const PHONE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/g;
const STREET =
  /\d{1,5}\s+[\w.'-]+(?:\s+[\w.'-]+)*\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|place|pl)\.?(?:\s+\w+)*/gi;

export function isPdfMagic(bytes: Uint8Array) {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

export function stripPrivateDetails(value: string) {
  return value.replace(PHONE, "[redacted]").replace(STREET, "[redacted]");
}

function stripDeep(value: unknown): unknown {
  if (typeof value === "string") return stripPrivateDetails(value);
  if (Array.isArray(value)) return value.map(stripDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, stripDeep(nested)]),
    );
  }
  return value;
}

export function stripProfilePii<T>(data: T): T {
  return stripDeep(data) as T;
}

export function slugFromName(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "profile";
}

export async function uniqueSlug(
  base: string,
  taken: (slug: string) => Promise<boolean>,
) {
  const root = slugFromName(base);
  if (!(await taken(root))) return root;
  for (let i = 0; i < 12; i += 1) {
    const candidate = `${root}-${Math.random().toString(36).slice(2, 6)}`;
    if (!(await taken(candidate))) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 8)}`;
}
