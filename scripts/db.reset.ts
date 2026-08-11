import { rmSync } from "node:fs";
import { getDbFilePath } from "../app/db/client.server";

// CLI: npm run db:reset
// Borra el archivo de la base (y los de WAL/SHM). Solo uso en desarrollo.
const dbPath = getDbFilePath();
for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(dbPath + suffix, { force: true });
}
console.log(`Base de datos eliminada: ${dbPath}`);