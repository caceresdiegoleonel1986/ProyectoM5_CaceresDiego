import { useEffect, useState, useRef } from "react";

export function useHeaderVisible() {
  const [isVisible, setIsVisible] = useState(true);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  return { isVisible, headerRef };
}