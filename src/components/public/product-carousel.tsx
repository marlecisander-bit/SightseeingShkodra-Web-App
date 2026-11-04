"use client";

import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./product-booking-cards.module.css";

/** Native scrolling preserves vertical gestures and works without JavaScript. */
export function ProductCarousel({ children, titles }: { children: ReactNode; titles: string[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const id = useId();
  const [active, setActive] = useState(0);
  return <>
    <div ref={rail} id={id} style={{"--product-count":Math.min(titles.length,3)} as CSSProperties} className={styles.grid} onScroll={() => {
      const node = rail.current;
      if (!node) return;
      const left = node.getBoundingClientRect().left;
      const distances = Array.from(node.children, child => Math.abs(child.getBoundingClientRect().left - left));
      setActive(distances.indexOf(Math.min(...distances)));
    }}>{children}</div>
    {titles.length > 1 && <div className={styles.pagination} role="group" aria-label="Choose experience">
      {titles.map((title, index) => <button key={index} type="button" aria-label={`Show ${title}`} aria-controls={id} aria-current={active === index ? "true" : undefined} onClick={() => {
        const node = rail.current;
        const card = node?.children[index] as HTMLElement | undefined;
        if (node && card) node.scrollTo({left:card.offsetLeft - (node.children[0] as HTMLElement).offsetLeft, behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
      }}><span/></button>)}
    </div>}
  </>;
}
