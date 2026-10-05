import { NotificationCenter } from '../../notifications';
import { safeAdminReturn } from '@/modules/notifications/contracts';
import { EmailPanel } from "../../email-panel";
import { ReviewsPanel } from "../../reviews-panel";
import { notFound, redirect } from 'next/navigation';
import { requirePermission } from '../../../../modules/identity/require-permission';
import { AuthorizationError } from '../../../../modules/identity/authorization';
import { adminSections } from '../../../../modules/identity/admin-navigation';
import { createSessionClient } from '../../../../modules/identity/supabase-server';
import { CatalogPanel } from '../../catalog-panel';
import { CalendarPanel } from '../../calendar-panel';
import { ContentPanel } from '../../content-panel';
import { BookingsPanel } from '../../bookings-panel';
import { AdminShell } from '../../admin-shell';
import { OverviewPanel } from '../../overview-panel';
export default async function Workspace({ params, searchParams }: { params: Promise<{ operatorId: string; section: string }>; searchParams: Promise<{ result?: string; date?:string; email?:string; requestId?:string; booking?:string; delivery?:string; recipient?:string }> }) {
  const { operatorId, section } = await params;
  const selected = adminSections.find(item => item.slug === section);
  if (!selected) notFound();
  let context;
  try { context = await requirePermission(operatorId, selected.permission); }
  catch (error) {
    if (error instanceof AuthorizationError) {
      const search = await searchParams;
      const query = new URLSearchParams();
      if (section === 'bookings' && search.booking) query.set('booking', search.booking);
      if (['bookings', 'departures'].includes(section) && search.date) query.set('date', search.date);
      const next = safeAdminReturn(`/admin/${operatorId}/${section}${query.size ? '?' + query.toString() : ''}`);
      redirect(`/auth/sign-in?next=${encodeURIComponent(next)}&error=${error.code === 'UNAUTHENTICATED' ? 'signin' : error.code === 'FORBIDDEN' ? 'access' : 'unavailable'}`);
    }
    throw error;
  }
  const client = await createSessionClient();
  const { data: operator } = await client.from('operators').select('name').eq('id', context.operatorId).single();
  return <AdminShell userId={context.userId} operatorId={context.operatorId} operatorName={operator?.name ?? 'Operator workspace'} role={context.role} section={section}>
    {section !== 'content' && <h1>{selected.label}</h1>}
    {section==='notifications'?<NotificationCenter/>:section==='email'?<EmailPanel operatorId={context.operatorId} {...await searchParams}/>:section==='reviews'?<ReviewsPanel operatorId={context.operatorId}/>:section==='catalog'?<CatalogPanel operatorId={context.operatorId} result={(await searchParams).result}/>:section==='departures'?<CalendarPanel operatorId={context.operatorId} {...await searchParams}/>:section==='content'?<ContentPanel operatorId={context.operatorId} result={(await searchParams).result}/>:section==='bookings'?<BookingsPanel operatorId={context.operatorId} {...await searchParams}/>:<OverviewPanel operatorId={context.operatorId} role={context.role}/>}
  </AdminShell>;
}
