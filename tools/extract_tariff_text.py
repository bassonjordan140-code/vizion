from __future__ import annotations

import json
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "Grille_tarifaire"
OUTPUT_DIR = ROOT / "outputs" / "grille_tarifaire_work"


def extract_pdf(path: Path) -> dict:
    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        pages.append(
            {
                "page": i,
                "text": page.extract_text(extraction_mode="layout") or "",
            }
        )
    return {
        "file": str(path),
        "relative_file": str(path.relative_to(ROOT)),
        "folder": path.parent.name,
        "name": path.name,
        "pages": pages,
    }


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    records = []
    for pdf in sorted(SOURCE_DIR.rglob("*.pdf")):
        records.append(extract_pdf(pdf))

    out = OUTPUT_DIR / "pdf_text.json"
    out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = [
        {
            "relative_file": item["relative_file"],
            "pages": len(item["pages"]),
            "chars": sum(len(page["text"]) for page in item["pages"]),
        }
        for item in records
    ]
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
