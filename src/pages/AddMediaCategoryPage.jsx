import React from "react";
import { useNavigate } from "react-router-dom";
import useListingEntryContext from "../hooks/useListingEntryContext";

import Cinema from "../assets/AddMediaCategoryPageIcons/Cinema.svg"
import Airport from "../assets/AddMediaCategoryPageIcons/Airport.svg"
import DOOH from "../assets/AddMediaCategoryPageIcons/Dooh.svg"
import Outdoor from "../assets/AddMediaCategoryPageIcons/Outdoor.svg"
import OfflineBTL from "../assets/AddMediaCategoryPageIcons/Offline-BTL.svg"
import Print from "../assets/AddMediaCategoryPageIcons/Print.svg"
import Radio from "../assets/AddMediaCategoryPageIcons/Radio.svg"
import Television from "../assets/AddMediaCategoryPageIcons/Television.svg"
import Other from "../assets/AddMediaCategoryPageIcons/Other.svg"

/**
 * Media Categories with their journey mappings:
 * - Television → Digital Ads journey (mediaonline, subcategory: Digital ADs)
 * - Print Media → Newspaper journey (mediaoffline, News Papers / Magazines)
 * - Radio → Display video journey (mediaonline, non-excel upload)
 * - Hoarding → Hoarding journey (mediaoffline, subcategory: Hoardings)
 * - Multiplex → Multiplex journey (mediaonline, subcategory: Multiplex ADs)
 * - DOOH → Digital Ads journey (mediaonline, subcategory: Digital ADs)
 * - Airport → Airport journey (mediaonline)
 * - Offline BTL → Car wrap/bus wrap journey (mediaoffline)
 * - Other → Display video journey (mediaonline, non-excel upload)
 */
const MEDIA_CATEGORIES = [
  {
    id: 1,
    key: "television",
    label: "Television",
    icon: Television,
    mediaType: "mediaonline",
    subcategoryHint: "Digital ADs",
    journey: "digital-ads",
  },
  {
    id: 2,
    key: "print",
    label: "Print Media",
    icon: Print,
    mediaType: "mediaoffline",
    subcategoryHint: "News Papers / Magazines",
    journey: "newspaper",
  },
  {
    id: 3,
    key: "radio",
    label: "Radio",
    icon: Radio,
    mediaType: "mediaonline",
    subcategoryHint: "Display Video",
    journey: "display-video",
  },
  {
    id: 4,
    key: "hoarding",
    label: "Hoarding",
    icon: Outdoor,
    mediaType: "mediaoffline",
    subcategoryHint: "Hoardings",
    journey: "hoarding",
  },
  {
    id: 5,
    key: "multiplex",
    label: "Multiplex",
    icon: Cinema,
    mediaType: "mediaonline",
    subcategoryHint: "Multiplex ADs",
    journey: "multiplex",
  },
  {
    id: 6,
    key: "dooh",
    label: "DOOH",
    icon: DOOH,
    mediaType: "mediaonline",
    subcategoryHint: "Digital ADs",
    journey: "digital-ads",
  },
  {
    id: 7,
    key: "airport",
    label: "Airport",
    icon: Airport,
    mediaType: "mediaonline",
    subcategoryHint: "Airport",
    journey: "airport",
  },
  {
    id: 8,
    key: "offlinebtl",
    label: "Offline BTL",
    icon: OfflineBTL,
    mediaType: "mediaoffline",
    subcategoryHint: "Car Wrap",
    journey: "btl",
  },
  {
    id: 9,
    key: "other",
    label: "Other",
    icon: Other,
    mediaType: "mediaonline",
    subcategoryHint: "Display Video",
    journey: "display-video",
  },
];

export default function AllMediaCategories() {
  const navigate = useNavigate();
  const { source } = useListingEntryContext();

  const handleCategoryClick = (category) => {
    // Store media category info for the general-info page to use
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("mediaCategory", category.key);
      localStorage.setItem("mediaSubcategoryHint", category.subcategoryHint);
      localStorage.setItem("mediaJourney", category.journey);
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("mediaCategory", category.key);
      sessionStorage.setItem("mediaSubcategoryHint", category.subcategoryHint);
      sessionStorage.setItem("mediaJourney", category.journey);
    }

    // Build params preserving admin context
    const params = new URLSearchParams();
    if (source === "admin") {
      params.set("source", "admin");
    }
    params.set("mediaCategory", category.key);
    params.set("journey", category.journey);

    // Navigate to appropriate general-info page based on mediaType
    const basePath = category.mediaType === "mediaoffline"
      ? "/mediaoffline/general-info"
      : "/mediaonline/general-info";

    navigate(`${basePath}?${params.toString()}`);
  };

  const handleBackToAdmin = () => {
    try {
      if (window.history && window.history.length > 1) {
        window.history.back();
        return;
      }
    } catch {
      // ignore history access issues
    }
    navigate("/sellerhub");
  };

  return (
    <div
      className="media-categories-bg"
      data-testid="all-categories-admin-page"
    >
      <div className="media-categories-overlay">

        <main className="media-categories-main">
          <div className="media-categories-card">
            <h1 className="media-categories-title">Choose Any Media Category</h1>
            <p className="media-categories-subtitle">
              You can add a media in any of the categories below
            </p>

            <div className="media-category-grid">
              {MEDIA_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className="media-category-tile"
                    onClick={() => handleCategoryClick(cat)}
                    data-testid={`admin-category-${cat.key}`}
                  >
                    <img src={Icon} className="media-category-icon" />
                    <span className="media-category-label">{cat.label}</span>
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

