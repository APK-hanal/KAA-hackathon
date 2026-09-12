import sqlite3
import re
import json
from rapidfuzz import fuzz, process
from db import get_db

AGENCIES_CACHE = []

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'\b(pvt|ltd|private|limited|co|company)\b', '', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def normalize_license(lic: str) -> str:
    if not lic:
        return ""
    return re.sub(r'[^a-zA-Z0-9]', '', lic).lower()

def load_agencies():
    global AGENCIES_CACHE
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agencies")
    rows = cursor.fetchall()
    conn.close()

    AGENCIES_CACHE = []
    for row in rows:
        item = dict(row)
        item["norm_name"] = normalize_text(item.get("name", ""))
        item["norm_permission_no"] = normalize_license(item.get("permission_no", ""))
        AGENCIES_CACHE.append(item)
    print(f"Loaded {len(AGENCIES_CACHE)} agencies into search cache.")

def evaluate_status(agency: dict) -> dict:
    raw_status = (agency.get("status") or "").strip().lower()
    phone = agency.get("telephone") or agency.get("mobile")
    address = agency.get("address")

    if raw_status == "active":
        if not phone or not address:
            return {
                "color": "yellow",
                "label": "FOUND - INCOMPLETE DATA",
                "description": "Registered as Active with DoFE, but missing verified contact or address details."
            }
        return {
            "color": "green",
            "label": "VERIFIED & ACTIVE",
            "description": "Licensed and active in official DoFE registry."
        }
    else:
        return {
            "color": "red",
            "label": f"WARNING: {raw_status.upper() if raw_status else 'UNLICENSED'}",
            "description": "This agency is marked as Suspended, Blocked, or Inactive by DoFE."
        }

def get_agency_reports(agency_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM reports WHERE agency_id = ? ORDER BY created_at DESC", 
        (agency_id,)
    )
    rows = cursor.fetchall()
    conn.close()

    reports = [dict(r) for r in rows]
    total_count = len(reports)
    
    if total_count == 0:
        return {
            "total_count": 0,
            "avg_risk_level": "None",
            "list": []
        }

    high_cnt = sum(1 for r in reports if r["risk_level"] == "High")
    med_cnt = sum(1 for r in reports if r["risk_level"] == "Medium")
    low_cnt = sum(1 for r in reports if r["risk_level"] == "Low")

    if high_cnt >= med_cnt and high_cnt >= low_cnt:
        avg_risk = "High"
    elif med_cnt >= low_cnt:
        avg_risk = "Medium"
    else:
        avg_risk = "Low"

    for r in reports:
        try:
            r["answers_json"] = json.loads(r["answers_json"])
        except Exception:
            r["answers_json"] = []

    return {
        "total_count": total_count,
        "avg_risk_level": avg_risk,
        "list": reports
    }

def search_agency(query: str):
    if not query or not query.strip():
        return []

    clean_query = query.strip()
    norm_query_lic = normalize_license(clean_query)
    norm_query_name = normalize_text(clean_query)

    matched_indices = []

    # 1. License match
    exact_matches = [
        (idx, item) for idx, item in enumerate(AGENCIES_CACHE)
        if item["norm_permission_no"] == norm_query_lic and norm_query_lic != ""
    ]
    
    if exact_matches:
        results = []
        for idx, match in exact_matches:
            res = dict(match)
            res["match_type"] = "exact_license"
            res["score"] = 100
            res["ui_status"] = evaluate_status(res)
            res["community_reports"] = get_agency_reports(res["id"])
            results.append(res)
        return results

    # 2. Fuzzy name search
    names_list = [item["norm_name"] for item in AGENCIES_CACHE]
    raw_names_list = [item.get("name", "") for item in AGENCIES_CACHE]

    fuzzy_norm = process.extract(norm_query_name, names_list, scorer=fuzz.WRatio, limit=5)
    fuzzy_raw = process.extract(clean_query, raw_names_list, scorer=fuzz.WRatio, limit=5)

    candidates = {}
    for match, score, idx in fuzzy_norm + fuzzy_raw:
        if score >= 65:
            if idx not in candidates or score > candidates[idx]:
                candidates[idx] = score

    sorted_indices = sorted(candidates.items(), key=lambda x: x[1], reverse=True)[:5]

    results = []
    for idx, score in sorted_indices:
        item = dict(AGENCIES_CACHE[idx])
        item["match_type"] = "fuzzy_name"
        item["score"] = round(score, 1)
        item["ui_status"] = evaluate_status(item)
        item["community_reports"] = get_agency_reports(item["id"])
        results.append(item)

    return results

def add_report(agency_id: int, permission_no: str, risk_score: int, risk_level: str, answers_json: list, comment: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO reports (agency_id, permission_no, risk_score, risk_level, answers_json, comment)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (agency_id, permission_no, risk_score, risk_level, json.dumps(answers_json), comment[:300] if comment else ""))
    conn.commit()
    conn.close()