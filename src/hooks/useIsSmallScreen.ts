import { useEffect, useState } from "react";

export default function useIsSmallScreen(breakpoint = 768) {
  const getMatches = () => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return false;
    }
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(media.matches);

    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [breakpoint]);

  return matches;
}
