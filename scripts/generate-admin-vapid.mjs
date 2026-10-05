import {mkdir,writeFile} from 'node:fs/promises';
import webpush from 'web-push';

// Deliberate owner action; never print the private key or overwrite an existing pair.
const directory=new URL('../private/',import.meta.url);
await mkdir(directory,{recursive:true});
const {publicKey,privateKey}=webpush.generateVAPIDKeys();
await writeFile(new URL('admin-push-vapid.env',directory),`VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\nVAPID_SUBJECT=\n`,{flag:'wx',mode:0o600});
console.log('Keys saved to ignored private/admin-push-vapid.env. Set VAPID_SUBJECT and copy the values into hosting environment settings. Do not commit or share this file.');
