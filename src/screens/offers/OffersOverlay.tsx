// src/screens/offers/OffersOverlay.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Percent,
  Store,
  MapPin,
  Calendar,
  Copy,
  Check,
  Gift,
  Sliders,
  Navigation,
  Filter,
} from "lucide-react";

/** ===================== Types ===================== */
type Offer = {
  id: string;
  title: string;
  merchant: string;
  short: string;
  code?: string;
  till: string; // ISO
  type: "cashback" | "discount" | "bundle" | "fnb";
  lat?: number;
  lng?: number;
  tags?: string[];
  distanceKm?: number; // derived at runtime
};

type Tab = "forYou" | "nearby" | "expiring";

/** ===================== Prefs / LS Keys ===================== */
const GEO_LS = "astha_offers_geo_on_v1";
const SEG_LS = "astha_profile_segment_v1"; // "student" | "staff" | "family" | "default"
const FILTER_LS = "astha_offers_filters_v1";

/** ===================== Mock User Segments =====================
 * We blend user segment with base preference weights.
 * You can set segment in LS for demos:
 *   localStorage.setItem('astha_profile_segment_v1','student');
 */
type Segment = "student" | "staff" | "family" | "default";

/** Base preference weights by type */
const BASE_WEIGHTS: Record<Offer["type"], number> = {
  fnb: 0.9,
  cashback: 0.7,
  discount: 0.5,
  bundle: 0.4,
};

/** Segment multipliers to blend with base weights */
const SEG_WEIGHTS: Record<Segment, Partial<Record<Offer["type"], number>>> = {
  student: { fnb: 1.2, cashback: 1.1, discount: 1.05 },
  staff: { cashback: 1.15, bundle: 1.05 },
  family: { bundle: 1.15, discount: 1.1 },
  default: {},
};

/** ===================== Mock Location (fallback) ===================== */
const FALLBACK_LAT = 23.7806; // Dhaka-ish
const FALLBACK_LNG = 90.4000;

/** ===================== Haversine ===================== */
function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** ===================== Mock Offers ===================== */
const MOCK_OFFERS: Offer[] = [
  {
    id: "ofr1",
    title: "10% OFF on Weekend Dining",
    merchant: "Bistro 24",
    short: "Pay with Astha QR, max BDT 500 back.",
    code: "EAT10",
    till: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    type: "fnb",
    lat: 23.7804,
    lng: 90.4074,
    tags: ["QR", "Dining", "Weekend"],
  },
  {
    id: "ofr2",
    title: "12% Cashback on Groceries",
    merchant: "Shwapno",
    short: "Min BDT 1,000. Max back BDT 600.",
    till: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    type: "cashback",
    lat: 23.7762,
    lng: 90.4016,
    tags: ["Cashback", "Groceries"],
  },
  {
    id: "ofr3",
    title: "BDT 300 Off on Fashion",
    merchant: "Aarong",
    short: "On bills over BDT 2,000 via Astha.",
    code: "STYLE300",
    till: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    type: "discount",
    lat: 23.7941,
    lng: 90.4142,
    tags: ["Fashion"],
  },
  {
    id: "ofr4",
    title: "Travel Bundle: 8% off + Lounge",
    merchant: "GoZayaan",
    short: "Flights + hotel pack via Astha",
    till: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
    type: "bundle",
    lat: 23.7465,
    lng: 90.3760,
    tags: ["Travel", "Bundle"],
  },
];

/** ===================== Helpers ===================== */
function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function blendWeights(segment: Segment) {
  const seg = SEG_WEIGHTS[segment] || {};
  const blended: Record<Offer["type"], number> = { ...BASE_WEIGHTS };
  (Object.keys(seg) as Offer["type"][]).forEach((k) => {
    blended[k] = (blended[k] ?? 0.4) * (seg[k] ?? 1);
  });
  return blended;
}

function scoreOfferForUser(o: Offer, weights: Record<Offer["type"], number>, geoOn: boolean) {
  const typeW = weights[o.type] ?? 0.4;
  const daysToExpiry = Math.max(
    0,
    (new Date(o.till).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const expiryBoost = 1 + (daysToExpiry < 10 ? (10 - daysToExpiry) / 40 : 0);
  const distanceBoost =
    geoOn && typeof o.distanceKm === "number"
      ? 1 + Math.max(0, 1.5 - Math.min(o.distanceKm, 1.5)) / 10
      : 1;
  return typeW * expiryBoost * distanceBoost;
}

/** ===================== Component ===================== */
export default function OffersOverlay({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("forYou");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Geo toggle
  const [geoOn, setGeoOn] = useState<boolean>(() => {
    const raw = localStorage.getItem(GEO_LS);
    return raw ? raw === "1" : true;
  });

  // Real geolocation (with fallback)
  const [coord, setCoord] = useState<{ lat: number; lng: number }>({
    lat: FALLBACK_LAT,
    lng: FALLBACK_LNG,
  });
  const [geoDenied, setGeoDenied] = useState(false);

  useEffect(() => {
    if (!geoOn || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoDenied(false);
      },
      () => {
        // denied or error → keep fallback but show hint
        setGeoDenied(true);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 10_000 }
    );
  }, [geoOn]);

  // Segment (mock) — default to "staff" to match app context; override via LS for demos
  const [segment, setSegment] = useState<Segment>(() => {
    const raw = (localStorage.getItem(SEG_LS) || "staff") as Segment;
    return ["student", "staff", "family", "default"].includes(raw) ? raw : "default";
  });

  useEffect(() => {
    localStorage.setItem(SEG_LS, segment);
  }, [segment]);

  // Pill filters: types and tags (persist to LS)
  type TypeFilter = Offer["type"];
  const ALL_TYPES: TypeFilter[] = ["fnb", "cashback", "discount", "bundle"];
  const ALL_TAGS = Array.from(
    new Set(MOCK_OFFERS.flatMap((o) => o.tags || []))
  );

  const [typeFilters, setTypeFilters] = useState<TypeFilter[]>(() => {
    try {
      const raw = localStorage.getItem(FILTER_LS);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { types?: TypeFilter[]; tags?: string[] };
      return Array.isArray(parsed.types) ? parsed.types : [];
    } catch {
      return [];
    }
  });

  const [tagFilters, setTagFilters] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FILTER_LS);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { types?: TypeFilter[]; tags?: string[] };
      return Array.isArray(parsed.tags) ? parsed.tags : [];
    } catch {
      return [];
    }
  });

  function persistFilters(nextTypes: TypeFilter[], nextTags: string[]) {
    localStorage.setItem(FILTER_LS, JSON.stringify({ types: nextTypes, tags: nextTags }));
  }

  function toggleType(t: TypeFilter) {
    setTypeFilters((cur) => {
      const has = cur.includes(t);
      const next = has ? cur.filter((x) => x !== t) : [...cur, t];
      persistFilters(next, tagFilters);
      return next;
    });
  }
  function toggleTag(tag: string) {
    setTagFilters((cur) => {
      const has = cur.includes(tag);
      const next = has ? cur.filter((x) => x !== tag) : [...cur, tag];
      persistFilters(typeFilters, next);
      return next;
    });
  }

  /** Enrich offers with distance if geo is ON */
  const enrichedOffers: Offer[] = useMemo(() => {
    if (!geoOn) return MOCK_OFFERS.map(({ distanceKm: _d, ...rest }) => rest);
    return MOCK_OFFERS.map((o) => {
      if (typeof o.lat === "number" && typeof o.lng === "number") {
        const d = kmBetween(coord.lat, coord.lng, o.lat, o.lng);
        return { ...o, distanceKm: Math.max(0, d) };
      }
      return o;
    });
  }, [geoOn, coord.lat, coord.lng]);

  /** Apply pill filters */
  const filteredOffers = useMemo(() => {
    return enrichedOffers.filter((o) => {
      const typeOk = typeFilters.length ? typeFilters.includes(o.type) : true;
      const tagOk = tagFilters.length
        ? (o.tags || []).some((t) => tagFilters.includes(t))
        : true;
      return typeOk && tagOk;
    });
  }, [enrichedOffers, typeFilters, tagFilters]);

  /** Segment-blended weights */
  const weights = useMemo(() => blendWeights(segment), [segment]);

  /** Lists */
  const byExpiringSoon = useMemo(
    () =>
      [...filteredOffers].sort(
        (a, b) => new Date(a.till).getTime() - new Date(b.till).getTime()
      ),
    [filteredOffers]
  );

  const byNearby = useMemo(() => {
    if (!geoOn) return filteredOffers;
    return [...filteredOffers].sort((a, b) => {
      const da = typeof a.distanceKm === "number" ? a.distanceKm : Number.POSITIVE_INFINITY;
      const db = typeof b.distanceKm === "number" ? b.distanceKm : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [filteredOffers, geoOn]);

  const byForYou = useMemo(() => {
    const scored = filteredOffers
      .map((o) => ({ o, score: scoreOfferForUser(o, weights, geoOn) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.o);
    return scored;
  }, [filteredOffers, weights, geoOn]);

  function copyCode(code?: string, id?: string) {
    if (!code || !id) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function activateOffer(o: Offer) {
    const deeplink = `astha://offer/${o.id}?merchant=${encodeURIComponent(o.merchant)}`;
    alert(`Offer activated!\n${deeplink}`);
  }

  function toggleGeo() {
    setGeoOn((s) => {
      const next = !s;
      localStorage.setItem(GEO_LS, next ? "1" : "0");
      return next;
    });
  }

  const list =
    tab === "forYou" ? byForYou : tab === "nearby" ? byNearby : byExpiringSoon;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 h-[92vh] w-[min(1000px,96vw)] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-3 text-white">
          <button className="rounded-full p-2 hover:bg-white/10" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-lg font-semibold">
            <Gift className="h-5 w-5" />
            Offers for You
          </div>

          <div className="flex items-center gap-2">
            {/* Segment quick picker (mock) */}
            <div className="hidden md:flex items-center gap-1 text-xs text-white/90">
              <Sliders className="h-4 w-4" />
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as Segment)}
                className="rounded-full bg-white/15 px-2 py-0.5 text-white outline-none"
                title="Personalization segment (mock)"
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="family">Family</option>
                <option value="default">Default</option>
              </select>
            </div>

            {/* Geo toggle */}
            <button
              onClick={toggleGeo}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                geoOn ? "bg-white text-rose-700" : "bg-white/20 text-white"
              }`}
              title="Geo-aware ranking"
            >
              <Navigation className="h-4 w-4" />
              {geoOn ? "Geo On" : "Geo Off"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between bg-rose-700 px-4 pb-3">
          <div className="flex items-center gap-2">
            {(
              [
                { id: "forYou", label: "For You" },
                { id: "nearby", label: "Nearby" },
                { id: "expiring", label: "Expiring Soon" },
              ] as { id: Tab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3 py-1 text-sm ${
                  tab === t.id ? "bg-white text-rose-700" : "text-white/90 hover:bg-white/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filters (types + tags) */}
          <div className="flex items-center gap-2 text-white/90">
            <Filter className="h-4 w-4" />
            <div className="hidden sm:flex items-center gap-1">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    typeFilters.includes(t) ? "bg-white text-rose-700" : "bg-white/20 text-white"
                  }`}
                >
                  {t === "fnb" ? "Food & Dining" : t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-1">
              {ALL_TAGS.map((tg) => (
                <button
                  key={tg}
                  onClick={() => toggleTag(tg)}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    tagFilters.includes(tg) ? "bg-white text-rose-700" : "bg-white/20 text-white"
                  }`}
                >
                  {tg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Geo denied hint */}
        {geoOn && geoDenied && (
          <div className="mx-4 mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900 ring-1 ring-rose-200">
            Location permission denied. Using an approximate city location. You can enable precise
            location in your browser settings for better “Nearby”.
          </div>
        )}

        {/* Content */}
        <div className="h-[calc(92vh-142px)] overflow-y-auto px-5 py-5">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4">
            {list.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[220px] flex-1">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-rose-600" />
                      <div className="text-[15px] font-semibold text-slate-900">
                        {o.title}
                      </div>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Store className="h-3.5 w-3.5" />
                      <span>{o.merchant}</span>

                      {geoOn && typeof o.distanceKm === "number" && (
                        <>
                          <span>•</span>
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{o.distanceKm.toFixed(1)} km</span>
                        </>
                      )}

                      <span>•</span>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>till {formatDate(o.till)}</span>
                    </div>

                    <div className="mt-2 text-sm text-slate-700">{o.short}</div>

                    {/* Tags */}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 ring-1 ring-rose-200">
                        {o.type === "cashback"
                          ? "Cashback"
                          : o.type === "discount"
                          ? "Discount"
                          : o.type === "bundle"
                          ? "Bundle"
                          : "Food & Dining"}
                      </span>
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 text-slate-600 ring-1 ring-slate-200">
                        Astha Pay
                      </span>
                      {o.tags?.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-slate-50 px-2 py-0.5 text-slate-600 ring-1 ring-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {o.code && (
                      <button
                        onClick={() => copyCode(o.code, o.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
                        title="Copy code"
                      >
                        {copiedId === o.id ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            {o.code}
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => activateOffer(o)}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      Activate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mx-auto mt-6 max-w-4xl text-center text-xs text-slate-500">
            Personalisation is blended with your segment (<b>{segment}</b>) and geo-aware ranking is{" "}
            {geoOn ? "ON" : "OFF"}. Use the filters to refine offer types and tags.
          </div>
        </div>
      </div>
    </div>
  );
}
