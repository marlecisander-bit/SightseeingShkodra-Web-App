import {notFound} from 'next/navigation';
import {ResponsiveControls} from './preview';
import '../../(public)/public.css';
export default function Page(){if(process.env.NODE_ENV!=='development')notFound();return <ResponsiveControls/>;}
