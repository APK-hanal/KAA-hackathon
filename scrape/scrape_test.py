import requests
import json

url = "https://foreignjob.dofe.gov.np/Home/Get_RecruitmentAgency"
params = {'PermissionNo': '', 'Name': 'a', 'StatusID': ''}

r = requests.get(url, params=params)
data = r.json()

# Print the first item to see field names
print(json.dumps(data[0] if isinstance(data, list) else data, indent=2, ensure_ascii=False))