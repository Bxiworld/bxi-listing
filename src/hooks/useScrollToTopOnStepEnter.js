import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll window to top when a wizard step component mounts (separate route → new mount). */
export function useScrollToTopOnStepEnter() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);
}

/**
 * Scroll when the route pathname changes. Use when the same component is used for multiple steps
 * (e.g. voucher design and go-live) so each transition resets scroll.
 */
export function useScrollToTopOnPathname() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
}
