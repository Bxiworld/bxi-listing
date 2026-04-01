/**
 * Physical vs Digital (Product vs Voucher) selection - matches bxi-dashboard /physical route.
 * When user clicks "Add Product", they land here to choose Product or Voucher, then proceed.
 */
import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import BreadCrumbHeader from "../components/layout/BreadCrumbHeader";
import { Button } from "../components/ui/button";
import { ArrowLeft, Package, Gift } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useAuthUser } from "../hooks/useAuthUser";
import useListingEntryContext from "../hooks/useListingEntryContext";
import { getAllowedCategories, getAllowedVouchers } from "../config/categories";
import { getVoucherJourneyType, getVoucherJourneyLabel } from "../utils/voucherType";

const PHYSICAL_OPTIONS = [
  {
    id: 1,
    name: "Single SKU- Multiple QTY",
    desc: "One Product , Multiple Qty , Single SKU & Multiple Colours to be uploaded here",
    bulkupload: false,
  },
  {
    id: 2,
    name: "Multiple SKU & Bulk QTY",
    desc: "Multiple Products, Multiple Designs, Multiple Sizes and Colours to be uploaded here",
    bulkupload: true,
  },
];

const DIGITAL_OPTIONS = [
  {
    id: 1,
    name: "Offer Specific",
    desc: "Specific / Code ( One Time | Single Use | Specific to Something | Only That is Available )",
  },
  {
    id: 2,
    name: "Value Voucher / Gift Cards ",
    desc: "Value voucher - This can be used for multiple services or products in only a single transaction. Gift Card / Wallet - This can be used for multiple services or products in multiple transactions.",
  },
];

const COMPANY_TYPE_TO_PRODUCT_PATH = {
  Textile: "/textile/general-info",
  Electronics: "/electronics/general-info",
  FMCG: "/fmcg/general-info",
  "Office Supply": "/officesupply/general-info",
  Lifestyle: "/lifestyle/general-info",
  Mobility: "/mobility/general-info",
  QSR: "/restaurant/general-info",
  Others: "/others/general-info",
  Hotel: "/hotelsVoucher/generalinformation",
};

const COMPANY_TYPE_TO_VOUCHER_PATH = {
  Textile: "/textileVoucher/generalinformation",
  Electronics: "/electronicsVoucher/generalinformation",
  FMCG: "/fmcgVoucher/generalinformation",
  "Office Supply": "/officesupplyVoucher/generalinformation",
  Lifestyle: "/lifestyleVoucher/generalinformation",
  Mobility: "/mobilityVoucher/generalinformation",
  QSR: "/qsrVoucher/generalinformation",
  Others: "/otherVoucher/generalinformation",
  Hotel: "/hotelsVoucher/generalinformation",
  "Entertainment & Events": "/eeVoucher/generalinformation",
  "Airline Tickets": "/airlineVoucher/generalinformation",
  "Airlines Tickets": "/airlineVoucher/generalinformation",
};

export default function PhysicalDigital() {
  const navigate = useNavigate();
  const { companyType, isAdmin } = useAuthUser();
  const { source, entryCompanyType } = useListingEntryContext();
  const adminContext = isAdmin || source === "admin";
  // When admin context with URL companyType, prioritize entryCompanyType over logged-in user's type
  const effectiveCompanyType = (adminContext && entryCompanyType)
    ? entryCompanyType
    : (companyType || entryCompanyType || "Others");
  const [selectedProduct, setSelectedProduct] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(false);
  const [physicalData, setPhysicalData] = useState(null);
  const [digitalData, setDigitalData] = useState(null);
  const [selectedBulkUpload, setSelectedBulkUpload] = useState(false);
  const [openView, setOpenView] = useState(0);

  const showAdminView = adminContext;
  const allowedCategories = getAllowedCategories(
    effectiveCompanyType,
    showAdminView
  );
  const allowedVouchers = getAllowedVouchers(
    effectiveCompanyType,
    showAdminView
  );
  const hasProductAccess = allowedCategories.length > 0;
  const hasVoucherAccess = allowedVouchers.length > 0;

  const isVoucherOnly = [
    "Hotel",
    "Hotels",
    "Airline Tickets",
    "Airlines Tickets",
  ].includes(effectiveCompanyType);
  useEffect(() => {
    if (isVoucherOnly) {
      setSelectedVoucher(true);
      setSelectedProduct(false);
      setOpenView(1);
      setDigitalData(DIGITAL_OPTIONS[0]);
    }
  }, [isVoucherOnly]);

  if (!hasProductAccess && !hasVoucherAccess) {
    return <Navigate to="/sellerhub" replace />;
  }

  const handleList = () => {
    if (selectedVoucher) {
      if (!digitalData) {
        toast.error(
          "Please select the type of voucher (Offer Specific or Value Voucher).",
        );
        return;
      }
      const path = COMPANY_TYPE_TO_VOUCHER_PATH[effectiveCompanyType];
      if (path) {
        // Match bxi-dashboard: store voucher type and company for general-info and downstream steps
        if (typeof localStorage !== 'undefined') {
          const voucherJourneyType = getVoucherJourneyType(digitalData?.name ?? 'Offer Specific');
          localStorage.setItem('digitalDataType', voucherJourneyType);
          localStorage.setItem('digitalData', getVoucherJourneyLabel(voucherJourneyType));
          localStorage.setItem('companyType', effectiveCompanyType ?? '');
        }
        navigate(path);
      } else {
        toast.error("Voucher listing is not available for your company type.");
      }
      return;
    }

    if (selectedProduct) {
      if (!physicalData) {
        toast.error("Please select Product SKU / Type (Single or Bulk).");
        return;
      }
      if (selectedBulkUpload) {
        navigate("/productbulkupload");
      } else {
        const path = COMPANY_TYPE_TO_PRODUCT_PATH[effectiveCompanyType];
        if (path && path.includes("general")) {
          navigate(path);
        } else if (effectiveCompanyType === "Hotel") {
          navigate("/hotelsVoucher/generalinformation");
        } else {
          toast.error(
            "Product listing is not available for your company type.",
          );
        }
      }
      return;
    }

    toast.error("Please select Product or Voucher.");
  };

  return (
    <div
      className="min-h-screen bg-[#f5f5f7] py-12 px-4"
      data-testid="physical-digital-page"
    >
          <BreadCrumbHeader MainText="Add Product" showbreadcrumb={true} />
      <div   className="max-w-5xl mx-auto text-center">
        {/* Back Button */}
        <div className="text-left mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
        </div>
        <h1 className="text-xl font-semibold text-[#374151] mb-3">
          Add Product
        </h1>

        <p className="text-[#6b7280] max-w-2xl mx-auto mb-12 text-sm sm:text-base leading-relaxed">
          Let Them Discover the Freedom to Go Where Ever They Want with Your
          Mobility Products, Make Your Listing Count !
        </p>

        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {!isVoucherOnly && hasProductAccess && (
            <button
              type="button"
              onClick={() => {
                setOpenView(0);
                setSelectedProduct(true);
                setSelectedVoucher(false);
                setPhysicalData(null);
              }}
              className={cn(
                "w-[340px] h-[210px] bg-white rounded-2xl border-2 transition-all flex flex-col items-center justify-center px-8 text-center shadow-sm",
                selectedProduct
                  ? "border-[#C64091]"
                  : "border-gray-200 hover:border-[#C64091] hover:shadow-lg",
              )}
            >
              <div className="w-14 h-14 rounded-full bg-[rgba(198,64,145,0.1)] flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-[#C64091]" />
              </div>

              <h3 className="font-semibold text-lg text-[#374151] mb-2">
                Product
              </h3>

              <p className="text-sm text-[#6b7280] leading-relaxed">
                If your product is tangible and needs to be physically shipped
                or delivered, please click here to upload.
              </p>
            </button>
          )}

          {hasVoucherAccess && (
            <button
              type="button"
              onClick={() => {
                if (effectiveCompanyType === "Entertainment & Events") {
                  navigate("/eephysical");
                  return;
                }
                setOpenView(1);
                setSelectedVoucher(true);
                setSelectedProduct(false);
                setDigitalData(null);
              }}
              className={cn(
                "w-[340px] h-[210px] bg-white rounded-2xl border-2 transition-all flex flex-col items-center justify-center px-8 text-center shadow-sm",
                selectedVoucher
                  ? "border-[#C64091]"
                  : "border-gray-200 hover:border-[#C64091] hover:shadow-lg",
              )}
            >
              <div className="w-14 h-14 rounded-full bg-[rgba(198,64,145,0.1)] flex items-center justify-center mb-4">
                <Gift className="w-7 h-7 text-[#C64091]" />
              </div>

              <h3 className="font-semibold text-lg text-[#374151] mb-2">
                Voucher
              </h3>

              <p className="text-sm text-[#6b7280] leading-relaxed">
                If your products can be redeemed through voucher / codes / gift
                cards, please click here to upload.
              </p>
            </button>
          )}
        </div>

        {openView === 0 && selectedProduct && hasProductAccess && (
          <div className="mb-16">
            <h2 className="text-lg font-medium text-[#374151] mb-10">
              Availability of Product SKU / TYPE
            </h2>

            <div className="flex flex-wrap justify-center gap-8">
              {PHYSICAL_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPhysicalData(item);
                    setSelectedBulkUpload(item.bulkupload);
                  }}
                  className={cn(
                    "w-[320px] h-[160px] bg-white rounded-2xl border-2 transition-all flex flex-col justify-center px-6 text-center shadow-sm",
                    physicalData?.id === item.id
                      ? "border-[#C64091]"
                      : "border-gray-200 hover:border-[#C64091] hover:shadow-lg",
                  )}
                >
                  <h3 className="font-semibold text-[#374151] mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[#6b7280]">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {openView === 1 && selectedVoucher && hasVoucherAccess && (
          <div className="mb-16">
            <h2 className="text-lg font-medium text-[#374151] mb-10">
              Please Select the Type of Voucher You are Offering
            </h2>

            <div className="flex flex-wrap justify-center gap-8">
              {DIGITAL_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDigitalData(item)}
                  className={cn(
                    "w-[320px] h-[160px] bg-white rounded-2xl border-2 transition-all flex flex-col justify-center px-6 text-center shadow-sm",
                    digitalData?.id === item.id
                      ? "border-[#C64091]"
                      : "border-gray-200 hover:border-[#C64091] hover:shadow-lg",
                  )}
                >
                  <h3 className="font-semibold text-[#374151] mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[#6b7280]">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-5 mt-12">
          <Button
            className="bg-[#C64091] hover:bg-[#a53575] text-white font-semibold px-12 py-6 rounded-xl text-base shadow-md"
            onClick={handleList}
          >
            List {selectedProduct ? "Product" : "Voucher"}
          </Button>

          <Button
            variant="ghost"
            className="text-[#C64091] font-medium"
            onClick={() => navigate("/sellerhub")}
          >
            Back to Seller Hub
          </Button>
        </div>
      </div>
    </div>
  );
}
