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
- Node.js 18+ and pnpm
- Modern web browser (for web mode)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd my-bbs

# Install dependencies
pnpm install

# Run in development mode (web)
pnpm dev

# Run as Electron app
pnpm electron:dev
```

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
│   │   ├── lib/          # ANSI parser, utilities
│   │   └── styles/       # CSS files
│   └── index.html
├── server/          # Node.js/Express backend
│   ├── src/
│   │   ├── index.js      # Main server file
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

## 🎮 Usage

### Web Browser
1. Run `pnpm dev`
2. Open http://localhost:5173
3. Watch the modem connection sequence
4. Press `[N]` for New User or `[L]` to Login

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
- [ ] Complete message board implementation with threading
- [ ] File upload/download with actual file storage
- [ ] Private messaging system
- [ ] ANSI art animation support (.anim files)
- [ ] MS-DOS executable ANSI animations
- [ ] SysOp admin panel
- [ ] Multi-node support (multiple simultaneous users)
- [ ] More authentic modem sounds
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

## 📞 Support

For issues, questions, or nostalgic stories about your BBS days, please open an issue on GitHub.

---

**NO CARRIER** 📞

*Made with ❤️ for the retro computing community*
