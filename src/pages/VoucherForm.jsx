import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuthUser } from '../hooks/useAuthUser';
import useListingEntryContext from '../hooks/useListingEntryContext';
import { getAllowedVouchers } from '../config/categories';

const voucherTypes = [
  { id: 'electronicsVoucher', label: 'Electronics Voucher', icon: '📱' },
  { id: 'fmcgVoucher', label: 'FMCG Voucher', icon: '🛒' },
  { id: 'mobilityVoucher', label: 'Mobility Voucher', icon: '🚗' },
  { id: 'officesupplyVoucher', label: 'Office Supply Voucher', icon: '📎' },
  { id: 'eeVoucher', label: 'Entertainment & Events', icon: '🎬' },
  { id: 'textileVoucher', label: 'Textile Voucher', icon: '👕' },
  { id: 'lifestyleVoucher', label: 'Lifestyle Voucher', icon: '🏠' },
  { id: 'airlineVoucher', label: 'Airline Voucher', icon: '✈️' },
  { id: 'qsrVoucher', label: 'QSR Voucher', icon: '🍔' },
  { id: 'hotelsVoucher', label: 'Hotels Voucher', icon: '🏨' },
  { id: 'otherVoucher', label: 'Other Voucher', icon: '🎁' },
];

export default function VoucherForm() {
  const navigate = useNavigate();
  const { companyType, isAdmin, loading } = useAuthUser();
  const { source, entryCompanyType } = useListingEntryContext();

  const allowAdminAllCategories = isAdmin || source === 'admin';
  // When admin context with URL companyType, prioritize entryCompanyType over logged-in user's type
  const effectiveCompanyType = (allowAdminAllCategories && entryCompanyType)
    ? entryCompanyType
    : (companyType || entryCompanyType || 'Others');
  const allowedVoucherIds = getAllowedVouchers(effectiveCompanyType, allowAdminAllCategories).map((voucher) => voucher.id);
  const filteredVoucherTypes = voucherTypes.filter((voucher) => allowedVoucherIds.includes(voucher.id));
  const hasVoucherAccess = filteredVoucherTypes.length > 0;

  const handleVoucherSelect = (voucherId) => {
    navigate(`/${voucherId}/generalinformation`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-pulse text-[#C64091]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8" data-testid="voucher-form-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/sellerhub')}
            className="mb-4 text-gray-600 hover:text-[#C64091]"
            data-testid="btn-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Seller Hub
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FCE7F3] flex items-center justify-center">
              <Ticket className="w-6 h-6 text-[#C64091]" />
            </div>
            <div>
              <h1 
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Add Voucher
              </h1>
              <p className="text-gray-600">Select a voucher category to get started</p>
            </div>
          </div>
        </div>

        {/* Voucher Categories Grid */}
        {hasVoucherAccess ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredVoucherTypes.map((voucher) => (
              <Card
                key={voucher.id}
                className="cursor-pointer hover:border-[#C64091] hover:shadow-md transition-all group"
                onClick={() => handleVoucherSelect(voucher.id)}
                data-testid={`voucher-card-${voucher.id}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{voucher.icon}</div>
                  <p className="font-medium text-gray-900 group-hover:text-[#C64091] transition-colors text-sm">
                    {voucher.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-700">
            Voucher listing is not available for your company type.
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-[#FCE7F3] rounded-lg p-6">
          <h3 className="font-semibold text-[#C64091] mb-2">About Vouchers</h3>
          <p className="text-gray-600 text-sm">
            Vouchers allow you to list gift cards, discount coupons, and value-based offerings. 
            Select the appropriate category above to start creating your voucher listing.
          </p>
        </div>
      </div>
    </div>
  );
}
