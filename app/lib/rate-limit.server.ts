// Protección básica contra fuerza bruta en login, en memoria (por proceso).
// Tras 5 fallos consecutivos por IP+email se bloquea 5 minutos.
// Limitar a memoria es aceptable para esta etapa: se documenta que el contador
// se reinicia al reiniciar el proceso.

interface RateEntry {
  failures: number;
  lockedUntil: number;
  lastFailureAt: number;
}

const store = new Map<string, RateEntry>();
const MAX_FAILURES = 5;
const LOCK_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 5000;

/** IP del cliente respetando proxies (x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}

function keyOf(ip: string, email: string): string {
  return `${ip}|${email.toLowerCase()}`;
}

export function getLock(input: {
  ip: string;
  email: string;
}): { locked: boolean; remainingSeconds: number } {
  const key = keyOf(input.ip, input.email);
  const entry = store.get(key);
  if (!entry) return { locked: false, remainingSeconds: 0 };
  // Decae el contador si pasó la ventana sin nuevos intentos.
  if (Date.now() - entry.lastFailureAt > LOCK_MS) {
    store.delete(key);
    return { locked: false, remainingSeconds: 0 };
  }
  if (entry.lockedUntil > Date.now()) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((entry.lockedUntil - Date.now()) / 1000),
    };
  }
  return { locked: false, remainingSeconds: 0 };
}

export function registerLoginFailure(ip: string, email: string): void {
  const key = keyOf(ip, email);
  const now = Date.now();
  const entry = store.get(key) ?? { failures: 0, lockedUntil: 0, lastFailureAt: 0 };
  entry.failures += 1;
  entry.lastFailureAt = now;
  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCK_MS;
    entry.failures = 0;
  }
  store.set(key, entry);
  prune(now);
}

export function registerLoginSuccess(ip: string, email: string): void {
  store.delete(keyOf(ip, email));
}

function prune(now: number): void {
  if (store.size <= MAX_ENTRIES) return;
  for (const [key, entry] of store) {
    if (entry.lockedUntil < now && now - entry.lastFailureAt > LOCK_MS) store.delete(key);
  }
}