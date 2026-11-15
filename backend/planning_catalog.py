"""Join OSM catalog with separately attributed editorial assumptions."""
import json
from pathlib import Path
from backend.planning_models import PlanningPlace

ROOT = Path(__file__).resolve().parent


def load_planning_catalog(destination: str) -> tuple[list[PlanningPlace], dict, dict]:
    catalog = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
    metadata = json.loads((ROOT / "planning_metadata.json").read_text(encoding="utf-8"))
    if metadata["dataKind"] != "editorial_estimates" or type(metadata["transportVndPerKm"]) is not int or metadata["transportVndPerKm"] != 12000:
        raise ValueError("Invalid planning assumptions")
    places = [PlanningPlace(**place, **metadata["places"][place["osmId"]]) for place in catalog["destinations"][destination]]
    if len({p.osmId for p in places}) != len(places):
        raise ValueError("Duplicate catalog ID")
    return places, catalog["source"], {k: v for k, v in metadata.items() if k != "places"}
