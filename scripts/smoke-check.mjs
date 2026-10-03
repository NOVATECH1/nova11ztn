import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const required = [
  "package.json", "next.config.ts", "tsconfig.json", ".env.example", "README.md",
  "app/layout.tsx", "app/globals.css", "proxy.ts", "prisma/schema.prisma",
  "components/shell.tsx", "components/screens.tsx", "components/product-card.tsx",
  "lib/waliya.ts", "lib/veritas.ts", "lib/didit.ts", "lib/brevo.ts", "lib/r2.ts",
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);

const pages = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "page.tsx") pages.push(path.relative(root, full));
  }
}
walk(path.join(root, "app"));
if (pages.length < 30) failures.push(`Expected 30+ route files, found ${pages.length}`);

const files = [];
function readAll(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") readAll(full);
    else if (entry.isFile()) files.push(full);
  }
}
readAll(root);
const textFiles = files.filter(f => /\.(ts|tsx|css|json|md|mjs|prisma|svg|example)$/.test(f));
const corpus = textFiles.map(f => fs.readFileSync(f, "utf8")).join("\n");

const env = fs.readFileSync(path.join(root, ".env.example"), "utf8");
for (const key of ["DATABASE_URL", "DIRECT_URL", "VERITAS_API_KEY", "DIDIT_API_KEY", "WALIYA_PUBLIC_KEY", "WALIYA_SECRET_KEY", "BREVO_API_KEY", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"]) {
  if (!env.includes(`${key}=`)) failures.push(`Missing env placeholder ${key}`);
}

for (const price of [99,299,799,1399,2499,299,499,999,1599,2699]) {
  if (!corpus.includes(String(price))) failures.push(`Premium price missing: ${price}`);
}

for (const asset of ["free-fire.svg", "instagram.svg", "design-pack.svg", "sensitivity.svg"]) {
  if (!files.some(f => f.toLowerCase().includes(asset.toLowerCase()))) failures.push(`Missing asset/reference: ${asset}`);
}

if (failures.length) {
  console.error("ZTN smoke check FAILED");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log(`ZTN smoke check PASSED — ${pages.length} route files, ${files.length} files inspected.`);
