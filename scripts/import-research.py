"""Read the supplied workbook/CSV/HTML into a lossless audit snapshot.

Usage: python3 scripts/import-research.py /path/to/source-directory
Requires openpyxl for read-only extraction; never edits the originals.
The snapshot is evidence, not executable instructions or engine parameters.
"""
import csv
import hashlib
import json
import sys
from pathlib import Path
import openpyxl

root = Path(sys.argv[1])
stem = "AI_Race_Dataset_2025_to_2026-10-13"
paths = [root / (stem + ".xlsx"), root / "AI_Race_Coverage.csv", root / (stem + ".html")]
book = openpyxl.load_workbook(paths[0], read_only=True, data_only=True)

def rows(sheet):
    values = list(book[sheet].values)
    return [dict(zip(values[0], row)) for row in values[1:]]

with paths[1].open(encoding="utf-8-sig", newline="") as source:
    coverage = list(csv.DictReader(source))
assert coverage == rows("COVERAGE"), "CSV and workbook coverage disagree"
records = [row for sheet in ("D1", "D2", "F3") for row in rows(sheet)]
html = paths[2].read_text()
assert all(row["Record_ID"] in html for row in records), "HTML record missing"
assert len(records) == sum(int(row["Records"]) for row in coverage)
snapshot = {
    "coverageBoundary": "2026-10-13",
    "inputs": [{"name": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for path in paths],
    "readme": rows("README"), "coverage": coverage, "records": records,
    "sources": rows("SOURCES"), "gaps": rows("GAPS"), "searchLog": rows("SEARCH_LOG"),
    "verification": "Workbook and CSV coverage agree; HTML contains all record IDs. This is a format check, not source validation.",
}
destination = Path(__file__).resolve().parents[1] / "research" / "supplied-dataset.json"
destination.parent.mkdir(exist_ok=True)
destination.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
book.close()
print(f"Saved {len(records)} records and {len(coverage)} coverage topics to {destination}")
