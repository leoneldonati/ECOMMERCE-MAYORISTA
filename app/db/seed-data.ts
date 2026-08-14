// Datos del seed de catálogo: categorías con productos impresos en 3D.
// Precios en CENTAVOS ARS (por unidad). Las imágenes son placeholders.

export interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
  madeToOrder: boolean;
  leadTimeDays?: number;
}

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  products: SeedProduct[];
}

function placeholder(name: string): string {
  return `https://placehold.co/600x600?text=${name.replace(/ /g, "+")}`;
}

export const seedCategories: SeedCategory[] = [
  {
    slug: "figuras",
    name: "Figuras y coleccionables",
    description: "Figuras impresas a pedido: mascotas, bustos y decoración.",
    sortOrder: 10,
    products: [
      {
        slug: "figura-perro-retriever",
        name: "Figura de perro Labrador",
        description: "Réplica detallada de un labrador a escala. Impresa bajo pedido.",
        priceCents: 3200000,
        imageUrl: placeholder("Perro Labrador"),
        stock: 0,
        madeToOrder: true,
        leadTimeDays: 4,
      },
      {
        slug: "figura-gato-sentado",
        name: "Figura de gato sentado",
        description: "Gato estilizado en posición de sentado, ideal para el escritorio.",
        priceCents: 2500000,
        imageUrl: placeholder("Gato Sentado"),
        stock: 0,
        madeToOrder: true,
        leadTimeDays: 3,
      },
      {
        slug: "busto-filosofo",
        name: "Busto clásico",
        description: "Busto decorativo de inspiración clásica para estantes y bibliotecas.",
        priceCents: 5800000,
        imageUrl: placeholder("Busto Clásico"),
        stock: 2,
        madeToOrder: false,
      },
    ],
  },
  {
    slug: "hogar",
    name: "Hogar y organización",
    description: "Objetos útiles para ordenar y decorar la casa.",
    sortOrder: 20,
    products: [
      {
        slug: "organizador-cables",
        name: "Organizador de cables",
        description: "Soporte para ordenar los cables del escritorio o la TV.",
        priceCents: 700000,
        imageUrl: placeholder("Organizador de cables"),
        stock: 30,
        madeToOrder: false,
      },
      {
        slug: "gancho-antorcha",
        name: "Gancho adhesivo doble",
        description: "Gancho autoadhesivo para colgar llaves, toallas o delantales.",
        priceCents: 500000,
        imageUrl: placeholder("Gancho doble"),
        stock: 40,
        madeToOrder: false,
      },
      {
        slug: "porta-plumas-modular",
        name: "Porta lápices modular",
        description: "Porta lápices encastrable: se combina con otras unidades.",
        priceCents: 900000,
        imageUrl: placeholder("Porta lápices"),
        stock: 0,
        madeToOrder: true,
        leadTimeDays: 2,
      },
    ],
  },
  {
    slug: "accesorios",
    name: "Accesorios y personalización",
    description: "Pequeños accesorios y piezas de repuesto impresas.",
    sortOrder: 30,
    products: [
      {
        slug: "llavero-inicial",
        name: "Llavero personalizado",
        description: "Llavero con la inicial que elijas. Impreso bajo pedido.",
        priceCents: 400000,
        imageUrl: placeholder("Llavero inicial"),
        stock: 0,
        madeToOrder: true,
        leadTimeDays: 2,
      },
      {
        slug: "tapa-mango-tool",
        name: "Adaptador de mango",
        description: "Adaptador para herramientas y mangos de uso general.",
        priceCents: 600000,
        imageUrl: placeholder("Adaptador mango"),
        stock: 25,
        madeToOrder: false,
      },
    ],
  },
  {
    slug: "juegos",
    name: "Juegos y juguetes",
    description: "Juguetes y piezas de juegos resistentes y sin bordes filosos.",
    sortOrder: 40,
    products: [
      {
        slug: "autito-clasico",
        name: "Auto de juguete clásico",
        description: "Autito de juguete de una pieza, ideal para regalar.",
        priceCents: 1100000,
        imageUrl: placeholder("Autito"),
        stock: 15,
        madeToOrder: false,
      },
      {
        slug: "dado-gigante",
        name: "Dado gigante",
        description: "Dado de 4 cm de lado para juegos de mesa o fomento.",
        priceCents: 850000,
        imageUrl: placeholder("Dado gigante"),
        stock: 0,
        madeToOrder: true,
        leadTimeDays: 3,
      },
    ],
  },
  {
    slug: "utiles",
    name: "Útiles y oficina",
    description: "Accesorios de escritorio y oficina impresos.",
    sortOrder: 50,
    products: [
      {
        slug: "soporte-celular",
        name: "Soporte para celular",
        description: "Soporte de escritorio para celular en posición cómoda.",
        priceCents: 950000,
        imageUrl: placeholder("Soporte celular"),
        stock: 20,
        madeToOrder: false,
      },
      {
        slug: "clip-sellador",
        name: "Sellador de bolsas",
        description: "Clip para cerrar y sellar bolsas de snacks o alimentos.",
        priceCents: 300000,
        imageUrl: placeholder("Sellador de bolsas"),
        stock: 0,
        madeToOrder: true,
        leadTimeDays: 1,
      },
    ],
  },
];
