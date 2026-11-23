import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthUser } from '../../hooks/useAuthUser';
import useListingEntryContext from '../../hooks/useListingEntryContext';
import { getAllowedCategories, getAllowedVouchers } from '../../config/categories';

export default function ListingAccessGuard({ kind, category, children }) {
  const { companyType, isAdmin, loading } = useAuthUser();
  const { source, entryCompanyType } = useListingEntryContext();

  let hasAdminToken = false;
  if (typeof window !== 'undefined') {
    try {
      hasAdminToken = !!(
        window.sessionStorage.getItem('admintoken') ||
        window.sessionStorage.getItem('listing_entry_admintoken')
      );
    } catch {
      hasAdminToken = false;
    }
  }

  const allowAdminAllCategories =
    isAdmin || (source === 'admin' && hasAdminToken);
  const candidateTypes = [];
  const addCandidate = (value) => {
    const name = String(value || '').trim();
    if (!name || candidateTypes.includes(name)) return;
    candidateTypes.push(name);
  };
  addCandidate(entryCompanyType);
  addCandidate(companyType);
  if (!candidateTypes.length) addCandidate('Others');

  if (loading) {
    return null;
  }

  const typeCanOpen = (typeName) => {
    if (kind === 'listing') {
      const allowedCategories = getAllowedCategories(typeName, allowAdminAllCategories);
      const allowedVouchers = getAllowedVouchers(typeName, allowAdminAllCategories);
      return allowedCategories.length > 0 || allowedVouchers.length > 0;
    }
    if (kind === 'voucher') {
      const allowedVouchers = getAllowedVouchers(typeName, allowAdminAllCategories);
      return category
        ? allowedVouchers.some((voucher) => voucher.id === category)
        : allowedVouchers.length > 0;
    }
    const allowedCategories = getAllowedCategories(typeName, allowAdminAllCategories);
    return category
      ? allowedCategories.some((item) => item.slug === category)
      : allowedCategories.length > 0;
  };

  const isAllowed = candidateTypes.some(typeCanOpen);

  if (!isAllowed) {
    return <Navigate to="/sellerhub" replace />;
  }

  return children;
}
