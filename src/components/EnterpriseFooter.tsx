import React from 'react';
import { RadarMark } from './RadarLogo';
import { Database, Shield, Smartphone } from 'lucide-react';

export interface EnterpriseFooterProps {
  rowCount?: number;
  uniqueOrgCount?: number;
  lastUpdated?: string;
  className?: string;
}

/**
 * Radar 365 Enterprise SaaS Bar Footer
 * Pixel-accurate recreation of the user-provided executive design:
 * - Rounded obsidian bar with golden ambient halo rim glow
 * - 5 horizontal modular segments separated by golden vertical dividers
 * - Brand logo & NiXant Intelligence OS attribution
 * - 4-bar ascending chart with consolidated portfolio insight copy
 * - Database icon with 08 Sep 2026 data freshness & deduplication status
 * - Shield icon with copyright & revenue intelligence discovery
 * - Smartphone icon with Galaxy Z Fold Ultra optimization specs
 */
export const EnterpriseFooter: React.FC<EnterpriseFooterProps> = ({
  lastUpdated = '08 Sep 2026',
  className = '',
}) => {
  return (
    <footer
      id="radar-365-enterprise-footer"
      className={`w-full mt-8 mb-6 select-none print:hidden ${className}`}
    >
      {/* Outer Pill Container with Golden Ambient Rim Glow */}
      <div
        className="relative w-full rounded-2xl bg-gradient-to-b from-[#111318] via-[#0b0c10] to-[#07080a] border border-[#d97706]/70 shadow-[0_0_25px_rgba(234,179,8,0.22),0_0_50px_rgba(217,119,6,0.12),inset_0_1px_1.5px_rgba(254,240,138,0.32),inset_0_-1px_2px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-200"
      >
        {/* Top subtle golden light beam */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FFC600]/65 to-transparent pointer-events-none" />

        {/* 5-Column Grid / Flex Container */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 items-center py-3 sm:py-3.5 px-4 sm:px-6 gap-y-3.5 md:gap-y-3 lg:gap-y-0 divide-y md:divide-y-0 divide-[#d97706]/20">
          
          {/* Section 1: Brand & Logo */}
          <div className="flex items-center gap-3.5 py-1.5 md:py-0 lg:pr-4 lg:border-r border-[#d97706]/35">
            <div className="shrink-0 flex items-center justify-center transition-transform duration-150 hover:scale-105">
              <RadarMark size={42} theme="dark" animated={false} />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-baseline leading-none">
                <span className="text-white font-bold text-[18px] tracking-tight font-sans">
                  Radar
                </span>
                <span className="text-[#FFC600] font-black text-[18px] tracking-tight ml-1 font-sans">
                  365
                </span>
                <span className="text-[#FFC600] text-[10px] font-bold align-top ml-0.5 font-sans">
                  ™
                </span>
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-1 font-normal tracking-tight whitespace-nowrap">
                by <strong className="text-white font-semibold">Ni</strong>
                <strong className="text-[#FFC600] font-bold">Xant</strong>{' '}
                <span className="text-[#D1D5DB] font-medium">Intelligence OS</span>
              </div>
            </div>
          </div>

          {/* Section 2: Consolidated Insights */}
          <div className="flex items-center gap-3.5 py-1.5 md:py-0 lg:px-4 lg:border-r border-[#d97706]/35">
            <div className="shrink-0 flex items-center justify-center w-6 h-6">
              <svg
                className="w-5 h-5 text-[#FFC600]"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="4" y1="19" x2="4" y2="13.5" stroke="#FFC600" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="9.3" y1="19" x2="9.3" y2="10" stroke="#FFC600" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="14.6" y1="19" x2="14.6" y2="6.5" stroke="#FFC600" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="20" y1="19" x2="20" y2="3.5" stroke="#FFC600" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-[11px] leading-[1.38] text-[#D1D5DB] font-normal font-sans">
              <div>Insights generated from consolidated</div>
              <div>portfolio visibility, account matching</div>
              <div>and GMV trend analysis.</div>
            </div>
          </div>

          {/* Section 3: Data Freshness & Deduplication */}
          <div className="flex items-center gap-3.5 py-1.5 md:py-0 lg:px-4 lg:border-r border-[#d97706]/35">
            <div className="shrink-0 flex items-center justify-center w-6 h-6">
              <Database className="w-5 h-5 text-[#FFC600]" strokeWidth={2.1} />
            </div>
            <div className="text-[11px] leading-[1.38] text-[#D1D5DB] font-normal font-sans">
              <div>
                Data refreshed through <span className="text-white font-bold">{lastUpdated}</span> •
              </div>
              <div>Org ID deduplicated • Non-RAM/KAM</div>
              <div>cohort filtered</div>
            </div>
          </div>

          {/* Section 4: Copyright & Purpose */}
          <div className="flex items-center gap-3.5 py-1.5 md:py-0 lg:px-4 lg:border-r border-[#d97706]/35">
            <div className="shrink-0 flex items-center justify-center w-6 h-6">
              <Shield className="w-5 h-5 text-[#FFC600]" strokeWidth={2.1} />
            </div>
            <div className="text-[11px] leading-[1.38] text-[#D1D5DB] font-normal font-sans">
              <div>© 2026 NiXant Intelligence.</div>
              <div>Built for Revenue Intelligence &</div>
              <div>Opportunity Discovery.</div>
            </div>
          </div>

          {/* Section 5: Galaxy Z Fold Ultra Optimized */}
          <div className="flex items-center gap-3.5 py-1.5 md:py-0 lg:pl-4">
            <div className="shrink-0 flex items-center justify-center w-6 h-6">
              <Smartphone className="w-5 h-5 text-[#FFC600]" strokeWidth={2.1} />
            </div>
            <div className="text-[11px] leading-[1.38] text-[#D1D5DB] font-normal font-sans">
              <div>
                <span className="text-white font-bold">Galaxy Z Fold Ultra Optimized</span>{' '}
                <span className="text-[#FFC600] font-bold">•</span>
              </div>
              <div>Cover Screen | Single Screen |</div>
              <div>Dual-Pane Experience</div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};
