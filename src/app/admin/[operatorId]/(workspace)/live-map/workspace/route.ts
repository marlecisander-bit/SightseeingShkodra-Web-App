import { randomBytes } from 'node:crypto';
import { trackingAdminSession } from '@/modules/tracking/admin-server';
import stopDesignDefaults from '@/modules/tracking/stop-design-defaults.json';
import { workspaceHtml } from '@/modules/tracking/workspace-template';

export async function GET(_request: Request, { params }: { params: Promise<{ operatorId: string }> }) {
  const { operatorId } = await params;
  const session = await trackingAdminSession(operatorId).catch(() => null);
  const headers = {
    'Cache-Control': 'private, no-store',
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin',
  };
  if (!session) return new Response('<p>Reconnect your tracking account in the website admin to open the editing workspace.</p>', { status: 401, headers });

  const nonce = randomBytes(24).toString('base64');
  const configuration = {
    workspaceProjectId: session.projectId,
    workspaceDataPath: `/admin/${encodeURIComponent(operatorId)}/live-map/workspace/data/`,
  };
  const defaults = JSON.stringify(stopDesignDefaults).replace(/</g, '\\u003c');
  const bootstrap = `<script nonce="${nonce}">window.liveMapWorkspace = ${JSON.stringify(configuration).replace(/</g, '\\u003c')};window.stopDesignDefaults = ${defaults};</script>`;
  return new Response(workspaceHtml.replace('<!-- WORKSPACE_CONFIG -->', bootstrap), {
    headers: {
      ...headers,
      'Content-Security-Policy': [
        "default-src 'none'",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' https: data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://router.project-osrm.org",
        "sandbox allow-same-origin allow-scripts allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox",
        "frame-ancestors 'self'",
        "base-uri 'none'",
        "form-action 'none'",
      ].join('; '),
    },
  });
}
