import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import '../../(public)/public.css';
export const dynamic = 'force-dynamic';
export default function ButtonsPreview() {
 if(process.env.NODE_ENV !== 'development') notFound();
 const labels=['Book your day','Rezervoni udhetimin tuaj','Prenota la tua giornata a Scutari','Buchen Sie Ihren Tagesausflug','Reservez votre journee a Shkodra'];
 return <div className="public-site"><main style={{padding:16,gap:16,maxWidth:900}}><h1>Button layout checks</h1>{labels.map(label=><div className="p-actions" key={label}><Button className="p-button p-button-booking">{label}</Button><Button className="p-button">{label}</Button></div>)}<Button className="p-button" disabled>Unavailable</Button><Button className="p-button" disabled aria-busy="true">Saving changes...</Button><Button className="p-button" size="sm">Save</Button><Button className="p-button" fullWidth>Full width action</Button></main></div>;
}
