import QRCode from 'qrcode';
/** Token only: no URLs, identifiers, contact details or analytics service. */
export function bookingQrMatrix(token: string) {
  if(!/^[0-9a-f]{64}$/.test(token)) throw new Error('Invalid booking credential');
  return QRCode.create(token,{errorCorrectionLevel:'M'}).modules;
}
