"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import styles from "./expandable-text.module.css";

type Props = {
  text: string;
  collapsedLines?: number | { mobile: number; tablet: number; desktop: number };
  className?: string;
  as?: "p" | "blockquote";
  moreLabel?: string;
  lessLabel?: string;
};

export function ExpandableText(props: Props) {
  // A replacement CMS value starts collapsed, including same-destination edits.
  return <TextBlock key={props.text} {...props} />;
}

function TextBlock({ text, collapsedLines = { mobile: 4, tablet: 5, desktop: 6 }, className, as: Tag = "p", moreLabel = "Read more", lessLabel = "Show less" }: Props) {
  const id = useId();
  const ref = useRef<HTMLParagraphElement & HTMLQuoteElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const limits = typeof collapsedLines === "number"
    ? { mobile: collapsedLines, tablet: collapsedLines, desktop: collapsedLines }
    : collapsedLines;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let active = true;
    const measure = () => {
      if (!active || !element.getClientRects().length) return;
      const css = getComputedStyle(element);
      const lineHeight = Number.parseFloat(css.lineHeight);
      const lines = Number.parseFloat(css.getPropertyValue("--visible-lines"));
      // scrollHeight includes the full text even when line-clamped. This also
      // measures the collapsed capacity while the same element is expanded.
      setOverflows(element.scrollHeight > lineHeight * lines + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure);
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [limits.mobile, limits.tablet, limits.desktop]);

  return <div className={styles.root} style={{
    "--mobile-lines": limits.mobile,
    "--tablet-lines": limits.tablet,
    "--desktop-lines": limits.desktop,
  } as CSSProperties}>
    <Tag ref={ref} id={id} className={`${styles.text}${className ? ` ${className}` : ""}`} data-collapsed={overflows && !expanded ? "true" : undefined}>{text}</Tag>
    {overflows && <button type="button" className={styles.toggle} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>{expanded ? lessLabel : moreLabel}</button>}
  </div>;
}
