# SETUP GUIDE - Web Reveal Backend Scanner

## You're seeing "Failed to fetch" because Node.js is not installed yet!

### Step 1: Install Node.js

1. **Download Node.js:**
   - Go to: https://nodejs.org/
   - Download the LTS (Long Term Support) version for Windows
   - Run the installer and follow the installation wizard
   - Make sure to check "Add to PATH" during installation

2. **Verify Installation:**
   After installation, open a NEW PowerShell window and run:
   ```powershell
   node --version
   npm --version
   ```
   You should see version numbers if installed correctly.

### Step 2: Install Project Dependencies

Open PowerShell in this folder and run:
```powershell
npm install
```

This will install:
- express (web server)
- axios (HTTP client)
- cheerio (HTML parser)
- cors (cross-origin support)

### Step 3: Start the Backend Server

```powershell
npm start
```

You should see:
```
Web Reveal Scanner Server running on http://localhost:3000
Scans will be saved to: C:\Users\jared\Desktop\webreveal\scans
```

### Step 4: Use the Scanner

1. Open your web browser
2. Go to: `http://localhost:3000/index.html`
3. Enter a website URL (e.g., `https://github.com`)
4. Click "Scan"
5. Results will appear on the page AND be saved to the `scans/` folder!

---

## Quick Reference

### Start the server:
```powershell
npm start
```

### Stop the server:
Press `Ctrl + C` in the PowerShell window

### View saved scans:
Check the `scans/` folder for JSON files

### API Endpoints:
- POST `http://localhost:3000/api/scan` - Scan a website
- GET `http://localhost:3000/api/scans` - List all scans
- GET `http://localhost:3000/api/scans/:filename` - Get specific scan

---

## Troubleshooting

**"npm is not recognized"**
- You need to install Node.js first (see Step 1)
- After installing, restart PowerShell

**"Port 3000 already in use"**
- Another application is using port 3000
- Either close that application or change the port in `server.js` (line 6)

**"Cannot fetch website"**
- Some websites block automated requests
- Try a different website
- The server is working if you see the error message (it's the target website blocking)

**Server won't start**
- Make sure you ran `npm install` first
- Check for errors in the terminal
- Make sure no other server is running on port 3000

---

## Need Help?

1. Make sure Node.js is installed: `node --version`
2. Make sure dependencies are installed: Check for `node_modules/` folder
3. Make sure server is running: You should see "Server running" message
4. Make sure you're accessing: `http://localhost:3000/index.html`
