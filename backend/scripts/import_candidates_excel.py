import requests
import json
from openpyxl import load_workbook
from datetime import datetime, date
import sys
import os

# Configuration
BASE_URL = "http://127.0.0.1:8000/api/v1"
EXCEL_FILE = r"C:\\Users\\daran\\Downloads\\candidates_pool_cleaned.xlsx"  # Change this to your file name

# Credentials provided by user
AUTH_EMAIL = "dharanidaran.a@winvinaya.com"
AUTH_PASS = "Testpass@123"

def get_token():
    """Authenticate and get access token"""
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": AUTH_EMAIL,
        "password": AUTH_PASS
    }
    print(f"Logging in as {AUTH_EMAIL}...")
    try:
        response = requests.post(url, json=payload, timeout=15)
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"[ERROR] Login failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Connection error during login: {e}")
        sys.exit(1)

def format_date(val):
    """Format date to YYYY-MM-DD string"""
    if isinstance(val, datetime):
        return val.date().isoformat()
    if isinstance(val, date):
        return val.isoformat()
    if isinstance(val, str):
        try:
            # Try parsing common formats
            for fmt in ("%d-%b-%Y", "%Y-%m-%d", "%d/%m/%Y"):
                try:
                    return datetime.strptime(val, fmt).date().isoformat()
                except ValueError:
                    continue
        except:
            pass
    return None

def import_candidates(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    if not os.path.exists(EXCEL_FILE):
        print(f"[ERROR] Excel file '{EXCEL_FILE}' not found.")
        return

    wb = load_workbook(EXCEL_FILE, data_only=True)
    sheet = wb.active
    
    print(f"Reading sheet: {sheet.title}")
    
    # Assuming headers are in row 1, data starts from row 2
    # We will use column indexes based on the provided sample image
    
    success_count = 0
    fail_count = 0
    processed_emails = set()
    
    for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        # Safety check for empty rows
        if not any(row):
            continue
            
        # Ensure row has enough columns (pad with None if needed)
        row = list(row) + [None] * (23 - len(row))
        
        name = str(row[1]).strip() if row[1] else None
        email = str(row[5]).strip() if row[5] else None
        
        if not name or not email:
            print(f"  [SKIP] Row {row_idx}: Missing name or email.")
            continue

        if email in processed_emails:
            print(f"\nProcessing row {row_idx}: {name} ({email})")
            print(f"  [SKIP] Email {email} already processed in this batch.")
            continue
            
        processed_emails.add(email)
            
        gender = str(row[2]).strip().lower() if row[2] else "male"
        if "female" in gender:
            gender = "female"
        else:
            gender = "male"
            
        disability_cat = str(row[3]).strip() if row[3] else ""
        disability_sub_cat = str(row[4]).strip() if row[4] else ""
        contact = str(row[6]).strip() if row[6] else ""
        dob = format_date(row[7])
        state = str(row[8]).strip() if row[8] else "Unknown"
        district = str(row[9]).strip() if row[9] else "Unknown"
        city = str(row[10]).strip() if row[10] else "Unknown"
        pincode = str(row[11]).strip() if row[11] else ""
        passing_year = row[12]
        qualification = str(row[13]).strip() if row[13] else "Degree"
        college = str(row[14]).strip() if row[14] else "Other"
        primary_skills = str(row[15]).strip() if row[15] else ""
        
        # Placement info
        company = str(row[16]).strip() if row[16] else ""
        joining_date = format_date(row[17])
        designation = str(row[18]).strip() if row[18] else ""
        ctc = str(row[19]).strip() if row[19] else ""
        status_beneficiary = str(row[20]).strip() if row[20] else ""
        donor = str(row[21]).strip() if row[21] else ""
        batch_year = str(row[22]).strip() if row[22] else ""

        print(f"\nProcessing row {row_idx}: {name} ({email})")

        # 1. Register Candidate
        # Note: register endpoint is public, but we can pass token if needed
        # We use a default pincode since it's not in the Excel
        candidate_payload = {
            "name": name,
            "gender": gender,
            "email": email,
            "phone": contact,
            "dob": dob,
            "pincode": pincode or "Unknown", # Default
            "city": city or "Unknown",
            "district": district or "Unknown",
            "state": state or "Unknown",
            "disability_details": {
                "is_disabled": True if disability_cat and disability_cat.lower() != "none" else False,
                "disability_type": disability_cat or "",
                "disability_percentage": 40 if disability_cat and disability_cat.lower() != "none" else 0,
                "disability_sub_category": disability_sub_cat or ""
            },
            "education_details": {
                "degrees": [
                    {
                        "degree_name": qualification or "Degree",
                        "specialization": "General",
                        "college_name": college or "Other",
                        "year_of_passing": int(passing_year) if str(passing_year).isdigit() else 2020,
                        "percentage": 0.0
                    }
                ]
            },
            "other": {
                "disability_sub_category": disability_sub_cat,
                "company_placed": company,
                "date_of_joining": joining_date,
                "designation": designation,
                "ctc": ctc,
                "status_of_beneficiary": status_beneficiary,
                "donor": donor,
                "batch_year": batch_year,
                "registration_type": "Excel"
            }
        }

        def make_request(method, url, **kwargs):
            """Helper to handle rate limits and retries"""
            max_retries = 5
            for attempt in range(max_retries):
                try:
                    resp = requests.request(method, url, timeout=30, **kwargs)
                    if resp.status_code == 429:
                        wait_time = (attempt + 1) * 10
                        print(f"  [WAIT] Rate limit hit. Waiting {wait_time}s...")
                        import time
                        time.sleep(wait_time)
                        continue
                    return resp
                except Exception as e:
                    print(f"  [ERROR] Request failed: {e}")
                    import time
                    time.sleep(2)
            return None

        # 1. Register Candidate
        resp = make_request("POST", f"{BASE_URL}/candidates/", json=candidate_payload)
        if not resp or resp.status_code != 201:
            print(f"  [ERROR] Candidate creation failed: {resp.status_code if resp else 'N/A'} - {resp.text if resp else ''}")
            fail_count += 1
            continue
        
        candidate_data = resp.json()
        public_id = candidate_data.get("public_id")
        print(f"  [SUCCESS] Candidate created. Public ID: {public_id}")

        # 2. Create Screening Record
        screening_payload = {
            "status": "Completed",
            "others": {
                "comments": f"Imported from Excel. Status: {status_beneficiary}",
                "source_of_info": "WinVinaya Trained",
                "is_winvinaya_student": "Yes"
            }
        }
        resp_screen = make_request(
            "POST",
            f"{BASE_URL}/candidates/{public_id}/screening", 
            json=screening_payload, 
            headers=headers
        )
        if resp_screen and resp_screen.status_code == 201:
            print("  [SUCCESS] Screening record created.")
        else:
            print(f"  [WARNING] Screening failed: {resp_screen.status_code if resp_screen else 'N/A'}")

        # 3. Create Counseling Record with Skills
        skills_list = []
        if primary_skills:
            skills = [s.strip() for s in str(primary_skills).split(',') if s.strip()]
            skills_list = [{"name": s} for s in skills]

        counseling_payload = {
            "status": "selected",
            "skills_taught": skills_list,
            "others": {
                "comments": "Imported from Excel with skill history."
            }
        }
        resp_counsel = make_request(
            "POST",
            f"{BASE_URL}/candidates/{public_id}/counseling", 
            json=counseling_payload, 
            headers=headers
        )
        if resp_counsel and resp_counsel.status_code == 201:
            print("  [SUCCESS] Counseling record created with skills.")
            success_count += 1
        else:
            print(f"  [WARNING] Counseling failed: {resp_counsel.status_code if resp_counsel else 'N/A'}")

        # Small delay to avoid aggressive rate limit hits
        import time
        time.sleep(1)

    print("\nImport Finished!")
    print(f"Total Success: {success_count}")
    print(f"Total Failed: {fail_count}")

if __name__ == "__main__":
    token = get_token()
    import_candidates(token)
