from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORK_DIR = ROOT / "outputs" / "grille_tarifaire_work"
INPUT = WORK_DIR / "pdf_text.json"
OUTPUT = WORK_DIR / "tariff_data.json"

MONTHS = {
    "janvier": 1,
    "fevrier": 2,
    "février": 2,
    "mars": 3,
    "avril": 4,
    "mai": 5,
    "juin": 6,
    "juillet": 7,
    "aout": 8,
    "août": 8,
    "septembre": 9,
    "octobre": 10,
    "novembre": 11,
    "decembre": 12,
    "décembre": 12,
}


def as_float(value: str | None) -> float | None:
    if value in (None, "-", ""):
        return None
    return float(value.replace(",", "."))


def normalized_text(record: dict) -> str:
    return "\n".join(page["text"] for page in record["pages"])


def effective_date(record: dict, text: str) -> str | None:
    m = re.search(r"applicables au\s+1er\s+([A-Za-zéûôîïÉè]+)\s+(\d{4})", text, re.I)
    if m:
        month = MONTHS.get(m.group(1).lower())
        if month:
            return date(int(m.group(2)), month, 1).isoformat()
    path = record["relative_file"]
    m = re.search(r"01\s+([A-Za-zéûôîïÉè]+)\s+(\d{4})", path, re.I)
    if m:
        month = MONTHS.get(m.group(1).lower())
        if month:
            return date(int(m.group(2)), month, 1).isoformat()
    m = re.search(r"au\s+01(0[128])(\d{2})", path, re.I)
    if m:
        return f"20{m.group(2)}-{m.group(1)}-01"
    m = re.search(r"20(\d{2})[ ._-]?(0[128])", path)
    if m:
        return f"20{m.group(1)}-{m.group(2)}-01"
    return None


def tariff_name(record: dict, text: str) -> str:
    name = record["name"].lower()
    if "bleu_plus" in name or "bleu plus" in name or "tarif bleu plus" in text.lower():
        return "Bleu Plus"
    if "bleu" in name or "tarif bleu" in text.lower():
        return "Bleu"
    if "vert" in name or "tarif vert" in text.lower():
        return "Vert"
    return "Non identifié"


def add_energy_row(rows: list[dict], record: dict, eff: str | None, tariff: str, option: str, segment: str,
                   period: str, price: float | None, subscription: float | None = None,
                   breaker: int | None = None, subscribed_power: int | str | None = None,
                   subscription_unit: str | None = None, extra: dict | None = None) -> None:
    rows.append(
        {
            "date_application": eff,
            "annee": int(eff[:4]) if eff else None,
            "tarif": tariff,
            "option": option,
            "segment_version": segment,
            "puissance_souscrite": subscribed_power,
            "reglage_disjoncteur_A": breaker,
            "abonnement": subscription,
            "unite_abonnement": subscription_unit,
            "periode_prix": period,
            "prix_energie_cEUR_kWh": price,
            "source_pdf": record["relative_file"],
            **(extra or {}),
        }
    )


def parse_bleu(record: dict, text: str, eff: str | None, rows: list[dict]) -> None:
    pages = record["pages"]
    for line in pages[0]["text"].splitlines():
        m = re.match(r"\s*(\d{1,2})\*{0,2}\s+(\d{2,3})\s+(\d+\.\d{2})\s+(\d+\.\d{4})\s*$", line)
        if m:
            add_energy_row(
                rows, record, eff, "Bleu", "Base", "Base", "Base",
                as_float(m.group(4)), as_float(m.group(3)), int(m.group(2)), int(m.group(1)), "EUR/an"
            )
    if len(pages) > 1:
        for line in pages[1]["text"].splitlines():
            m = re.match(r"\s*(\d{1,2})\s+(\d{2,3})\s+(\d+\.\d{2})\s+(\d+\.\d{4})\s+(\d+\.\d{4})\s*$", line)
            if m:
                add_energy_row(
                    rows, record, eff, "Bleu", "Heures Pleines / Heures Creuses", "HP/HC",
                    "Heures Pleines", as_float(m.group(4)), as_float(m.group(3)), int(m.group(2)), int(m.group(1)), "EUR/an"
                )
                add_energy_row(
                    rows, record, eff, "Bleu", "Heures Pleines / Heures Creuses", "HP/HC",
                    "Heures Creuses", as_float(m.group(5)), as_float(m.group(3)), int(m.group(2)), int(m.group(1)), "EUR/an"
                )


def parse_bleu_plus(record: dict, text: str, eff: str | None, rows: list[dict]) -> None:
    for line in text.splitlines():
        m = re.match(r"\s*Option base\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{4})\s+-\s*$", line, re.I)
        if m:
            add_energy_row(rows, record, eff, "Bleu Plus", "Base", "Base", "Heures Pleines/Base",
                           as_float(m.group(3)), as_float(m.group(1)), None, ">=36 kVA", "EUR/an",
                           {"majoration_abonnement_EUR_kVA_an": as_float(m.group(2))})
        m = re.match(r"\s*Option Heures Creuses\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{4})\s+(\d+\.\d{4})\s*$", line, re.I)
        if m:
            add_energy_row(rows, record, eff, "Bleu Plus", "Heures Creuses", "HP/HC", "Heures Pleines",
                           as_float(m.group(3)), as_float(m.group(1)), None, ">=36 kVA", "EUR/an",
                           {"majoration_abonnement_EUR_kVA_an": as_float(m.group(2))})
            add_energy_row(rows, record, eff, "Bleu Plus", "Heures Creuses", "HP/HC", "Heures Creuses",
                           as_float(m.group(4)), as_float(m.group(1)), None, ">=36 kVA", "EUR/an",
                           {"majoration_abonnement_EUR_kVA_an": as_float(m.group(2))})


def parse_vert(record: dict, text: str, eff: str | None, rows: list[dict]) -> None:
    version_map = {
        "Longues": "Longues Utilisations",
        "Moyenn": "Moyennes Utilisations",
        "Courtes": "Courtes Utilisations",
    }
    periods = [
        "Pointe",
        "Eté - Heures Pleines",
        "Eté - Heures Creuses",
        "Hiver - Heures Pleines",
        "Hiver - Heures Creuses",
    ]
    for line in record["pages"][0]["text"].splitlines():
        if not any(key in line for key in version_map):
            continue
        numbers = re.findall(r"\d+\.\d+", line)
        if len(numbers) < 11:
            continue
        key = next(key for key in version_map if key in line)
        prime = as_float(numbers[0])
        prices = [as_float(v) for v in numbers[1:6]]
        coeffs = [as_float(v) for v in numbers[6:11]]
        dep = as_float(numbers[11]) if len(numbers) > 11 else None
        reactive = as_float(numbers[12]) if len(numbers) > 12 else None
        for period, price, coeff in zip(periods, prices, coeffs):
            add_energy_row(rows, record, eff, "Vert", "Base", version_map[key], period, price, prime,
                           None, ">=250 kVA", "EUR/kW/an",
                           {"coefficient_puissance_reduite": coeff, "depassement_EUR_kW": dep, "energie_reactive_cEUR_kVArh": reactive})

    if len(rows) == 0 or not any(row["source_pdf"] == record["relative_file"] for row in rows):
        old_versions = {
            "LONGUES UTILISATIONS": "Longues Utilisations",
            "MOYENNES  UTILISATIONS": "Moyennes Utilisations",
            "COURTES UTILISATIONS": "Courtes Utilisations",
        }
        old_periods = [
            "Pointe",
            "Eté - Heures Pleines",
            "Eté - Heures Creuses",
            "Hiver - Heures Pleines",
            "Hiver - Heures Creuses",
        ]
        coeff_by_version = {}
        for line in record["pages"][0]["text"].splitlines():
            for label, version in old_versions.items():
                if line.strip().startswith(label):
                    nums = re.findall(r"\d+,\d+|\d+\.\d+", line)
                    if len(nums) == 5:
                        coeff_by_version[version] = [as_float(v) for v in nums]
                    elif len(nums) >= 6:
                        prime = as_float(nums[0])
                        prices = [as_float(v) for v in nums[1:6]]
                        for period, price in zip(old_periods, prices):
                            add_energy_row(rows, record, eff, "Vert", "Base", version, period, price, prime,
                                           None, ">=250 kVA", "EUR/kW/an")

        dep_by_version = {}
        reactive = None
        for line in record["pages"][0]["text"].splitlines():
            if "Dépassement" in line or "Depassement" in line:
                nums = re.findall(r"\d+,\d+|\d+\.\d+", line)
                if nums:
                    if "69" in nums[0] or "69," in nums[0]:
                        dep_by_version["Longues Utilisations"] = as_float(nums[0])
                    elif "38" in nums[0]:
                        dep_by_version["Moyennes Utilisations"] = as_float(nums[0])
                    elif "18" in nums[0]:
                        dep_by_version["Courtes Utilisations"] = as_float(nums[0])
            if "ENERGIE REACTIVE" in line:
                nums = re.findall(r"\d+,\d+|\d+\.\d+", line)
                if nums:
                    reactive = as_float(nums[-1])
        for row in rows:
            if row["source_pdf"] == record["relative_file"] and row["tarif"] == "Vert":
                version = row["segment_version"]
                period_index = old_periods.index(row["periode_prix"]) if row["periode_prix"] in old_periods else None
                if period_index is not None and version in coeff_by_version:
                    row["coefficient_puissance_reduite"] = coeff_by_version[version][period_index]
                row["depassement_EUR_kW"] = dep_by_version.get(version)
                row["energie_reactive_cEUR_kVArh"] = reactive

    transition_text = record["pages"][1]["text"] if len(record["pages"]) > 1 else ""
    m = re.search(
        r"\n\s*(\d+\.\d{2})\s+(\d+\.\d{4})\s+(\d+\.\d{4})\s+(\d+\.\d{4})\s+(\d+\.\d{4})\s+(\d+\.\d{4})\s+"
        r"(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{3})\s+(\d+\.\d{2})",
        transition_text,
    )
    if m:
        nums = [as_float(v) for v in m.groups()]
        transition_periods = [
            "Saison Haute - Pointe",
            "Saison Haute - Heures Pleines",
            "Saison Haute - Heures Creuses",
            "Saison Basse - Heures Pleines",
            "Saison Basse - Heures Creuses",
        ]
        for period, price, coeff in zip(transition_periods, nums[1:6], nums[6:11]):
            add_energy_row(rows, record, eff, "Vert", "Transition Energétique", "Transition Energétique",
                           period, price, nums[0], None, ">=250 kVA", "EUR/kW/an",
                           {"coefficient_puissance_reduite": coeff, "energie_reactive_cEUR_kVArh": nums[11], "depassement_EUR_kW": nums[12]})


def parse_time_windows(record: dict, text: str, eff: str | None, tariff: str) -> list[dict]:
    rows = []
    src = record["relative_file"]
    if tariff == "Bleu":
        if "EDF a défini trois périodes" in text:
            rows.append({"date_application": eff, "tarif": tariff, "option": "Heures Pleines / Heures Creuses",
                         "saison": "Toute l'année", "periode": "Heures creuses",
                         "plage_horaire": "21h45-5h45, 21h30-5h30 ou 22h00-6h00", "source_pdf": src})
        elif "22h00-6h00" in text or "22h et 6h" in text:
            rows.append({"date_application": eff, "tarif": tariff, "option": "Heures Pleines / Heures Creuses",
                         "saison": "Toute l'année", "periode": "Heures creuses",
                         "plage_horaire": "22h00-6h00", "source_pdf": src})
    elif tariff == "Bleu Plus":
        if "22h et 6h" in text:
            rows.append({"date_application": eff, "tarif": tariff, "option": "Heures Creuses",
                         "saison": "Toute l'année", "periode": "Heures creuses",
                         "plage_horaire": "entre 22h et 6h", "source_pdf": src})
    elif tariff == "Vert":
        rows.extend([
            {"date_application": eff, "tarif": tariff, "option": "Base", "saison": "Hiver austral", "periode": "Dates", "plage_horaire": "1er mai au 30 septembre inclus", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Base", "saison": "Eté austral", "periode": "Dates", "plage_horaire": "1er octobre au 30 avril inclus", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Base", "saison": "Toutes saisons", "periode": "Heures creuses", "plage_horaire": "8h/jour entre 22h30 et 6h30", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Base", "saison": "Semaine", "periode": "Heures pleines", "plage_horaire": "6h30-9h, 12h30-19h, 20h30-22h30", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Base", "saison": "Samedi et dimanche", "periode": "Heures pleines", "plage_horaire": "6h30-22h30", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Base", "saison": "Semaine", "periode": "Heures de pointe", "plage_horaire": "9h-12h30 et 19h-20h30", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Transition Energétique", "saison": "Saison Haute", "periode": "Dates", "plage_horaire": "1er octobre au 31 mars inclus", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Transition Energétique", "saison": "Saison Haute - semaine", "periode": "Heures creuses", "plage_horaire": "00h-8h", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Transition Energétique", "saison": "Saison Haute - samedi/dimanche", "periode": "Heures creuses", "plage_horaire": "00h-16h", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Transition Energétique", "saison": "Saison Haute - semaine", "periode": "Heures pleines", "plage_horaire": "8h-18h et 22h-00h", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Transition Energétique", "saison": "Saison Haute - samedi/dimanche", "periode": "Heures pleines", "plage_horaire": "16h-00h", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Transition Energétique", "saison": "Saison Haute - semaine", "periode": "Heures de pointe", "plage_horaire": "18h-22h", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Transition Energétique", "saison": "Saison Basse", "periode": "Dates", "plage_horaire": "1er avril au 30 septembre inclus", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Transition Energétique", "saison": "Saison Basse - semaine", "periode": "Heures pleines", "plage_horaire": "18h-22h", "source_pdf": src},
            {"date_application": eff, "tarif": tariff, "option": "Transition Energétique", "saison": "Saison Basse", "periode": "Heures creuses", "plage_horaire": "autres horaires", "source_pdf": src},
        ])
    return rows


def main() -> None:
    data = json.loads(INPUT.read_text(encoding="utf-8"))
    price_rows: list[dict] = []
    time_rows: list[dict] = []
    sources: list[dict] = []

    for record in data:
        text = normalized_text(record)
        eff = effective_date(record, text)
        tariff = tariff_name(record, text)
        extracted_chars = len(text.strip())
        before = len(price_rows)
        if extracted_chars:
            if tariff == "Bleu":
                parse_bleu(record, text, eff, price_rows)
            elif tariff == "Bleu Plus":
                parse_bleu_plus(record, text, eff, price_rows)
            elif tariff == "Vert":
                parse_vert(record, text, eff, price_rows)
            time_rows.extend(parse_time_windows(record, text, eff, tariff))
        sources.append(
            {
                "date_application": eff,
                "tarif": tariff,
                "source_pdf": record["relative_file"],
                "pages": len(record["pages"]),
                "caracteres_extraits": extracted_chars,
                "lignes_prix_extraites": len(price_rows) - before,
                "statut": "extrait" if len(price_rows) > before else ("texte non exploitable/OCR requis" if not extracted_chars else "aucune ligne tarifaire reconnue"),
            }
        )

    OUTPUT.write_text(
        json.dumps({"prix": price_rows, "plages_horaires": time_rows, "sources": sources}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps({"prix": len(price_rows), "plages_horaires": len(time_rows), "sources": len(sources)}, indent=2))


if __name__ == "__main__":
    main()
