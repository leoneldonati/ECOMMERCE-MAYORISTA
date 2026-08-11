import { seedCategories } from "./seed-data";
import { createCategory, listCategories } from "./repos/categories.server";
import { createProduct, replacePriceTiers } from "./repos/products.server";
import { createUser, listUsers } from "./repos/users.server";
import { hashPassword } from "../lib/password.server";
import { isValidCuit, normalizeCuit } from "../lib/cuit.server";

// Seed IDEMPOTENTE: solo popula cuando la base está vacía.
// El catálogo se siembra si no hay categorías; los usuarios demo solo si
// no existe admin y no existen clientes respectivamente.

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@mayorista.test";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

const ADMIN_CUIT = "20123456786";
const DEMO_CUSTOMER_EMAIL = "cliente@mayorista.test";
const DEMO_CUSTOMER_PASSWORD = "cliente1234";
const DEMO_CUSTOMER_CUIT = "20123456700";

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
      const createdProduct = createProduct({
        categoryId: createdCategory.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        unitLabel: product.unitLabel,
        packageSize: product.packageSize,
        stock: product.stock,
      });
      replacePriceTiers(createdProduct.id, product.tiers);
      productCount++;
    }
  }
  console.log(`[seed] catálogo: ${seedCategories.length} categorías · ${productCount} productos`);
}

function seedUsers(): void {
  if (listUsers().some((user) => user.role === "admin")) return;
  if (!isValidCuit(ADMIN_CUIT)) {
    throw new Error(`El CUIT del admin del seed es inválido: ${ADMIN_CUIT}`);
  }
  createUser({
    email: SEED_ADMIN_EMAIL,
    passwordHash: hashPassword(SEED_ADMIN_PASSWORD),
    businessName: "Administración Mayorista",
    cuit: normalizeCuit(ADMIN_CUIT),
    contactName: "Sistema",
    role: "admin",
    status: "approved",
  });
  console.log(`[seed] admin creado: ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD} (cambiar en producción)`);

  if (listUsers().some((user) => user.role === "customer")) return;
  if (!isValidCuit(DEMO_CUSTOMER_CUIT)) {
    throw new Error(`El CUIT del cliente demo del seed es inválido: ${DEMO_CUSTOMER_CUIT}`);
  }
  createUser({
    email: DEMO_CUSTOMER_EMAIL,
    passwordHash: hashPassword(DEMO_CUSTOMER_PASSWORD),
    businessName: "Almacén Don Juan",
    cuit: normalizeCuit(DEMO_CUSTOMER_CUIT),
    contactName: "Juan Pérez",
    phone: "11 5555 1234",
    province: "Buenos Aires",
    customerType: "almacen",
  });
  console.log(
    `[seed] cliente demo (pending) creado: ${DEMO_CUSTOMER_EMAIL} / ${DEMO_CUSTOMER_PASSWORD}`
  );
}