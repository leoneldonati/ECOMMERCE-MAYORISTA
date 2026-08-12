import { mkdirSync, readdirSync, statSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// Snapshot de la SQLite vía VACUUM INTO (node:sqlite no expone backup()),
// con verificación de integridad de la copia y rotación por antigüedad.
// Autocontenido (solo builtins): corre en el container de producción con el
// `node` nativo (type-stripping de Node 24) aunque no esté instalado tsx.

const sourcePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), "data", "app.db");
const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 7);

/** Timestamp local YYYYMMDD-HHMMSS para el nombre del backup. */
function timestamp(): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
}

/** Milisegundos hasta la próxima ocurrencia local de (hour:minute). */
function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Borra los backups vencidos según mtime (approximado, corre en cada corrida). */
function prune(backupsDir: string): void {
  const cutoff = Date.now() - retentionDays * 86_400_000;
  for (const name of readdirSync(backupsDir)) {
    if (!name.startsWith("app-") || !name.endsWith(".db")) continue;
    const file = path.join(backupsDir, name);
    if (statSync(file).mtimeMs < cutoff) {
      rmSync(file);
      console.log(`Backup vencido eliminado: ${file}`);
    }
  }
}

function run(): void {
  if (!statSync(sourcePath).isFile()) {
    throw new Error(`No se encontró la base en ${sourcePath}. ¿Seteaste DATABASE_PATH?`);
  }

  const backupsDir = path.join(path.dirname(sourcePath), "backups");
  mkdirSync(backupsDir, { recursive: true });
  const target = path.join(backupsDir, `app-${timestamp()}.db`);

  const db = new DatabaseSync(sourcePath);
  db.exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`);
  db.close();

  const copy = new DatabaseSync(target, { readOnly: true });
  const check = copy.prepare("PRAGMA quick_check;").get();
  copy.close();
  if (!check || Object.values(check)[0] !== "ok") {
    rmSync(target);
    throw new Error(`El backup falló la verificación (quick_check): ${target}`);
  }

  const sizeKiB = Math.round(statSync(target).size / 1024);
  console.log(`Backup creado: ${target} (${sizeKiB} KiB)`);
  prune(backupsDir);
}

/** Modo --watch para el sidecar del container: corre diario ~03:00 sin morir ante errores. */
async function watchLoop(): Promise<void> {
  for (;;) {
    const waitMs = msUntilNext(3, 0);
    console.log(`[db:backup] próximo backup ~03:00 (en ${Math.round(waitMs / 3_600_000)} h)`);
    await sleep(waitMs);
    try {
      run();
    } catch (error) {
      console.error(`[db:backup] ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (process.argv.includes("--watch")) {
  void watchLoop();
} else {
  try {
    run();
  } catch (error) {
    console.error(`[db:backup] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
