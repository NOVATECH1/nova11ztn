const fs=require('node:fs');
const path=require('node:path');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root=process.cwd();
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir)){const full=path.join(dir,name);const st=fs.statSync(full);if(st.isDirectory()) walk(full);else if(/\.(ts|tsx)$/.test(name)) files.push(full);}}
walk(root);
const errors=[];
for(const file of files){
  const code=fs.readFileSync(file,'utf8');
  const kind=file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS;
  try{
    const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,kind);
    const diags=sf.parseDiagnostics||[];
    for(const d of diags){errors.push({file:path.relative(root,file),message:ts.flattenDiagnosticMessageText(d.messageText,' ')})}
  }catch(e){errors.push({file:path.relative(root,file),message:String(e.message||e)})}
}
console.log(`Checked ${files.length} TS/TSX files for parse syntax.`);
if(errors.length){for(const e of errors) console.log(`FAIL ${e.file}: ${e.message}`);process.exit(1);} console.log('PASS TypeScript/TSX syntax check');
