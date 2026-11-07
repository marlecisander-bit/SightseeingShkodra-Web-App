/** Only the projector's reference/count/date grammar may reach a locked screen.
 * Customer names/contact, management tokens, notes and arbitrary event text are omitted.
 */
export function lockScreenMessage(message:string){
 const match=/^Booking (SS-[A-Za-z0-9-]{1,64}) - (.+) - [A-Z]{3} \d{1,12}\.\d{2}\. Details at processing time\.$/.exec(message);
 if(!match)return 'Open Admin for booking details.';
 const sections=match[2].split('; ');
 if(!sections.every(s=>/^\d{1,5} guests \/ \d{1,5} seats(?: - \d{4}-\d{2}-\d{2} \d{2}:\d{2})?$/.test(s)))return `Booking ${match[1]}. Open Admin for details.`;
 return `Booking ${match[1]} · ${sections.join('; ')}`.slice(0,240);
}
