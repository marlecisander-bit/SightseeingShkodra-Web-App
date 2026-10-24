'use client';
import {useLinkStatus} from 'next/link';
import {AdminIcon} from './admin-icon';
export function BookingOpenLabel(){
 const {pending}=useLinkStatus();
 return <><span role="status">{pending?'Opening…':'View booking'}</span><AdminIcon name="arrow-right" size={16}/></>;
}
