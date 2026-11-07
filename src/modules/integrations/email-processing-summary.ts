/** Automatic sending health; provider outcomes and inbox receipt are separate. */
export function emailProcessingSummary(input:{enabled:boolean;processing:string;pending:number;queueFailures:number|undefined;health:{delayed:number;missingOutcome:number;oldestPending:string|null}|null},now=Date.now()):'Working'|'Paused'|'Needs attention'{
 if(!input.enabled)return 'Paused';
 const oldest=input.health?.oldestPending?Date.parse(input.health.oldestPending):NaN;
 const overdue=input.pending>0&&(!Number.isFinite(oldest)||oldest>now||now-oldest>180000);
 return input.processing==='Operational'&&input.health&&input.queueFailures===0&&!overdue&&input.health.delayed===0&&input.health.missingOutcome===0?'Working':'Needs attention';
}
