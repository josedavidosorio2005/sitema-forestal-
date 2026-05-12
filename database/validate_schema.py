"""
FMS SQLite Schema Validator
Executes all SQL scripts in order and reports results.
"""
import sqlite3
import os
import sys

DB_PATH = "fms_mobile_test.db"
SCRIPTS = [
    "00_core.sql",
    "01_module_a_silviculture.sql",
    "02_module_b_harvesting.sql",
    "03_module_c_logistics.sql",
    "04_module_d_sawmill.sql",
    "05_module_e_finance.sql",
    "06_module_f_bi_views.sql",
]

def main():
    # Remove old test DB
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    
    errors = []
    for script in SCRIPTS:
        path = os.path.join(os.path.dirname(__file__) or ".", script)
        if not os.path.exists(path):
            errors.append(f"MISSING: {script}")
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                sql = f.read()
            conn.executescript(sql)
            print(f"  OK  {script}")
        except Exception as e:
            errors.append(f"FAIL {script}: {e}")
            print(f" FAIL {script}: {e}")
    
    # Report tables
    cursor = conn.execute("SELECT type, name FROM sqlite_master WHERE type IN ('table','view','trigger') ORDER BY type, name;")
    rows = cursor.fetchall()
    
    tables = [r[1] for r in rows if r[0] == 'table']
    views = [r[1] for r in rows if r[0] == 'view']
    triggers = [r[1] for r in rows if r[0] == 'trigger']
    
    print(f"\n{'='*60}")
    print(f"TABLES ({len(tables)}):")
    for t in tables:
        count = conn.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
        print(f"  {t} ({count} rows)")
    
    print(f"\nVIEWS ({len(views)}):")
    for v in views:
        print(f"  {v}")
    
    print(f"\nTRIGGERS ({len(triggers)}):")
    for tr in triggers:
        print(f"  {tr}")
    
    if errors:
        print(f"\nERRORS ({len(errors)}):")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)
    else:
        print(f"\nALL SCRIPTS EXECUTED SUCCESSFULLY")
    
    conn.close()

if __name__ == "__main__":
    main()
