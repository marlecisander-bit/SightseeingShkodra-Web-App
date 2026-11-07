const messages:Record<string,string>={
 DELIVERY_PAUSED:'Push delivery is paused or not configured. Registration does not activate delivery; ask the owner to check worker settings.',
 TEST_RATE_LIMIT:'Wait one minute before sending another test notification.',
 DEVICE_UNAVAILABLE:'This device is no longer registered. Enable notifications again or use Repair registration.',
 PUSH_DISABLED:'Push registration is not configured for this environment. Ask the owner to check push settings.',
 SUBSCRIPTION_INVALID:'The browser returned an unsupported subscription. Update the browser or iOS, then tap Retry.',
 DEVICE_ACCOUNT:'This browser has an older registration for another account or workspace. Tap Retry to set up alerts for this account.',
 DEVICE_LIMIT:'You have reached 50 active devices. Remove an old device below and try again.',
 REGISTRATION_UNSAVED:'The device subscription could not be saved. Check your connection and sign-in, then enable again.',
 UNAUTHENTICATED:'Your session expired. Sign in to this workspace again before registering notifications.',
 FORBIDDEN:'This account cannot manage booking notifications. An active owner, admin or operations role is required.',
 UNAVAILABLE:'Notification settings are unavailable. Check your connection and sign-in, then retry.',
 INSTALL_REQUIRED:'On iPhone/iPad, install Admin on the Home Screen and open its icon before enabling notifications. iOS/iPadOS 16.4 or later is required.',
 UNSUPPORTED:'Push is not supported in this browser. Use a supported browser over HTTPS.',
 PERMISSION_DENIED:'Notifications are blocked. Open this app’s notification settings to allow them, then return here. This page cannot override a denial or Focus.',
 PERMISSION_DISMISSED:'Permission was not granted. Tap Enable notifications again when you are ready to allow them.',
 WORKER_FAILED:'The notification service worker could not start. Check your connection, reload Admin and retry.',
 KEY_CHANGED:'This registration needs refreshing. Enable booking alerts again.',
 SUBSCRIBE_FAILED:'The push service rejected registration. Check iOS/browser updates, network access to Apple’s push service, and tap Retry.',
};
export class PushRegistrationError extends Error {
 constructor(public code:string){super(messages[code]??messages.UNAVAILABLE);this.name='PushRegistrationError';}
}
