import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';

const LOGIN_URL = process.env.REACT_APP_LOGIN_URL || '';

/**
 * Optional auth guard: if REACT_APP_LOGIN_URL is set and user is not authenticated, redirect to login.
 * Otherwise render children.
 */
export function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuthUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-pulse text-[#C64091]">Loading...</div>
      </div>
    );
  }

  if (LOGIN_URL && !isAuthenticated) {
    const returnTo = window.location.href;
    const redirect = `${LOGIN_URL}?redirect=${encodeURIComponent(returnTo)}`;
    window.location.href = redirect;
    return null;
  }

  return children;
}

export default AuthGuard;
