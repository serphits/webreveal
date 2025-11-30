# Web Reveal - Backend Scanner

This is a backend-powered website scanner that detects technologies used by websites and saves the results to a folder.

## Setup Instructions

### 1. Install Dependencies

Open PowerShell in this directory and run:

```powershell
npm install
```

### 2. Start the Backend Server

```powershell
npm start
```

The server will start on `http://localhost:3000`

### 3. Open the Scanner

Open `index.html` in your browser or navigate to:
```
http://localhost:3000/index.html
```

## How It Works

1. **Frontend (HTML)**: Users enter a website URL in the scanner
2. **Backend (Node.js/Express)**: Server fetches the website and analyzes it for technologies
3. **Storage**: Results are saved as JSON files in the `scans/` folder

## API Endpoints

### POST /api/scan
Scans a website and saves results
- **Request Body**: `{ "url": "https://example.com" }`
- **Response**: Technology detection results + filename

### GET /api/scans
Lists all saved scans
- **Response**: Array of scan metadata

### GET /api/scans/:filename
Retrieves a specific scan result
- **Response**: Full scan details

## Scans Folder

All scan results are saved in `scans/` as JSON files with the format:
```
scan_<sanitized-url>_<timestamp>.json
```

Each file contains:
- URL scanned
- Timestamp
- Technologies detected (grouped by category)
- Total count of technologies found

## Technologies Detected

The scanner can detect:
- **CMS**: WordPress, Shopify, Drupal, Joomla, etc.
- **Frontend Frameworks**: React, Vue, Angular, Next.js, etc.
- **CSS Frameworks**: Tailwind, Bootstrap, Bulma, etc.
- **JavaScript Libraries**: jQuery, D3.js, Chart.js, etc.
- **Analytics**: Google Analytics, Facebook Pixel, Mixpanel, etc.
- **Hosting**: AWS, Cloudflare, Vercel, Netlify, etc.
- And many more...

## Development Mode

For auto-restart during development:

```powershell
npm run dev
```

(Requires nodemon - already included in devDependencies)

## Troubleshooting

**Error: Cannot fetch website**
- Some websites block automated requests
- The backend uses a proper User-Agent but some sites may still block it
- CORS issues are avoided by fetching on the backend

**Port already in use**
- Change the PORT in server.js or set environment variable:
```powershell
$env:PORT=4000; npm start
```
