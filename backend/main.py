import os
import sqlite3
import json
from fastapi import FastAPI, Form, Query, Request
from fastapi.responses import HTMLResponse, PlainTextResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from rapidfuzz import process, fuzz
import uvicorn

app = FastAPI(title="Agency Shield Nepal")

# Initialize DB connection and schema
try:
    from db import init_db, get_db
    init_db()
except ImportError:
    DB_FILE = "dofe_agencies.db"
    def get_db():
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        return conn

# STRICT FUZZY MATCH SIMILARITY THRESHOLD (Below 80% = Unregistered / Not Found)
FUZZY_THRESHOLD = 80.0

class ReportSchema(BaseModel):
    agency_id: Optional[int] = None
    permission_no: Optional[str] = "UNREGISTERED"
    risk_score: int
    risk_level: str
    answers: list
    comment: Optional[str] = ""

def compute_ui_status(row):
    """
    Bulletproof status calculation checking multiple DB columns, 
    boolean flags, and common status keywords (English & Nepali).
    """
    # 1. Combine all status-related column fields into a searchable string
    status_parts = []
    for field in ["status", "permission_status", "agency_status", "remarks", "state", "status_name"]:
        if field in row and row[field] is not None:
            status_parts.append(str(row[field]))
            
    status_str = " ".join(status_parts).lower()

    # 2. Check boolean / numeric status flags (e.g., is_blocked=1 or is_active=0)
    is_blocked_flag = (
        row.get("is_blocked") in (1, "1", True, "true", "True") or
        row.get("is_active") in (0, "0", False, "false", "False")
    )

    # 3. Comprehensive blocked/suspended status keywords
    blocked_keywords = [
        "block", "suspend", "cancel", "cancle", "revok", "black", 
        "inact", "deact", "close", "kharaj", "sthagit", "halt", "hold", "reject"
    ]

    has_blocked_keyword = any(kw in status_str for kw in blocked_keywords)

    if is_blocked_flag or has_blocked_keyword:
        return {
            "color": "red",
            "label": "BLOCKED / SUSPENDED",
            "description": "This agency's license has been blocked, suspended, or canceled by DoFE. Do not conduct business or pay money to them."
        }

    phone = row.get("telephone") if "telephone" in row else None
    mobile = row.get("mobile") if "mobile" in row else None

    if not phone and not mobile:
        return {
            "color": "yellow",
            "label": "INCOMPLETE DOFE CONTACT DATA",
            "description": "Agency is listed as active in registry, but missing verified telephone or office contact details."
        }

    return {
        "color": "green",
        "label": "ACTIVE & REGISTERED",
        "description": "Verified active recruitment agency with valid Department of Foreign Employment license."
    }

def fetch_reports_for_agency(cursor, agency_id):
    if not agency_id:
        return {"total_count": 0, "avg_risk_level": "N/A", "list": []}
    
    cursor.execute("""
        SELECT id, risk_score, risk_level, answers_json, comment, created_at 
        FROM reports 
        WHERE agency_id = ? 
        ORDER BY id DESC
    """, (agency_id,))
    rows = cursor.fetchall()
    
    if not rows:
        return {"total_count": 0, "avg_risk_level": "N/A", "list": []}
    
    report_list = []
    total_score = 0
    for r in rows:
        total_score += r["risk_score"]
        try:
            answers_parsed = json.loads(r["answers_json"])
        except Exception:
            answers_parsed = []
        report_list.append({
            "id": r["id"],
            "risk_score": r["risk_score"],
            "risk_level": r["risk_level"],
            "answers_json": answers_parsed,
            "comment": r["comment"],
            "created_at": r["created_at"]
        })
    
    avg_score = total_score / len(rows)
    avg_level = "Low"
    if avg_score >= 56:
        avg_level = "High"
    elif avg_score >= 26:
        avg_level = "Medium"
        
    return {
        "total_count": len(rows),
        "avg_risk_level": avg_level,
        "list": report_list
    }

@app.get("/api/search")
def search_agencies(q: str = Query("", min_length=0)):
    query = q.strip()
    if not query:
        return {"query": query, "results": [], "match_found": False}
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agencies")
    all_agencies = cursor.fetchall()
    
    matched_results = []
    
    for row in all_agencies:
        agency_dict = dict(row)
        name = agency_dict.get("name", "")
        perm_no = agency_dict.get("permission_no", "") or ""
        
        score_name = fuzz.token_set_ratio(query.lower(), name.lower())
        score_perm = fuzz.ratio(query.lower(), perm_no.lower())
        best_score = max(score_name, score_perm)
        
        if best_score >= FUZZY_THRESHOLD:
            agency_dict["similarity_score"] = round(best_score, 1)
            agency_dict["ui_status"] = compute_ui_status(agency_dict)
            agency_dict["community_reports"] = fetch_reports_for_agency(cursor, agency_dict["id"])
            matched_results.append(agency_dict)
            
    conn.close()
    
    matched_results.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    return {
        "query": query,
        "results": matched_results,
        "match_found": len(matched_results) > 0
    }

@app.post("/api/reports")
def create_report(report: ReportSchema):
    conn = get_db()
    cursor = conn.cursor()
    
    perm_no = report.permission_no
    if not perm_no or perm_no == "N/A":
        if report.agency_id:
            cursor.execute("SELECT permission_no FROM agencies WHERE id = ?", (report.agency_id,))
            row = cursor.fetchone()
            if row and row["permission_no"]:
                perm_no = row["permission_no"]
    
    ag_id = report.agency_id if report.agency_id else 0
    
    cursor.execute("""
        INSERT INTO reports (agency_id, permission_no, risk_score, risk_level, answers_json, comment)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        ag_id,
        perm_no or "UNREGISTERED",
        report.risk_score,
        report.risk_level,
        json.dumps(report.answers),
        report.comment or ""
    ))
    conn.commit()
    report_id = cursor.lastrowid
    conn.close()
    
    return {"status": "success", "report_id": report_id}

@app.post("/api/sms", response_class=PlainTextResponse)
def sms_gateway(Body: str = Form(...)):
    query = Body.strip()
    if not query:
        return "Agency Shield: Send agency name or license # to check. e.g. 'Talent' or '958'"
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agencies")
    all_agencies = cursor.fetchall()
    
    best_agency = None
    highest_score = 0
    
    for row in all_agencies:
        agency_dict = dict(row)
        name = agency_dict.get("name", "")
        perm_no = agency_dict.get("permission_no", "") or ""
        
        s1 = fuzz.token_set_ratio(query.lower(), name.lower())
        s2 = fuzz.ratio(query.lower(), perm_no.lower())
        score = max(s1, s2)
        
        if score > highest_score:
            highest_score = score
            best_agency = agency_dict
            
    conn.close()
    
    if highest_score < FUZZY_THRESHOLD or not best_agency:
        return f"NOT FOUND: '{query}' is NOT registered in DoFE official records. High risk of fraud! Do not pay money. - Agency Shield Nepal"
    
    ui_status = compute_ui_status(best_agency)
    name = best_agency.get("name", "Unknown")
    lic = best_agency.get("permission_no", "N/A")
    dist = best_agency.get("district", "N/A")
    phone = best_agency.get("telephone") or best_agency.get("mobile") or "No phone"
    
    return f"AGENCY SHIELD: {name} (Lic #{lic})\nStatus: {ui_status['label']}\nDistrict: {dist}\nPhone: {phone}\nVerify before paying!"

# Serve Static Assets
app.mount("/", StaticFiles(directory="static", html=True), name="static_root")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)