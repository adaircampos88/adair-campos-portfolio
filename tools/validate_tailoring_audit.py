#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIT_PATH = ROOT / "applications" / "tailoring-audit.json"
MANIFEST_TEMPLATE = ROOT / "applications" / "_template" / "tailoring_manifest.json"


def checksum(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
require(audit["schemaVersion"] == 1, "Unsupported audit schema")

variants = audit["variants"]
require(len(variants) == audit["summary"]["uniqueTailoredVariants"], "Variant count mismatch")
require(len({item["id"] for item in variants}) == len(variants), "Duplicate variant id")
require(len({item["sha256"] for item in variants}) == len(variants), "Duplicate variant checksum")

linkage_counts = Counter(item["linkage"] for item in variants)
require(linkage_counts["Verified"] == audit["summary"]["verifiedLinks"], "Verified count mismatch")
require(linkage_counts["Probable"] == audit["summary"]["probableLinks"], "Probable count mismatch")
require(linkage_counts["Unknown"] == audit["summary"]["unknownLinks"], "Unknown count mismatch")

eligible = [item for item in variants if item["performanceEligible"]]
require(len(eligible) == audit["summary"]["performanceEligibleVariants"], "Eligible count mismatch")
require(all(item["linkage"] == "Verified" for item in eligible), "Only Verified links may be eligible")
require(all(not item["performanceEligible"] for item in variants if item["linkage"] != "Verified"), "Non-Verified link is eligible")

for item in variants:
    path = Path(item["cvPath"])
    require(path.is_file(), f"Missing tailored CV artifact: {path}")
    require(checksum(path) == item["sha256"], f"Checksum mismatch: {path}")

for item in audit["foundations"]:
    path = Path(item["path"])
    require(path.is_file(), f"Missing CV foundation: {path}")
    require(checksum(path) == item["sha256"], f"Foundation checksum mismatch: {path}")
    require(item["pages"] == 2, f"Foundation must remain two pages: {path}")

strategy_packs = audit["strategyPacks"]
require(len(strategy_packs) == audit["summary"]["strategyPacks"], "Strategy count mismatch")
for item in strategy_packs:
    path = Path(item["path"])
    require(path.is_file(), f"Missing strategy pack: {path}")
    require(checksum(path) == item["sha256"], f"Strategy checksum mismatch: {path}")

template = json.loads(MANIFEST_TEMPLATE.read_text(encoding="utf-8"))
require(template["roleFamily"] in {"Product", "UXUI"}, "Invalid template CV family")
require(template["primaryEmphasis"] in {"Craft", "Product", "Research", "Domain"}, "Invalid template emphasis")
require(template["approval"]["waypointUpload"] == "Not requested", "Waypoint upload must require separate approval")
require(template["approval"]["application"] == "Not requested", "Application must require separate approval")

print(
    "Tailoring audit valid: "
    f"{len(variants)} unique variants, {linkage_counts['Verified']} verified link, "
    f"{len(strategy_packs)} strategy packs, 2 corrected foundations."
)
