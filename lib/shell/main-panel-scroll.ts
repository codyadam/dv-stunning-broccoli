import * as React from "react";

const MAIN_PANEL_SELECTOR = ".main-panel-scroll";

export function scrollMainPanelToTop(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .querySelector<HTMLElement>(MAIN_PANEL_SELECTOR)
    ?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

function subscribeMainPanelHeight(onChange: () => void): () => void {
  const panel = document.querySelector<HTMLElement>(MAIN_PANEL_SELECTOR);
  if (!panel) return () => {};
  const observer = new ResizeObserver(onChange);
  observer.observe(panel);
  return () => observer.disconnect();
}

function readMainPanelHeight(): number {
  return document.querySelector<HTMLElement>(MAIN_PANEL_SELECTOR)?.clientHeight ?? 0;
}

/**
 * The main panel's visible height, kept current as it resizes. A component mounted after hydration
 * reads it in its first render, so it never paints a frame at 0; the server and hydration read 0.
 */
export function useMainPanelHeight(): number {
  return React.useSyncExternalStore(subscribeMainPanelHeight, readMainPanelHeight, () => 0);
}

/**
 * Whether `content` itself runs more than half the main panel's height past one panel, not
 * counting the end-of-list chrome inside it (elements marked `data-scroll-end`), so showing that
 * chrome never changes the answer. Content above or beside it, such as another section, does not
 * count.
 */
export function useMainPanelScrollsFar(content: React.RefObject<HTMLElement | null>): boolean {
  const [far, setFar] = React.useState(false);
  React.useEffect(() => {
    const panel = document.querySelector<HTMLElement>(MAIN_PANEL_SELECTOR);
    const element = content.current;
    if (!panel || !element) return undefined;
    const measure = () => {
      let chrome = 0;
      for (const end of element.querySelectorAll<HTMLElement>("[data-scroll-end]")) {
        chrome += end.offsetHeight;
      }
      const overflow = element.getBoundingClientRect().height - chrome - panel.clientHeight;
      setFar(overflow > panel.clientHeight / 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    observer.observe(element);
    return () => observer.disconnect();
  }, [content]);
  return far;
}
