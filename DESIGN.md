# DESIGN.md — Blood on the Clocktower (Trouble Brewing)
## "Obsidian Dark Mode & Editorial Multi-Room"

### Core Design Rules
1. **True Obsidian Dark Mode (No Green)**:
   - Base canvas: `#0C0C10` (Deep Obsidian Velvet)
   - Secondary canvas: `#121217`
   - Panels & Bento Cards: `#181822` / `#1F1F2C` with border `rgba(255, 255, 255, 0.08)`
   - Highlight Accent Cards: `#EDEAF0` or `#252536`
   - Storyteller Gold: `#D4AF37` / `#F0D279`
   - Crimson Danger / Evil: `#EF4444` / `#DC2626`
   - Townsfolk Good: `#34D399` / `#10B981`
2. **Minimal Empty Navbar**:
   - Navbar contains only the brand title ("Grimoire BOTC") and the discreet Room Switcher pill. No cluttered buttons or tabs.
   - Clean page navigation lives naturally within the application flow.
3. **Multi-Room (Max 3 Game Rooms)**:
   - Up to 3 active game rooms saved in local storage.
   - When a 4th room is added, the oldest room is automatically deleted.
   - Fast room switching without state collision.
4. **Stealth Peek & Discretion Rules**:
   - Player names are strictly hidden by default on all secret peek and show cards (showing "Kursi X" instead) to prevent accidental shoulder-surfing leaks.
   - **Teensyville / Under-7 Rule**: In games with fewer than 7 players, Minion names are never shown on the Demon's 3-bluff card.
5. **Confirmation Alerts**:
   - Critical storyteller actions (executions, kills, phase transitions, and session resets) trigger explicit confirmation alerts to prevent accidental misclicks during live play.
6. **Zero Emojis**:
   - 100% Lucide SVG vector glyphs across all components.
