import {renderConfirmation} from '../src/modules/integrations/booking-notifications.ts';
const message=renderConfirmation({reference:'SAMPLE-NOT-VALID',confirmed:true,currency:'EUR',total:2500,collectionMode:'meeting_point',paid:false,email:'sample@example.invalid',phone:null,whatsappAllowed:false,items:[{title:'Example van tour',date:'2030-01-01',time:'10:00',timezone:'Europe/Tirane',guests:2}]});
console.log('LOCAL SAMPLE ONLY - no message sent, no database accessed.');console.log(message.subject);console.log(message.text);
