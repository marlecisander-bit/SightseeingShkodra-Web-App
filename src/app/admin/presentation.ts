/** Owner-facing labels only. Stored values and action payloads stay unchanged. */
export const positionLabels: Record<string, string> = {
  'center center': 'Center', 'center top': 'Top', 'center bottom': 'Bottom',
  'left center': 'Left', 'right center': 'Right', 'left top': 'Top left',
  'right top': 'Top right', 'left bottom': 'Bottom left', 'right bottom': 'Bottom right',
};

export function ownerFieldLabel(label: string) {
  return label.replace('Homepage SEO', 'Homepage search & sharing').replace(/Eyebrow/g, 'Small heading').replace(/focal position/gi, 'image position')
    .replace(/SEO/g, 'Search result').replace(/alt text/gi, 'description')
    .replace(/\bURL\b/g, 'link').replace('Enable WhatsApp button', 'WhatsApp contact')
    .replace('WhatsApp Business number (international, with country code)', 'Business number');
}

export function ownerStatus(value: string | null | undefined) {
  return ({draft:'Draft',published:'Published',unpublished:'Unpublished',archived:'Archived',
    active:'Active',paused:'Paused',scheduled:'Scheduled',pending:'Pending',awaiting_payment:'Awaiting payment',
    paid:'Paid',confirmed:'Confirmed',cancelled:'Cancelled',expired:'Expired',released:'Released',
    consumed:'Used',held:'Temporarily reserved',failed:'Failed',processing:'Processing',partially_refunded:'Partially refunded',refunded:'Refunded',refund_pending:'Refund review needed',
  } as Record<string,string>)[value ?? ''] ?? 'Status unavailable';
}

export function ownerEmailStatus(value: string) {
  return ({pending:'Pending',leased:'Preparing',sending:'Sending',retry:'Will retry',accepted:'Sent (arrival not confirmed)',
    failed:'Could not send',uncertain:'Check delivery before resending',skipped:'Not sent',
  } as Record<string,string>)[value] ?? 'Status unavailable';
}

export function ownerEmailEvent(value?: string | null) {
  return ({BOOKING_CREATED:'New booking',BOOKING_MODIFIED:'Booking changed',BOOKING_CANCELLED:'Booking cancelled',
    'booking.confirmed':'Booking confirmation','booking.modified':'Booking changed','order.cancelled':'Booking cancelled',
  } as Record<string,string>)[value ?? ''] ?? 'Booking update';
}

export function imageUploadMessage(error: unknown) {
  if (error instanceof Error && /^(This image is |This image could not be opened\.|Your browser could not prepare this image\.)/.test(error.message)) return error.message;
  return 'Image could not be uploaded. Choose a JPEG, PNG, WebP or AVIF image and try again.';
}
