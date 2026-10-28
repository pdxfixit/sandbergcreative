# One-shot prompt: rebuild sandbergcreative.net from nothing

The prompt itself is the fenced block below. After it is a short section on why it is
shaped the way it is, since the point of writing it was to learn how to brief work like
this better.

Inputs a fresh session would need beside the prompt: `art/cover.jpg` and `art/front.jpg`
(the 2008 card art, 1088 x 638 px each). Everything else is derivable.

---

```text
Build sandbergcreative.net: Ben Sandberg's 2008 "Sandberg Creative" business card as a
web page. The repo is pdxfixit/sandbergcreative. Two files are supplied and are the
source of truth for the design: art/cover.jpg (the green cover) and art/front.jpg (the
white name side), both 1088 x 638 px. Measure from them; do not restyle them.

# What it is

One page. It opens on the green cover, which fills the browser window at whatever shape
the window is. A click or tap anywhere turns the card over, in 3D, to the name side.
That is the whole site: no navigation, no copy, nothing on the page but the card.

# The cover, as printed

- Background #779152. Lettering and skills in #c2e296.
- Title: "SANDBERG" over "CREATIVE", set in Eccentric Std, spanning roughly x 216-871,
  y 132-505 of the card. The two lines share a gentle wave: SANDBERG's baseline and
  CREATIVE's cap line follow one cosine curve, about 95 units apart, crest near x 330,
  amplitude about 11 units.
- Skills: a loop of terms in Impact, around all four edges on the card's 79-unit margin,
  corners rounded r 24. Letter tops face the middle of the card (the bottom edge reads
  normally, the top edge is upside down).

# The cover, as built

Fonts. Eccentric Std is a commercial Adobe face and may not be assumed. Trace the title
from art/cover.jpg instead: a shell script tools/trace-title.sh (ImageMagick + potrace +
python3 -I) crops the title region, upscales 4x, thresholds, traces, and writes
web/title.svg as a <symbol id="lettering" viewBox="0 0 1088 638"> mapped back into card
space. The same script traces the S of SANDBERG and the C of CREATIVE side by side on a
rounded green square and writes web/favicon.svg. Impact and Times New Roman are used by
name with similar fallbacks (Haettenschweiler, Arial Narrow Bold; Times, Liberation
Serif).

The skills loop.
- The list lives in the HTML as the text of <textPath id="skills" href="#loop">, terms
  separated by " · " (a middle dot). That is the only place anyone edits to change it.
  Seed it with the 2008 card's terms plus a current list of around 200 (web, sysadmin,
  cloud, SRE, AI tooling, design, consulting). Say the terms the way people do: CSS,
  DNS, SQL, not their expansions.
- The list is far longer than the border. On every visit the script shuffles it
  (Fisher-Yates), then scrolls it around the loop at 36 card units per second. The loop
  path starts and ends at a seam in the middle of the bottom edge, so the text streams out
  from the seam, goes once around, and streams back in.
- At the seam sits a pill badge showing the short hash of the commit the page was
  deployed from, linking to that commit on GitHub. It reads web/version.json (stamped at
  deploy time, shape {"commit": "<sha>"}); if the file is missing or the value is not a
  hex sha, the badge stays hidden. No badge beats a wrong one.
- The text fades to nothing over 40 units on each side of the badge (an SVG mask with two
  linear gradients), so no letter ever pops in or out at the seam.
- Pointer over the band the skills run in: the scroll pauses so they can be read.
  Pointer leaves the page or the card is flipped: pause too.
- The <desc> of the cover SVG lists the terms as plain text for screen readers; the
  moving textPath is aria-hidden once the animation starts.

The title's wave follows the pointer. Cut the traced lettering into its 16 letters with
clipPath rectangles, one per letter column (measure the columns, tops and bottoms off
art/cover.jpg and hard-code them). As the pointer moves across, the crest of the wave
eases toward the pointer's x (lerp factor 0.08 per frame). Each SANDBERG letter stretches
or shrinks vertically with its top pinned; each CREATIVE letter does the same with its
bottom pinned; both words take the same shift so the gap between them keeps its shape.
At rest, or with the pointer off the page, the title is exactly the printed card.

# Filling the window

The SVG viewBox is recomputed on load and resize so the card fills the window edge to
edge at any aspect ratio. One card unit is sized so the printed card (1088 x 638, or
638 x 1088 on a tall window) just fits, capped at 0.75 CSS px per unit so a big monitor
gets more green around the same-size text rather than bigger text. The drawing then
widens or deepens to the window's shape:
- the skills loop is redrawn along the window's edges at the 79-unit margin, with the
  seam, badge and fade masks moved to the new bottom centre;
- the title stays centred at printed size, scaled down only when the window leaves less
  than about 125 units clear on each side;
- the name side's text block does the same.

# The name side, as printed

White. Black Times New Roman, centred: "Ben Sandberg" large, "Digital Lifestyle
Consultant" under it, then lower down the phone 503.317.0905 and ben@sandbergcreative.net.
Phone and email are tel: and mailto: links; they turn card green on hover and focus. A
click on a link does not flip the card.

# Behaviour and accessibility

- Script in <head> adds class "js" to <html> before first paint. Without script, both
  sides render one above the other, static, with the first lap of the skills visible.
- Flip: CSS 3D (perspective, preserve-3d, backface-visibility), 0.7 s ease. Under
  prefers-reduced-motion the flip is a 0.25 s crossfade, the skills do not scroll and the
  title does not move.
- The side facing away is inert. A "Flip the card" button exists for keyboard users
  only: visually hidden unless focus-visible, with aria-pressed and aria-controls.
- The page around the card (visible only without script) follows light and dark mode;
  the card's own colours never change, they are the 2008 art.
- Meta: title, description ("Ben Sandberg, Digital Lifestyle Consultant. Web
  development, system administration, graphic design."), theme-color #779152, Open Graph
  with og.jpg (a copy of the cover art), SVG favicon.

# Files and hosting

- web/: index.html, style.css, card.js, title.svg, favicon.svg, og.jpg, _headers,
  .assetsignore. Plain HTML, CSS and one script. No build step, no dependencies, no
  inline script or style.
- _headers: Cache-Control: no-cache; X-Content-Type-Options: nosniff; Referrer-Policy
  strict-origin-when-cross-origin; CSP default-src 'self'; img-src 'self' data:;
  object-src 'none'; base-uri 'self'; frame-ancestors 'none'.
- Hosting: one Cloudflare Worker serving web/ as static assets, no Worker code.
  site/wrangler.toml names the worker sandbergcreative-net with custom domains
  sandbergcreative.net and www.sandbergcreative.net and [assets] directory = "../web".
- Deploy: .github/workflows/deploy.yml runs on every push to main via the
  pdxfixit/flarepress@v1 action with site: site (secrets CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID), one deploy at a time, no cancel-in-progress. flarepress stamps
  web/version.json and verifies the live site serves the new commit. site/site.conf:
  url, committed=web site, pwa=0, rollback=redeploy.
- .gitignore: web/version.json, .wrangler/, site/.wrangler.deploy.toml,
  .claude/worktrees/, .DS_Store.
- Local preview: python3 -m http.server 8742 --directory web. Also a .claude/launch.json
  running the same.
- README: what it is, the folder layout, the font story, how to edit the skills (one
  place), preview, deploy.

# How to work

- Commit in small steps, one behaviour per commit, messages in plain sentences
  ("feat: the ticker fades into and out of the seam badge").
- Comment the code for the next reader in the same voice: say what a block is for and
  why the numbers are what they are (measured off the card, fitted to the curve), not
  what the syntax does.
- Before you call it done: open it in a browser at a wide, a square and a tall window;
  confirm the flip, the scroll, the seam fade, the wave, the hidden badge on local
  preview, keyboard flip, reduced motion, and no CSP violations in the console.
```

---

## Why it is shaped this way

The vague version of this request is "make my old business card into a web page that
flips". That gets you a generic flip card. Everything that makes this one worth having
came from decisions the vague brief leaves to chance. The prompt above pins those down,
and the pattern of what it pins is the transferable part.

- **Name the source of truth and say not to restyle it.** The art files plus "measure
  from them" removes the whole class of "I made it tasteful" drift.
- **Separate "as printed" from "as built".** The first says what the thing is; the
  second says the engineering choices that preserve it. A fresh session with only the
  first would guess at fonts, scrolling and the seam, and guess differently every time.
- **State the constraint behind every odd choice.** "Eccentric Std is commercial, so
  trace it" and "no badge beats a wrong one" and "big monitors get more green, not bigger
  text" are the lines that steer design decisions you will not be there to make. A
  number without its reason gets rounded away; a reason survives.
- **Give the measurements, not adjectives.** 79-unit margin, r 24 corners, 36 units per
  second, 40-unit fade, lerp 0.08, cap 0.75 px per unit. "Subtle" and "smooth" mean
  nothing; these mean exactly one thing.
- **Say what happens when things fail or are absent.** No script, no version.json,
  reduced motion, pointer off the page, a link clicked. Each of those was a commit in
  the real history because it was not in the original brief.
- **Name the single edit point.** "The list is the textPath text; nothing else needs to
  change" is the difference between a site you can maintain and one you cannot.
- **Specify the negative space.** "Nothing on the page but the card", "no build step",
  "no inline script or style", "no Worker code". Models add things; tell them what not
  to add.
- **Include hosting and deploy as part of the product.** The commit badge only makes
  sense because the deploy stamps version.json. Leaving deploy out of the prompt leaves
  a feature half-specified.
- **Say how to work, and how to know it is done.** Commit granularity, comment voice, and
  a concrete acceptance checklist. Without the checklist "done" means "it rendered once
  on my laptop".

What the prompt deliberately does not do: it does not paste the code. A prompt that is
the code is not a prompt. It gives every fact a competent builder would otherwise have
to ask you for, and leaves the keystrokes to them. If a rebuild from this comes out
differently in a way you care about, that difference is a missing line in the prompt,
and that is the test for whether a brief is complete.
