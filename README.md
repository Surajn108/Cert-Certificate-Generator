# CertGen — Certificate Generator System

A fully functional, single-page Certificate Generator with Admin Panel and QR-based verification.

## Features

- **Issue certificates** with Name, Role, Event/Internship, Date, Organisation
- **Unique Certificate ID** (e.g. `CERT-X7K2MN9P`) auto-generated per certificate
- **QR Code** embedded in every certificate (links to verify page)
- **Download as PDF** or **PNG** (client-side, no server needed)
- **Live preview** updates as you type
- **Admin Panel** — view all issued certificates, search, revoke, restore, delete, export CSV
- **Verify Page** — enter any Certificate ID to check authenticity and status
- **localStorage** data persistence (no backend required)

## Project Structure

```
cert-generator/
├── index.html    ← Main HTML (all three views: Issue, Admin, Verify)
├── style.css     ← All styles
├── app.js        ← All logic (ID gen, PDF/PNG export, admin, verify)
└── README.md
```

## How to Run

Just open `index.html` in any modern browser. No build step, no server, no npm install.

```bash
# Option 1: Open directly
open index.html

# Option 2: Quick local server (if needed for QR links)
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How to Use

### Issue a Certificate
1. Fill in Recipient Name, Role, Event, Date
2. Click **Generate & Save** — saves to local storage
3. Click **Download PDF** or **Download PNG** to export

### Admin Panel
- Search certificates by name, ID, or event
- Revoke / Restore / Delete any certificate
- Export all records as CSV

### Verify a Certificate
- Enter the Certificate ID (printed on every certificate)
- Or scan the QR code on the certificate (opens verify page automatically)

## Tech Stack

| Purpose | Library |
|---|---|
| PDF export | jsPDF 2.5.1 |
| Certificate screenshot | html2canvas 1.4.1 |
| QR code generation | qrcodejs 1.0.0 |
| Data storage | localStorage (browser) |
| Fonts | Google Fonts (Playfair Display, DM Sans, DM Mono) |

All libraries are loaded from Cloudflare CDN — no installation required.

## Data Schema

Each certificate record stored in localStorage:

```json
{
  "id": "CERT-X7K2MN9P",
  "name": "Suraj Navale",
  "role": "Frontend Developer Intern",
  "event": "Summer Dev Bootcamp 2026",
  "org": "TechCorp Academy",
  "date": "2026-05-15",
  "issuedAt": "2026-05-16T10:30:00.000Z",
  "status": "active"
}
```

## Notes

- All data is stored in the browser's localStorage — clearing browser data will clear records
- For production, replace localStorage with a backend API (Node.js + Supabase recommended)
- Internet connection required for CDN fonts and libraries on first load
