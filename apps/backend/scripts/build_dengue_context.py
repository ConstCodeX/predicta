#!/usr/bin/env python3
"""
Pre-agrega los datos de dengue a un JSON compacto por departamento.

Lee de data/csv/:
  - Casos_Dengue.xlsx        (casos por departamento, 2021-2026 total y SE 28)
  - Defunciones_Dengue.xlsx  (letalidad, incidencia, defunciones, poblacion)
  - DATA_MAESTRA_UNIFICADA_RIESGOS_PERU - Sheet1.csv  (por distrito -> se agrega)

Escribe data/datasets/dengue_context.json  (clave = DEPARTAMENTO normalizado).

Uso:
  python scripts/build_dengue_context.py

Reglas (ver AGENTE_CONSULTAS.md): nunca inventar. Si un campo no sale de una
tabla, se deja null. Todo valor es auditable a su fuente.
"""
import json
import unicodedata
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parents[1]          # apps/backend
CSV = BASE / "data" / "csv"
OUT = BASE / "data" / "datasets" / "dengue_context.json"

CASOS = CSV / "Casos_Dengue.xlsx"
DEFUN = CSV / "Defunciones_Dengue.xlsx"
MAESTRA = CSV / "DATA_MAESTRA_UNIFICADA_RIESGOS_PERU - Sheet1.csv"


def norm(s):
    """MAYUSCULAS sin acentos, espacios colapsados."""
    if s is None:
        return ""
    s = str(s).strip().upper()
    s = "".join(c for c in unicodedata.normalize("NFD", s)
                if unicodedata.category(c) != "Mn")
    return " ".join(s.split())


def num(v):
    try:
        if pd.isna(v):
            return None
        return float(v)
    except Exception:
        return None


def build():
    ctx = {}

    # ── Casos por año (total y SE 28) ───────────────────────────────────────
    casos = pd.ExcelFile(CASOS).parse(0)
    for _, r in casos.iterrows():
        dep = norm(r.get("geo"))
        if not dep:
            continue
        ctx.setdefault(dep, {})
        ctx[dep]["casos"] = {
            "fuente": "Casos_Dengue.xlsx (MINSA-CDC)",
            "total_por_anio": {
                str(a): num(r.get(f"total_{a}")) for a in range(2021, 2027)
            },
            "acumulado_SE28_por_anio": {
                str(a): num(r.get(f"(SE 28)_{a}")) for a in range(2021, 2027)
            },
            "total_2026": num(r.get("total_2026")),
            "acumulado_SE28_2026": num(r.get("(SE 28)_2026")),
        }

    # ── Defunciones / letalidad / incidencia ────────────────────────────────
    defun = pd.ExcelFile(DEFUN).parse(0)
    for _, r in defun.iterrows():
        dep = norm(r.get("geo"))
        if not dep:
            continue
        ctx.setdefault(dep, {})
        ctx[dep]["epidemiologia"] = {
            "fuente": "Defunciones_Dengue.xlsx (MINSA-CDC)",
            "casos_2026": num(r.get("casos")),
            "poblacion": num(r.get("poblacion")),
            "incidencia_100mil_hab": num(r.get("incidencia_100mil_hab")),
            "defunciones": num(r.get("defunciones")),
            "defunciones_dengue": num(r.get("defunciones_dengue")),
            "letalidad_pct": num(r.get("letalidad")),
        }

    # ── Data maestra: agregar por departamento ──────────────────────────────
    m = pd.read_csv(MAESTRA)
    m["_dep"] = m["Departamento"].map(norm)

    def s(col):
        return pd.to_numeric(m[col], errors="coerce")

    for dep, g in m.groupby("_dep"):
        if not dep:
            continue
        gi = g.index
        pob = s("POBLACION_TOTAL").loc[gi]
        pob_sum = float(pob.sum()) if pob.notna().any() else None

        def wavg(col):
            v = s(col).loc[gi]
            w = pob
            mask = v.notna() & w.notna()
            if not mask.any() or w[mask].sum() == 0:
                return float(v.mean()) if v.notna().any() else None
            return float((v[mask] * w[mask]).sum() / w[mask].sum())

        def ssum(col):
            v = s(col).loc[gi]
            return float(v.sum()) if v.notna().any() else None

        ctx.setdefault(dep, {})
        ctx[dep]["capacidad_y_exposicion"] = {
            "fuente": "DATA_MAESTRA_UNIFICADA_RIESGOS_PERU (agregado por depto)",
            "n_distritos": int(len(g)),
            "poblacion_total": pob_sum,
            "poblacion_menor_5": ssum("POBLACION_MENOR_5"),
            "poblacion_mayor_60": ssum("POBLACION_MAYOR_60"),
            "camas_hospitalarias_totales": ssum("CAMAS_HOSPITALARIAS_TOTALES"),
            "establecimientos_salud": ssum("CANT_EESS_TOTALES"),
            "deficit_agua_potable_pct": wavg("PORCENTAJE_DEFICIT_AGUA_POTABLE"),
            "reservorios_agua": ssum("CANT_RESERVORIOS_AGUA"),
            "ptap_agua_tratada": ssum("CANT_PTAP_AGUA_TRATADA"),
            "anemia_pct": wavg("PORCENTAJE_ANEMIA"),
            "desnutricion_infantil_pct": wavg("PORCENTAJE_DESNUTRICION_INFANTIL"),
        }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(ctx, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {len(ctx)} departamentos -> {OUT}")
    # Muestra de control
    for k in ["PIURA", "LORETO", "LA LIBERTAD"]:
        if k in ctx:
            c = ctx[k]
            print(f"  {k}: casos2026={c.get('casos',{}).get('total_2026')}, "
                  f"letalidad={c.get('epidemiologia',{}).get('letalidad_pct')}, "
                  f"camas={c.get('capacidad_y_exposicion',{}).get('camas_hospitalarias_totales')}")


if __name__ == "__main__":
    build()
