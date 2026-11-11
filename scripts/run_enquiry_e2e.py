import json
import os
import re
import subprocess
import sys
import urllib.request
import http.cookiejar

BASE = "http://localhost:4400/api"
SRC = os.path.join(os.path.dirname(__file__), "test_onboarding_and_carer.py")
DST = os.path.join(os.path.dirname(__file__), "_tmp_enquiry_flow.py")

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        r = opener.open(req)
        return r.status, json.loads(r.read().decode() or "null")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


s, login = call("POST", "/auth/login", {"email": "demo-admin@3dots.co", "password": "Password123!"})
assert s in (200, 201), login
opener.addheaders = [("Authorization", "Bearer " + login["accessToken"])]

# Minimal, realistic enquiry (only the fields the enquiry form requires)
s, enq = call("POST", "/enquiries", {
    "enquirerName": "Margaret Hale",
    "enquirerRelationship": "Daughter",
    "enquirerPhone": "07700900123",
    "firstName": "Arthur",
    "lastName": "Pendelton",
    "currentLocation": "Home",
    "careCategory": "Residential",
})
print("create enquiry:", s)
assert s in (200, 201), enq
enq_id = enq["id"]
print("enquiry id:", enq_id)

with open(SRC, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    'admin_page.goto("http://localhost:3000/resident/admit", wait_until="networkidle")',
    'admin_page.goto("http://localhost:3000/admin/residents/admit?enquiryId=%s", wait_until="networkidle")' % enq_id,
    1,
)
c = c.replace("**/resident/admit?", "**/admit?")
c = c.replace(
    "if admin_page.locator(\"button:has-text('Add next of kin')\").is_visible():",
    "if admin_page.locator(\"button:has-text('Add next of kin')\").is_visible() and admin_page.locator(\"text=No next of kin added yet\").count() > 0:",
    1,
)

extra_fill = """
        select_field(admin_page, "Marital status", "Widowed")
        fill_text_field(admin_page, "NHS number", "9434765919")
        fill_text_field(admin_page, "Preferred language", "English")
        fill_text_field(admin_page, "Previous address", "12 Rose Lane, Leeds")
        select_field(admin_page, "Level of care", "High")
"""
reason_line = 'fill_text_field(admin_page, "Reason for admission", "Requires full care support and mobility monitoring.")\n'
probe = '''
        admin_page.wait_for_timeout(1500)
        def _val(lbl):
            return admin_page.locator("label:has-text('%s')" % lbl).first.locator("xpath=..").locator("input, textarea").first.input_value()
        print("   PREFILL first name:", repr(_val("First name")), "| last name:", repr(_val("Last name")))
        admin_page.click("button:has-text('Save and continue')")
        admin_page.wait_for_timeout(1000)
        for msg in ["Date of birth is required", "Gender is required", "Marital status is required", "NHS number is required", "Previous address is required", "Preferred language is required", "Type of stay is required", "Type of care is required", "Level of care is required", "Admitted from is required", "Reason for admission is required"]:
            print("   blank-save error shown [%s]:" % msg, admin_page.locator("text='%s'" % msg).count() > 0)
'''
marker = '        # Step 1 (Part A): Personal Details\n'
assert marker in c
c = c.replace(marker, probe + marker, 1)

anchor_line = '        fill_text_field(admin_page, "Reason for admission", "Requires full care support and mobility monitoring.")\n'
assert anchor_line in c, "reason line not found"
c = c.replace(anchor_line, anchor_line + extra_fill, 1)

with open(DST, "w", encoding="utf-8") as f:
    f.write(c)

res = subprocess.run([sys.executable, DST], capture_output=True, text=True, encoding="utf-8", errors="replace")
print(res.stdout[-6000:])
print(res.stderr[-2500:])

s, after = call("GET", "/enquiries/" + enq_id)
if s == 200:
    print("ENQUIRY AFTER:", {k: after.get(k) for k in ("status", "convertedResidentId", "admittedAt")})
else:
    print("enquiry fetch:", s, after)

os.remove(DST)
sys.exit(res.returncode)

