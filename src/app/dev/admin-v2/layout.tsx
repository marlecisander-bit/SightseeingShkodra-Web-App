import {notFound} from 'next/navigation';
import {Suspense,type ReactNode} from 'react';
import {AdminV2Fixture} from './fixture';
export default function Layout({children}:{children:ReactNode}){if(process.env.NODE_ENV!=='development')notFound();return <Suspense><AdminV2Fixture>{children}</AdminV2Fixture></Suspense>;}
