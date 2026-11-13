"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** A single row that scrolls sideways when it overflows. */
export function ScrollRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current!;
    // Mouse wheels only scroll vertically; turn that into sideways scrolling while the row overflows.
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={scrollRef}
      className={cn("scroll-fade-x no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain", className)}
    >
      <div className="flex w-max items-center gap-4">{children}</div>
    </div>
  );
}
