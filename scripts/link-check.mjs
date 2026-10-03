import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const routes=new Set(['/']);
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.name==='page.tsx'){let rel=path.relative(path.join(root,'app'),path.dirname(full)).replaceAll('\\','/');rel=rel.replace(/^\(([^)]+)\)\//,'');rel=rel.replace(/\/\[\[\.\.\.([^\]]+)\]\]/g,'').replace(/\/\[[^\]]+\]/g,'/:id');if(rel==='.')rel='';routes.add('/'+rel);}}}
walk(path.join(root,'app'));
const refs=[];
function read(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory()&&!['node_modules','.next'].includes(e.name))read(full);else if(e.isFile()&&/\.(tsx|ts)$/.test(e.name)){const s=fs.readFileSync(full,'utf8');for(const m of s.matchAll(/href=["'](\/[A-Za-z0-9_./?=&-]+)/g))refs.push({file:path.relative(root,full),href:m[1].split('?')[0]});}}}
read(root);
const ignored=new Set(['/api']); const missing=[];
for(const r of refs){if(ignored.has(r.href)||r.href.startsWith('/api/'))continue;let ok=routes.has(r.href);if(!ok){const pattern=r.href.replace(/\/[^/]+$/,'/:id');ok=routes.has(pattern);}if(!ok&&!missing.some(m=>m.href===r.href))missing.push(r);}
if(missing.length){console.error('BROKEN INTERNAL LINKS');for(const m of missing)console.error(`${m.file} -> ${m.href}`);process.exit(1)}
console.log(`Internal link check passed — ${refs.length} static link references inspected.`);
