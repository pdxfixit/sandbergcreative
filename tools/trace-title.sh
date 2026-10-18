#!/bin/sh
# Trace the SANDBERG CREATIVE lettering from the 2008 card art into vector paths.
#
# The card was set in Eccentric Std, a commercial Adobe face this Mac does not have,
# so the page draws the lettering from a trace of the card itself, not from a font.
# Writes web/title.svg (a <symbol id="lettering"> in the card's 1088x638 space) and
# web/favicon.svg (the S). Needs ImageMagick (magick), potrace and python3.
#
# Usage: tools/trace-title.sh        (from the repo root; run again only if the art changes)
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# The title sits in x 216-871, y 133-505 of art/cover.jpg; crop with a 10 px margin,
# upscale 4x so the trace has room for smooth curves, keep the light letters as black.
magick "$root/art/cover.jpg" -crop 675x392+206+123 +repage -colorspace gray \
  -filter Lanczos -resize 400% -threshold 62% -negate "$tmp/title.pbm"
potrace "$tmp/title.pbm" -s --flat -t 8 -a 1.1 -O 0.4 -o "$tmp/title.svg"

python3 -I - "$tmp/title.svg" "$root/web" <<'EOF'
import re, sys
src, web = sys.argv[1], sys.argv[2]
d = re.search(r'<path d="([^"]+)"', open(src).read()).group(1)
d = " ".join(d.split())
# potrace units are 1/10 of an upscaled pixel with y flipped; this maps them back
# onto the card: the crop's origin (206,123), its height 392, and 1/4 * 1/10.
g = '<g transform="translate(206 515) scale(0.025 -0.025)"><path d="%s"/></g>' % d
with open(web + "/title.svg", "w") as f:
    f.write('<svg xmlns="http://www.w3.org/2000/svg">'
            '<symbol id="lettering" viewBox="0 0 1088 638">%s</symbol></svg>\n' % g)
# The S alone (x 216-265, y 132-278), on the card green, clipped from its neighbour A.
with open(web + "/favicon.svg", "w") as f:
    f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="160 125 160 160">'
            '<rect x="160" y="125" width="160" height="160" rx="28" fill="#779152"/>'
            '<clipPath id="s"><rect x="200" y="125" width="76" height="160"/></clipPath>'
            '<g fill="#c2e296" clip-path="url(#s)">%s</g></svg>\n' % g)
EOF
echo "✅ wrote web/title.svg and web/favicon.svg"
