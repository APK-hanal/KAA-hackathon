from fastapi import FastAPI, Query, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from contextlib import asynccontextmanager

from db import init_db
from search import load_agencies, search_agency, add_report, get_agency_reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    load_agencies()
    yield

app = FastAPI(title="Agency Shield Nepal", lifespan=lifespan)

class AnswerItem(BaseModel):
    question: str
    flagged: bool
    points: int
    reason: str

class ReportPayload(BaseModel):
    agency_id: int
    permission_no: str
    risk_score: int
    risk_level: str
    answers: List[AnswerItem]
    comment: Optional[str] = Field(None, max_length=300)

@app.get("/api/search")
def api_search(q: str = Query("", description="Agency name or permission number")):
    return {"query": q, "results": search_agency(q)}

@app.post("/api/reports")
def submit_report(payload: ReportPayload):
    try:
        answers_dict = [a.model_dump() for a in payload.answers]
        add_report(
            agency_id=payload.agency_id,
            permission_no=payload.permission_no,
            risk_score=payload.risk_score,
            risk_level=payload.risk_level,
            answers_json=answers_dict,
            comment=payload.comment or ""
        )
        return {"status": "success", "message": "Report submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sms", response_class=PlainTextResponse)
def sms_simulated_endpoint(Body: str = Form(...)):
    """Simulates receiving an SMS and returning a feature-phone optimized response."""
    query = Body.strip()
    results = search_agency(query)

    if not results:
        return (
            f"AGENCY SHIELD: '{query}' NOT FOUND in DoFE registry. "
            "WARNING: Do not pay money to unlicensed agents! Check again or call DoFE."
        )

    match = results[0]
    name = match.get("name", "Unknown")[:30]
    lic = match.get("permission_no", "N/A")
    raw_status = (match.get("status") or "UNKNOWN").upper()
    phone = match.get("telephone") or match.get("mobile") or "No phone"

    if raw_status == "ACTIVE":
        return (
            f"✅ VERIFIED ACTIVE: {name} (Lic #{lic}). "
            f"Phone: {phone}. Check job demand letter at dofe.gov.np before paying."
        )
    else:
        return (
            f"⚠️ WARNING: {name} (Lic #{lic}) status is {raw_status}. "
            "DO NOT pay fees. Contact DoFE hotline."
        )

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)