import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
export type WorkerEvidence = {started_at:string;finished_at:string|null;last_success_at:string|null;status:string;processed:number};
export function workerHealth(evidence:WorkerEvidence|null, enabled:boolean, now=Date.now()) {
  if(!enabled) return 'Disabled';
  if(!evidence) return 'Unverified';
  if(evidence.status==='failed') return 'Last run failed';
  if(evidence.status==='running') return now-Date.parse(evidence.started_at)<120000?'Running':'Run overdue';
  const age=evidence.finished_at?now-Date.parse(evidence.finished_at):Infinity;
  if(age<0||age>180000) return 'No recent successful run';
  if(evidence.status==='test') return 'Operational (test mode)';
  if(evidence.status==='live') return 'Operational';
  return 'Disabled at last run';
}
export async function withEmailHeartbeat<T extends {status:string;processed:number}>(client:Pick<SupabaseClient,'rpc'>,operator:string,work:()=>Promise<T>) {
  const start=await client.rpc('begin_email_worker_run_v1',{p_operator_id:operator});
  if(start.error || typeof start.data!=='string') throw Error('email_heartbeat_unavailable');
  try {
    const result=await work();
    const finish=await client.rpc('finish_email_worker_run_v1',{p_operator_id:operator,p_token:start.data,p_status:result.status,p_processed:result.processed});
    if(finish.error) throw Error('email_heartbeat_unavailable');
    return result;
  } catch {
    // Best effort only; lack of completion remains visible as an overdue run.
    try { await client.rpc('finish_email_worker_run_v1',{p_operator_id:operator,p_token:start.data,p_status:'failed',p_processed:0}); } catch { /* Remains overdue. */ }
    throw Error('email_worker_failed');
  }
}
