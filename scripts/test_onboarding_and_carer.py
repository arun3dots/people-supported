import sys
import subprocess
import time
import urllib.parse
from playwright.sync_api import sync_playwright

def reset_carer_shift():
    cmd = 'pnpm --filter backend exec node -e "const { prisma } = require(\'@repo/db\'); prisma.staffShiftLog.deleteMany({ where: { shiftId: \'a400e79c-9765-4e44-9772-aaa0a3717dc8\' } }).then(r => console.log(\'Reset logs:\', r));"'
    subprocess.run(cmd, shell=True, capture_output=True)

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

def run():
    print("==================================================================")
    print("=== STARTING FULL END-TO-END RESIDENT ONBOARDING & CARER FLOW ===")
    print("==================================================================")
    reset_carer_shift()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # ---------------------------------------------------------
        # PHASE 1: ADMIN ONBOARDING JOURNEY
        # ---------------------------------------------------------
        print("\n--- PHASE 1: Admin Onboarding Journey ---")
        admin_context = browser.new_context(viewport={"width": 1280, "height": 900})
        admin_page = admin_context.new_page()

        # Step 1: Login as Admin
        print("1. Logging in as Admin (demo-admin@3dots.co)...")
        admin_page.goto("http://localhost:3000/login", wait_until="networkidle")
        admin_page.fill("#email", "demo-admin@3dots.co")
        admin_page.fill("#password", "Password123!")
        admin_page.click("button[type='submit']")
        admin_page.wait_for_url("**/dashboard**", timeout=15000)
        print("   Admin login successful!")

        # Step 2: Go to /resident/admit
        print("2. Navigating to /resident/admit...")
        admin_page.goto("http://localhost:3000/resident/admit", wait_until="networkidle")
        admin_page.wait_for_timeout(1000)

        # Step 1 (Part A): Personal Details
        print("3. Completing Step 1 (Part A: Personal Details)...")
        fill_text_field(admin_page, "First name", "Arthur")
        fill_text_field(admin_page, "Last name", "Pendelton")

        # Pick DOB
        dob_btn = admin_page.locator("button:has-text('Select date of birth')").first
        dob_btn.click()
        admin_page.wait_for_timeout(400)
        admin_page.select_option("select[aria-label='Select year']", "1945")
        admin_page.select_option("select[aria-label='Select month']", "5") # June
        admin_page.locator("[data-radix-popper-content-wrapper] button:text-is('12')").first.click()
        admin_page.wait_for_timeout(400)

        select_field(admin_page, "Gender", "Male")
        select_field(admin_page, "Type of stay", "Permanent")
        select_field(admin_page, "Admitted from", "Home")
        fill_text_field(admin_page, "Reason for admission", "Requires full care support and mobility monitoring.")

        # Save and continue
        print("   Clicking Save and continue on Step 1...")
        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_url("**/resident/admit?*id=**", timeout=15000)
        url = admin_page.url
        parsed = urllib.parse.urlparse(url)
        params = urllib.parse.parse_qs(parsed.query)
        resident_id = params.get("id", [None])[0]
        print(f"   Step 1 completed! Resident ID created: {resident_id}")

        # Step 2: Contacts (Part B)
        print("4. Completing Step 2 (Part B: Contacts)...")
        admin_page.wait_for_timeout(1000)
        if admin_page.locator("button:has-text('Add next of kin')").is_visible():
            admin_page.click("button:has-text('Add next of kin')")
            admin_page.wait_for_timeout(300)
        fill_text_field(admin_page, "Name", "Jane Pendelton")
        fill_text_field(admin_page, "Relationship", "Daughter")
        fill_text_field(admin_page, "Phone", "07700900123")
        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_url("**/resident/admit?*step=3**", timeout=10000)
        print("   Step 2 completed!")

        # Step 3: Medical / Health (Part C)
        print("5. Completing Step 3 (Part C: Medical / Health)...")
        admin_page.wait_for_timeout(1000)
        diag_label = admin_page.locator("label:text-is('Diagnoses')").first
        diag_label.locator("xpath=..").locator("input").fill("Moderate mobility impairment, Hypertension")
        
        no_allergy_lbl = admin_page.locator("label:has-text('No known allergies')").first
        no_allergy_lbl.click()
        admin_page.wait_for_timeout(300)

        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_url("**/resident/admit?*step=4**", timeout=10000)
        print("   Step 3 completed!")

        # Step 4: Risk assessment (Step D)
        print("6. Step 4 (Risk assessment)...")
        admin_page.wait_for_timeout(1000)
        # Record Fall risk so mandatory validation passes
        record_fall_btn = admin_page.locator("button:has-text('Record Fall')").first
        if record_fall_btn.is_visible():
            record_fall_btn.click()
            admin_page.wait_for_selector("[role='dialog']", timeout=5000)
            admin_page.wait_for_timeout(500)
            # Select risk cell (e.g. 6)
            admin_page.locator("[role='dialog'] button:text-is('6')").first.click()
            admin_page.wait_for_timeout(300)
            # Click Save assessment
            admin_page.click("[role='dialog'] button:has-text('Save assessment')")
            admin_page.wait_for_selector("[role='dialog']", state="hidden", timeout=5000)
            admin_page.wait_for_timeout(500)
        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_url("**/resident/admit?*step=5**", timeout=10000)
        print("   Step 4 completed -> Moved to Step 5!")

        # Step 5: Care needs assessment (Step E) & Care Plan creation
        print("7. Completing Step 5 (Care needs assessment & Care Plan Creation)...")
        admin_page.wait_for_timeout(2000)
        
        # Fill Mobility and falls finding
        mobility_finding = admin_page.locator("input[aria-label='Mobility and falls finding']")
        mobility_finding.fill("Uses Zimmer frame with 1 carer assistance")
        admin_page.wait_for_timeout(300)

        # Select Mobility support level (Assistance of one)
        admin_page.click("button[aria-label='Mobility and falls support level']")
        admin_page.wait_for_timeout(400)
        admin_page.locator("[role='option']").filter(has_text="Assistance of one").first.click()
        admin_page.wait_for_timeout(300)

        # Click "+ Add care plan" for Mobility
        print("   Opening Care Plan Modal for Mobility...")
        admin_page.click("tr:has-text('Mobility and falls') button:has-text('Add care plan')")
        admin_page.wait_for_selector("[role='dialog']", timeout=5000)
        admin_page.wait_for_timeout(500)

        # Inside CarePlanModal
        name_input = admin_page.locator("label:text-is('Care plan name')").first.locator("xpath=..").locator("input")
        name_input.fill("Mobility & Fall Prevention Plan")

        outcome_input = admin_page.locator("label:text-is('Outcome')").first.locator("xpath=..").locator("textarea")
        outcome_input.fill("Walks safely between room and lounge")

        # Add support step
        admin_page.click("button:has-text('Add step')")
        admin_page.wait_for_timeout(300)
        admin_page.locator("input[placeholder*='Offer steady arm']").first.fill("Offer Zimmer frame and assist to stand")

        # Add timed carer task
        admin_page.click("button:has-text('Add task')")
        admin_page.wait_for_timeout(300)
        admin_page.fill("input[placeholder*='Check heels and sacrum']", "Morning mobility check")
        admin_page.fill("input[type='time']", "08:30")
        
        # Click Add task inside subform
        admin_page.click("div.bg-white.rounded-xl.border button:has-text('Add task')")
        admin_page.wait_for_timeout(500)

        # Sign agreement inside modal so plan is Agreed
        signer_name = admin_page.locator("label:text-is('Name')").first.locator("xpath=..").locator("input")
        signer_name.fill("Arthur Pendelton")
        signer_role = admin_page.locator("label:text-is('Relationship or role')").first.locator("xpath=..").locator("input")
        signer_role.fill("Resident")

        # Click Save care plan
        print("   Saving Care Plan Modal...")
        admin_page.click("button:has-text('Save care plan')")
        admin_page.wait_for_selector("[role='dialog']", state="hidden", timeout=10000)
        admin_page.wait_for_timeout(1000)

        # Verify button became link
        plan_link = admin_page.locator("tr:has-text('Mobility and falls') button:has-text('Mobility & Fall Prevention Plan')")
        assert plan_link.is_visible(), "Care plan link not visible in NeedsTable!"
        print("   Verified: Care plan created and appears as link 'Mobility & Fall Prevention Plan'!")

        # Advance through remaining steps
        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_url("**/resident/admit?*step=6**", timeout=10000)
        print("   Step 5 completed -> Moved to Step 6!")

        # Step 6: Mental Capacity (Part E)
        print("8. Completing Step 6 (Part E: Mental Capacity)...")
        admin_page.wait_for_timeout(1000)
        select_field(admin_page, "Capacity for this decision", "Has capacity")
        fill_text_field(admin_page, "Summary", "Arthur understands the move and gives full consent.")
        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_url("**/resident/admit?*step=7**", timeout=10000)
        print("   Step 6 completed!")

        # Step 7: Part F
        print("9. Completing Step 7...")
        admin_page.wait_for_timeout(1000)
        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_url("**/resident/admit?*step=8**", timeout=10000)
        print("   Step 7 completed!")

        # Step 8: Part G
        print("10. Completing Step 8...")
        admin_page.wait_for_timeout(1000)
        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_url("**/resident/admit?*step=9**", timeout=10000)
        print("   Step 8 completed!")

        # Step 9: Room Allocation
        print("11. Completing Step 9 (Room & Bed Allocation)...")
        admin_page.wait_for_timeout(1500)
        # Select Wing
        wing_label = admin_page.locator("label").filter(has_text="Wing / Floor").first
        wing_select = wing_label.locator("xpath=..").locator("button[role='combobox']").first
        wing_select.click()
        admin_page.wait_for_timeout(400)
        admin_page.locator("[role='option']").first.click()
        admin_page.wait_for_timeout(500)

        # Select Room 103 (has free bed)
        room_label = admin_page.locator("label").filter(has_text="Room Number").first
        room_select = room_label.locator("xpath=..").locator("button[role='combobox']").first
        room_select.click()
        admin_page.wait_for_timeout(400)
        admin_page.locator("[role='option']").filter(has_text="Room 103").first.click()
        admin_page.wait_for_timeout(500)

        # Select Bed
        bed_label = admin_page.locator("label").filter(has_text="Bed Allocation").first
        bed_select = bed_label.locator("xpath=..").locator("button[role='combobox']").first
        bed_select.click()
        admin_page.wait_for_timeout(400)
        admin_page.locator("[role='option']").filter(has_text="Assigned").or_(admin_page.locator("[role='option']").filter(has_text="Available")).first.click()
        admin_page.wait_for_timeout(500)

        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_url("**/resident/admit?*step=10**", timeout=10000)
        print("   Step 9 completed -> Moved to Step 10 (Review)!")

        # Step 10: Review & Admission
        print("12. Verifying Step 10 (Review, Manager Decision & Admission)...")
        admin_page.wait_for_timeout(2000)

        # Verify ReviewCareTasksCard shows the plan and task
        assert admin_page.locator("text='Mobility & Fall Prevention Plan'").first.is_visible(), "ReviewCareTasksCard does not show the care plan!"
        assert admin_page.locator("text='Morning mobility check'").first.is_visible(), "ReviewCareTasksCard does not show the morning task!"
        print("   Verified: ReviewCareTasksCard displays plan and 'Morning mobility check' task!")

        # Submit for manager decision
        print("   Submitting for manager decision...")
        admin_page.click("button:has-text('Submit for manager decision')")
        admin_page.wait_for_timeout(1500)

        # Record manager decision
        print("   Recording manager decision 'Accepted'...")
        fill_text_field(admin_page, "Rationale", "Resident needs can be safely and comfortably met by our team.")
        admin_page.click("button:has-text('Record decision')")
        admin_page.wait_for_timeout(2000)

        # Click Admit resident
        print("   Clicking 'Admit resident'...")
        admin_page.click("button:has-text('Admit resident')")
        admin_page.wait_for_timeout(3000)

        # Verify success screen
        assert admin_page.locator("text=Admission Confirmed").or_(admin_page.locator("text=Resident Active")).first.is_visible(), "Admission success confirmation not seen!"
        print(f"   SUCCESS: Resident Arthur Pendelton ({resident_id}) successfully admitted!")
        admin_context.close()

        # ---------------------------------------------------------
        # PHASE 2: CARER JOURNEY & SHIFT GATING
        # ---------------------------------------------------------
        print("\n--- PHASE 2: Carer Journey & Shift Gating ---")
        carer_context = browser.new_context(viewport={"width": 1280, "height": 900})
        carer_page = carer_context.new_page()

        # Step 1: Login as Carer
        print("1. Logging in as Carer (demo-carer@3dots.co)...")
        carer_page.goto("http://localhost:3000/login", wait_until="networkidle")
        carer_page.fill("#email", "demo-carer@3dots.co")
        carer_page.fill("#password", "Password123!")
        carer_page.click("button[type='submit']")
        carer_page.wait_for_url("**/dashboard**", timeout=15000)
        print("   Carer login successful!")

        # Step 2: Test Shift Gate on /carer/residents
        print("2. Verifying Shift Gate on /carer/residents (Shift not started yet)...")
        carer_page.goto("http://localhost:3000/carer/residents", wait_until="networkidle")
        carer_page.wait_for_timeout(1000)
        
        gate_visible = carer_page.locator("text='Shift Required for Resident Directory'").or_(carer_page.locator("text='Shift Not Started'")).first.is_visible()
        table_visible = carer_page.locator("table").is_visible()
        print(f"   Gate visible: {gate_visible}, Table visible: {table_visible}")
        assert gate_visible, "Shift gate not shown on /carer/residents!"
        assert not table_visible, "Resident directory should not be visible before shift start!"
        print("   Verified: Resident directory is gated before shift start!")

        # Step 3: Test Shift Gate on /carer/tasks and Clock In
        print("3. Testing Shift Gate on /carer/tasks and starting shift...")
        carer_page.goto("http://localhost:3000/carer/tasks", wait_until="networkidle")
        carer_page.wait_for_timeout(1000)

        clock_in_btn = carer_page.locator("button:has-text('Start Shift / Clock In')").first
        assert clock_in_btn.is_visible(), "Clock in button not visible on /carer/tasks!"
        print("   Clicking 'Start Shift / Clock In'...")
        clock_in_btn.click()
        
        carer_page.wait_for_selector("text='Shift Started'", timeout=10000)
        carer_page.wait_for_timeout(1500)
        print("   Verified: Shift successfully started / clocked in!")

        # Step 4: Verify /carer/residents is now UNLOCKED
        print("4. Verifying /carer/residents is unlocked after clocking in...")
        carer_page.goto("http://localhost:3000/carer/residents", wait_until="networkidle")
        carer_page.wait_for_timeout(2000)
        gate_now = carer_page.locator("text='Shift Required for Resident Directory'").is_visible()
        print(f"   Gate still visible: {gate_now}")
        assert not gate_now, "Shift gate still showing after clocking in!"
        print("   Verified: Resident directory unlocked!")

        # Step 5: Navigate to resident care journey tasks
        print(f"5. Navigating to care journey tasks for resident {resident_id}...")
        carer_page.goto(f"http://localhost:3000/carer/resident/care-journey?id={resident_id}&view=tasks", wait_until="networkidle")
        carer_page.wait_for_timeout(2000)

        # Switch to Day tab if evening/night
        day_tab = carer_page.locator("button[role='tab']").filter(has_text="Day").first
        if day_tab.is_visible():
            day_tab.click()
            carer_page.wait_for_timeout(1000)

        # Verify task "Morning mobility check" is present
        print("6. Verifying 'Morning mobility check' task appears in Day shift...")
        task_row = carer_page.locator("li:has-text('Morning mobility check')").first
        assert task_row.is_visible(), "Morning mobility check task not visible in care journey tasks!"
        assert task_row.locator("text='08:30'").is_visible(), "Task time 08:30 not visible!"
        print("   Verified: 'Morning mobility check' task is displayed at 08:30!")

        # Step 6: Record Task
        print("7. Recording task execution...")
        record_btn = task_row.locator("button:has-text('Record')")
        record_btn.click()
        carer_page.wait_for_timeout(500)

        save_rec_btn = task_row.locator("button:has-text('Save record')")
        save_rec_btn.click()
        carer_page.wait_for_timeout(2000)

        # Verify Done badge appears
        done_pill = task_row.locator("text=Done").first
        assert done_pill.is_visible(), "'Done' pill not found after recording task!"
        print(f"   Verified: Task status updated to '{done_pill.inner_text()}'!")

        # Verify progress bar
        progress_text = carer_page.locator("text=/\\d+ of \\d+ recorded/").first
        assert progress_text.is_visible(), "Progress not visible!"
        print(f"   Verified: Progress updated to '{progress_text.inner_text()}'!")

        carer_context.close()
        browser.close()

    print("\n=======================================================")
    print("=== ALL END-TO-END TESTS COMPLETED WITH 100% SUCCESS ===")
    print("=======================================================")

if __name__ == "__main__":
    run()
