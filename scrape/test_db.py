import sqlite3

conn = sqlite3.connect('dofe_agencies.db')
c = conn.cursor()
c.execute("""SELECT * FROM agencies WHERE name ='A ONE OVERSEAS PVT. LTD.'""")
print(c.fetchall())