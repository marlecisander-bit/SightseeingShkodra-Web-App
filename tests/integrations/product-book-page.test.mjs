import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const product={id:'10000000-0000-4000-8000-000000000021',title:'Loop',card:{description:'Published booking introduction'}};let calls=[];
globalThis.productPageResolve=async id=>{calls.push(id);return id===product.id?product:null;};
registerHooks({resolve(s,c,next){
 let source;
 if(s==='next/navigation')source="export function notFound(){throw Error('NOT_FOUND')}";
 if(s.endsWith('/booking/products-server'))source='export const resolveBookableProduct=id=>globalThis.productPageResolve(id);';
 if(s.endsWith('/content/website-server'))source='export const getPublishedWebsite=async()=>({});export const getWebsitePublication=async()=>({content:{},published:true});';
 if(s.endsWith('/content/sitemap-server'))source='export const isPublicTourPublished=async()=>true;';
 if(s.endsWith('/content/seo'))source='export const editorialMetadata=()=>({});';
 if(s.endsWith('/public/booking'))source='export function BookingProvider(){};export function BookingFlow(){};';
 if(s.endsWith('/public/page-intro'))source='export function PageIntro(){};';
 return source?{url:'data:text/javascript,'+encodeURIComponent(source),shortCircuit:true}:next(s,c);
},load(url,c,next){if(url.startsWith('data:text/javascript,'))return {format:'module',source:decodeURIComponent(url.slice('data:text/javascript,'.length)),shortCircuit:true};return next(url,c);}});
const {default:Book}=await import('../../src/app/(public)/book/page.tsx');
function find(node,name){if(!node||typeof node!=='object')return null;if(node.type?.name===name)return node;return [node.props?.children].flat(Infinity).map(n=>find(n,name)).find(Boolean);}
test('booking page binds the selected offer to the shared booking provider and shows its published introduction',async()=>{calls=[];const page=await Book({searchParams:Promise.resolve({productId:product.id})});assert.equal(find(page,'BookingProvider').props.product.id,product.id);assert.deepEqual(calls,[product.id]);assert.match(JSON.stringify(page),/Published booking introduction/);});
test('invalid, repeated and unavailable product selectors cannot silently book the default product',async()=>{for(const productId of ['', 'unknown', [product.id,product.id]])await assert.rejects(Book({searchParams:Promise.resolve({productId})}),/NOT_FOUND/);});
test('legacy booking URLs retain the existing default provider without a second directory resolution',async()=>{calls=[];const page=await Book({searchParams:Promise.resolve({})});assert.equal(find(page,'BookingProvider'),undefined);assert(find(page,'BookingFlow'));assert.deepEqual(calls,[]);});
