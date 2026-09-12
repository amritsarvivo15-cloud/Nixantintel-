import React, { useMemo, useState, useEffect } from "react";
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
 * Production-grade Adaptive CompanyLogo Component for Radar 365
 *
 * Requirements:
 * 1. Adaptive container: Default background white/very light neutral with subtle border & soft shadow.
 * 2. Automatic contrast switching: Detects very light/white logos and adapts container background.
 * 3. Never stretch, crop, or recolor the logo (uses object-fit: contain with internal padding).
 * 4. Ensures dark/blue logos like Aamor Inox and Arista remain clearly visible at normal brightness.
 * 5. High-confidence cascade: Curated vectors -> Logo.dev -> Clearbit -> Google S2 128px -> Favicon -> Clean monogram.
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

  // Resolve pixel sizing (44x44 desktop, 40x40 compact when lg/44)
  const isLg = size === "lg" || size === 44;
  const pixelSize = useMemo(() => {
    if (typeof size === "number") return size;
    if (size === "sm") return 32;
    if (size === "md") return 36;
    if (size === "lg") return 44;
    return 36;
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

  // Clean initials fallback (e.g., "Aamor Inox" -> "AI", "Arista Networks" -> "AN")
  const fallbackInitials = useMemo(() => {
    const raw = displayName || normalizedDomain || "";
    const words = raw.split(/[\s,.-]+/).filter(Boolean);
    if (words.length >= 2) {
      const first = words[0].charAt(0).toUpperCase();
      const second = words[1].charAt(0).toUpperCase();
      if (/[A-Z]/.test(first) && /[A-Z]/.test(second)) {
        return `${first}${second}`;
      }
    }
    return raw.charAt(0)?.toUpperCase() || "?";
  }, [displayName, normalizedDomain]);

  // Build cascade of sources
  const sources = useMemo(() => {
    if (!normalizedDomain) return [];

    const list: string[] = [];

    // 1. Curated verified brand vectors (Aamor Inox, Arista, Festo, Greenchef, Skydo, etc.)
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
  const [containerBg, setContainerBg] = useState<'light' | 'dark'>('light');

  // Reset state if domain or sources change
  useEffect(() => {
    setSourceIndex(0);
    setFailed(false);
    setContainerBg('light');
  }, [normalizedDomain]);

  const handleError = () => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((prev) => prev + 1);
    } else {
      setFailed(true);
    }
  };

  // Inspect image contrast on load; switch to dark container only if the logo is predominantly white/very light
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const img = e.currentTarget;
      if (!img.naturalWidth || !img.naturalHeight) return;

      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 16, 16);
      const imageData = ctx.getImageData(0, 0, 16, 16);
      const data = imageData.data;
      let totalLuminance = 0;
      let visiblePixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a > 40) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Standard ITU-R BT.601 perceived luminance
          const lum = (r * 299 + g * 587 + b * 114) / 1000;
          totalLuminance += lum;
          visiblePixels++;
        }
      }

      if (visiblePixels > 4) {
        const avgLum = totalLuminance / visiblePixels;
        // If logo is almost completely white/light (luminance > 225), switch to dark container for contrast
        if (avgLum > 225) {
          setContainerBg('dark');
          return;
        }
      }
      setContainerBg('light');
    } catch {
      // If CORS blocks canvas sampling, keep safe light background (default)
      setContainerBg('light');
    }
  };

  const tooltip = title || `${displayName || normalizedDomain || 'Company'} logo`;

  // Fallback monogram
  if (!normalizedDomain || failed || sources.length === 0) {
    return (
      <div
        onClick={onClick}
        title={tooltip}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`flex shrink-0 items-center justify-center rounded-xl border border-slate-200/90 dark:border-zinc-700/60 bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-zinc-800 dark:to-zinc-900 font-extrabold text-slate-700 dark:text-zinc-200 shadow-xs select-none ${
          isLg ? "w-10 h-10 sm:w-11 sm:h-11" : ""
        } ${onClick ? "cursor-pointer hover:border-[#FFC600] transition-colors" : ""} ${className}`}
        style={{
          width: isLg ? undefined : pixelSize,
          height: isLg ? undefined : pixelSize,
          minWidth: isLg ? undefined : pixelSize,
          minHeight: isLg ? undefined : pixelSize,
          fontSize: Math.max(10, Math.round((isLg ? 44 : pixelSize) * (fallbackInitials.length > 1 ? 0.32 : 0.42))),
        }}
      >
        {fallbackInitials}
      </div>
    );
  }

  // Adaptive container styles:
  // Default is white (#FFFFFF) with a delicate slate border and soft shadow.
  // Dark/blue logos (e.g. Aamor Inox, Arista) remain 100% visible and crisp.
  const containerThemeClass =
    containerBg === 'dark'
      ? "bg-slate-900 border-slate-700 text-slate-100"
      : "bg-white border-slate-200/90 dark:border-zinc-300/40 text-slate-800";

  // Internal padding: 8-10px for large, 6px for medium
  const paddingClass = isLg ? "p-2 sm:p-2.5" : pixelSize >= 36 ? "p-1.5" : "p-1";

  return (
    <div
      onClick={onClick}
      title={tooltip}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-xs select-none transition-colors ${containerThemeClass} ${
        isLg ? "w-10 h-10 sm:w-11 sm:h-11" : ""
      } ${onClick ? "cursor-pointer hover:border-[#FFC600] transition-colors" : ""} ${className}`}
      style={{
        width: isLg ? undefined : pixelSize,
        height: isLg ? undefined : pixelSize,
        minWidth: isLg ? undefined : pixelSize,
        minHeight: isLg ? undefined : pixelSize,
      }}
    >
      <img
        src={sources[sourceIndex]}
        alt={`${displayName} logo`}
        loading="lazy"
        crossOrigin="anonymous"
        onLoad={handleImageLoad}
        onError={handleError}
        className={`h-full w-full object-contain ${paddingClass}`}
      />
    </div>
  );
}
