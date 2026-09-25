'use client';
import { Button } from "@/components/ui/button";
import { useRef, useState } from 'react';
import { MutationForm } from './mutation-form';
import { SubmitButton } from './submit-button';
import { saveServiceSchedule } from './schedule-actions';
import styles from './schedule.module.css';

export type ScheduleTime = { time: string; capacity?: number | null; vehicle_id?: string | null };
export type ServiceSchedule = { id: string; product_id: string; start_date: string; end_date: string; weekdays: number[]; departure_times: ScheduleTime[]; default_capacity: number; vehicle_id: string | null; status: string; updated_at: string; calendar_ranges?: ({from:string;to:string;weekdays:number[]}&Record<string,unknown>)[] };
export type ScheduleException = { id: string; schedule_id: string; service_date: string; closed: boolean; departure_times: ScheduleTime[]; note: string };
type Choice = { id: string; label: string };

function Times({ initial, vehicles }: { initial: ScheduleTime[]; vehicles: Choice[] }) {
  const [times, setTimes] = useState(initial);
  const nextInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  const sorted = [...times].sort((a,b) => a.time.localeCompare(b.time));
  return <div className={styles.times}>
    <input type="hidden" name="departure_times" value={JSON.stringify(sorted)} />
    <h3>Departure times</h3>
    <p>Blank overrides use the default capacity and vehicle. Each time has its own seat inventory.</p>
    {sorted.map(row => <div className={styles.timeRow} key={row.time}>
      <strong>{row.time}</strong>
      <label>Seat override<input aria-label={`Capacity at ${row.time}`} type="number" min="1" max="2147483647" step="1" placeholder="Default" value={row.capacity ?? ''} onChange={e => setTimes(times.map(t => t.time===row.time ? {...t, capacity:e.target.value ? Number(e.target.value) : null} : t))}/></label>
      <label>Vehicle override<select aria-label={`Vehicle at ${row.time}`} value={row.vehicle_id ?? ''} onChange={e => setTimes(times.map(t => t.time===row.time ? {...t,vehicle_id:e.target.value || null} : t))}><option value="">Default vehicle</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
      <Button type="button" aria-label={`Remove ${row.time}`} onClick={() => setTimes(times.filter(t => t.time!==row.time))}>Remove</Button>
    </div>)}
    <div className={styles.addTime}><label>New departure time<input type="time" step="60" ref={nextInput}/></label><Button type="button" disabled={times.length>=24} onClick={() => {
      const next = nextInput.current?.value;
      if (!next || times.some(t=>t.time===next)) {setNotice('Choose a time that is not already listed.'); return;}
      setTimes([...times,{time:next}]); if(nextInput.current) nextInput.current.value=''; setNotice('');
    }}>+ Add departure time</Button></div>
    {notice && <p role="alert">{notice}</p>}
  </div>;
}

export function ScheduleEditor({operatorId, schedule, products, vehicles}: {operatorId:string; schedule?:ServiceSchedule; products:Choice[]; vehicles:Choice[]}) {
  return <MutationForm action={saveServiceSchedule.bind(null,operatorId)} className={styles.form}>
    <input type="hidden" name="updated_at" value={schedule?.updated_at ?? ''}/>
    <label>Product<select name="product_id" required defaultValue={schedule?.product_id ?? ''} disabled={!!schedule}><option value="">Choose product</option>{products.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
    {schedule && <input type="hidden" name="product_id" value={schedule.product_id}/>}
    <h3>Service operating period</h3>
    <div className={styles.pair}><label>Start date<input type="date" name="start_date" required defaultValue={schedule?.start_date}/></label><label>End date<input type="date" name="end_date" required defaultValue={schedule?.end_date}/></label></div>
    <fieldset className={styles.weekdays}><legend>Operating days</legend>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day,i)=><label key={day}><input name="weekdays" type="checkbox" value={i+1} defaultChecked={schedule ? schedule.weekdays.includes(i+1) : true}/>{day}</label>)}</fieldset>
    <div className={styles.pair}><label>Default capacity per departure<input type="number" name="default_capacity" min="1" max="2147483647" step="1" required defaultValue={schedule?.default_capacity ?? 8}/></label><label>Default vehicle<select name="vehicle_id" defaultValue={schedule?.vehicle_id ?? ''}><option value="">Unassigned</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label></div>
    <Times initial={schedule?.departure_times ?? []} vehicles={vehicles}/>
    <label>Status<select name="status" defaultValue={schedule?.status ?? 'active'}><option value="active">Active</option><option value="paused">Paused</option></select></label>
    <p>Changes affect future departures. Existing reservations must be resolved before closing a departure or lowering capacity below reserved seats.</p>
    <SubmitButton disabled={!products.length}>Save Schedule</SubmitButton>
  </MutationForm>;
}

export function ExceptionEditor({operatorId,schedule,exception,vehicles}:{operatorId:string;schedule:ServiceSchedule;exception?:ScheduleException;vehicles:Choice[]}) {
  const [mode,setMode] = useState(exception?.closed ? 'closed' : 'custom');
  return <MutationForm action={saveServiceSchedule.bind(null,operatorId)} className={styles.form}>
    <input type="hidden" name="mode" value="exception"/><input type="hidden" name="schedule_id" value={schedule.id}/><input type="hidden" name="updated_at" value={schedule.updated_at}/>
    <label>Exception date<input name="service_date" type="date" min={schedule.start_date} max={schedule.end_date} required defaultValue={exception?.service_date} readOnly={!!exception}/></label>
    <label>Override<select value={mode} onChange={e=>setMode(e.target.value)}><option value="custom">Replace this date’s departures</option><option value="closed">Close entire day</option>{exception && <option value="restore">Restore normal schedule</option>}</select></label>
    <input type="hidden" name="closed" value={String(mode==='closed')}/><input type="hidden" name="restore" value={String(mode==='restore')}/>
    {mode==='custom' ? <><p>This list replaces the normal times for this date only. Remove a time to cancel it; remove and add to change a time; add a row for an extra departure. Capacity and vehicle overrides apply only on this date.</p><Times initial={exception && !exception.closed ? exception.departure_times : schedule.departure_times} vehicles={vehicles}/></> : <input type="hidden" name="departure_times" value="[]"/>}
    <label>Staff note<input name="note" maxLength={500} defaultValue={exception?.note}/></label>
    <SubmitButton>Save exception</SubmitButton>
  </MutationForm>;
}
