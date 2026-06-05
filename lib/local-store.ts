"use client";

import { starterLists } from "@/lib/demo";
import type { PlaceList } from "@/lib/types";

const listsKey = "placeshelf.lists.v1";

export function loadLocalLists(): PlaceList[] {
  if (typeof window === "undefined") return starterLists;
  const raw = window.localStorage.getItem(listsKey);
  if (!raw) {
    window.localStorage.setItem(listsKey, JSON.stringify(starterLists));
    return starterLists;
  }

  try {
    return JSON.parse(raw) as PlaceList[];
  } catch {
    window.localStorage.setItem(listsKey, JSON.stringify(starterLists));
    return starterLists;
  }
}

export function saveLocalLists(lists: PlaceList[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(listsKey, JSON.stringify(lists));
}

export function getLocalListById(listId: string) {
  return loadLocalLists().find((list) => list.id === listId);
}
