/** Hosted delivery is paused on Vercel Hobby by the owner's migration decision.
 * Keep this guard at the worker boundary, including direct/manual invocations.
 * A future activation requires a separately reviewed scheduling change.
 */
export function backgroundDeliveryPaused(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.VERCEL_ENV);
}
