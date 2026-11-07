"""Prepare a reviewable Git patch using a private index; never commit/push or checkout."""
from pathlib import Path
import hashlib,json,os,subprocess
root=Path(__file__).resolve().parents[1]
os.chdir(root)
out=root/'docs/evidence/notification-readiness-20261107'
out.mkdir(parents=True,exist_ok=True)
base='7daae3f2ea254b2469946cd8fd665340a740511a'
files='''
.env.example
public/admin/sw.js
src/app/admin/email-actions.ts
src/app/admin/email-panel.tsx
src/app/admin/notifications.module.css
src/app/admin/notifications.tsx
src/app/admin/booking-push-device.tsx
src/app/admin/configured-admin-test-form.tsx
src/app/api/admin/notifications/route.ts
src/app/auth/actions.ts
src/app/dev/admin-notifications/fixture.tsx
src/app/dev/email-reliability-preview/page.tsx
src/app/dev/booking-alerts/page.tsx
src/app/dev/booking-alerts/preview.tsx
src/modules/identity/admin-origin.ts
src/modules/integrations/admin-operational-email.ts
src/modules/integrations/configured-admin-test.ts
src/modules/integrations/booking-email-template-v2.ts
src/modules/integrations/booking-email-template.ts
src/modules/integrations/booking-email-worker.ts
src/modules/integrations/email-admin-status.ts
src/modules/integrations/email-admin-test.ts
src/modules/integrations/owner-new-booking-email.ts
src/modules/integrations/resend-provider.ts
src/modules/notifications/config.ts
src/modules/notifications/provider.ts
src/modules/notifications/push.ts
src/modules/notifications/server.ts
src/modules/notifications/test-push.ts
src/modules/notifications/worker.ts
src/modules/notifications/delivery-health.ts
src/modules/notifications/lock-screen-message.ts
src/modules/notifications/push-registration.ts
src/modules/notifications/registration-errors.ts
src/proxy.ts
supabase/migrations/20261107000200_admin_push_worker_health.sql
tests/components/booking-push-device.test.mjs
tests/database/core-schema.test.mjs
tests/database/push-worker-health.test.mjs
tests/integrations/admin-push.test.mjs
tests/integrations/booking-emails.test.mjs
tests/integrations/notification-activation.test.mjs
tests/integrations/booking-alert-events.test.mjs
tests/integrations/canonical-admin-origin.test.mjs
tests/integrations/configured-admin-test.test.mjs
tests/integrations/delivery-health.test.mjs
tests/integrations/push-registration.test.mjs
tests/integrations/admin-transition.test.mjs
scripts/audit-notification-public.mjs
scripts/check-admin-transition.mjs
scripts/prepare-notification-release.py
scripts/validate-notification-candidate.py
docs/ADMIN-BOOKING-ALERTS-2026-11-07.md
docs/EMAIL-COM-SIMPLE-ALERTS-2026-11-07.md
docs/NOTIFICATION-RELEASE-CHECKLIST-2026-11-07.md
docs/NOTIFICATION-DEPLOYMENT-READINESS-2026-11-07.md
'''.split()
# Keep redacted evidence with reports. Avoid self-referential patch/index/manifest.
for directory in ['admin-booking-alerts-20261107','email-com-simple-alerts-20261107','notification-release-20261107']:
 files += [str(p.relative_to(root)) for p in (root/'docs/evidence'/directory).glob('*') if p.is_file()]
files += [str(p.relative_to(root)) for p in out.glob('*') if p.is_file() and p.suffix in ['.log','.json'] and p.name!='release-manifest.json']
files=sorted(set(files))
def git(*args,env=None):return subprocess.check_output(['git',*args],env=env)
def sha(data):return hashlib.sha256(data).hexdigest()
normal_index=root/git('rev-parse','--git-path','index').decode().strip()
normal_hash=sha(normal_index.read_bytes())
assert git('rev-parse',base+'^{tree}')==git('rev-parse','HEAD^{tree}'), 'Baseline moved; review before packaging'
index=out/'release.index'
env={**os.environ,'GIT_INDEX_FILE':str(index)}
git('read-tree',base,env=env)
git('add','--',*files,env=env)
tree=git('write-tree',env=env).decode().strip()
patch=git('diff','--cached','--binary',base,env=env)
(out/'notification-only.patch').write_bytes(patch)
git('diff','--cached','--check',base,'--','.',':(exclude)docs/evidence/**',env=env)
changed=set(filter(None,git('diff','--name-only','-z',base).decode().split('\0')))
changed.update(filter(None,git('ls-files','--others','--exclude-standard','-z').decode().split('\0')))
excluded=sorted(p for p in changed if p not in files and (p.startswith(('src/','tests/','supabase/')) or p in ['AGENTS.md','DEPLOYMENT.md','README.md','next-env.d.ts']))
for p in excluded:
 old=subprocess.run(['git','cat-file','-e',base+':'+p],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 candidate=subprocess.run(['git','cat-file','-e',tree+':'+p],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 if old.returncode==0:assert git('rev-parse',base+':'+p)==git('rev-parse',tree+':'+p),p
 else:assert candidate.returncode!=0,p
assert sha(normal_index.read_bytes())==normal_hash, 'Normal index changed'
validation_path=out/'candidate-validation.json'
validation=json.loads(validation_path.read_text()) if validation_path.exists() else {}
def runtime_fingerprint(t):return sha(git('ls-tree','-r',t,'--','src','public','supabase','tests','package.json','package-lock.json','next.config.ts','next.config.mjs','tsconfig.json'))
validated=bool(validation.get('candidate-check',{}).get('exitCode')==0 and validation.get('candidate-tests',{}).get('exitCode')==0 and validation.get('excludedFilesRestoredByteIdentically') and runtime_fingerprint(tree)==runtime_fingerprint(validation['candidateTreeTested']))
manifest={'baseCommit':base,'localHead':git('rev-parse','HEAD').decode().strip(),'candidateTree':tree,'normalIndexUntouched':True,'patch':'notification-only.patch','patchSha256':sha(patch),'files':[{'path':p,'sha256':sha((root/p).read_bytes())} for p in files],'excludedChangedSourceAndSharedFiles':excluded,'migrationIncluded':'20261107000200_admin_push_worker_health.sql','migrationExcluded':'20261107000100_product_availability_order.sql','candidateExecuted':validated,'validationScope':'Application runtime, tests, migrations and build configuration match executed candidate; reports, evidence and preparation utilities may be newer','runtimeFingerprint':runtime_fingerprint(tree),'runtimeTestedFromTree':validation.get('candidateTreeTested'),'publicationAuthorized':False}
(out/'release-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
index.unlink()
print(json.dumps({'tree':tree,'files':len(files),'excluded':len(excluded),'patchBytes':len(patch),'normalIndexUntouched':True}))
