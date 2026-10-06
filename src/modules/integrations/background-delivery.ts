/** Hosted delivery requires explicit Production activation after scheduler configuration.
 * Keep this guard at the worker boundary, including direct/manual invocations.
 * Preview and hosted Development remain unconditionally paused.
 */
export function backgroundDeliveryPaused(env: NodeJS.ProcessEnv = process.env): boolean {
  if (!env.VERCEL_ENV) return false;
  return env.VERCEL_ENV !== 'production' || env.APP_ENV !== 'production'
    || env.BACKGROUND_DELIVERY_ENABLED !== 'true';
}
