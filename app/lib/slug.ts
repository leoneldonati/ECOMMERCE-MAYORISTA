// Slugify compartido entre cliente y servidor (usado en el form de producto).
// Normaliza a minúsculas, sin acentos y espacios a guiones.

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
