# 🖥️ Retro BBS

An authentic 1993-style Bulletin Board System (BBS) experience, accessible through modern web browsers or as a native desktop application.

![Retro BBS](https://img.shields.io/badge/Era-1993-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎨 Authentic Experience
- **Modem Connection Simulation** - Dial-up sounds and connection sequence
- **ANSI Art Support** - Full 16-color ANSI rendering with CP437 character set
- **Terminal Emulation** - 80x25 character display with DOS VGA font
- **Retro UI** - Single-keystroke commands, just like the old days

### 💬 Message Boards
- Multiple topic-based boards
- Threaded conversations
- Classic line-by-line editor
- Message threading and replies

### 📁 File Libraries
Organized categories matching the 1993 era:
- **Shareware & Demos** - SimCity, Doom, Wolfenstein 3D
- **ANSI Art & Graphics** - Art packs and ASCII collections
- **Music & Sound** - MOD files, tracker music, and players
- **Utilities** - File managers, PKZIP, screen savers
- **Drivers** - Mouse, printer, and SVGA drivers
- **Text Files** - The Anarchist Cookbook, hacker dictionary, PBX theory
- **Jokes & Entertainment** - Song lyrics (1980s-1992), jokes
- **Fractal & Graphics Apps** - Fractint, POV-Ray, math graphing tools

### 📨 Private Messaging
- Internal board-only messaging system
- Inbox/outbox management
- New message notifications

### 👤 User System
- **Handles** - Classic BBS usernames (no email required)
- **Upload/Download Ratios** - Maintain your ratio (e.g., 1:5)
- **User Statistics** - Track calls, posts, and transfers
- **Time Limits** - Daily session time limits

### 🛡️ Board Rules
- NO HACKING - No illegal intrusion discussion
- NO WAREZ - No pirated software
- NO NUKING - No harassment of other users
- Respectful community guidelines

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm (for development)
- Modern web browser (works entirely in browser - no server needed!)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd my-bbs

# Install dependencies
pnpm install

# Copy environment variables template (optional, for server mode)
cp .env.example .env

# Run in development mode (web)
pnpm dev

# Run as Electron app
pnpm electron:dev

# Build standalone browser-only version
pnpm build:standalone
```

### Browser-Only Mode

The BBS can run **entirely in your browser** without any server! 

- **Automatic Detection**: The app automatically detects if a server is available and falls back to browser-only mode
- **No Server Required**: Works offline, can be deployed as a static site
- **Local Storage**: Uses IndexedDB to persist your BBS data in the browser
- **Full Features**: All BBS features work in browser mode (registration, login, message boards, file areas, etc.)

**Deploy as Static Site:**
```bash
# Build for production
pnpm build:standalone

# Deploy the 'dist' folder to:
# - GitHub Pages
# - Netlify
# - Vercel
# - Any static hosting service
```

The browser-only version uses SQL.js (SQLite compiled to WebAssembly) for database storage, providing the same functionality as the server version but running entirely client-side.

### Environment Configuration

The server uses environment variables for configuration. Copy `.env.example` to `.env` and customize as needed:

```bash
# HTTP Server Configuration
PORT=3000                    # HTTP server port
NODE_ENV=development         # Environment mode (development/production)

# Telnet Server Configuration
TELNET_PORT=2323             # Telnet server port
ENABLE_TELNET=true           # Enable/disable telnet server

# Database Configuration
DB_PATH=server/data/bbs.db   # Path to SQLite database file

# Session Configuration
SESSION_SECRET=your-secret   # Secret key for session encryption (change in production!)

# CORS Configuration
CORS_ORIGIN=http://localhost:5173  # Allowed origin for CORS (web frontend)
```

**Production Notes:**
- Set `NODE_ENV=production` for production
- Use a strong, random `SESSION_SECRET` in production
- Update `CORS_ORIGIN` to your production domain
- Ensure `DB_PATH` points to a persistent location

### Development Commands

```bash
# Start client dev server only
pnpm dev:client

# Start backend server only
pnpm dev:server

# Run both client and server
pnpm dev

# Run as native Electron app
pnpm electron:dev

# Build for production
pnpm build:client

# Build Electron app
pnpm electron:build
```

## 🏗️ Architecture

```
my-bbs/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # Terminal, ModemConnect, etc.
│   │   ├── lib/          # ANSI parser, BBS engine, browser DB
│   │   │   ├── ansiParser.js
│   │   │   ├── bbsEngine.js      # Browser BBS engine
│   │   │   ├── browserDB.js      # SQL.js database wrapper
│   │   │   └── connectionManager.js  # Server/browser detection
│   │   └── styles/       # CSS files
│   └── index.html
├── server/          # Node.js/Express backend (optional)
│   ├── src/
│   │   ├── index.js      # Main server file
│   │   ├── telnetServer.js  # Telnet server
│   │   └── routes/       # API routes
│   └── data/             # SQLite database
├── electron/        # Electron main process
│   └── main.js
├── assets/          # ANSI art, sounds, files
│   ├── ansi-art/
│   ├── sounds/
│   └── files/
└── shared/          # Shared types/utilities
```

### Connection Modes

The BBS supports two connection modes:

1. **Server Mode** (Optional)
   - Backend API on port 3000
   - Telnet server on port 2323
   - SQLite database on server
   - Full multi-user support

2. **Browser-Only Mode** (Default Fallback)
   - No server required
   - SQL.js (SQLite in browser)
   - IndexedDB for persistence
   - Works offline
   - Can be deployed as static site

The app automatically detects server availability and falls back to browser mode if the server is unavailable.

## 🎮 Usage

### Web Browser
1. Run `pnpm dev` (or just open the built files)
2. Open http://localhost:5173
3. Watch the modem connection sequence
4. Press `[N]` for New User or `[L]` to Login
5. **No server needed!** The BBS runs entirely in your browser using SQL.js

### Desktop App (Electron)
1. Run `pnpm electron:dev`
2. The app will launch in a native window
3. Enjoy the full BBS experience

### Navigation
- **Single keystroke commands** - No need to press Enter for menu selections
- **Main Menu**:
  - `[M]` - Message Boards
  - `[F]` - File Areas
  - `[P]` - Private Mail
  - `[U]` - User List
  - `[Y]` - Your Statistics
  - `[L]` - Logoff

## 🎨 ANSI Art

The BBS supports full ANSI art rendering including:
- 16-color foreground/background
- Bold and blink attributes
- Cursor positioning
- IBM PC CP437 extended ASCII characters
- Box drawing characters

Place ANSI art files (`.ans` extension) in `assets/ansi-art/` to use them throughout the BBS.

## 📦 File Categories

Add files to the library by placing them in `assets/files/` and updating the database. The system tracks:
- Upload/download ratios
- File descriptions
- Download counts
- Uploader credits

## 🔧 Technology Stack

- **Frontend**: React 19 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Desktop**: Electron
- **Authentication**: bcrypt + express-session
- **Styling**: Pure CSS (retro terminal theme)

## 🎯 Roadmap

- [ ] Full authentication flow with password recovery
- [ ] More authentic modem sounds
- [ ] Complete message board implementation with threading
- [ ] File upload/download with actual file storage
- [ ] Private messaging system
- [ ] ANSI art animation support (.anim files)
- [ ] MS-DOS executable ANSI animations
- [ ] SysOp admin panel
- [ ] Multi-node support (multiple simultaneous users)
- [ ] QWK mail packet support
- [ ] FidoNet-style inter-BBS messaging

## 🤝 Contributing

Contributions welcome! This is a nostalgic project celebrating the BBS era. Feel free to add:
- More ANSI art
- Authentic file descriptions
- Additional file categories
- Historical accuracy improvements
- Bug fixes and enhancements

## 📜 License

MIT License - See LICENSE file for details

## 🙏 Credits

Inspired by the golden era of BBSs (1985-1995), including legendary systems like:
- Software Creations BBS
- Rusty n Edie's BBS
- Exec-PC
- Channel 1

Special thanks to all the SysOps who kept the BBS scene alive in the dial-up era!

## 🔧 Troubleshooting

### Telnet Connection Issues

**Can't connect via telnet:**
- Ensure telnet server is enabled: `ENABLE_TELNET=true` in `.env`
- Check if port is available: `lsof -i :2323` (or your `TELNET_PORT`)
- Verify firewall allows the telnet port
- Try connecting with: `telnet localhost 2323` or `nc localhost 2323`

**Connection timeout:**
- Default timeout is 5 minutes of inactivity
- Type any character to reset the timeout
- This is normal behavior to prevent idle connections

**Database errors in telnet:**
- Check database file exists at `DB_PATH`
- Ensure database file is readable/writable
- Run `node server/src/seedData.js` to initialize database if needed

### Server Issues

**Port already in use:**
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill

# Find process using telnet port
lsof -ti:2323 | xargs kill
```

**Database not found:**
- Database is created automatically on first run
- Or run: `node server/src/seedData.js` to create and seed database
- Check `DB_PATH` in `.env` points to correct location

**Session issues:**
- Clear browser cookies if sessions aren't working
- Ensure `SESSION_SECRET` is set (required for production)
- Check CORS settings if API calls fail from browser

### Development vs Production

**Development:**
- Uses default ports (3000 for HTTP, 2323 for telnet)
- CORS allows `http://localhost:5173`
- Session cookies not secure (HTTP only)

**Production:**
- Set `NODE_ENV=production`
- Use strong `SESSION_SECRET`
- Update `CORS_ORIGIN` to your domain
- Consider using HTTPS (requires reverse proxy like Nginx)
- Use process manager (PM2, systemd) for auto-restart

## 📞 Support

For issues, questions, or nostalgic stories about your BBS days, please open an issue on GitHub.

---

**NO CARRIER** 📞

*Made with ❤️ for the retro computing community*
