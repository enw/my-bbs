# Retro BBS Experience - Product Requirements Document

## Project Vision

Create an authentic 1993-era dial-up BBS experience accessible via modern web browser, complete with ANSI art, message boards, file libraries, and the nostalgic dial-up connection simulation.

## Core Philosophy

Recreate the look, feel, and functionality of a classic bulletin board system from the pre-internet era, emphasizing authenticity over modern conveniences.

---

## 1. User Experience & Authentication

### 1.1 Connection Simulation
- **Dial-up Animation**: Modem connection sounds (carrier tone, handshake noises)
- **Connection Sequence**:
  - Dialing animation with phone number display
  - "CONNECT 14400" or similar baud rate message
  - ANSI art splash screen with BBS name
  - Terminal emulation (80x25 character display)

### 1.2 User System
- **Handles**: Users choose unique handles (not email addresses)
- **User Levels**:
  - New User (limited access)
  - Validated User (full access)
  - SysOp (administrator)
- **Account Creation**:
  - New User application form
  - Real name (optional/fake), location, phone number fields (nostalgic)
  - Password creation
  - Auto-validation or manual SysOp approval option

### 1.3 Upload/Download Ratios
- **Ratio Tracking**: Track upload vs download byte counts
- **Ratio Requirements**: Configurable (e.g., 1:5 - upload 1MB to download 5MB)
- **Ratio Display**: Show user's current ratio on main menu
- **Exemptions**: SysOp can grant unlimited downloads or adjust ratios

---

## 2. Main Menu System

### 2.1 ANSI Menu Interface
- **Menu Structure**: Classic single-key navigation
- **Menu Options**:
  ```
  [M]essage Boards
  [F]ile Areas
  [P]rivate Mail
  [U]ser List
  [Y]our Statistics
  [L]ogoff
  [T]ime Left: XX minutes
  ```

### 2.2 Navigation
- Single keystroke commands (no Enter required)
- ANSI color-coded menu items
- Page-by-page navigation for listings
- [Q]uit or ESC to return to previous menu

---

## 3. Message Boards & Forums

### 3.1 Message Areas
- **Board Categories**:
  - General Discussion
  - Computer Talk (PC/Mac/Amiga)
  - Programming
  - Hardware/Software Help
  - Music & Entertainment
  - Jokes & Humor
  - For Sale/Trade
  - SysOp Announcements

### 3.2 Message Reading
- **Threading**: Basic threaded conversations
- **Display**: ANSI formatted message display
- **Navigation**: [N]ext, [P]revious, [R]eply, [Q]uit
- **Message Header**: From, To, Subject, Date, Time

### 3.3 Message Posting
- **New Messages**: Post new topic or reply to existing
- **Line Editor**: Classic line-by-line editor
- **Features**:
  - [S]ave message
  - [A]bort message
  - [E]dit line
  - [L]ist message
  - Maximum message length (e.g., 200 lines)

---

## 4. File Areas

### 4.1 File Library Structure
Organized into directories matching 1993 era software/content:

#### General Categories:
- **Shareware & Demos**
  - SimCity demos
  - Wolfenstein 3D shareware
  - Commander Keen episodes
  - Doom shareware

- **ANSI Art & Graphics**
  - ANSI art packs
  - ASCII art collections
  - VGA utilities

- **Music & Sound**
  - MOD files (Amiga tracker music)
  - S3M files (ScreamTracker)
  - XM files (FastTracker)
  - MOD player software (ModPlay, Cubic Player)
  - Sound Blaster utilities

- **Utilities**
  - File Managers (Norton Commander-like)
  - Disk compression (PKZip, ARJ, LHA)
  - PKUNZIP updates
  - Screen savers (After Dark, flying toasters)
  - Mouse drivers & utilities
  - Print utilities

- **Drivers**
  - Mouse drivers
  - Printer drivers (HP, Epson, etc.)
  - SVGA drivers (Tseng, Trident, S3)
  - Sound card drivers (Sound Blaster)

- **Text Files & Info**
  - The Anarchist Cookbook (text version)
  - Hacker dictionary/jargon file
  - Phrack magazine archives
  - 2600 Magazine articles
  - PBX access "theory" (nostalgic documentation)
  - Tone lists (red box, blue box tones)
  - "How to Make a Blue Box" (probably incorrect)
  - BBS lists
  - FAQ files

- **Jokes & Entertainment**
  - Joke collections
  - Song lyrics (1980s bands: Def Leppard, Bon Jovi, Guns N' Roses)
  - Early 90s lyrics (Nirvana, Pearl Jam, 1990-1992)
  - Funny text files
  - Chain letters (nostalgic)

### 4.2 File Browsing
- **File Listings**:
  - Filename (8.3 format display)
  - Size in KB
  - Upload date
  - Uploader handle
  - Download count
  - Short description

- **File Search**: Search by filename or description
- **New Files**: List files uploaded since last call
- **Popular Files**: Most downloaded files

### 4.3 Upload/Download
- **Download Process**:
  - Display file info and description
  - Check user's ratio before allowing download
  - Simulate ZMODEM/XMODEM transfer with progress bar
  - Deduct from download allowance

- **Upload Process**:
  - File description entry (required)
  - Category selection
  - Simulate upload transfer
  - Credit user's ratio
  - SysOp validation option for new uploads

---

## 5. Private Mail System

### 5.1 Internal Messaging
- **Inbox**: List unread and read messages
- **Message Actions**:
  - [R]ead message
  - [S]end new message
  - [D]elete message
  - [Q]uit to main menu

### 5.2 Message Composition
- **Recipient**: Enter handle name
- **Subject**: Message subject line
- **Body**: Line editor (same as message board posting)
- **Send confirmation**

### 5.3 Message Notifications
- Display "You have X new messages" on login
- Notification when returning to main menu if new mail arrives

---

## 6. User Features

### 6.1 User List
- List all users on the system
- Display: Handle, Last Call Date, Total Calls, Location
- Search by handle

### 6.2 User Statistics
Display for current user:
- Handle
- Real name
- Location
- First call date
- Last call date
- Total calls
- Upload/Download ratio
- Messages posted
- Time remaining this session

### 6.3 Time Limits
- Daily time limit per user (e.g., 60 minutes)
- Display countdown timer
- Warning at 5 minutes remaining
- Auto-logoff when time expires

---

## 7. Board Rules & Moderation

### 7.1 Explicit Rules Display
Show on login and in rules file:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              BOARD RULES - READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NO HACKING - Discussion of illegal computer intrusion
   is strictly prohibited.

2. NO WAREZ - No pirated software, cracks, or serial
   numbers allowed.

3. NO NUKING OTHER USERS - Harassment and attacks on
   other users will result in immediate ban.

4. Be respectful in message boards and private mail.

5. Upload legitimate shareware and freeware only.

6. Maintain your upload/download ratio.

Violation of these rules will result in account suspension
or termination at SysOp discretion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 7.2 SysOp Tools
- View all messages
- Delete inappropriate messages
- Suspend/ban users
- Edit user ratios
- Validate uploaded files
- System statistics

---

## 8. Technical Architecture

### 8.1 Frontend
- **Technology**: Modern web (React/Vue/vanilla JS)
- **Display**: Terminal emulator in browser
  - 80 columns x 25 rows
  - ANSI color support (16 colors)
  - ANSI art rendering
  - DOS-style font (VGA/IBM codepage 437)
  - Keyboard input handling

- **Audio**: Web Audio API for modem sounds

### 8.2 Backend
- **Server**: Node.js/Python/Go (to be determined)
- **Database**: Store users, messages, files, ratios
- **File Storage**: File library with metadata
- **Session Management**: Track logged-in users, time limits

### 8.3 ANSI Art Support
- Parse and render ANSI escape codes
- Support for:
  - Color codes (foreground/background)
  - Cursor positioning
  - Line drawing characters (box drawing)
  - IBM PC extended ASCII (codepage 437)

### 8.4 Data Models

**User**:
- id, handle, password_hash, real_name, location, phone
- first_call, last_call, total_calls
- bytes_uploaded, bytes_downloaded
- messages_posted, access_level
- time_used_today, time_bank

**Message**:
- id, board_id, thread_id, parent_id
- from_user_id, to_user (if reply), subject, body
- timestamp, read_status

**File**:
- id, filename, category, description
- uploader_user_id, upload_date, file_size
- download_count, validated_by_sysop

**Private Message**:
- id, from_user_id, to_user_id, subject, body
- timestamp, read_status

---

## 9. Nostalgic Details

### 9.1 Authentic Elements
- Modem connection sounds (configurable on/off)
- ANSI color schemes matching 1993 BBS aesthetics
- Pause prompts: "Press any key to continue..."
- "Last 10 callers" list
- System statistics (total calls, total files, total users)
- Bulletin/news section with ANSI art
- Logoff screen with ANSI art

### 9.2 Easter Eggs
- Hidden SysOp menu (Ctrl+S or specific key combo)
- Matrix-style ANSI animation on specific date/time
- Random BBS ads or fake "sponsor" messages
- Occasional "line noise" effect

---

## 10. Out of Scope (Explicitly Excluded)

- **No Door Games**: No online games (Trade Wars, Legend of the Red Dragon, etc.)
- **No External Protocols**: No actual ZMODEM file transfers (simulated only)
- **No Real Dial-up**: Web-based only, no actual modem support
- **No Multi-line**: Single-user experience (or single session per user)

---

## 11. Success Criteria

- Authentic 1993 BBS look and feel
- Functional message boards with threading
- Working file library with upload/download
- Upload/download ratio enforcement
- Private messaging system
- ANSI art rendering
- Responsive terminal emulation
- Mobile-friendly (optional, but maintain retro aesthetic)

---

## 12. Future Enhancements (Phase 2)

- Multiple BBS nodes (multi-user simultaneous access with "Please wait, all nodes busy...")
- Inter-BBS messaging (FidoNet-style)
- More sophisticated file tagging
- Chat mode between users
- Customizable ANSI themes
- SysOp chat mode (page SysOp)
- File ratings and comments
- QWK mail packet support (nostalgic)

---

## 13. Development Phases

### Phase 1: Core Infrastructure
- Terminal emulator
- User authentication
- Main menu system
- Basic navigation

### Phase 2: Message Boards
- Message board creation
- Message posting/reading
- Threading

### Phase 3: File Areas
- File upload/download simulation
- File categorization
- Ratio tracking

### Phase 4: Private Mail
- Internal messaging
- Inbox/outbox

### Phase 5: Polish & Nostalgia
- ANSI art integration
- Modem sounds
- Logoff screens
- Statistics

---

## Appendix A: ANSI Art Resources

Include authentic ANSI art packs:
- ACiD Productions packs
- iCE Advertisements
- Mistigris
- Classic BBS welcome screens
- File area headers
- Menu backgrounds

## Appendix B: Sample File Descriptions (Authentic 1993 Style)

```
PKZIP204G.EXE  [203kb] [1992-12-15] [SysOp] [DL:547]
PKZIP version 2.04g - Fast! New compression! A MUST
HAVE for any serious computer user. Compress your
files and save disk space.

SCREAM.ZIP     [156kb] [1993-04-20] [BlackKnight] [DL:89]
Scream Tracker 3.0 - Create awesome MOD music on your
PC! Supports GUS, SB, and more. 16 channels!

AOC.ZIP        [234kb] [1993-01-05] [Anonymous] [DL:1024]
The Anarchist Cookbook - Text file version. For
educational purposes only. SysOp takes NO
responsibility for misuse of this information.
```

---

**End of PRD**
