// Shared splash screen content for both telnet and browser interfaces
// This eliminates duplication between Terminal.jsx and TelnetSession.js

const SPLASH_SCREEN = `╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║  ██████╗ ███████╗████████╗██████╗  ██████╗     ██████╗ ██████╗ ███████╗  ║
║  ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗    ██╔══██╗██╔══██╗██╔════╝  ║
║  ██████╔╝█████╗     ██║   ██████╔╝██║   ██║    ██████╔╝██████╔╝███████╗  ║
║  ██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║    ██╔══██╗██╔══██╗╚════██║  ║
║  ██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝    ██████╔╝██████╔╝███████║  ║
║  ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝     ╚═════╝ ╚═════╝ ╚══════╝  ║
║                                                                           ║
║                       Welcome to the RETRO BBS!                            ║
║                                                                           ║
║                    A Nostalgic Trip Back to 1993                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              BOARD RULES - READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NO HACKING - Discussion of illegal computer intrusion is strictly prohibited.

2. NO WAREZ - No pirated software, cracks, or serial numbers allowed.

3. NO NUKING OTHER USERS - Harassment and attacks on other users will result
   in immediate ban.

4. Be respectful in message boards and private mail.

5. Upload legitimate shareware and freeware only.

6. Maintain your upload/download ratio.

Violation of these rules will result in account suspension or termination
at SysOp discretion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Press [N] for New User or [L] to Login: `

module.exports = { SPLASH_SCREEN }

