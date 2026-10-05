import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const root=new URL('../',import.meta.url);
const source=await readFile(new URL('public/brand/site-icon-source.svg',root),'utf8');
// Canonical sun-only vector: preserve transparency and original artwork colors.
const square=source;
if(!square.includes('viewBox="90 181 240 240"') || /<rect\b/.test(square))throw Error('Expected transparent sun-only source');
await mkdir(new URL('public/icons/',root),{recursive:true});
await writeFile(new URL('public/icons/site-icon.svg',root),square);
for(const size of [32,180,192,512])await writeFile(new URL(`public/icons/site-icon-${size}.png`,root),await sharp(Buffer.from(square)).resize(size,size).png().toBuffer());
await writeFile(new URL('public/apple-touch-icon.png',root),await readFile(new URL('public/icons/site-icon-180.png',root)));
const images=await Promise.all([16,32,48].map(size=>sharp(Buffer.from(square)).resize(size,size).png().toBuffer()));
const header=Buffer.alloc(6+16*images.length);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);let offset=header.length;
images.forEach((data,i)=>{const p=6+i*16;header[p]=[16,32,48][i];header[p+1]=header[p];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(data.length,p+8);header.writeUInt32LE(offset,p+12);offset+=data.length;});
await writeFile(new URL('public/favicon.ico',root),Buffer.concat([header,...images]));
// Keep earlier admin asset URLs compatible while all metadata shares /icons/.
for(const size of [192,512])await writeFile(new URL(`public/admin/icon-${size}.png`,root),await readFile(new URL(`public/icons/site-icon-${size}.png`,root)));
