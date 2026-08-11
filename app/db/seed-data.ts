// Datos del seed de catálogo: categorías con productos y sus escalas de precio.
// Precios en CENTAVOS ARS (por unidad de venta / caja).

export interface SeedTier {
  minQty: number;
  priceCents: number;
}

export interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  unitLabel: string;
  packageSize: string;
  stock: number;
  tiers: SeedTier[];
}

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  products: SeedProduct[];
}

export const seedCategories: SeedCategory[] = [
  {
    slug: "aceites",
    name: "Aceites",
    description: "Aceites comestibles por caja (girasol y mezcla).",
    sortOrder: 10,
    products: [
      {
        slug: "aceite-girasol-900ml-caja-12",
        name: "Aceite de girasol 900 ml",
        description: "Botella de 900 ml, caja x 12. Clásico de consumo masivo.",
        unitLabel: "caja",
        packageSize: "12 x 900 ml",
        stock: 240,
        tiers: [
          { minQty: 1, priceCents: 1550000 },
          { minQty: 6, priceCents: 1480000 },
          { minQty: 21, priceCents: 1420000 },
        ],
      },
      {
        slug: "aceite-girasol-1500ml-caja-8",
        name: "Aceite de girasol 1,5 l",
        description: "Botella de 1,5 l, caja x 8. Para comercios y cocina.",
        unitLabel: "caja",
        packageSize: "8 x 1.5 l",
        stock: 180,
        tiers: [
          { minQty: 1, priceCents: 1850000 },
          { minQty: 6, priceCents: 1780000 },
          { minQty: 15, priceCents: 1700000 },
        ],
      },
    ],
  },
  {
    slug: "arroz-y-pastas",
    name: "Arroz y pastas",
    description: "Arroces y fideos industriales por caja.",
    sortOrder: 20,
    products: [
      {
        slug: "arroz-largo-fino-1kg-caja-24",
        name: "Arroz largo fino 1 kg",
        description: "Paquete de 1 kg, caja x 24. Alta calidad de grano.",
        unitLabel: "caja",
        packageSize: "24 x 1 kg",
        stock: 300,
        tiers: [
          { minQty: 1, priceCents: 2200000 },
          { minQty: 6, priceCents: 2080000 },
          { minQty: 21, priceCents: 1980000 },
        ],
      },
      {
        slug: "arroz-doble-carolina-1kg-caja-24",
        name: "Arroz doble carolina 1 kg",
        description: "Paquete de 1 kg, caja x 24. Rinde e ideal para guarniciones.",
        unitLabel: "caja",
        packageSize: "24 x 1 kg",
        stock: 200,
        tiers: [
          { minQty: 1, priceCents: 2050000 },
          { minQty: 6, priceCents: 1940000 },
          { minQty: 21, priceCents: 1850000 },
        ],
      },
      {
        slug: "fideos-cabello-angel-500g-caja-20",
        name: "Fideos cabello de ángel 500 g",
        description: "Paquete de 500 g, caja x 20. Pasta de trigo duro.",
        unitLabel: "caja",
        packageSize: "20 x 500 g",
        stock: 260,
        tiers: [
          { minQty: 1, priceCents: 1200000 },
          { minQty: 10, priceCents: 1130000 },
          { minQty: 21, priceCents: 1060000 },
        ],
      },
      {
        slug: "fideos-tirabuzon-500g-caja-20",
        name: "Fideos tirabuzón 500 g",
        description: "Paquete de 500 g, caja x 20. Código de máxima rotación.",
        unitLabel: "caja",
        packageSize: "20 x 500 g",
        stock: 260,
        tiers: [
          { minQty: 1, priceCents: 1250000 },
          { minQty: 10, priceCents: 1180000 },
          { minQty: 21, priceCents: 1100000 },
        ],
      },
    ],
  },
  {
    slug: "harinas",
    name: "Harinas",
    description: "Harinas de trigo para panificación y pastelería.",
    sortOrder: 30,
    products: [
      {
        slug: "harina-000-1kg-caja-20",
        name: "Harina 000 1 kg",
        description: "Paquete de 1 kg, caja x 20. Para uso doméstico y panificado.",
        unitLabel: "caja",
        packageSize: "20 x 1 kg",
        stock: 320,
        tiers: [
          { minQty: 1, priceCents: 900000 },
          { minQty: 10, priceCents: 850000 },
          { minQty: 21, priceCents: 800000 },
        ],
      },
      {
        slug: "harina-0000-1kg-caja-20",
        name: "Harina 0000 1 kg",
        description: "Paquete de 1 kg, caja x 20. Ideal para repostería.",
        unitLabel: "caja",
        packageSize: "20 x 1 kg",
        stock: 320,
        tiers: [
          { minQty: 1, priceCents: 950000 },
          { minQty: 10, priceCents: 900000 },
          { minQty: 21, priceCents: 845000 },
        ],
      },
    ],
  },
  {
    slug: "legumbres",
    name: "Legumbres",
    description: "Legumbres secas envasadas.",
    sortOrder: 40,
    products: [
      {
        slug: "lentejas-500g-caja-24",
        name: "Lentejas 500 g",
        description: "Paquete de 500 g, caja x 24. Seleccionadas y limpias.",
        unitLabel: "caja",
        packageSize: "24 x 500 g",
        stock: 150,
        tiers: [
          { minQty: 1, priceCents: 1400000 },
          { minQty: 6, priceCents: 1320000 },
          { minQty: 21, priceCents: 1250000 },
        ],
      },
      {
        slug: "garbanzos-500g-caja-24",
        name: "Garbanzos 500 g",
        description: "Paquete de 500 g, caja x 24. Grano entero seleccionado.",
        unitLabel: "caja",
        packageSize: "24 x 500 g",
        stock: 150,
        tiers: [
          { minQty: 1, priceCents: 1550000 },
          { minQty: 6, priceCents: 1460000 },
          { minQty: 21, priceCents: 1380000 },
        ],
      },
      {
        slug: "porotos-alubia-500g-caja-24",
        name: "Porotos alubia 500 g",
        description: "Paquete de 500 g, caja x 24. Blancos, grano uniforme.",
        unitLabel: "caja",
        packageSize: "24 x 500 g",
        stock: 120,
        tiers: [
          { minQty: 1, priceCents: 1650000 },
          { minQty: 6, priceCents: 1550000 },
          { minQty: 21, priceCents: 1480000 },
        ],
      },
    ],
  },
  {
    slug: "enlatados-y-conservas",
    name: "Enlatados y conservas",
    description: "Conservas y enlatados de máxima rotación.",
    sortOrder: 50,
    products: [
      {
        slug: "tomate-perita-400g-caja-24",
        name: "Tomate perita en lata 400 g",
        description: "Lata de 400 g, caja x 24. Pulpa natural troceada.",
        unitLabel: "caja",
        packageSize: "24 x 400 g",
        stock: 220,
        tiers: [
          { minQty: 1, priceCents: 1850000 },
          { minQty: 6, priceCents: 1740000 },
          { minQty: 21, priceCents: 1650000 },
        ],
      },
      {
        slug: "arvejas-350g-caja-24",
        name: "Arvejas en lata 350 g",
        description: "Lata de 350 g, caja x 24.",
        unitLabel: "caja",
        packageSize: "24 x 350 g",
        stock: 200,
        tiers: [
          { minQty: 1, priceCents: 1600000 },
          { minQty: 6, priceCents: 1520000 },
          { minQty: 21, priceCents: 1440000 },
        ],
      },
      {
        slug: "atun-al-natural-170g-caja-24",
        name: "Atún al natural 170 g",
        description: "Lata de 170 g, caja x 24. En aceite o agua.",
        unitLabel: "caja",
        packageSize: "24 x 170 g",
        stock: 180,
        tiers: [
          { minQty: 1, priceCents: 3900000 },
          { minQty: 6, priceCents: 3680000 },
          { minQty: 21, priceCents: 3480000 },
        ],
      },
      {
        slug: "choclo-350g-caja-24",
        name: "Choclo entero en lata 350 g",
        description: "Lata de 350 g, caja x 24.",
        unitLabel: "caja",
        packageSize: "24 x 350 g",
        stock: 160,
        tiers: [
          { minQty: 1, priceCents: 1900000 },
          { minQty: 6, priceCents: 1790000 },
          { minQty: 21, priceCents: 1700000 },
        ],
      },
    ],
  },
  {
    slug: "azucar-y-endulzantes",
    name: "Azúcar y endulzantes",
    description: "Azúcares envasados.",
    sortOrder: 60,
    products: [
      {
        slug: "azucar-blanca-1kg-caja-20",
        name: "Azúcar blanca 1 kg",
        description: "Paquete de 1 kg, caja x 20.",
        unitLabel: "caja",
        packageSize: "20 x 1 kg",
        stock: 400,
        tiers: [
          { minQty: 1, priceCents: 1400000 },
          { minQty: 10, priceCents: 1330000 },
          { minQty: 21, priceCents: 1260000 },
        ],
      },
      {
        slug: "azucar-rubia-1kg-caja-20",
        name: "Azúcar rubia 1 kg",
        description: "Paquete de 1 kg, caja x 20.",
        unitLabel: "caja",
        packageSize: "20 x 1 kg",
        stock: 200,
        tiers: [
          { minQty: 1, priceCents: 1450000 },
          { minQty: 10, priceCents: 1380000 },
          { minQty: 21, priceCents: 1310000 },
        ],
      },
    ],
  },
  {
    slug: "bebidas-secas",
    name: "Bebidas secas",
    description: "Yerba, café y té por caja.",
    sortOrder: 70,
    products: [
      {
        slug: "yerba-mate-1kg-caja-12",
        name: "Yerba mate 1 kg",
        description: "Paquete de 1 kg, caja x 12. Con palo, estacionada.",
        unitLabel: "caja",
        packageSize: "12 x 1 kg",
        stock: 240,
        tiers: [
          { minQty: 1, priceCents: 1800000 },
          { minQty: 6, priceCents: 1700000 },
          { minQty: 21, priceCents: 1620000 },
        ],
      },
      {
        slug: "cafe-molido-500g-caja-12",
        name: "Café molido 500 g",
        description: "Paquete de 500 g, caja x 12. Tostado y molido.",
        unitLabel: "caja",
        packageSize: "12 x 500 g",
        stock: 120,
        tiers: [
          { minQty: 1, priceCents: 2600000 },
          { minQty: 6, priceCents: 2450000 },
          { minQty: 15, priceCents: 2320000 },
        ],
      },
      {
        slug: "te-comun-25-saquetes-caja-24",
        name: "Té común 25 saquitos",
        description: "Caja de 25 saquitos, bulto x 24.",
        unitLabel: "caja",
        packageSize: "24 x 25 saquitos",
        stock: 180,
        tiers: [
          { minQty: 1, priceCents: 1150000 },
          { minQty: 10, priceCents: 1080000 },
          { minQty: 21, priceCents: 1020000 },
        ],
      },
    ],
  },
  {
    slug: "galletitas-y-snacks",
    name: "Galletitas y snacks",
    description: "Galletitas dulces y saladas por caja.",
    sortOrder: 80,
    products: [
      {
        slug: "galletitas-dulces-surtidas-350g-caja-12",
        name: "Galletitas dulces surtidas 350 g",
        description: "Paquete de 350 g, caja x 12. Variedad para el mostrador.",
        unitLabel: "caja",
        packageSize: "12 x 350 g",
        stock: 260,
        tiers: [
          { minQty: 1, priceCents: 1050000 },
          { minQty: 10, priceCents: 990000 },
          { minQty: 21, priceCents: 940000 },
        ],
      },
      {
        slug: "galletitas-saladas-250g-caja-24",
        name: "Galletitas saladas 250 g",
        description: "Paquete de 250 g, caja x 24. Clásicas de agua.",
        unitLabel: "caja",
        packageSize: "24 x 250 g",
        stock: 240,
        tiers: [
          { minQty: 1, priceCents: 1250000 },
          { minQty: 10, priceCents: 1180000 },
          { minQty: 21, priceCents: 1120000 },
        ],
      },
    ],
  },
];