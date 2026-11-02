import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const consumer = path.resolve(process.argv[2] || root);
const typeRoot = path.join(consumer, "node_modules/@types");
const configDir = path.join(root, "node_modules/.cache/auth-consumer-types");
fs.mkdirSync(configDir, {recursive:true});
const config = path.join(configDir, "tsconfig.json");
fs.writeFileSync(config, JSON.stringify({ compilerOptions: {
  target:"ES2022", module:"ESNext", moduleResolution:"Bundler", jsx:"react-jsx", strict:true,
  noEmit:true, skipLibCheck:false, esModuleInterop:true, types:["react","react-dom"], typeRoots:[typeRoot],
  paths:{"react":[path.join(typeRoot,"react/index.d.ts")],"react/*":[path.join(typeRoot,"react/*")],"react-dom":[path.join(typeRoot,"react-dom/index.d.ts")],"react-dom/*":[path.join(typeRoot,"react-dom/*")]}
},files:[path.join(root,"verification/consumer.tsx")] },null,2));
const version=JSON.parse(fs.readFileSync(path.join(consumer,"node_modules/react/package.json"),"utf8")).version;
console.log("Checking built public declarations against React " + version);
const result=spawnSync(process.execPath,[path.join(path.dirname(require.resolve("typescript/package.json")), "bin/tsc"),"-p",config],{cwd:root,stdio:"inherit"});
process.exitCode=result.status ?? 1;
