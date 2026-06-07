export type PlaceIntent = {
  city?: string;
  area?: string;
  cuisine?: string;
  vibe?: string;
  price?: string;
  constraints?: string[];
};

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;
  lat: number;
  lng: number;
  mapsUrl: string;
  reason: string;
  types?: string[];
};

export type RecommendationResponse = {
  mode: "demo" | "live";
  intent: PlaceIntent;
  places: PlaceResult[];
  runId: string;
  diagnostic?: string;
};

export type SavedPlace = PlaceResult & {
  savedAt: string;
  mapsOpenedAt?: string;
  savedInGoogleMaps?: boolean;
  notes?: string;
};

export type PlaceList = {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  collaborators?: string[];
  createdAt: string;
  updatedAt: string;
  places: SavedPlace[];
};

export type UserProfile = {
  uid: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
};
