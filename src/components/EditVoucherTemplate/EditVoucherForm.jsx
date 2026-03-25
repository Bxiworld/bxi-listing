import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const VALIDITY_OPTIONS = [
  '1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months',
  '7 Months', '8 Months', '9 Months', '10 Months', '11 Months', '12 Months',
  '13 Months', '14 Months', '15 Months', '16 Months', '17 Months', '18 Months',
];

export default function EditVoucherForm({ cardData, closePopup, updateFormData }) {
  const [productName, setProductName] = useState(cardData?.productName ?? '');
  const [productSubtitle, setProductSubtitle] = useState(cardData?.productSubtitle ?? '');
  const [validityOfVoucherValue, setValidityOfVoucherValue] = useState(cardData?.validityOfVoucherValue ?? '');
  const [validityOfVoucherUnit, setValidityOfVoucherUnit] = useState(cardData?.validityOfVoucherUnit ?? 'Months');
  const [pricePerUnit, setPricePerUnit] = useState(cardData?.pricePerUnit ?? '');
  const [redemptionType, setRedemptionType] = useState(cardData?.redemptionType ?? 'Online');
  const [inclusions, setInclusions] = useState(cardData?.inclusions ?? '');
  const [exclusions, setExclusions] = useState(cardData?.exclusions ?? '');
  const [redemptionURL, setRedemptionURL] = useState(cardData?.redemptionURL ?? '');
  const [voucherType, setVoucherType] = useState(cardData?.voucherType ?? 'Gift Card');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cardData) {
      setProductName(cardData.productName ?? '');
      setProductSubtitle(cardData.productSubtitle ?? '');
      setValidityOfVoucherValue(cardData.validityOfVoucherValue ?? '');
      setValidityOfVoucherUnit(cardData.validityOfVoucherUnit ?? 'Months');
      setPricePerUnit(cardData.pricePerUnit ?? '');
      setRedemptionType(cardData.redemptionType ?? 'Online');
      setInclusions(cardData.inclusions ?? '');
      setExclusions(cardData.exclusions ?? '');
      setRedemptionURL(cardData.redemptionURL ?? '');
      setVoucherType(cardData.voucherType ?? 'Gift Card');
    }
  }, [cardData]);

  const validate = () => {
    const err = {};
    const name = (productName || '').trim();
    if (name.length < 5) err.productName = 'Product name should be at least 5 characters long';
    else if (name.length > 25) err.productName = 'Product name should be at most 25 characters long';
    const subtitle = (productSubtitle || '').trim();
    if (subtitle.length < 10) err.productSubtitle = 'Product subtitle should be at least 10 characters long';
    else if (subtitle.length > 50) err.productSubtitle = 'Product subtitle should be at most 50 characters long';
    if (!(inclusions || '').trim()) err.inclusions = 'This field is required';
    if (!(exclusions || '').trim()) err.exclusions = 'This field is required';
    if (validityOfVoucherValue !== undefined && validityOfVoucherValue !== null && validityOfVoucherValue !== '') {
      const n = parseInt(validityOfVoucherValue, 10);
      if (isNaN(n) || n < 1) err.validityOfVoucherValue = 'Validity must be at least 1';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;
    const productDetails = {
      productName: (productName || '').trim(),
      productSubtitle: (productSubtitle || '').trim(),
      validityOfVoucherValue,
      validityOfVoucherUnit: validityOfVoucherUnit || 'Months',
      pricePerUnit,
      redemptionType,
      inclusions: (inclusions || '').trim(),
      exclusions: (exclusions || '').trim(),
      termsAndConditions: cardData?.termsAndConditions,
      redemptionURL,
      voucherType,
    };
    updateFormData(productDetails);
    closePopup();
  };

  const validitySelectValue = (() => {
    const val = validityOfVoucherValue ?? '';
    const unit = (validityOfVoucherUnit || 'Months').trim();
    if (!val) return '12 Months';
    const normalized = val === '1' || val === 1 ? '1 Month' : `${val} ${unit}`;
    return VALIDITY_OPTIONS.includes(normalized) ? normalized : `${val} ${unit}`;
  })();

  const handleValiditySelect = (v) => {
    const match = (v || '12 Months').match(/^(\d+)\s*(.+)$/);
    if (match) {
      setValidityOfVoucherValue(match[1]);
      setValidityOfVoucherUnit((match[2] || 'Months').trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-[#6B7A99]">Product Name (5–25 characters) *</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={`mt-1 bg-white ${errors.productName ? 'border-red-500' : ''}`}
              maxLength={25}
              placeholder="Product Name"
            />
            {errors.productName && <p className="text-xs text-red-500 mt-0.5">{errors.productName}</p>}
          </div>
          <div>
            <Label className="text-sm text-[#6B7A99]">Inclusions *</Label>
            <Input
              value={inclusions}
              onChange={(e) => setInclusions(e.target.value)}
              className={`mt-1 bg-white ${errors.inclusions ? 'border-red-500' : ''}`}
              placeholder="Inclusions"
            />
            {errors.inclusions && <p className="text-xs text-red-500 mt-0.5">{errors.inclusions}</p>}
          </div>
          <div>
            <Label className="text-sm text-[#6B7A99]">Validity of Voucher</Label>
            <Select value={validitySelectValue} onValueChange={handleValiditySelect}>
              <SelectTrigger className="mt-1 bg-white">
                <SelectValue placeholder="Select validity" />
              </SelectTrigger>
              <SelectContent>
                {VALIDITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.validityOfVoucherValue && <p className="text-xs text-red-500 mt-0.5">{errors.validityOfVoucherValue}</p>}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-[#6B7A99]">Product Subtitle (10–50 characters) *</Label>
            <Input
              value={productSubtitle}
              onChange={(e) => setProductSubtitle(e.target.value)}
              className={`mt-1 bg-white ${errors.productSubtitle ? 'border-red-500' : ''}`}
              maxLength={50}
              placeholder="Product Subtitle"
            />
            {errors.productSubtitle && <p className="text-xs text-red-500 mt-0.5">{errors.productSubtitle}</p>}
          </div>
          <div>
            <Label className="text-sm text-[#6B7A99]">Exclusions *</Label>
            <Input
              value={exclusions}
              onChange={(e) => setExclusions(e.target.value)}
              className={`mt-1 bg-white ${errors.exclusions ? 'border-red-500' : ''}`}
              placeholder="Exclusions"
            />
            {errors.exclusions && <p className="text-xs text-red-500 mt-0.5">{errors.exclusions}</p>}
          </div>
          {voucherType !== 'Offer Specific' && (
            <div>
              <Label className="text-sm text-[#6B7A99]">Voucher Type</Label>
              <Select value={voucherType} onValueChange={setVoucherType}>
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gift Card">Gift Card</SelectItem>
                  <SelectItem value="Value Voucher">Value Voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-[#6B7A99]">Price per unit</Label>
        <Input value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} className="bg-white" placeholder="e.g. 1000" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-[#6B7A99]">Redemption type</Label>
        <Input value={redemptionType} onChange={(e) => setRedemptionType(e.target.value)} className="bg-white" placeholder="Online" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-[#6B7A99]">Redemption URL</Label>
        <Input value={redemptionURL} onChange={(e) => setRedemptionURL(e.target.value)} className="bg-white" placeholder="https://..." />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={closePopup} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-[#C64091] hover:bg-[#A03375]">
          Save
        </Button>
      </div>
    </form>
  );
}
