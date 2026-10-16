import {assertLocalEnvironment} from './cms-verification/safety.mjs';
assertLocalEnvironment();
const {verifyCms}=await import('./cms-verification/verify.mjs');
const result=await verifyCms({write:true});
console.log(JSON.stringify(result.counts,null,2));
process.exitCode=result.counts.fields.FAIL||result.counts.checks.FAIL?1:0;
