import 'server-only';
import { editableWebsiteSections } from '@/modules/content/website-schema';
import { ownerFieldLabel } from './presentation';

/** Keep validation advice, but never send unexpected infrastructure errors to the browser. */
export function ownerActionError(error: unknown, fallback: string): string {
  console.error('Admin action failed', error);
  if (!(error instanceof Error)) return fallback;
  let message = error.message;
  const calendarMessages: Record<string,string> = {
    'Schedule changed; reload': 'This schedule changed. Copy your edits, then refresh before saving.',
    'Product changed; reload': 'This product changed. Copy your edits, then refresh before saving.',
    'Set each category price; zero is allowed': 'Set a price for each age group. Use zero when there is no charge.',
    'Age ranges must be continuous and must not overlap': 'Check the age groups: every age must belong to exactly one group, with no gaps or overlaps.',
    'Capacity cannot be below confirmed passengers and active holds': 'Maximum seats cannot be lower than booked seats and temporary reservations.',
    'Too many range overrides': 'There are too many date-range changes. Ask your administrator to help simplify the schedule.',
  };
  if (calendarMessages[message]) return calendarMessages[message];
  for (const field of editableWebsiteSections.flatMap(section => section.fields)) {
    message = message.replaceAll(field.key, ownerFieldLabel(field.label));
  }
  if (/supabase|schema|payload|fetch|network|token|secret|permission denied|https?:|[a-f0-9]{8}-[a-f0-9-]{27}/i.test(message)) return fallback;
  if (!/^(Check |Choose |Enter |Use |This |Unable to save|Review could not|Settings could not|Google Reviews |Image upload failed|Image must|The image|Only |Publish |Publishing requires |Add |Provide |Keep |Remove )/.test(message)) return fallback;
  return ownerFieldLabel(message).replace(/\bslug\b/gi, 'page address');
}
