"use client";

import { Check, ExternalLink, MapPin, Star, Ticket, X } from "lucide-react";
import type { PlaceResult, SavedPlace } from "@/lib/types";

type PlaceCardProps = {
  place: PlaceResult | SavedPlace;
  saved?: boolean;
  onSave?: () => void;
  onOpenMaps?: () => void;
  onMarkSavedInMaps?: () => void;
  onRemove?: () => void;
};

export function PlaceCard({ place, saved, onSave, onOpenMaps, onMarkSavedInMaps, onRemove }: PlaceCardProps) {
  const savedInMaps = "savedInGoogleMaps" in place && place.savedInGoogleMaps;

  return (
    <article className="group relative overflow-hidden rounded-[8px] border border-ink/15 bg-paper/88 p-5 shadow-panel backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="absolute right-4 top-4 h-11 w-11 rounded-full border border-ink/10 bg-chartreuse/50 text-center font-display text-xl leading-[2.55rem] text-ink/80">
        {place.name.slice(0, 1)}
      </div>
      <div className="pr-14">
        <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-paper">
          <MapPin size={12} />
          Google Places
        </p>
        <h3 className="font-display text-2xl leading-tight">{place.name}</h3>
        <p className="mt-2 min-h-10 text-sm leading-5 text-ink/68">{place.address}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-ink/70">
        {place.rating ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-white/60 px-2.5 py-1">
            <Star size={13} fill="currentColor" />
            {place.rating.toFixed(1)}
          </span>
        ) : null}
        {typeof place.priceLevel === "number" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-white/60 px-2.5 py-1">
            <Ticket size={13} />
            {"€".repeat(Math.max(1, place.priceLevel))}
          </span>
        ) : null}
        {savedInMaps ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-moss/30 bg-moss/15 px-2.5 py-1 text-moss">
            <Check size={13} />
            Marcado en Maps
          </span>
        ) : null}
      </div>

      <p className="mt-4 border-l-2 border-tomato pl-3 text-sm leading-6 text-ink/78">{place.reason}</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {onSave ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saved}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-ink px-3 py-2.5 text-sm font-extrabold text-paper transition hover:bg-tomato disabled:cursor-default disabled:bg-moss"
          >
            <Check size={16} />
            {saved ? "Guardado" : "Guardar"}
          </button>
        ) : null}
        <a
          href={place.mapsUrl}
          target="_blank"
          rel="noreferrer"
          onClick={onOpenMaps}
          className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-ink/18 bg-white/62 px-3 py-2.5 text-sm font-extrabold text-ink transition hover:border-canal hover:text-canal"
        >
          <ExternalLink size={16} />
          Maps
        </a>
        {onMarkSavedInMaps ? (
          <button
            type="button"
            onClick={onMarkSavedInMaps}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[8px] border border-moss/25 bg-moss/10 px-3 py-2.5 text-sm font-extrabold text-moss transition hover:bg-moss hover:text-paper"
          >
            <Check size={16} />
            Ya lo guardé en Maps
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[8px] border border-tomato/20 bg-tomato/10 px-3 py-2.5 text-sm font-extrabold text-tomato transition hover:bg-tomato hover:text-paper"
          >
            <X size={16} />
            Quitar de la lista
          </button>
        ) : null}
      </div>
    </article>
  );
}
