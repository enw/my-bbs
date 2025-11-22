# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Retro BBS is an authentic 1993-style Bulletin Board System experience built as a modern web application with optional Electron desktop app. It simulates the dial-up BBS era with ANSI art, message boards, file libraries, and nostalgic features like upload/download ratios.

**Current Status**: ✅ Fully functional! Frontend works perfectly with modem animation, ANSI rendering, and keyboard input. Backend API is operational with SQLite database.

## Architecture

### Tech Stack
- **Frontend**: React 19 + Vite
- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Desktop**: Electron 39
- **Package Manager**: pnpm (NOT npm or yarn)

### Project Structure
```
my-bbs/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Terminal, ModemConnect UI components
│   │   ├── lib/         # ansiParser.js - ANSI/CP437 rendering
│   │   └── styles/      # CSS files (retro terminal theme)
│   └── index.html
├── server/              # Express backend
│   ├── src/
│   │   ├── index.js     # Main server with SQLite setup
│   │   └── seedData.js  # Database seeding script
│   └── data/            # SQLite database (bbs.db)
├── electron/            # Electron main process
│   └── main.js
├── assets/              # Static assets
│   ├── ansi-art/        # .ans files for ANSI art
│   ├── sounds/          # Modem sounds (future)
│   └── files/           # File library storage
└── shared/              # Shared utilities (future)
```

## Quick Start (Current Working State)

The BBS is functional and ready to run! Both frontend and backend work.

```bash
# 1. Start frontend (required)
pnpm dev:client
# Opens on http://localhost:5173

# 2. Start backend (required for user accounts/database)
pnpm dev:server
# Runs on http://localhost:3000
```

**Then open http://localhost:5173 in your browser!**

### Alternative: Run both at once
```bash
pnpm dev
```

### Desktop App
```bash
pnpm electron:dev
```

### Database Management
```bash
# Seed database with sample data
node server/src/seedData.js

# Database location
server/data/bbs.db
```

### Building
```bash
# Build frontend for production
pnpm build:client

# Build Electron app
pnpm electron:build
```

### Important: Native Modules

**Current State**: `better-sqlite3` is built and working ✅. `bcrypt` is temporarily disabled (using plain text passwords for testing).

The project uses native Node.js modules that require compilation:
- **better-sqlite3** (SQLite database) - Required, currently working
- **bcrypt** (password hashing) - Temporarily disabled to avoid build issues

#### If You Encounter "Could not locate bindings" Errors:

**Option 1: Install Python setuptools** (if using Python 3.12+)
```bash
pip3 install --break-system-packages setuptools
cd node_modules/better-sqlite3
npm run build-release
```

**Option 2: Enable pnpm builds**
```bash
echo "enable-pre-post-scripts=true" >> .npmrc
pnpm install
```

**Option 3: Use older Python** (recommended for easier setup)
```bash
brew install python@3.11
# Set as default, then reinstall packages
```

#### Re-enabling bcrypt (Future Work)
To restore proper password hashing:
1. Build bcrypt: Find it in `node_modules/.pnpm/bcrypt@*/node_modules/bcrypt` and run `npm run install`
2. Uncomment bcrypt imports in `server/src/index.js` and `server/src/seedData.js`
3. Re-enable bcrypt.hash() and bcrypt.compare() calls
4. Delete database and reseed: `rm server/data/bbs.db && node server/src/seedData.js`

## Key Components

### Terminal Emulator (`client/src/components/Terminal.jsx`)
- Renders 80x25 character terminal
- Handles ANSI escape sequences via `ansiParser.js`
- Single-keystroke navigation (no Enter required for menus)
- Manages BBS screens (splash, main menu, message boards, file areas, etc.)
- **Keyboard input handling**: Uses hidden input field with auto-focus, click-to-focus, and blur prevention

### ANSI Parser (`client/src/lib/ansiParser.js`)
- Parses ANSI escape codes (colors, cursor positioning)
- Supports 16-color ANSI (foreground/background)
- Handles CP437 (DOS) extended ASCII characters
- Renders box-drawing characters for retro UI

### Modem Connect (`client/src/components/ModemConnect.jsx`)
- Simulates dial-up connection sequence
- Plays modem sounds using Web Audio API
- Shows ATZ, ATDT, CONNECT 14400 sequence

### Backend Server (`server/src/index.js`)
- Express REST API on port 3000
- SQLite database with tables: users, boards, messages, files, file_categories, private_messages
- Session-based authentication (currently using plain text passwords - bcrypt temporarily disabled)
- CORS enabled for dev server (localhost:5173)
- **Login credentials**: Username: `SysOp`, Password: `sysop` (or any seeded user with password `password`)

## Database Schema

### Tables
- `users` - User accounts with handles, passwords, ratios, stats
- `boards` - Message board categories (General, Computer Talk, etc.)
- `messages` - Forum messages with threading support
- `files` - File library entries with metadata
- `file_categories` - File area categories
- `private_messages` - User-to-user private messages

### Seeded Data
Run `node server/src/seedData.js` to populate:
- Sample users (SysOp, BlackKnight, Shadowhawk, etc.)
- Message boards (8 categories)
- File categories (including "Fractal & Graphics Apps" with POV-Ray, Fractint)
- Sample files with nostalgic descriptions
- Sample messages and private messages

## File Categories (1993 Era)
1. Shareware & Demos - DOOM, SimCity, Wolfenstein 3D
2. ANSI Art & Graphics - ACiD, iCE art packs
3. Music & Sound - MOD files, ScreamTracker, ModPlay
4. Utilities - PKZIP, XTree Gold, After Dark screensavers
5. Drivers - Mouse, Sound Blaster, SVGA drivers
6. Text Files & Info - Anarchist Cookbook, Phrack, blue box guides, PBX theory
7. Jokes & Entertainment - Jokes, song lyrics (1988-1992: Def Leppard, Nirvana, etc.)
8. Fractal & Graphics Apps - Fractint, POV-Ray, GNUplot, math graphing

## Development Notes

### Adding ANSI Art
- Place .ans files in `assets/ansi-art/`
- ANSI art uses escape sequences: `\x1b[` followed by color codes
- Colors: 30-37 (foreground), 40-47 (background), 90-97 (bright foreground)
- Use `\x1b[0m` to reset colors
- Example: `\x1b[1;36m` = bright cyan

### Adding Features
- Message boards need API routes in `server/src/index.js`
- File uploads need storage handling and ratio updates
- New BBS screens go in `Terminal.jsx` with corresponding show* methods
- All navigation uses single-key commands (no Enter required)

### Styling Guidelines
- Use DOS VGA font (Perfect DOS VGA 437 from CDN)
- 80-column terminal width
- ANSI color palette (16 colors matching VGA)
- No modern UI elements - keep it retro!
- Line-by-line text display, no smooth scrolling

### API Endpoints
- POST `/api/users/register` - Create new user account
- POST `/api/users/login` - Authenticate user
- GET `/api/users/stats` - Get current user statistics
- GET `/api/boards` - List message boards
- GET `/api/files/categories` - List file categories with counts
- GET `/api/files/category/:id` - Get files in category

## Board Rules (Enforced)
1. NO HACKING - No illegal intrusion discussion
2. NO WAREZ - No pirated software
3. NO NUKING OTHER USERS - No harassment
4. Respectful communication required
5. Legitimate shareware/freeware only
6. Maintain upload/download ratio

## Electron-Specific Notes
- Main process: `electron/main.js`
- Starts backend server as child process
- Loads from Vite dev server in development
- Loads from `dist/` in production
- Server runs on localhost:3000, frontend on :5173 (dev) or bundled (prod)

## Future Enhancements
- Complete authentication flow
- Full message board with threading
- Actual file upload/download
- Private messaging implementation
- ANSI animation support (.anim files)
- Executable ANSI animations (MS-DOS style)
- SysOp admin panel
- Multi-node support (concurrent users)
- Better modem sounds
- QWK mail packets
- FidoNet-style inter-BBS messaging

## Common Issues

### "Could not locate the bindings file" Error
This means native modules (better-sqlite3) weren't built. See "Important: Native Modules" section above for fix.

### Database Not Found
Run `node server/src/seedData.js` to create and seed the database. Database will be created at `server/data/bbs.db`.

### Port Already in Use
Kill processes on ports 3000 (server) or 5173 (vite):
```bash
lsof -ti:3000 | xargs kill
lsof -ti:5173 | xargs kill
```

### ANSI Art Not Rendering
Check that escape sequences use `\x1b[` format and colors are valid (30-37, 40-47, 90-97, 100-107).

### Keyboard Input Not Working
The Terminal component uses a hidden input field. If keyboard doesn't work:
- Click anywhere on the terminal screen to refocus
- Check that `handleTerminalClick` and `onBlur` handlers are present
- Input field should have `autoFocus` and `onBlur={(e) => e.target.focus()}`

### Server Starts Then Exits Immediately
Check for:
- Missing database file (run seedData.js)
- Native module errors (better-sqlite3 not built)
- Port already in use (another instance running)
