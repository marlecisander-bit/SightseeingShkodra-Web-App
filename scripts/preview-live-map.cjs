/* eslint-disable @typescript-eslint/no-require-imports -- Loopback-only development fixture. */
// Website-owned mock sender. Does not load or modify the companion project or contact GPS/backend services.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowed=new Set(['http://localhost:3011','http://127.0.0.1:3011']);
const html=fs.readFileSync(path.join(__dirname,'fixtures/live-map-frame.html'));
for(const port of [4199,4200])http.createServer((req,res)=>{
 const u=new URL(req.url,`http://127.0.0.1:${port}`);res.setHeader('Cache-Control','no-store');
 if(u.pathname==='/live-map.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(u.pathname==='/van.svg'){res.setHeader('Content-Type','image/svg+xml');res.end(fs.readFileSync(path.join(root,'public/brand/sightseeing-van.svg')));return;}
 if(u.pathname==='/unauthorized'&&allowed.has(u.searchParams.get('parentOrigin'))){res.setHeader('Content-Type','text/html');res.end(`<script>parent.parent.postMessage({type:'shkodra:journey',version:1,unavailable:false,stops:[],embeddedDisplay:{version:1,label:'UNAUTHORIZED',destination:'MUST NEVER APPEAR',activity:'',eta:'',nextStop:'',live:true,stops:[]}},${JSON.stringify(u.searchParams.get('parentOrigin'))})</script>`);return;}
 res.writeHead(404).end();
}).listen(port,'127.0.0.1',()=>console.log(`Website mock sender http://127.0.0.1:${port}; no GPS/backend/companion access.`));
