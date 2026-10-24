"use client";

import React from "react";
import { Clock, MapPin, Sparkles, CheckCircle2 } from "lucide-react";
import { TrackingCheckpoint } from "@/types/tracking.types";

interface OrderActivityTimelineProps {
  checkpoints: TrackingCheckpoint[];
  className?: string;
  reverse?: boolean;
}

export function OrderActivityTimeline({
  checkpoints,
  className = "",
  reverse = false,
}: OrderActivityTimelineProps) {
  if (!checkpoints || checkpoints.length === 0) {
    return (
      <div className={`p-6 text-center text-xs text-neutral-400 bg-neutral-50/60 rounded-2xl border border-neutral-100 ${className}`}>
        No tracking checkpoints recorded yet.
      </div>
    );
  }

  // Display items in desired order (default: oldest to newest, or newest first if reverse is true)
  const items = reverse ? [...checkpoints].reverse() : checkpoints;

  // Helper to extract location tag if comment starts with [Location]
  const parseLocationAndComment = (comment: string, explicitLocation?: string | null) => {
    if (explicitLocation) {
      return { location: explicitLocation, text: comment };
    }
    const match = comment.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      return { location: match[1], text: match[2] };
    }
    return { location: null, text: comment };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <ol className="relative border-l-2 border-neutral-200 ml-3 sm:ml-4 space-y-6 pt-1 pb-1">
        {items.map((cp, idx) => {
          const isLatest = idx === items.length - 1;
          const { location, text } = parseLocationAndComment(cp.comment, cp.location);

          return (
            <li key={cp.id || idx} className="ml-5 sm:ml-6 relative group">
              {/* Checkpoint Dot */}
              <span
                className={`absolute flex items-center justify-center w-3.5 h-3.5 rounded-full -left-[27px] sm:-left-[31px] top-1 ring-4 ring-white transition-all ${
                  isLatest
                    ? "bg-emerald-600 ring-emerald-50 scale-110"
                    : "bg-neutral-300"
                }`}
              >
                {isLatest && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>

              {/* Checkpoint Content */}
              <div className="bg-white/80 p-3.5 sm:p-4 rounded-xl border border-neutral-100 shadow-2xs hover:border-neutral-200 transition-colors space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 tracking-tight">
                      {cp.statusLabel || cp.status}
                    </span>

                    {location && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/70">
                        <MapPin className="w-3 h-3 text-amber-700" />
                        <span>{location}</span>
                      </span>
                    )}

                    {isLatest && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                        Latest Update
                      </span>
                    )}
                  </div>

                  <time className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(cp.timestamp).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </time>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                  {text}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
