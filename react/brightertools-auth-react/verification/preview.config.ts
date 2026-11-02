import { defineConfig } from "vite";
import path from "node:path";
const root=path.resolve(".");
const consumer=process.env.AUTH_REACT_CONSUMER_ROOT;
if(!consumer) throw new Error("Set AUTH_REACT_CONSUMER_ROOT to an installed Bootstrap/React consumer.");
const modules=path.resolve(consumer,"node_modules");
export default defineConfig({root:path.join(root,"verification"),resolve:{alias:[
  {find:"host-bootstrap",replacement:path.join(modules,"bootstrap/dist/css/bootstrap.min.css")},
  {find:/^react$/,replacement:path.join(modules,"react/index.js")},
  {find:/^react\/(.*)$/,replacement:path.join(modules,"react/$1")},
  {find:/^react-dom$/,replacement:path.join(modules,"react-dom/index.js")},
  {find:/^react-dom\/(.*)$/,replacement:path.join(modules,"react-dom/$1")}
]},server:{host:"127.0.0.1",port:5189,strictPort:true,fs:{allow:[root,modules]}}});
