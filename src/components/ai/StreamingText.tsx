"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/components/ui";

export function StreamingText({ text, className }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  const [visible, setVisible] = useState(reduced ? words.length : 0);

  useEffect(() => {
    if (reduced) {
      setVisible(words.length);
      return;
    }
    setVisible(0);
    const timer = window.setInterval(() => {
      setVisible((current) => {
        const next = Math.min(words.length, current + 3);
        if (next >= words.length) window.clearInterval(timer);
        return next;
      });
    }, 28);
    return () => window.clearInterval(timer);
  }, [reduced, words]);

  return (
    <p className={cn("text-sm leading-7 whitespace-pre-wrap text-ink", className)}>
      {words.slice(0, visible).join("")}
      {visible < words.length ? (
        <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand-600 align-middle" />
      ) : null}
    </p>
  );
}
