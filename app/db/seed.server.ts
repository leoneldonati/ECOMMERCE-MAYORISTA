import { seedCategories } from "./seed-data";
import { createCategory, listCategories } from "./repos/categories.server";
import { createProduct } from "./repos/products.server";
import { createUser, listUsers } from "./repos/users.server";
import { hashPassword } from "../lib/password.server";

// Seed IDEMPOTENTE: solo popula cuando la base está vacía.
// El catálogo se siembra si no hay categorías; los usuarios demo solo si
// no existe admin y no existen clientes respectivamente.

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@impreso.test";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

const DEMO_CUSTOMER_EMAIL = "cliente@impreso.test";
const DEMO_CUSTOMER_PASSWORD = "cliente1234";

export function seedDatabase(): void {
  seedCatalog();
  seedUsers();
}

function seedCatalog(): void {
  if (listCategories().length > 0) return;
  let productCount = 0;
  for (const category of seedCategories) {
    const createdCategory = createCategory({
      slug: category.slug,
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
    });
    for (const product of category.products) {
      createProduct({
        categoryId: createdCategory.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        stock: product.stock,
        madeToOrder: product.madeToOrder,
        leadTimeDays: product.madeToOrder ? product.leadTimeDays : null,
      });
      productCount++;
    }
  }
  console.log(`[seed] catálogo: ${seedCategories.length} categorías · ${productCount} productos`);
}

function seedUsers(): void {
  if (listUsers().some((user) => user.role === "admin")) return;
  createUser({
    email: SEED_ADMIN_EMAIL,
    passwordHash: hashPassword(SEED_ADMIN_PASSWORD),
    name: "Administración Impreso Online",
    role: "admin",
  });
  console.log(
    `[seed] admin creado: ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD} (cambiar en producción)`,
  );

  if (listUsers().some((user) => user.role === "customer")) return;
  createUser({
    email: DEMO_CUSTOMER_EMAIL,
    passwordHash: hashPassword(DEMO_CUSTOMER_PASSWORD),
    name: "Cliente de Prueba",
    phone: "11 5555 1234",
    province: "Buenos Aires",
    address: "Av. Rivadavia 1234, CABA",
  });
  console.log(`[seed] cliente demo creado: ${DEMO_CUSTOMER_EMAIL} / ${DEMO_CUSTOMER_PASSWORD}`);
}
