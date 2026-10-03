export function formatETB(value: number) {
  return new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 }).format(value);
}

export function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
