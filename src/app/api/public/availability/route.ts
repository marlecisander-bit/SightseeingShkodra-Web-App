import {getAvailability} from '@/modules/booking/availability-server';
import {publicAvailability} from '@/modules/booking/public-availability';
import {resolveBookableProduct} from '@/modules/booking/products-server';
export async function GET(request:Request) {
 return publicAvailability(request,{
  resolve:async(productId)=>{
   const product=await resolveBookableProduct(productId);
   const operatorId=process.env.PUBLIC_OPERATOR_ID;
   return product&&operatorId?{operatorId,productId:product.id,timezone:'Europe/Tirane'}:null;
  },quote:input=>getAvailability(input,AbortSignal.timeout(5000)),
 });
}
