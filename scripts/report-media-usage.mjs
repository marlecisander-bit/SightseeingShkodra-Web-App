import {readFile,stat} from 'node:fs/promises';
import {assertLocalEnvironment} from './cms-verification/safety.mjs';
import {mediaReferences} from './cms-verification/media.mjs';
assertLocalEnvironment();
const file=process.argv[2];if(!file||/^[a-z]+:\/\//i.test(file))throw Error('Provide a local JSON snapshot path; no remote service is supported.');
const info=await stat(file);if(!info.isFile()||info.size>10*1024*1024)throw Error('Provide a regular snapshot file up to 10 MiB.');
const bytes=await readFile(file);if(bytes.length>10*1024*1024)throw Error('Snapshot exceeds 10 MiB.');
const input=JSON.parse(bytes.toString());console.log(JSON.stringify(mediaReferences(input.documents??input,input.objects??[]),null,2));
