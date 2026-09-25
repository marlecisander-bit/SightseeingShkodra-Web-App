'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { withOperatorService } from '@/modules/identity/operator-service';

export async function saveServiceSchedule(operatorId: string, form: FormData) {
  let errorMessage = '';
  try {
    const value = (key: string) => String(form.get(key) ?? '');
    await withOperatorService(operatorId, 'departures.manage', async (client, context) => {
      const exception = value('mode') === 'exception';
      const common = { p_operator_id: context.operatorId, p_actor_id: context.staffProfileId,
        p_expected_updated_at: value('updated_at') || null };
      const times = JSON.parse(value('departure_times'));
      const { error } = exception
        ? await client.rpc('save_schedule_exception_v1', { ...common, p_schedule_id: value('schedule_id'),
          p_date: value('service_date'), p_closed: value('closed') === 'true', p_times: times,
          p_note: value('note'), p_restore: value('restore') === 'true' })
        : await client.rpc('save_service_schedule_v1', { ...common, p_product_id: value('product_id'),
          p_start: value('start_date'), p_end: value('end_date'), p_weekdays: form.getAll('weekdays').map(Number),
          p_times: times, p_capacity: Number(value('default_capacity')), p_vehicle_id: value('vehicle_id') || null,
          p_status: value('status') });
      if (error) errorMessage = error.code === 'PT409' ? 'This schedule changed. Your entries are preserved; reload the latest schedule before saving.'
        : error.code === 'P0001' ? 'Reserved seats or conflicting manual departures prevent this change. Resolve affected bookings or reconcile the manual departures first. Nothing was changed.'
        : 'Unable to save. Check the operating period, weekdays, unique times, positive capacities and exception date. Your entries are preserved.';
    });
  } catch { errorMessage = 'Unable to save the schedule. Check your access and entries, then try again.'; }
  if (errorMessage) return { error: errorMessage };
  revalidatePath(`/admin/${operatorId}/departures`);
  revalidatePath(`/admin/${operatorId}/bookings`);
  revalidatePath('/');
  redirect(`/admin/${operatorId}/departures?result=schedule`);
}
