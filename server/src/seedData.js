// Script to seed the database with sample files and messages

const Database = require('better-sqlite3')
const path = require('path')
// const bcrypt = require('bcrypt') // Temporarily disabled

const db = new Database(path.join(__dirname, '../data/bbs.db'))

async function seedData() {
  console.log('Seeding database with sample data...')

  // Create SysOp user (using plain text password for testing)
  const passwordHash = 'sysop' // await bcrypt.hash('sysop', 10)

  try {
    db.prepare(`
      INSERT INTO users (handle, password_hash, real_name, location, phone, first_call, last_call, total_calls, access_level)
      VALUES (?, ?, ?, ?, ?, datetime('now', '-100 days'), datetime('now'), 1547, 99)
    `).run('SysOp', passwordHash, 'The System Operator', 'New York, NY', '555-1234')
  } catch (e) {
    console.log('SysOp user already exists')
  }

  // Add sample users
  const users = [
    ['BlackKnight', 'Los Angeles, CA', '555-2345', 892],
    ['Shadowhawk', 'Chicago, IL', '555-3456', 654],
    ['PhantomLord', 'Seattle, WA', '555-4567', 234],
    ['CyberNinja', 'Miami, FL', '555-5678', 178]
  ]

  for (const [handle, location, phone, calls] of users) {
    try {
      const hash = 'password' // await bcrypt.hash('password', 10)
      db.prepare(`
        INSERT INTO users (handle, password_hash, real_name, location, phone, first_call, last_call, total_calls)
        VALUES (?, ?, ?, ?, ?, datetime('now', '-50 days'), datetime('now', '-1 day'), ?)
      `).run(handle, hash, handle, location, phone, calls)
    } catch (e) {
      console.log(`User ${handle} already exists`)
    }
  }

  // Add sample files
  const files = [
    [1, 'DOOM1.ZIP', 'DOOM Shareware v1.9 - The ultimate first person shooter! Requires 386+, 4MB RAM, VGA. 2.4 MB of pure action!', 2495488, 547],
    [1, 'SIMCITY.ZIP', 'SimCity Demo - Build your own city! Classic city simulation game. Requires EGA/VGA.', 1048576, 234],
    [1, 'WOLF3D.ZIP', 'Wolfenstein 3D Shareware - Nazi-killing FPS action! Requires 286+, VGA.', 1572864, 423],
    [1, 'KEEN4.ZIP', 'Commander Keen Episode 4 - Platform game by id Software. Requires EGA/VGA.', 786432, 189],
    [2, 'ACID-093.ZIP', 'ACiD Productions ANSI Pack #93 - The finest ANSI art available! 42 files.', 524288, 156],
    [2, 'ICE-0892.ZIP', 'iCE Advertisements ANSI Pack August 1992 - Cool BBS art and logos.', 393216, 98],
    [3, '2UNLIMIT.ZIP', 'MOD: 2 Unlimited - No Limit remix. Awesome techno track! Requires MOD player.', 204800, 312],
    [3, 'MODPLAY.ZIP', 'ModPlay v2.09 - Play Amiga MOD files on your PC! Supports SB, GUS.', 98304, 445],
    [3, 'SCREAM3.ZIP', 'Scream Tracker 3.0 - Create your own MOD music! 16 channels, GUS support.', 163840, 278],
    [4, 'PKZIP204.EXE', 'PKZIP 2.04g - Fast file compression! A must-have utility. Creates .ZIP files.', 208896, 892],
    [4, 'XTGOLD.ZIP', 'XTree Gold v2.5 - The ultimate file manager for DOS. Norton Commander killer!', 327680, 567],
    [4, 'AFDARK.ZIP', 'After Dark Screen Saver - Flying toasters and more! Requires VGA, mouse.', 245760, 334],
    [5, 'MOUSE9.ZIP', 'Microsoft Mouse Driver v9.01 - Latest mouse driver. Supports all models.', 81920, 445],
    [5, 'SBPRO.ZIP', 'Sound Blaster Pro drivers v2.0 - Get the most out of your sound card!', 147456, 289],
    [5, 'S3_SVGA.ZIP', 'S3 SVGA drivers v1.3 - High resolution video drivers. Supports 1024x768.', 131072, 178],
    [6, 'ANARCHIST.ZIP', 'The Anarchist Cookbook - Text version. For educational purposes only!', 524288, 1024],
    [6, 'JARGON.ZIP', 'The Hacker Jargon File v3.0 - Definitive compendium of hacker slang.', 262144, 456],
    [6, 'PHRACK.ZIP', 'Phrack Magazine Issues 1-40 - Underground hacker e-zine archive.', 786432, 678],
    [6, 'BLUEBOX.TXT', 'How to Build a Blue Box - Phone phreaking guide. Probably wrong anyway!', 8192, 890],
    [6, 'PBX-INFO.ZIP', 'PBX Access Theory - Understanding phone systems. Educational text.', 65536, 543],
    [6, 'TONELIST.TXT', 'DTMF Tone Frequencies - Red box, blue box tone reference chart.', 4096, 432],
    [7, 'JOKES92.ZIP', 'Joke Collection 1992 - Over 500 clean jokes! Hours of laughs.', 131072, 567],
    [7, 'LYRICS1.ZIP', 'Song Lyrics 1988-1990 - Def Leppard, Bon Jovi, Guns N Roses and more!', 98304, 445],
    [7, 'LYRICS2.ZIP', 'Song Lyrics 1990-1992 - Nirvana, Pearl Jam, early grunge era hits!', 81920, 389],
    [7, 'FUNNIES.ZIP', 'Funny Text Files - ASCII art, stories, and chain letters from 1992.', 73728, 298],
    [8, 'FRACTINT.ZIP', 'Fractint v19.2 - The ultimate fractal generator! Mandelbrot, Julia sets.', 524288, 234],
    [8, 'POVRAY.ZIP', 'POV-Ray 2.2 - Persistence of Vision Raytracer. Create amazing 3D images!', 786432, 189],
    [8, 'GNUPLOT.ZIP', 'GNUplot v3.5 - Scientific data plotting and graphing. Math visualization.', 393216, 145],
    [8, 'FRACTAL.ZIP', 'Fractal Generator v2.1 - Easy to use fractal creation tool. VGA required.', 163840, 167]
  ]

  for (const [cat, file, desc, size, downloads] of files) {
    try {
      db.prepare(`
        INSERT INTO files (category_id, filename, description, uploader_id, size, download_count, validated)
        VALUES (?, ?, ?, 1, ?, ?, 1)
      `).run(cat, file, desc, size, downloads)
    } catch (e) {
      // File probably exists
    }
  }

  // Add sample messages
  const messages = [
    [1, 2, 'Welcome!', 'Hey everyone! New to the board. Loving the retro vibe!', 0],
    [1, 1, 'Re: Welcome!', 'Welcome aboard! Make sure to check out the file areas. Tons of great stuff!', 1],
    [2, 3, 'Need 486 upgrade advice', 'Thinking about upgrading from my 386DX to a 486. Worth it for Doom?', 0],
    [2, 2, 'Re: Need 486 upgrade advice', 'Absolutely! Doom runs so much better on a 486. Go for the DX2/66 if you can afford it.', 1],
    [3, 4, 'Learning C++', 'Just started learning C++. Any good books you guys recommend?', 0],
    [4, 3, 'Sound Blaster issues', 'Can\'t get my Sound Blaster 16 to work in DOS. IRQ 5, DMA 1. Help?', 0],
    [5, 2, 'New MOD uploaded!', 'Just uploaded a sick techno MOD in the music section. Check it out!', 0],
    [6, 1, 'Keyboard not found joke', 'Why did the computer go to therapy? Because it had too many Ctrl issues! 😄', 0],
    [8, 1, 'Board updates coming', 'Working on some cool new features for the BBS. Stay tuned!', 0]
  ]

  for (const [board, user, subject, body, thread] of messages) {
    try {
      db.prepare(`
        INSERT INTO messages (board_id, from_user_id, subject, body, thread_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(board, user, subject, body, thread)
    } catch (e) {
      // Message probably exists
    }
  }

  // Add sample private messages
  try {
    db.prepare(`
      INSERT INTO private_messages (from_user_id, to_user_id, subject, body)
      VALUES (1, 1, 'Welcome to the BBS!', 'Thanks for joining DRiPz \/RLD! Feel free to explore all the message boards and file areas. Remember to maintain your upload/download ratio. If you need anything, just send me a message!\n\n- SysOp')
    `).run()
  } catch (e) {
    // Message exists
  }

  console.log('Database seeded successfully!')
  db.close()
}

seedData().catch(console.error)
