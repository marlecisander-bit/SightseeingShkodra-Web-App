import {notFound} from 'next/navigation';
import {NavigationFixture} from '../navigation-fixture';
export default function Layout({children}:{children:React.ReactNode}){if(process.env.NODE_ENV!=='development')notFound();return <NavigationFixture mode="after">{children}</NavigationFixture>;}
