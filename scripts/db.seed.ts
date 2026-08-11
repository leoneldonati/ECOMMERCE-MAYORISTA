import { getDb } from "../app/db/client.server";
import { seedDatabase } from "../app/db/seed.server";

// CLI: npm run db:seed
// Idempotente: solo popula si la base está vacía.
const db = getDb();
seedDatabase();
console.log("Seed finalizado.");
db.close();