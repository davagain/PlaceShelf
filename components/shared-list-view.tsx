"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Lock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { PlaceCard } from "@/components/place-card";
import { getLocalListById } from "@/lib/local-store";
import type { PlaceList } from "@/lib/types";

export function SharedListView({ listId }: { listId: string }) {
  const [list, setList] = useState<PlaceList | null>(null);

  useEffect(() => {
    setList(getLocalListById(listId) ?? null);
  }, [listId]);

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-[8px] border border-ink/12 bg-paper/80 px-3 py-2 text-sm font-extrabold shadow-panel backdrop-blur transition hover:bg-ink hover:text-paper"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>

        {list ? (
          <>
            <header className="mt-8 grid gap-5 border-b border-ink/15 pb-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-tomato">PlaceShelf</p>
                <h1 className="mt-3 font-display text-5xl leading-none md:text-7xl">{list.name}</h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/66">{list.description}</p>
              </div>
              <div className="rounded-[8px] border border-ink/12 bg-paper/82 p-4 text-right shadow-panel">
                <p className="text-4xl font-black">{list.places.length}</p>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink/50">sitios</p>
              </div>
            </header>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.places.map((place) => (
                <PlaceCard key={place.placeId} place={place} />
              ))}
            </section>

            {list.places.length === 0 ? (
              <div className="mt-8 grid min-h-[320px] place-items-center rounded-[8px] border border-dashed border-ink/18 bg-paper/58 p-8 text-center">
                <div>
                  <MapPin className="mx-auto text-canal" size={42} />
                  <p className="mt-4 font-display text-3xl">Lista vacía por ahora.</p>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-10 grid min-h-[520px] place-items-center rounded-[8px] border border-ink/12 bg-paper/82 p-8 text-center shadow-panel">
            <div>
              <Lock className="mx-auto text-canal" size={48} />
              <h1 className="mt-5 font-display text-5xl">No encuentro esta lista.</h1>
              <p className="mx-auto mt-4 max-w-xl text-ink/62">
                En esta V1 la vista compartida lee las listas demo/locales del navegador. Al conectar Firestore, esta ruta
                podrá resolver listas públicas persistidas.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-[8px] bg-ink px-4 py-3 text-sm font-extrabold text-paper transition hover:bg-tomato"
              >
                <ExternalLink size={16} />
                Abrir app
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
