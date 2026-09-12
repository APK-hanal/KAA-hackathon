import requests
import sqlite3
import time

# Setup database
conn = sqlite3.connect('dofe_agencies.db')
c = conn.cursor()

c.execute('''CREATE TABLE IF NOT EXISTS agencies
             (id INTEGER PRIMARY KEY,
              permission_no TEXT UNIQUE, 
              name TEXT, 
              status TEXT,
              district TEXT,
              address TEXT,
              email TEXT,
              telephone TEXT,
              mobile TEXT,
              website TEXT)''')

url = "https://foreignjob.dofe.gov.np/Home/Get_RecruitmentAgency"

# Try to get all at once with empty search
params = {'PermissionNo': '', 'Name': '', 'StatusID': ''}

print("Fetching all agencies...")

try:
    r = requests.get(url, params=params, timeout=30)
    data = r.json()
    
    # Check if it's a list or wrapped in an object
    if isinstance(data, dict):
        agencies = data.get('data', data.get('agencies', [data]))
    else:
        agencies = data
    
    print(f"Found {len(agencies)} agencies in response")
    
    # If empty search returned nothing, try single letters
    if len(agencies) < 100:
        print("Empty search returned limited results, trying letter-by-letter...")
        all_agencies = {}
        
        for letter in 'abcdefghijklmnopqrstuvwxyz':
            params['Name'] = letter
            r = requests.get(url, params=params, timeout=10)
            letter_data = r.json()
            
            if isinstance(letter_data, list):
                for agency in letter_data:
                    all_agencies[agency['id']] = agency
            
            print(f"Letter '{letter}': {len(letter_data)} agencies (Total unique: {len(all_agencies)})")
            time.sleep(0.3)
        
        agencies = list(all_agencies.values())
    
    # Insert into database
    for agency in agencies:
        c.execute('''INSERT OR REPLACE INTO agencies 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (agency.get('id'),
                  agency.get('permissionNo', '').strip(),
                  agency.get('name', '').strip(),
                  agency.get('statusName', ''),
                  agency.get('district', ''),
                  agency.get('address', ''),
                  agency.get('email', ''),
                  agency.get('telephone', ''),
                  agency.get('mobileNo', ''),
                  agency.get('website', '')))
    
    conn.commit()
    print(f"\n saved {len(agencies)} agencies ")
    
    # Show status breakdown
    c.execute("SELECT status, COUNT(*) FROM agencies GROUP BY status")
    print("\nStatus breakdown:")
    for status, count in c.fetchall():
        print(f"  {status}: {count}")

except Exception as e:
    print(f"Error: {e}")

conn.close()