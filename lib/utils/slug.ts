/**
 * Converts a string into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // separate accent from letter
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-") // collapse dashes
    .replace(/^-+/, "") // trim - from start
    .replace(/-+$/, ""); // trim - from end
}

/**
 * Ensures a slug is unique by querying the provided predicate function.
 * If collision occurs, increments numerical suffix (e.g., slug-1, slug-2).
 */
export async function createUniqueSlug(
  baseText: string,
  checkExists: (slug: string) => Promise<boolean>,
  currentId?: string
): Promise<string> {
  const baseSlug = slugify(baseText) || "product";
  let candidate = baseSlug;
  let counter = 1;

  while (await checkExists(candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }

  return candidate;
}
