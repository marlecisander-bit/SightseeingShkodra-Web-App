"use client";

import Link from "next/link";
import type {ComponentProps} from "react";
import type {BookableProduct} from "@/modules/booking/products";
import {BookingProvider, useBooking} from "./booking";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {product:BookableProduct};
/** Preserve direct/new-tab URLs while ordinary product activation stays on this page. */
export function ProductBookingLink({product,...props}: Props) {
  return <BookingProvider product={product}><ProductDialogLink {...props} product={product}/></BookingProvider>;
}
function ProductDialogLink({product,onClick,...props}: Props) {
  const {open} = useBooking();
  return <Link {...props} href={`/book?productId=${product.id}`} aria-haspopup="dialog" onClick={event=>{
    onClick?.(event);
    if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (props.target && props.target!=="_self") || props.download)return;
    event.preventDefault();
    open(event.currentTarget);
  }}/>;
}
