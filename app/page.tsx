"use client";

import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowUpRight,
  Boxes,
  Copy,
  Download,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Map,
  Plus,
  Search,
  Sparkles
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PlaceCard } from "@/components/place-card";
import { auth, isFirebaseConfigured, saveListToFirestore, signInWithGoogle, signOutUser, subscribeUserLists, toUserProfile } from "@/lib/firebase";
import { loadLocalLists, saveLocalLists } from "@/lib/local-store";
import type { PlaceList, PlaceResult, RecommendationResponse, SavedPlace, UserProfile } from "@/lib/types";

const promptExamples = ["ramen bueno en Madrid", "cena cozy en Chamberí", "tapas con terraza en Malasaña"];

function newList(name = "Nueva lista"): PlaceList {
  const now = new Date().toISOString();
  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "lista"}-${Date.now()}`;
  return {
    id,
    name,
    description: "Una caja nueva para sitios que merecen una segunda mirada.",
    isPublic: false,
    createdAt: now,
    updatedAt: now,
    places: []
  };
}

function formatListForText(list: PlaceList) {
  const lines = [
    list.name,
    list.description,
    "",
    ...list.places.flatMap((place, index) => [
      `${index + 1}. ${place.name}`,
      place.address,
      place.rating ? `Rating: ${place.rating.toFixed(1)}` : "",
      place.reason,
      place.mapsUrl,
      ""
    ])
  ];

  return lines.filter((line, index) => line || lines[index - 1]).join("\n").trim();
}

function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lists, setLists] = useState<PlaceList[]>([]);
  const [activeListId, setActiveListId] = useState("");
  const [prompt, setPrompt] = useState(promptExamples[0]);
  const [response, setResponse] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? lists[0],
    [activeListId, lists]
  );

  useEffect(() => {
    const localLists = loadLocalLists();
    setLists(localLists);
    setActiveListId(localLists[0]?.id ?? "");
  }, []);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? toUserProfile(firebaseUser) : null);
    });
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeUserLists(user.uid, (remoteLists) => {
      if (remoteLists.length > 0) {
        setLists(remoteLists);
        setActiveListId((current) => (remoteLists.some((list) => list.id === current) ? current : remoteLists[0].id));
      }
    });
    return unsubscribe;
  }, [user?.uid]);

  function persist(nextLists: PlaceList[]) {
    setLists(nextLists);
    saveLocalLists(nextLists);
    if (user?.uid) {
      nextLists.forEach((list) => void saveListToFirestore(user.uid, list));
    }
  }

  async function recommend(event?: FormEvent) {
    event?.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt, listId: activeList?.id })
      });
      const payload = (await res.json()) as RecommendationResponse | { error: string };
      if ("error" in payload) throw new Error(payload.error);
      setResponse(payload);
    } catch {
      setError("No he podido consultar ahora mismo. Prueba otra búsqueda o revisa las claves externas.");
    } finally {
      setLoading(false);
    }
  }

  function createList() {
    const created = newList(`Lista ${lists.length + 1}`);
    persist([created, ...lists]);
    setActiveListId(created.id);
  }

  function updateActiveList(updater: (list: PlaceList) => PlaceList) {
    if (!activeList) return;
    persist(lists.map((list) => (list.id === activeList.id ? updater(list) : list)));
  }

  function savePlace(place: PlaceResult) {
    updateActiveList((list) => {
      if (list.places.some((saved) => saved.placeId === place.placeId)) return list;
      const saved: SavedPlace = { ...place, savedAt: new Date().toISOString() };
      return { ...list, places: [saved, ...list.places], updatedAt: new Date().toISOString() };
    });
  }

  function markMapsOpened(placeId: string) {
    updateActiveList((list) => ({
      ...list,
      places: list.places.map((place) =>
        place.placeId === placeId ? { ...place, mapsOpenedAt: new Date().toISOString() } : place
      ),
      updatedAt: new Date().toISOString()
    }));
  }

  function markSavedInMaps(placeId: string) {
    updateActiveList((list) => ({
      ...list,
      places: list.places.map((place) =>
        place.placeId === placeId
          ? { ...place, savedInGoogleMaps: true, mapsOpenedAt: place.mapsOpenedAt ?? new Date().toISOString() }
          : place
      ),
      updatedAt: new Date().toISOString()
    }));
  }

  function removePlace(placeId: string) {
    updateActiveList((list) => ({
      ...list,
      places: list.places.filter((place) => place.placeId !== placeId),
      updatedAt: new Date().toISOString()
    }));
  }

  function shareUrl() {
    if (!activeList) return "";
    return `${window.location.origin}/share/${activeList.id}`;
  }

  function emailActiveList() {
    if (!activeList) return;
    const subject = encodeURIComponent(`PlaceShelf: ${activeList.name}`);
    const body = encodeURIComponent(`${formatListForText(activeList)}\n\nVista compartible: ${shareUrl()}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function downloadActiveListText() {
    if (!activeList) return;
    downloadFile(`${slugify(activeList.name) || "placeshelf-list"}.txt`, formatListForText(activeList), "text/plain");
  }

  function downloadActiveListJson() {
    if (!activeList) return;
    downloadFile(
      `${slugify(activeList.name) || "placeshelf-list"}.json`,
      JSON.stringify(activeList, null, 2),
      "application/json"
    );
  }

  const savedIds = new Set(activeList?.places.map((place) => place.placeId) ?? []);

  return (
    <main className="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[310px_minmax(0,1fr)_380px]">
        <aside className="rounded-[8px] border border-ink/12 bg-paper/86 p-4 shadow-panel backdrop-blur lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-tomato">PlaceShelf</p>
              <h1 className="mt-2 font-display text-4xl leading-none">Sitios con memoria.</h1>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-ink text-paper">
              <Boxes size={22} />
            </div>
          </div>

          <div className="mt-6 rounded-[8px] border border-ink/12 bg-white/54 p-3">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{user.name}</p>
                  <p className="truncate text-xs text-ink/58">{user.email ?? "sesión Google"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="grid h-10 w-10 place-items-center rounded-[8px] border border-ink/12 hover:bg-ink hover:text-paper"
                  title="Cerrar sesión"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle().then((profile) => profile && setUser(profile))}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-3 py-3 text-sm font-extrabold text-paper transition hover:bg-tomato disabled:opacity-60"
                disabled={!isFirebaseConfigured}
                title={isFirebaseConfigured ? "Entrar con Google" : "Configura Firebase para activar login real"}
              >
                <LogIn size={17} />
                {isFirebaseConfigured ? "Entrar con Google" : "Demo local"}
              </button>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-ink/58">Listas</h2>
            <button
              type="button"
              onClick={createList}
              className="grid h-9 w-9 place-items-center rounded-[8px] bg-chartreuse text-ink transition hover:bg-ink hover:text-paper"
              title="Crear lista"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="mt-3 flex max-h-[48vh] flex-col gap-2 overflow-auto pr-1 scrollbar-none">
            {lists.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => setActiveListId(list.id)}
                className={`rounded-[8px] border p-3 text-left transition ${
                  activeList?.id === list.id
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/10 bg-white/50 text-ink hover:border-moss"
                }`}
              >
                <span className="block text-sm font-extrabold">{list.name}</span>
                <span className="mt-1 block text-xs opacity-70">{list.places.length} sitios</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-[8px] border border-ink/12 bg-paper/72 p-4 shadow-panel backdrop-blur lg:min-h-[calc(100vh-2rem)] sm:p-5">
          <form onSubmit={recommend} className="rounded-[8px] border border-ink/14 bg-white/64 p-3 shadow-panel">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/38" size={20} />
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="h-14 w-full rounded-[8px] border border-ink/12 bg-paper pl-12 pr-4 text-base font-bold outline-none transition placeholder:text-ink/35 focus:border-tomato"
                  placeholder="¿Qué sitio buscas?"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[8px] bg-tomato px-5 text-sm font-extrabold text-paper transition hover:bg-ink disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Recomendar
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {promptExamples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-ink/12 bg-paper px-3 py-1.5 text-xs font-bold text-ink/70 transition hover:border-canal hover:text-canal"
                >
                  {example}
                </button>
              ))}
            </div>
          </form>

          {error ? (
            <div className="mt-4 rounded-[8px] border border-tomato/25 bg-tomato/10 p-4 text-sm font-bold text-tomato">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-ink/50">
                {response?.mode === "live" ? "Resultados reales" : "Modo demo"}
              </p>
              <h2 className="mt-1 font-display text-3xl">Recomendaciones</h2>
              {response?.diagnostic ? (
                <p className="mt-1 max-w-xl text-xs font-bold text-ink/45">{response.diagnostic}</p>
              ) : null}
            </div>
            {response?.intent.city ? (
              <span className="rounded-full bg-canal px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-paper">
                {response.intent.city}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(response?.places ?? []).map((place) => (
              <PlaceCard
                key={place.placeId}
                place={place}
                saved={savedIds.has(place.placeId)}
                onSave={() => savePlace(place)}
                onOpenMaps={() => markMapsOpened(place.placeId)}
              />
            ))}
          </div>

          {!response ? (
            <div className="mt-6 grid min-h-[360px] place-items-center rounded-[8px] border border-dashed border-ink/18 bg-white/36 p-8 text-center">
              <div>
                <Map className="mx-auto text-canal" size={44} />
                <p className="mt-4 font-display text-3xl">Pide una ciudad, una cocina o una vibra.</p>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="rounded-[8px] border border-ink/12 bg-paper/86 p-4 shadow-panel backdrop-blur lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-moss">Lista activa</p>
              <h2 className="mt-1 truncate font-display text-3xl">{activeList?.name ?? "Sin lista"}</h2>
              <p className="mt-2 text-sm leading-5 text-ink/62">{activeList?.description}</p>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(shareUrl())}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-ink/12 bg-white/60 transition hover:bg-ink hover:text-paper"
              title="Copiar enlace público"
            >
              <Copy size={17} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={activeList ? `/share/${activeList.id}` : "#"}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-chartreuse px-3 py-3 text-sm font-extrabold text-ink transition hover:bg-ink hover:text-paper"
            >
              <ArrowUpRight size={17} />
              Vista
            </a>
            <button
              type="button"
              onClick={emailActiveList}
              disabled={!activeList?.places.length}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-ink/14 bg-white/64 px-3 py-3 text-sm font-extrabold text-ink transition hover:border-canal hover:text-canal disabled:cursor-default disabled:opacity-45"
            >
              <Mail size={17} />
              Email
            </button>
            <button
              type="button"
              onClick={downloadActiveListText}
              disabled={!activeList?.places.length}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-ink/14 bg-white/64 px-3 py-3 text-sm font-extrabold text-ink transition hover:border-canal hover:text-canal disabled:cursor-default disabled:opacity-45"
            >
              <Download size={17} />
              TXT
            </button>
            <button
              type="button"
              onClick={downloadActiveListJson}
              disabled={!activeList?.places.length}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-ink/14 bg-white/64 px-3 py-3 text-sm font-extrabold text-ink transition hover:border-canal hover:text-canal disabled:cursor-default disabled:opacity-45"
            >
              <Download size={17} />
              JSON
            </button>
          </div>

          <div className="mt-4 flex max-h-[calc(100vh-340px)] flex-col gap-3 overflow-auto pr-1 scrollbar-none">
            {activeList?.places.length ? (
              activeList.places.map((place) => (
                <PlaceCard
                  key={place.placeId}
                  place={place}
                  onOpenMaps={() => markMapsOpened(place.placeId)}
                  onMarkSavedInMaps={() => markSavedInMaps(place.placeId)}
                  onRemove={() => removePlace(place.placeId)}
                />
              ))
            ) : (
              <div className="rounded-[8px] border border-dashed border-ink/18 bg-white/40 p-6 text-center">
                <p className="font-display text-2xl">Todavía no hay sitios.</p>
                <p className="mt-2 text-sm text-ink/58">Guarda una recomendación para empezar esta lista.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
