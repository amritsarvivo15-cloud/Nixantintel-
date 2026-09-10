import React, { useState, useRef, useEffect } from 'react';
import { FreshnessState, ImportSession } from '../types';
import { Calendar, Clock, FileText, Database, RotateCcw, ArrowUpRight, X } from 'lucide-react';

interface FreshnessBadgeProps {
  freshness: FreshnessState;
  history: ImportSession[];
  onOpenDataHub: (initialTab?: 'smart' | 'paste' | 'single' | 'history') => void;
  onRollback?: (session: ImportSession) => void;
}

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({
  freshness,
  history,
  onOpenDataHub,
  onRollback
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const dotPulse =
    freshness.status === 'fresh'
      ? 'bg-emerald-400'
      : freshness.status === 'stale'
      ? 'bg-amber-400'
      : 'bg-rose-400';

  const statusLabel =
    freshness.status === 'fresh'
      ? 'Fresh'
      : freshness.status === 'stale'
      ? 'Potentially Stale'
      : 'Outdated';

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Compact Header Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 hover:border-[#FFC600]/60 shadow-sm transition-all flex items-center gap-2 text-xs font-medium cursor-pointer"
        title="View Data Freshness, latest reporting date, and audit trail"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotPulse}`}
          />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotPulse}`} />
        </span>

        <span className="text-[var(--text)] font-semibold flex items-center gap-1">
          <span className="hidden sm:inline font-bold">{statusLabel}</span>
          <span className="text-[var(--muted)] hidden sm:inline">·</span>
          <span className="font-mono text-[11px] sm:text-xs">
            Through {freshness.dataThroughDate}
          </span>
        </span>
      </button>

      {/* Freshness & Quick Audit Details Sheet / Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121418]/95 backdrop-blur-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${dotPulse}`} />
              <h4 className="text-sm font-bold text-[var(--text)]">Data Freshness & Sync</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5 text-xs">
            {/* Metric row 1: Data Through */}
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <Calendar className="w-3.5 h-3.5 text-[#FFC600]" />
                <span>Data Through Date:</span>
              </div>
              <span className="font-mono font-bold text-[var(--text)]">
                {freshness.dataThroughDate}
              </span>
            </div>

            {/* Metric row 2: Last Imported At */}
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Last Processed:</span>
              </div>
              <span className="font-mono font-medium text-[var(--text)]">
                {freshness.importedAt}
              </span>
            </div>

            {/* Metric row 3: Source File */}
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--muted)] truncate max-w-[170px]">
                <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Source:</span>
              </div>
              <span className="font-mono text-[11px] text-[var(--text)] truncate max-w-[150px] text-right font-medium">
                {freshness.lastSourceName}
              </span>
            </div>
          </div>

          {/* Quick Recent Imports List */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--muted)] mb-2">
              <span>RECENT INGESTION SESSIONS</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenDataHub('history');
                }}
                className="text-[#FFC600] hover:underline flex items-center gap-0.5"
              >
                View all ({history.length})
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-[11px] text-[var(--muted)] italic py-2 text-center">
                Default baseline snapshot loaded (08 Sep 2026).
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {history.slice(0, 3).map((sess) => (
                  <div
                    key={sess.importId}
                    className="p-2 rounded-lg bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/40 flex items-center justify-between text-[11px]"
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-[var(--text)] truncate">{sess.fileName}</div>
                      <div className="text-[10px] text-[var(--muted)]">
                        Through {sess.dataThroughDate} • {sess.valuesChanged} updated
                      </div>
                    </div>
                    {onRollback && (
                      <button
                        onClick={() => {
                          if (confirm(`Roll back portfolio changes from ${sess.fileName}?`)) {
                            onRollback(sess);
                            setIsOpen(false);
                          }
                        }}
                        className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Rollback this import session"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revert</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenDataHub('smart');
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#FFC600] hover:bg-[#e6b200] text-black font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Refresh GMV Data Hub</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
