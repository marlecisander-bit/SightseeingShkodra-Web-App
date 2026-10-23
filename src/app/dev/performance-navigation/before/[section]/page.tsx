import {notFound} from 'next/navigation';
import {NavigationFixture} from '../../navigation-fixture';
export default async function Page({params}:{params:Promise<{section:string}>}){if(process.env.NODE_ENV!=='development')notFound();const {section}=await params;return <NavigationFixture mode="before"><h1>{section}</h1></NavigationFixture>;}
