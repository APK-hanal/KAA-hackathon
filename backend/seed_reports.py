import sqlite3
import json
from db import init_db, DB_FILE

SAMPLE_REPORTS = [
    {
        "risk_score": 60,
        "risk_level": "High",
        "answers": [
            {"question": "Did the agency ask for payment before signing a written contract?", "flagged": True, "points": 25, "reason": "Scam signal"},
            {"question": "Did they pressure you to decide or pay quickly?", "flagged": True, "points": 15, "reason": "Scam signal"},
            {"question": "Did they request payment to a personal bank account/mobile wallet?", "flagged": True, "points": 20, "reason": "Scam signal"}
        ],
        "comment": "Demanded 80,000 NPR in cash transfer to agent's eSewa account before showing offer letter."
    },
    {
        "risk_score": 30,
        "risk_level": "Medium",
        "answers": [
            {"question": "Is promised salary 30%+ higher than typical market rate?", "flagged": True, "points": 15, "reason": "Scam signal"},
            {"question": "Does the agency lack a physical registered office?", "flagged": True, "points": 15, "reason": "Scam signal"}
        ],
        "comment": "Met the sub-agent at a cafe in Gongabu. Salary promised was $1200 for basic packing job."
    },
    {
        "risk_score": 0,
        "risk_level": "Low",
        "answers": [],
        "comment": "Official office in Lazimpat. Did not take any cash prior to contract copy."
    },
    {
        "risk_score": 75,
        "risk_level": "High",
        "answers": [
            {"question": "Did the agency ask for payment before signing a written contract?", "flagged": True, "points": 25, "reason": "Scam signal"},
            {"question": "Did they refuse to give you a physical copy of the contract?", "flagged": True, "points": 20, "reason": "Scam signal"},
            {"question": "Did they request payment to a personal bank account?", "flagged": True, "points": 20, "reason": "Scam signal"},
            {"question": "Were you promised a job inconsistent with visa type?", "flagged": True, "points": 15, "reason": "Scam signal"}
        ],
        "comment": "Tried sending my cousin on visit visa to UAE. Avoid!"
    }
]

def seed_demo_reports():
    print("--- DEMO SEED SCRIPT FOR HACKATHON PRESENTATION ---")
    init_db()  # Ensure database table is updated
    
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT id, permission_no, name FROM agencies LIMIT 3")
    agencies = cursor.fetchall()

    if not agencies:
        print("ERROR: No agencies found in database to attach demo reports.")
        conn.close()
        return

    inserted_cnt = 0
    for agency in agencies:
        ag_id = agency["id"]
        perm_no = agency["permission_no"] or "N/A"
        
        for r_data in SAMPLE_REPORTS[:3]:
            cursor.execute("""
                INSERT INTO reports (agency_id, permission_no, risk_score, risk_level, answers_json, comment)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                ag_id,
                perm_no,
                r_data["risk_score"],
                r_data["risk_level"],
                json.dumps(r_data["answers"]),
                r_data["comment"]
            ))
            inserted_cnt += 1

    conn.commit()
    conn.close()
    print(f"Successfully inserted {inserted_cnt} sample demo reports across {len(agencies)} agencies.")

if __name__ == "__main__":
    seed_demo_reports()