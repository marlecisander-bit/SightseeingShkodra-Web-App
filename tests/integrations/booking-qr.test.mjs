import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomBytes} from 'node:crypto';
import jsQR from 'jsqr';
import {bookingQrMatrix} from '../../src/modules/booking/qr-matrix.ts';
for(const width of [185,205])test(`QR decodes opaque credentials at ${width}px with four-module quiet zone`,()=>{
 for(let sample=0;sample<3;sample++){
  const token=randomBytes(32).toString('hex'),m=bookingQrMatrix(token),size=m.size+8,pixels=new Uint8ClampedArray(width*width*4);
  for(let y=0;y<width;y++)for(let x=0;x<width;x++){
   const mx=Math.floor(x*size/width)-4,my=Math.floor(y*size/width)-4;
   const black=mx>=0&&my>=0&&mx<m.size&&my<m.size&&m.get(my,mx),i=(y*width+x)*4;
   pixels[i]=pixels[i+1]=pixels[i+2]=black?0:255;pixels[i+3]=255;
  }
  assert.equal(jsQR(pixels,width,width)?.data,token);
 }
});
test('QR renderer rejects identifiers, URLs and personal payloads',()=>{
 for(const value of ['SS-123','https://example.com/booking','test@example.com',''])assert.throws(()=>bookingQrMatrix(value));
});
