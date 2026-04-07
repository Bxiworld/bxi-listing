import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useListingEntryContext from "../hooks/useListingEntryContext";
import api from "../utils/api";

import Cinema from "../assets/AddMediaCategoryPageIcons/Cinema.svg";
import Airport from "../assets/AddMediaCategoryPageIcons/Airport.svg";
import DOOH from "../assets/AddMediaCategoryPageIcons/Dooh.svg";
import Outdoor from "../assets/AddMediaCategoryPageIcons/Outdoor.svg";
import OfflineBTL from "../assets/AddMediaCategoryPageIcons/Offline-BTL.svg";
import Print from "../assets/AddMediaCategoryPageIcons/Print.svg";
import Radio from "../assets/AddMediaCategoryPageIcons/Radio.svg";
import Television from "../assets/AddMediaCategoryPageIcons/Television.svg";
import Other from "../assets/AddMediaCategoryPageIcons/Other.svg";

/**
 * Offline listing flows use /mediaoffline/general-info; online use /mediaonline/general-info.
 * After general info, MediaGeneralInfo / GeneralInformation route by `journey`:
 * - multiplex → Excel/screens step (mediaonlinemultiplexproductinfo)
 * - digital-ads → digital screens Excel flow
 * - hoarding → hoarding Excel flow (mediaofflinehoardinginfo)
 * - newspaper / btl → offline product-info style flows
 */
function generalInfoPathForJourney(journey) {
  const offlineJourneys = new Set(["newspaper", "hoarding", "btl"]);
  const base = offlineJourneys.has(journey) ? "/mediaoffline" : "/mediaonline";
  return `${base}/general-info`;
}

const MEDIA_CATEGORIES = [
  {
    id: 1,
    key: "television",
    label: "Television",
    icon: Television,
    subcategoryHint: "Digital ADs",
    journey: "digital-ads",
  },
  {
    id: 2,
    key: "print",
    label: "Print Media",
    icon: Print,
    subcategoryHint: "News Papers / Magazines",
    journey: "newspaper",
  },
  {
    id: 3,
    key: "radio",
    label: "Radio",
    icon: Radio,
    subcategoryHint: "Display Video",
    journey: "display-video",
  },
  {
    id: 4,
    key: "hoarding",
    label: "Hoarding",
    icon: Outdoor,
    subcategoryHint: "Hoardings",
    journey: "hoarding",
  },
  {
    id: 5,
    key: "multiplex",
    label: "Multiplex",
    icon: Cinema,
    subcategoryHint: "Multiplex ADs",
    journey: "multiplex",
  },
  {
    id: 6,
    key: "dooh",
    label: "DOOH",
    icon: DOOH,
    subcategoryHint: "Digital ADs",
    journey: "digital-ads",
  },
  {
    id: 7,
    key: "airport",
    label: "Airport",
    icon: Airport,
    subcategoryHint: "Airport",
    journey: "airport",
  },
  {
    id: 8,
    key: "offlinebtl",
    label: "Offline BTL",
    icon: OfflineBTL,
    subcategoryHint: "Car Wrap",
    journey: "btl",
  },
  {
    id: 9,
    key: "other",
    label: "Other",
    icon: Other,
    subcategoryHint: "Display Video",
    journey: "display-video",
  },
];

function normalizeLabel(s) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Supports:
 * - Nested: { subcategory: [{ categoryName, subCategories: [{ _id, subCategoryName }] }] }
 * - Flat rows: { subcategory: [{ _id, subCategoryName, categoryName, DisplayName?, iconurl? }] }
 */
function normalizeListingPayload(payload) {
  const docs = payload?.subcategory ?? payload?.data ?? [];
  if (!Array.isArray(docs) || docs.length === 0) return [];

  const first = docs[0];
  const looksFlat =
    first &&
    (first.subCategoryName || first.DisplayName) &&
    !Array.isArray(first.subCategories);

  if (looksFlat) {
    return docs
      .filter((d) => d?._id && (d.subCategoryName || d.DisplayName))
      .map((d) => ({
        _id: String(d._id),
        subCategoryName: d.subCategoryName || d.DisplayName,
        categoryName: d.categoryName || "",
        displayName: d.DisplayName || d.displayName || d.subCategoryName,
        iconUrl: d.iconurl || d.iconUrl || null,
      }));
  }

  const rows = [];
  for (const doc of docs) {
    for (const sub of doc.subCategories || []) {
      if (!sub?._id || !sub.subCategoryName) continue;
      rows.push({
        _id: String(sub._id),
        subCategoryName: sub.subCategoryName,
        categoryName: doc.categoryName || "",
        displayName:
          sub.DisplayName || sub.displayName || sub.subCategoryName,
        iconUrl: sub.iconurl || sub.iconUrl || null,
      });
    }
  }
  return rows;
}

const LABEL_ALIASES = {
  [normalizeLabel("Digital Out-of-Home")]: normalizeLabel("DOOH"),
  [normalizeLabel("Digital Out Of Home")]: normalizeLabel("DOOH"),
  [normalizeLabel("BTL")]: normalizeLabel("Offline BTL"),
  [normalizeLabel("Multiplex ADs")]: normalizeLabel("Multiplex"),
  [normalizeLabel("Multiplex Ads")]: normalizeLabel("Multiplex"),
};

const OFFLINE_JOURNEYS = new Set(["newspaper", "hoarding", "btl"]);

/**
 * Pick one API row for a canonical tile. API often has many leaf subcategories; we only show 9 top-level tiles.
 * 1) Subdocument whose name matches the canonical label (or alias → canonical).
 * 2) Else first sub under a parent whose categoryName matches the canonical label.
 */
function matchApiRowForCanonical(flat, cat) {
  if (!Array.isArray(flat) || flat.length === 0) return null;
  const target = normalizeLabel(cat.label);

  const bySubName = flat.find((r) => {
    const n = normalizeLabel(r.subCategoryName);
    const resolved = LABEL_ALIASES[n] || n;
    return resolved === target || n === target;
  });
  if (bySubName) return bySubName;

  const underParent = flat.filter(
    (r) => normalizeLabel(r.categoryName) === target
  );
  if (underParent.length) return underParent[0];

  return null;
}

export default function AllMediaCategories() {
  const navigate = useNavigate();
  const { source } = useListingEntryContext();
  const [flatRows, setFlatRows] = useState([]);
  const [fetchState, setFetchState] = useState({ loading: true, error: "" });

  /** Always 9 UI tiles; `apiRow` links to backend when names align. */
  const tiles = useMemo(
    () =>
      MEDIA_CATEGORIES.map((meta) => ({
        meta,
        apiRow: matchApiRowForCanonical(flatRows, meta),
      })),
    [flatRows]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetchState({ loading: true, error: "" });
      try {
        const res = await api.get("/mediasubcategory/for_listing");
        const flat = normalizeListingPayload(res?.data);
        if (!cancelled) {
          setFlatRows(flat);
          setFetchState({ loading: false, error: "" });
        }
      } catch (e) {
        if (!cancelled) {
          setFlatRows([]);
          setFetchState({
            loading: false,
            error:
              e?.response?.data?.message ||
              e?.message ||
              "Failed to load categories",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCategoryClick = (apiRow, meta) => {
    const journey = meta.journey;
    const isOffline = OFFLINE_JOURNEYS.has(journey);
    const hasOnlineLink =
      Boolean(apiRow?._id && apiRow?.categoryName) && !isOffline;

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("mediaCategory", meta.key);
      localStorage.setItem("mediaSubcategoryHint", meta.subcategoryHint);
      localStorage.setItem("mediaJourney", journey);
      if (hasOnlineLink) {
        localStorage.setItem("mediaParent", apiRow.categoryName);
        localStorage.setItem("preselectedSubcategoryId", apiRow._id);
      } else {
        localStorage.removeItem("mediaParent");
        localStorage.removeItem("preselectedSubcategoryId");
      }
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("mediaCategory", meta.key);
      sessionStorage.setItem("mediaSubcategoryHint", meta.subcategoryHint);
      sessionStorage.setItem("mediaJourney", journey);
      if (hasOnlineLink) {
        sessionStorage.setItem("mediaParent", apiRow.categoryName);
        sessionStorage.setItem("preselectedSubcategoryId", apiRow._id);
      } else {
        sessionStorage.removeItem("mediaParent");
        sessionStorage.removeItem("preselectedSubcategoryId");
      }
    }

    const params = new URLSearchParams();
    if (source === "admin") {
      params.set("source", "admin");
    }
    params.set("mediaCategory", meta.key);
    params.set("journey", journey);
    if (hasOnlineLink) {
      params.set("mediaParent", apiRow.categoryName);
      params.set("preselectedSubcategoryId", apiRow._id);
    }

    const basePath = generalInfoPathForJourney(journey);
    navigate(`${basePath}?${params.toString()}`);
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
              {fetchState.loading && (
                <p className="media-categories-subtitle col-span-full text-center">
                  Loading categories…
                </p>
              )}
              {!fetchState.loading && fetchState.error && (
                <p className="media-categories-subtitle col-span-full text-center text-red-600">
                  {fetchState.error}
                </p>
              )}
              {!fetchState.loading &&
                !fetchState.error &&
                tiles.map(({ meta, apiRow }) => {
                  const Icon = apiRow?.iconUrl || meta.icon;
                  return (
                    <button
                      key={meta.key}
                      type="button"
                      className="media-category-tile"
                      onClick={() => handleCategoryClick(apiRow, meta)}
                      data-testid={`admin-category-${meta.key}`}
                    >
                      <img
                        src={Icon}
                        alt=""
                        className="media-category-icon"
                      />
                      <span className="media-category-label">
                        {meta.label}
                      </span>
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
