import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "../hooks/useAuthUser";
import {
  ShoppingBag,
  Plug,
  Package,
  Briefcase,
  Shirt,
  Car,
  Utensils,
  MonitorPlay,
  Building2,
  TicketPercent,
  Plane,
  Ellipsis,
} from "lucide-react";

const IMAGE_CONFIG = {
  Textile: "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Textile.svg",
  Electronics: "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Electronics.svg",
  FMCG: "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/FMCG.svg",
  "Office Supply": "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Office_Supply.svg",
  Lifestyle: "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Lifestyle.png",
  Mobility: "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Mobility.svg",
  Media: "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Media.svg",
  "Office Supply": "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Office_Supply.png",
  Hotel: "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Hotel.svg",
  QSR: "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/QSR.svg",
  Others: "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Others.svg",
  "Entertainment & Events": "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Entertainment.svg",
  "Airline Tickets": "https://bxidevelopment1.s3.ap-south-1.amazonaws.com/BxiStatic/BXI_ICONS/Airline_Tickets.svg",
};

const CATEGORY_CONFIG = {
  Textile: { key: "textile", icon: Shirt, routeType: "physical" },
  Electronics: { key: "electronics", icon: Plug, routeType: "physical" },
  FMCG: { key: "fmcg", icon: ShoppingBag, routeType: "physical" },
  "Office Supply": {
    key: "officesupply",
    icon: Briefcase,
    routeType: "physical",
  },
  Lifestyle: { key: "lifestyle", icon: Package, routeType: "physical" },
  Mobility: { key: "mobility", icon: Car, routeType: "physical" },
  QSR: { key: "restaurant", icon: Utensils, routeType: "physical" },
  Media: { key: "media", icon: MonitorPlay, routeType: "media-physical" },
  Hotel: { key: "hotels", icon: Building2, routeType: "physical" },
  "Entertainment & Events": {
    key: "entertainment",
    icon: TicketPercent,
    routeType: "eephysical",
  },
  "Airline Tickets": {
    key: "airline",
    icon: Plane,
    routeType: "physical",
  },
  Others: { key: "others", icon: Ellipsis, routeType: "physical" },
};

function buildTargetPath(category) {
  const params = new URLSearchParams({
    source: "admin",
    companyType: category.companyType,
  });

  if (category.routeType === "media-physical") {
    return `/media-physical?${params.toString()}`;
  }
  if (category.routeType === "eephysical") {
    return `/eephysical?${params.toString()}`;
  }
  return `/physical?${params.toString()}`;
}

export default function AllCategoriesAdmin() {
  const navigate = useNavigate();
  const { companyTypes, loading } = useAuthUser();

  const categories = useMemo(
    () =>
      (companyTypes || [])
        .map((item) => {
          const name = item?.CompanyTypeName?.trim();
          if (!name) return null;

          const config = CATEGORY_CONFIG[name] || {};

          return {
            id: item._id || name,
            key: config.key || name.toLowerCase().replace(/\s+/g, "-"),
            label: name,
            icon: config.icon || Ellipsis,
            image: IMAGE_CONFIG[name],
            companyType: name,
            routeType: config.routeType || "physical",
          };
        })
        .filter(Boolean),
    [companyTypes]
  );

  const handleCategoryClick = (category) => {
    const target = buildTargetPath(category);
    navigate(target);
  };

  const handleBackToAdmin = () => {
    try {
      if (window.history && window.history.length > 1) {
        window.history.back();
        return;
      }
    } catch {
    }
    navigate("/sellerhub");
  };

  return (
    <div
      className="admin-categories-bg"
      data-testid="all-categories-admin-page"
    >
      <div className="admin-categories-overlay">

        <main className="admin-categories-main">
          <div className="admin-categories-card">
            <h1 className="admin-categories-title">Choose Any Category</h1>
            <p className="admin-categories-subtitle">
              You can add a product or media in any of the categories below
            </p>

            <div className="admin-category-grid">
              {categories.map((cat) => {
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className="admin-category-tile"
                    onClick={() => handleCategoryClick(cat)}
                    data-testid={`admin-category-${cat.key}`}
                  >
                    <div className="admin-category-icon-wrap">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.label}
                          className="admin-category-icon"
                        />
                      ) : (
                        <cat.icon className="admin-category-icon" />
                      )}
                    </div>
                    <span className="admin-category-label">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

