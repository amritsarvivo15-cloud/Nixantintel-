import React, { useMemo, useState } from "react";
import { CURATED_BRAND_LOGOS, isObscureDomain } from "../utils/logoResolver";

export type CompanyLogoProps = {
  domain?: string | null;
  companyName?: string | null;
  orgName?: string | null; // backward compatibility alias
  size?: number | 'sm' | 'md' | 'lg' | 'responsive';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
};

/**
 * Production-grade CompanyLogo Component for Radar 365
 *
 * Source Cascade:
 * 1. Curated verified brand vectors (Festo, ORO, Greenchef, Skydo, AcoBloom, Arista, Mahle, etc.)
 * 2. Logo.dev API (if VITE_LOGO_DEV_TOKEN or server proxy configured)
 * 3. Clearbit Logo API
 * 4. Google S2 high-density (128px) favicon CDN
 * 5. Domain root favicon / apple-touch-icon
 * 6. Intentional corporate initial badge fallback
 */
export function CompanyLogo({
  domain,
  companyName,
  orgName,
  size = 36,
  className = "",
  onClick,
  title,
}: CompanyLogoProps) {
  const displayName = (companyName || orgName || domain || "").trim();

  // Resolve numeric pixel size
  const pixelSize = useMemo(() => {
    if (typeof size === "number") return size;
    if (size === "sm") return 32;
    if (size === "md") return 36;
    if (size === "lg") return 44;
    return 36; // 'responsive' default
  }, [size]);

  const normalizedDomain = useMemo(() => {
    if (!domain) return "";

    const cleaned = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0];

    if (cleaned === "—" || cleaned === "na" || cleaned === "null" || isObscureDomain(cleaned)) {
      return "";
    }

    return cleaned;
  }, [domain]);

  const fallbackLetter =
    displayName?.charAt(0)?.toUpperCase() || normalizedDomain?.charAt(0)?.toUpperCase() || "?";

  // Build cascade of sources
  const sources = useMemo(() => {
    if (!normalizedDomain) return [];

    const list: string[] = [];

    // 1. Curated verified brand vectors
    if (CURATED_BRAND_LOGOS[normalizedDomain]) {
      list.push(CURATED_BRAND_LOGOS[normalizedDomain]);
    }

    // 2. Logo.dev with client or server token
    const logoDevToken = import.meta.env.VITE_LOGO_DEV_TOKEN;
    if (logoDevToken) {
      list.push(`https://img.logo.dev/${normalizedDomain}?token=${logoDevToken}`);
    }

    // 3. Clearbit Logo API
    list.push(`https://logo.clearbit.com/${normalizedDomain}`);

    // 4. Google S2 high-density favicon CDN (128px)
    list.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(normalizedDomain)}&sz=128`);

    // 5. Website favicon
    list.push(`https://${normalizedDomain}/favicon.ico`);

    return list;
  }, [normalizedDomain]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((prev) => prev + 1);
    } else {
      setFailed(true);
    }
  };

  const tooltip = title || `${displayName || normalizedDomain || 'Company'} logo`;

  if (!normalizedDomain || failed || sources.length === 0) {
    return (
      <div
        onClick={onClick}
        title={tooltip}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`flex shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 font-bold text-gray-700 dark:text-gray-200 select-none ${
          onClick ? "cursor-pointer hover:border-[#FFC600] transition-colors" : ""
        } ${className}`}
        style={{
          width: pixelSize,
          height: pixelSize,
          minWidth: pixelSize,
          minHeight: pixelSize,
          fontSize: Math.max(11, Math.round(pixelSize * 0.42)),
        }}
      >
        {fallbackLetter}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      title={tooltip}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xs select-none ${
        onClick ? "cursor-pointer hover:border-[#FFC600] transition-colors" : ""
      } ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
      }}
    >
      <img
        src={sources[sourceIndex]}
        alt={`${displayName} logo`}
        loading="lazy"
        onError={handleError}
        className="h-full w-full object-contain p-1.5"
      />
    </div>
  );
}
