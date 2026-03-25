/**
 * Entertainment & Events: Entertainment vs Events choice then voucher type.
 * Matches bxi-dashboard eephysical (PhysicalDigitalee). Only voucher flow; no product.
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft, Gift } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { getVoucherJourneyType, getVoucherJourneyLabel } from "../utils/voucherType";

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

const EE_OPTIONS = [
  {
    id: "entertainment",
    title: "Entertainment",
    desc: "Value Vouchers for your FEC | Entertainment | Activity Center | Parks | Adventures",
  },
  {
    id: "event",
    title: "Events",
    desc: "Date Specific Shows | Events | Programs | Gathering",
  },
];

export default function EePhysical() {
  const navigate = useNavigate();
  const [selectedEe, setSelectedEe] = useState(null);
  const [digitalData, setDigitalData] = useState(null);

  const handleList = () => {
    if (!digitalData) {
      toast.error("Please select the type of voucher (Offer Specific or Value Voucher).");
      return;
    }
    if (typeof localStorage !== "undefined") {
      const voucherJourneyType = getVoucherJourneyType(digitalData?.name ?? "Offer Specific");
      localStorage.setItem("digitalDataType", voucherJourneyType);
      localStorage.setItem("digitalData", getVoucherJourneyLabel(voucherJourneyType));
      localStorage.setItem("companyType", "Entertainment & Events");
    }
    navigate("/eeVoucher/generalinformation");
  };

  return (
    <div
      className="min-h-screen bg-[#f5f5f7] py-12 px-4"
      data-testid="ee-physical-page"
    >
      <div className="max-w-5xl mx-auto text-center">
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
          How are you offering this Product?
        </h1>
        <p className="text-[#6b7280] max-w-2xl mx-auto mb-12 text-sm sm:text-base leading-relaxed">
          Let the Buyer be dazzled to Your World-Class Event & Entertainment Venues.
        </p>

        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {EE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setSelectedEe(opt.id);
                setDigitalData(null);
                if (typeof localStorage !== "undefined") {
                  localStorage.setItem("eevoucherdata", opt.id === "event" ? "event" : "");
                }
              }}
              className={cn(
                "w-[320px] h-[140px] bg-white rounded-2xl border-2 transition-all flex flex-col justify-center px-6 text-center shadow-sm",
                selectedEe === opt.id ? "border-[#C64091]" : "border-gray-200 hover:border-[#C64091] hover:shadow-lg"
              )}
            >
              <h3 className="font-semibold text-[#374151] mb-2">{opt.title}</h3>
              <p className="text-sm text-[#6b7280]">{opt.desc}</p>
            </button>
          ))}
        </div>

        {selectedEe && (
          <>
            <h2 className="text-lg font-medium text-[#374151] mb-6">
              Please Select Type of Voucher You are Offering
            </h2>
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              {DIGITAL_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDigitalData(item)}
                  className={cn(
                    "w-[320px] h-[160px] bg-white rounded-2xl border-2 transition-all flex flex-col justify-center px-6 text-center shadow-sm",
                    digitalData?.id === item.id ? "border-[#C64091]" : "border-gray-200 hover:border-[#C64091] hover:shadow-lg"
                  )}
                >
                  <h3 className="font-semibold text-[#374151] mb-2">{item.name}</h3>
                  <p className="text-sm text-[#6b7280]">{item.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col items-center gap-5 mt-12">
          <Button
            className="bg-[#C64091] hover:bg-[#a53575] text-white font-semibold px-12 py-6 rounded-xl text-base shadow-md"
            onClick={handleList}
          >
            List Voucher
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
