import { manageBooking } from '@/modules/booking/customer-management-server';
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request){
 try{const origin=new URL(request.headers.get('origin')??'');if(origin.host!==request.headers.get('host')||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'FORBIDDEN'},{status:403,headers});}catch{return Response.json({error:'FORBIDDEN'},{status:403,headers});}
 try{
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw Error('INVALID_REQUEST');
  const reader=request.body?.getReader();if(!reader)throw Error('INVALID_REQUEST');let size=0;const chunks:Uint8Array[]=[];
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();throw Error('INVALID_REQUEST');}chunks.push(value);}
  const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||typeof body!=='object'||Array.isArray(body))throw Error('INVALID_REQUEST');
  return Response.json(await manageBooking(body),{headers});
 }catch(e){const code=e instanceof Error?e.message:'';const safe=['NOT_FOUND','CLOSED','CONTACT_OPERATOR','CHANGED','SOLD_OUT','INVALID_REQUEST','ADULT_REQUIRED'].includes(code)?code:'UNAVAILABLE';return Response.json({error:safe},{status:safe==='NOT_FOUND'?404:safe==='UNAVAILABLE'?503:409,headers});}
}
