import {BookingConfirmation} from './booking-confirmation';
import {MutationForm,type MutationFailure} from './mutation-form';
import {SubmitButton} from './submit-button';
import styles from './bookings.module.css';
export function BookingDeletionForm({reference,action}:{reference:string;action:(form:FormData)=>Promise<MutationFailure|void>}){
 return <details className={styles.cancel}><summary>Delete booking permanently</summary><p>This removes the reservation from the database and invalidates its pass and management link. Seats are released. Payment, refund and audit history remain; no refund is issued. This cannot be undone.</p><BookingConfirmation message={`Permanently delete ${reference}? This cannot be undone. Financial history is retained; no refund is issued.`}><MutationForm action={action}><label>Type booking reference {reference}<input name="reference" required maxLength={200} autoComplete="off" spellCheck={false}/></label><label>Reason for deletion<textarea name="reason" required maxLength={500}/></label><label className={styles.check}><input type="checkbox" name="confirm" value="yes" required/>I understand this permanently deletes the booking</label><SubmitButton>Delete booking permanently</SubmitButton></MutationForm></BookingConfirmation></details>;
}
