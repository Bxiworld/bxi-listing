import React, { useEffect, useState } from 'react';
import { useAuthUser } from '../hooks/useAuthUser';
import { waitForSellerHandoff } from '../utils/api';

const LOGIN_URL = (
  process.env.REACT_APP_LOGIN_URL ||
  process.env.REACT_APP_DASHBOARD_URL ||
  'https://bxi-dashboard-skrsv.ondigitalocean.app/login'
).replace(/\/+$/, '');

const DASHBOARD_URL = (
  process.env.REACT_APP_DASHBOARD_URL ||
  'https://bxi-dashboard-skrsv.ondigitalocean.app'
).replace(/\/+$/, '');

function getEntrySource() {
  try {
    const q = new URLSearchParams(window.location.search);
    return (
      q.get('source') ||
      sessionStorage.getItem('listing_entry_source') ||
      ''
    );
  } catch {
    return '';
  }
}

/**
 * Auth guard: wait for any dashboard handoff code exchange, then require a
 * session. Unauthenticated users are sent to the configured dashboard login
 * (not a hardcoded production host).
 */
export function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuthUser();
  const [handoffSettled, setHandoffSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await waitForSellerHandoff();
      } catch {
        /* exchange failed — treat as settled so we can redirect cleanly */
      }
      if (!cancelled) setHandoffSettled(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !handoffSettled) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-pulse text-[#C64091]">Loading...</div>
      </div>
    );
  }

  if (LOGIN_URL && !isAuthenticated) {
    const source = getEntrySource();
    const returnTo = window.location.href;
    // Dashboard handoff failed / missing → send back to the matching dashboard
    // login (dev UAT), never a hardcoded production host.
    const loginBase =
      source === 'dashboard'
        ? `${DASHBOARD_URL}/login`
        : LOGIN_URL.includes('/login')
          ? LOGIN_URL
          : `${LOGIN_URL}/login`;
    window.location.href = `${loginBase}?redirect=${encodeURIComponent(returnTo)}`;
    return null;
  }

  return children;
}

export default AuthGuard;
