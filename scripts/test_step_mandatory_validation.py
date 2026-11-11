import sys
import subprocess
import time
import json
import urllib.request
import urllib.parse
import http.cookiejar
from playwright.sync_api import sync_playwright

def test_backend_validation():
    print("\n--- 1. Testing Backend Zod Mandatory Validation ---")
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def make_req(method, url, body=None):
        data = json.dumps(body).encode('utf-8') if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header('Content-Type', 'application/json')
        try:
            resp = opener.open(req)
            return resp.status, json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            content = e.read().decode('utf-8')
            try:
                err_json = json.loads(content)
            except Exception:
                err_json = {"raw": content}
            return e.code, err_json

    # 1. Login
    status, login_res = make_req("POST", "http://localhost:4400/api/auth/login", {
        "email": "demo-admin@3dots.co",
        "password": "Password123!"
    })
    assert status in (200, 201), f"Login failed: {status} {login_res}"
    token = login_res.get("accessToken")
    opener.addheaders = [("Authorization", f"Bearer {token}")]
    print("  [OK] Authenticated as Admin on port 4400")

    # A. POST /api/residents/pre-admission with empty partA
    print("  Testing POST /api/residents/pre-admission with missing fields...")
    status, res = make_req("POST", "http://localhost:4400/api/residents/pre-admission", {
        "partA": {}
    })
    print("  Response status:", status)
    assert status == 400, f"Expected 400, got {status}: {res}"
    print("  400 Error Message:", res.get("message"))
    assert "First name is required" in str(res) or "Validation failed" in str(res)
    print("  [OK] Backend blocked invalid pre-admission creation with Zod validation!")

    # Now create valid pre-admission to get residentId
    status, valid_create = make_req("POST", "http://localhost:4400/api/residents/pre-admission", {
        "partA": {
            "firstName": "Validation",
            "lastName": "Tester",
            "dob": "1950-01-01",
            "gender": "Male",
            "maritalStatus": "Single",
            "nhsNumber": "9991234567",
            "previousAddress": "1 Test Street",
            "language": "English",
            "stayType": "Permanent",
            "typeOfCare": "Residential Care",
            "careLevel": "Medium",
            "admittedFrom": "Home",
            "admissionReason": "Testing mandatory validation"
        }
    })
    assert status in (200, 201), f"Valid creation failed: {status} {valid_create}"
    resident_id = valid_create["residentId"]
    print(f"  Created test resident {resident_id}")

    # B. PATCH partA with missing required fields
    print("  Testing PATCH partA with empty fields...")
    status, res_partA = make_req("PATCH", f"http://localhost:4400/api/residents/{resident_id}/pre-admission/parts/partA", {
        "firstName": ""
    })
    assert status == 400, f"Expected 400, got {status}: {res_partA}"
    print("  [OK] Backend rejected invalid partA update:", res_partA.get("message"))

    # C. PATCH partB with empty nextOfKin
    print("  Testing PATCH partB with empty nextOfKin...")
    status, res_partB = make_req("PATCH", f"http://localhost:4400/api/residents/{resident_id}/pre-admission/parts/partB", {
        "nextOfKin": []
    })
    assert status == 400, f"Expected 400, got {status}: {res_partB}"
    print("  [OK] Backend rejected invalid partB update:", res_partB.get("message"))

    # D. PATCH partC with empty diagnoses
    print("  Testing PATCH partC with empty diagnoses...")
    status, res_partC = make_req("PATCH", f"http://localhost:4400/api/residents/{resident_id}/pre-admission/parts/partC", {
        "diagnoses": [],
        "allergies": [],
        "noKnownAllergies": False
    })
    assert status == 400, f"Expected 400, got {status}: {res_partC}"
    print("  [OK] Backend rejected invalid partC update:", res_partC.get("message"))

    print("--- Backend validation tests passed completely! ---\n")
    return resident_id

def select_field(page, label_text, option_text):
    label = page.locator(f"label:text-is('{label_text}')").first
    wrapper = label.locator("xpath=..")
    trigger = wrapper.locator("button[role='combobox']").first
    trigger.click()
    page.wait_for_timeout(300)
    page.locator(f"[role='option']:has-text('{option_text}')").first.click()
    page.wait_for_timeout(300)

def fill_text_field(page, label_text, text):
    label = page.locator(f"label:text-is('{label_text}')").first
    wrapper = label.locator("xpath=..")
    inp = wrapper.locator("input, textarea").first
    inp.fill(text)

def test_frontend_validation():
    print("\n--- 2. Testing Frontend Zod Step Mandatory Validation via Playwright ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()

        # Login
        print("  Logging in...")
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.fill("#email", "demo-admin@3dots.co")
        page.fill("#password", "Password123!")
        page.click("button[type='submit']")
        page.wait_for_url("**/dashboard**", timeout=15000)

        # 1. Step 1 (Empty form)
        print("  Navigating to /resident/admit...")
        page.goto("http://localhost:3000/resident/admit", wait_until="networkidle")
        page.wait_for_timeout(1000)

        print("  Clicking 'Save and continue' on empty Step 1...")
        save_btn = page.locator("button:has-text('Save and continue')").first
        save_btn.click()
        page.wait_for_timeout(1000)

        # Check inline error messages
        err_msg = page.locator("text='First name is required'").first
        assert err_msg.is_visible(), "Expected 'First name is required' to be visible"
        print("  [OK] Step 1 'First name is required' error visible")

        err_dob = page.locator("text='Date of birth is required'").first
        assert err_dob.is_visible(), "Expected 'Date of birth is required' to be visible"
        print("  [OK] Step 1 'Date of birth is required' error visible")

        err_stay = page.locator("text='Type of stay is required'").first
        assert err_stay.is_visible(), "Expected 'Type of stay is required' to be visible"
        print("  [OK] Step 1 'Type of stay is required' error visible")

        page.screenshot(path="C:/Users/Admin/.gemini/antigravity/brain/1b066d6b-9794-4aa1-a02e-8a00cf82087f/step1_validation_errors.png")
        print("  Saved step1_validation_errors.png")

        # Now fill in mandatory Step 1 fields
        print("  Filling mandatory Step 1 fields...")
        fill_text_field(page, "First name", "Arthur")
        fill_text_field(page, "Last name", "Pendelton")
        
        dob_label = page.locator("label:text-is('Date of birth')").first
        dob_input = dob_label.locator("xpath=..").locator("input").first
        dob_input.fill("1944-03-15")
        dob_input.dispatch_event("input")
        dob_input.dispatch_event("change")
        
        select_field(page, "Gender", "Male")
        select_field(page, "Type of stay", "Permanent")
        select_field(page, "Admitted from", "Home")
        fill_text_field(page, "Reason for admission", "Requires full care support and mobility monitoring.")

        # Save and continue to Step 2
        save_btn.click()
        page.wait_for_url("**/resident/admit?**step=2**", timeout=10000)
        print("  [OK] Advanced to Step 2 successfully!")
        page.wait_for_timeout(1000)

        # 2. Step 2 (Empty Contacts / Next of Kin)
        print("  Clicking 'Save and continue' on empty Step 2...")
        save_btn = page.locator("button:has-text('Save and continue')").first
        save_btn.click()
        page.wait_for_timeout(1000)

        err_nok = page.locator("text='At least one next of kin is required'").first
        assert err_nok.is_visible(), "Expected 'At least one next of kin is required' to be visible"
        print("  [OK] Step 2 'At least one next of kin is required' error visible")

        page.screenshot(path="C:/Users/Admin/.gemini/antigravity/brain/1b066d6b-9794-4aa1-a02e-8a00cf82087f/step2_validation_errors.png")
        print("  Saved step2_validation_errors.png")

        # Add Next of Kin
        print("  Adding Next of Kin...")
        add_nok_btn = page.locator("button:has-text('Add next of kin')").first
        add_nok_btn.click()
        page.wait_for_timeout(500)
        fill_text_field(page, "Full name", "Jane Pendelton")
        fill_text_field(page, "Relationship", "Daughter")
        fill_text_field(page, "Phone", "07700900123")

        # Save and continue to Step 3
        save_btn.click()
        page.wait_for_url("**/resident/admit?**step=3**", timeout=10000)
        print("  [OK] Advanced to Step 3 successfully!")
        page.wait_for_timeout(1000)

        # 3. Step 3 (Empty Health / Medicines)
        print("  Clicking 'Save and continue' on empty Step 3...")
        save_btn = page.locator("button:has-text('Save and continue')").first
        save_btn.click()
        page.wait_for_timeout(1000)

        err_diag = page.locator("text='At least one diagnosis is required'").first
        assert err_diag.is_visible(), "Expected 'At least one diagnosis is required' to be visible"
        print("  [OK] Step 3 'At least one diagnosis is required' error visible")

        page.screenshot(path="C:/Users/Admin/.gemini/antigravity/brain/1b066d6b-9794-4aa1-a02e-8a00cf82087f/step3_validation_errors.png")
        print("  Saved step3_validation_errors.png")

        # Fill diagnoses & allergies
        print("  Adding Diagnosis and confirming No known allergies...")
        add_diag_btn = page.locator("button:has-text('Add diagnosis')").first
        add_diag_btn.click()
        page.wait_for_timeout(300)
        page.locator("input[placeholder='e.g. Type 2 diabetes']").first.fill("Moderate mobility impairment, Hypertension")

        no_allergies_checkbox = page.locator("label:has-text('No known allergies') input[type='checkbox']").first
        no_allergies_checkbox.check()

        # Save and continue to Step 4
        save_btn.click()
        page.wait_for_url("**/resident/admit?**step=4**", timeout=10000)
        print("  [OK] Advanced to Step 4 (Risk assessment) successfully!")
        page.wait_for_timeout(1000)

        # 4. Step 4 (Risk assessment step with 0 assessments)
        print("  Testing Step 4 with 0 recorded risk assessments...")
        save_btn = page.locator("button:has-text('Save and continue')").first
        save_btn.click()
        page.wait_for_timeout(1000)

        # Verify toast or validation stops it
        step_url = page.url
        assert "step=4" in step_url, f"Expected to remain on step 4, got {step_url}"
        print("  [OK] Step 4 validation prevented continuing without a risk assessment!")
        page.screenshot(path="C:/Users/Admin/.gemini/antigravity/brain/1b066d6b-9794-4aa1-a02e-8a00cf82087f/step4_validation_errors.png")
        print("  Saved step4_validation_errors.png")

        browser.close()
        print("--- Frontend validation tests passed completely! ---")

if __name__ == "__main__":
    test_backend_validation()
    test_frontend_validation()
    print("\nALL MANDATORY VALIDATION TESTS PASSED (WEB & BACKEND)!\n")