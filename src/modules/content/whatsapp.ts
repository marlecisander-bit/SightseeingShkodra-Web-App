export const whatsappDefaults:Record<string,string>={
 'whatsapp.enabled':'false','whatsapp.number':'',
 'whatsapp.message':'Hello! I have a question about Sightseeing Shkodra Hop-On Hop-Off tours.',
 'whatsapp.label':'Chat with us','whatsapp.desktop':'true','whatsapp.mobile':'true',
};
export function normalizeWhatsAppNumber(value:string):string|null{
 const input=value.trim();
 if(!/^\+?[1-9][0-9 ()-]*$/.test(input)||input.length>40)return null;
 const digits=input.replace(/[+ ()-]/g,'');
 return /^[1-9][0-9]{7,14}$/.test(digits)&&!/^([0-9])\1+$/.test(digits)?digits:null;
}
export function validateWhatsApp(content:Record<string,string>){
 for(const key of ['enabled','desktop','mobile'])if(!['true','false'].includes(content[`whatsapp.${key}`]))throw Error('Choose On or Off for WhatsApp visibility.');
 const number=content['whatsapp.number'];
 if(number.trim()&&!normalizeWhatsAppNumber(number))throw Error('Enter a valid international WhatsApp number including country code.');
 if(content['whatsapp.enabled']==='true'&&!normalizeWhatsAppNumber(number))throw Error('Add a valid WhatsApp number before enabling the button.');
}
export function whatsappLink(content:Record<string,string>):string|null{
 if(content['whatsapp.enabled']!=='true'||content['whatsapp.desktop']!=='true'&&content['whatsapp.mobile']!=='true')return null;
 const number=normalizeWhatsAppNumber(content['whatsapp.number']??'');if(!number)return null;
 const message=(content['whatsapp.message']??'').trim();
 return `https://wa.me/${number}${message?'?text='+encodeURIComponent(message):''}`;
}
export type DockRect={left:number;right:number;top:number;bottom:number};
/** Move above visible interactive obstacles, or hide when no unobstructed slot fits. */
export function whatsappDock(rect:DockRect,obstacles:DockRect[],minimumTop:number):number|null{
 const height=rect.bottom-rect.top;let top=rect.top;
 for(let pass=0;pass<=obstacles.length;pass++){
  const hit=obstacles.find(o=>rect.left<o.right+12&&rect.right>o.left-12&&top<o.bottom+12&&top+height>o.top-12);
  if(!hit)return top>=minimumTop?top:null;
  top=hit.top-height-12;if(top<minimumTop)return null;
 }
 return null;
}
