# DESIGN.md — Blood on the Clocktower (Trouble Brewing)
## "Occult Botanical & Editorial Bento"

Aesthetic direction curated from the user's reference designs:
1. **Editorial Luxury & Atmosphere**: Elegant high-contrast serif headlines paired with ultra-crisp geometric sans metadata, framed dark vignette cards, and subtle warm borders.
2. **Organic Sage & Bone Bento Grid**: Deep pine-obsidian canvas (`#141A16`), forest sage panels (`#1F2B23`), and contrasting warm linen/bone highlight cards (`#F4EFEA`).
3. **Soft Pill Navigation & Controls**: Frosted glass capsules, smooth pill tab switchers, and subtle glow states.
4. **Physical Tactile Tokens**: High-contrast circular tokens with clean vector insignias, giving the feel of polished game stones on a storyteller table.

---

### Non-Negotiable Core Rules
- **ZERO EMOJIS**: Emojis are strictly banned across all components, buttons, notifications, and labels. Every icon must be a clean vector SVG from `lucide-react` or custom SVG paths.
- **CLEAN APP ROUTER PATHS**: Never fake pages with query parameters like `?view=dashboard` or `?tab=grimoire`. All views are first-class Next.js App Router routes (`/`, `/setup`, `/grimoire`, `/evil`, `/narrator`, `/webplay`).
- **CENTRALIZED GAME STATE**: All game state lives in a single persistent `GameContext` provider, keeping player seats, tokens, reminders, night phases, and logs synchronized seamlessly across page transitions.

---

### Color Palette
- **Canvas Base**: `#141A16` (Deep Pine Slate)
- **Secondary Canvas**: `#19221C` (Dark Forest Velvet)
- **Panel / Bento Dark Surface**: `#1F2B23` with `border border-white/[0.08]`
- **Panel / Bento Bone Highlight**: `#F4EFEA` (Text: `#17201A`)
- **Primary Accent (Storyteller Gold)**: `#D4AF37` / `#F0D279`
- **Good / Townsfolk Accent (Verdant Glow)**: `#34D399` / `#10B981`
- **Evil / Demon Accent (Crimson Ember)**: `#E11D48` / `#9F1239`
- **Muted Metadata Text**: `#9AA39C` on dark surfaces; `#6B7280` on bone surfaces

---

### Typography
- **Headlines & Storyteller Lore**: `font-display` (Cinzel / Serif) with tracked spacing.
- **Body & Controls**: `font-sans` (Plus Jakarta Sans) with crisp weights (500/600/700).
- **Metadata & Technical Timing**: `font-mono` (JetBrains Mono) for round counts, night sequences, and seat numbers.

---

### Radii & Spacing
- Bento Cards: `rounded-2xl` to `rounded-3xl` (16px to 28px).
- Navigation Pills: `rounded-full`.
- Inner Control Buttons: `rounded-xl` to `rounded-2xl`.

