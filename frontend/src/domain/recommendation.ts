import type { Place } from "./types";

export interface PlaceRecommendation {
  place: Place;
  matchedInterests: string[];
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("vi").normalize("NFC");

/** Rank fixture places by exact category match; unmatched items keep their input order. */
export function recommendPlaces(places: Place[], interests: string[]): PlaceRecommendation[] {
  const uniqueInterests = [...new Set(interests.map(normalize).filter(Boolean))];
  return places
    .map((place, index) => ({
      place,
      index,
      matchedInterests: uniqueInterests.filter((interest) => interest === normalize(place.category)),
    }))
    .sort((a, b) => b.matchedInterests.length - a.matchedInterests.length || a.index - b.index)
    .map(({ place, matchedInterests }) => ({ place, matchedInterests }));
}
