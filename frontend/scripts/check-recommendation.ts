import assert from "node:assert/strict";
import { recommendPlaces } from "../src/domain/recommendation";
import { snapshot } from "../src/services/mockTravelService";

const names = (interests: string[]) => recommendPlaces(snapshot.places, interests).map(({ place }) => place.id);
assert.equal(names(["VĂN HÓA"])[0], "marble");
assert.deepEqual(names([" ẨM THỰC "]).slice(0, 1), ["han-market"]);
assert.deepEqual(names([]), snapshot.places.map((place) => place.id));
assert.deepEqual(names(["không có"]), names([]));
assert.equal(recommendPlaces(snapshot.places, ["biển", "biển"])[0].matchedInterests.length, 1);
assert.deepEqual(recommendPlaces([], ["biển"]), []);
console.log("Recommendation checks passed");
