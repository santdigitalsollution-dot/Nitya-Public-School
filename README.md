# Nitya Public School – Smart ERP System
**Salori, Prayagraj | Developed by Sant Digital Solution**

---

## 🗂 Folder Structure

```
NPS-erp/
├── index.html          ← Login page (3 tabs: Teacher / Accountant / Principal)
├── teacher.html        ← Teacher dashboard
├── accountant.html     ← Accountant dashboard
├── principal.html      ← Principal dashboard (full access)
├── js/
│   ├── config.js       ← GAS URL, API Key, session, validation helpers
│   └── attendance.js   ← QR scanner, QR generator, manual, biometric
├── backend/
│   └── Code.gs         ← Google Apps Script (paste into script.google.com)
└── README.md
```

---

## ✅ Features

### 🔐 Login
- Role-based tabs: Teacher · Accountant · Principal
- Session token stored in `sessionStorage` (not localStorage)
- URL-switching protection (role verified on every page load)

### 👩‍🏫 Teacher Dashboard
| Feature | Details |
|---|---|
| Self Attendance | Teacher marks present on login |
| Manual Attendance | Checkbox toggle per student, saved to Google Sheets |
| QR Scan Attendance | Camera opens, scans student QR codes in real time via `jsQR` |
| Biometric Attendance | Web Serial API connects USB fingerprint reader |
| Work Log | Subject, topic, image upload, saved to Sheets |
| QR Card Generator | Generates printable QR card for any student |

### 💰 Accountant Dashboard
- **Admission**: Auto roll number, all fields, auto QR generated, print fee slip
- **Fee Collection**: Search by roll, auto-calculates pending from session start, print receipt
- **Salary Entry**: Search teacher, auto-fetch base salary & present days, calculate net
- **Teacher Registration**: Full details + Aadhaar image upload
- **Expenditure**: Categorized (Lunch / Electricity / Transport / Maintenance / Office / Other)

### 🏫 Principal Dashboard
- **Full CRUD** on Students and Teachers
- **Salary Approvals** by teacher name, based on attendance
- **Analytics**: Income vs Expenditure chart, fee by class, attendance trend (Chart.js)
- **Reports & Print**:
  - Student ID Card (visiting card size + QR)
  - Admit Card (half A4)
  - Report Card (A4)
  - Exam Time Table (half A4)
  - Student Year Status (attendance + fees)
  - Teacher Salary Slip (current month / full session)
  - Export to Excel (via Google Sheets export API)

---

## 🚀 Setup Guide

### Step 1 – Google Sheet
1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/**YOUR_ID**/edit`
3. The following tabs will be auto-created on first API call:
   `Students · Attendance · Fees · Teachers · Salary · Expenditure · WorkLog · Users`

### Step 2 – Google Apps Script
1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Paste the entire contents of `backend/Code.gs`
4. Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your actual Spreadsheet ID
5. Run `setupDefaultUsers()` **once** to create demo login accounts
6. Click **Deploy → New Deployment**:
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the **Web App URL**

### Step 3 – Frontend Config
Open `js/config.js` and update:
```javascript
const CONFIG = {
  GAS_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", // ← Paste here
  API_KEY: "NPS_SECRET_2025",  // Must match Code.gs API_KEY
  ...
};
```

### Step 4 – GitHub Pages (Free Hosting)
```bash
git init
git add .
git commit -m "Initial ERP deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/NPS-erp.git
git push -u origin main
```
Then in GitHub → Settings → Pages → Source: `main` branch → `/root`

Your ERP will be live at:
`https://YOUR_USERNAME.github.io/NPS-erp/`

---

## 📱 QR Attendance Flow

```
Student Admission
      ↓
Auto QR Generated (payload: HEA|ROLL|NAME|CLASS)
      ↓
Print ID Card (visiting card size)
      ↓
Teacher opens Teacher Dashboard → QR Scan tab
      ↓
Camera reads QR → Roll parsed → Marked Present
      ↓
"Save All QR Scans" → sent to Google Sheets Attendance tab
```

### QR Payload Format
```
HEA|2024001|Rahul%20Sharma|Class%205
```
- Prefix `HEA|` ensures only school QR codes are accepted
- URL-encoded name to handle spaces/special chars

---

## 🖐 Biometric Setup

The biometric module uses the **Web Serial API** (Chrome/Edge desktop only).

Your fingerprint device must send data in this format over serial port (9600 baud):
```
ROLL:2024001\n
```

Compatible devices: Any fingerprint scanner that supports serial/USB output
(e.g., ZK series, Digital Persona, Mantra MFS100 with custom firmware)

For mobile biometrics: Use the phone camera QR scan mode instead.

---

## 🔒 Security

| Concern | Solution |
|---|---|
| No hardcoded URLs | `config.js` is the single source of truth |
| Role protection | `Session.requireRole()` on every dashboard page |
| API Key | Shared secret between frontend and GAS |
| Aadhaar masking | Non-principal roles see `XXXXXXXX1234` |
| Input validation | `Validate.mobile()`, `Validate.aadhaar()`, `Validate.feeAmount()` |
| CRUD authorization | GAS checks API Key on every write operation |

---

## 🖨 Print Instructions

All print buttons call `window.print()`. To get the best results:
- Chrome: Uncheck "Headers and footers", set margins to "None" for cards
- For A4 reports: Keep default margin settings
- ID Cards are sized to `85mm × 54mm` (standard visiting card)

---

## 📊 Google Sheet Column Reference

### Students
`roll | name | father | cls | aadhaar | mobile | age | religion | caste | admDate | admFee | depFee | monthly | transport | session | paidTotal`

### Attendance
`date | roll | name | cls | status(P/A) | type(student/teacher) | mode(manual/qr/biometric) | markedBy`

### Fees
`date | roll | name | cls | month | months | deposited | transport | collectedBy`

### Teachers
`name | mobile | aadhaar | joinDate | salary | religion | caste | address | assignedClass | password`

### Salary
`month | teacherMobile | name | baseSalary | presentDays | advance | deductions | paid | status | savedBy`

### Expenditure
`date | category | amount | desc | addedBy`

### Users
`mobile | password | role | name`

---

## 🆘 Troubleshooting

| Problem | Fix |
|---|---|
| "API not connected" | Check GAS_URL in config.js, redeploy GAS |
| Login fails | Run `setupDefaultUsers()` in Apps Script editor |
| Camera doesn't open | Use HTTPS (GitHub Pages) or localhost, allow camera permission |
| Biometric not connecting | Must use Chrome/Edge on desktop, not mobile browser |
| QR not scanning | Ensure good lighting, QR code not too small |

---

*Developed and Powered by Sant Digital Solution*
