#!/bin/sh
# Trace the SANDBERG CREATIVE lettering from the 2008 card art into vector paths.
#
# The card was set in Eccentric Std, a commercial Adobe face this Mac does not have,
# so the page draws the lettering from a trace of the card itself, not from a font.
# Writes web/title.svg (a <symbol id="lettering"> in the card's 1088x638 space) and
# web/favicon.svg (the S and the C, side by side, on the card green). Needs ImageMagick
# (magick), potrace and python3.
#
# Usage: tools/trace-title.sh        (from the repo root; run again only if the art changes)
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Crop a region of art/cover.jpg, upscale 4x so the trace has room for smooth curves,
# keep the light letters as black, and trace it: trace <name> <w>x<h>+<x>+<y>
trace() {
  magick "$root/art/cover.jpg" -crop "$2" +repage -colorspace gray \
    -filter Lanczos -resize 400% -threshold 62% -negate "$tmp/$1.pbm"
  potrace "$tmp/$1.pbm" -s --flat -t 8 -a 1.1 -O 0.4 -o "$tmp/$1.svg"
}
# The title sits in x 216-871, y 133-505; the crop keeps a 10 px margin.
trace title 675x392+206+123
# The S of SANDBERG (x 216-265, y 132-278) and the C of CREATIVE (x 219-278, y 365-505),
# each alone with a 5 px margin, for the favicon.
trace s 60x156+211+127
trace c 70x150+214+360

python3 -I - "$tmp" "$root/web" <<'EOF'
import re, sys
tmp, web = sys.argv[1], sys.argv[2]

def placed(name, x, y, h):
    """The traced path, mapped back onto the card. potrace units are 1/10 of an
    upscaled pixel with y flipped: the crop's origin (x, y), its height h, 1/4 * 1/10."""
    d = re.search(r'<path d="([^"]+)"', open("%s/%s.svg" % (tmp, name)).read()).group(1)
    return ('<g transform="translate(%d %d) scale(0.025 -0.025)"><path d="%s"/></g>'
            % (x, y + h, " ".join(d.split())))

with open(web + "/title.svg", "w") as f:
    f.write('<svg xmlns="http://www.w3.org/2000/svg">'
            '<symbol id="lettering" viewBox="0 0 1088 638">%s</symbol></svg>\n'
            % placed("title", 206, 123, 392))

# SC: each letter moved from its place on the card to the icon, at 0.82 of card size,
# the S centred at x 58 and the C at x 100 so the two just touch.
def letter(name, crop, centre, at):
    return ('<g transform="translate(%g 80) scale(0.82) translate(%g %g)">%s</g>'
            % (at, -centre[0], -centre[1], placed(name, *crop)))
with open(web + "/favicon.svg", "w") as f:
    f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">'
            '<rect width="160" height="160" rx="28" fill="#779152"/>'
            '<g fill="#c2e296">%s%s</g></svg>\n'
            % (letter("s", (211, 127, 156), (240.5, 205), 58),
               letter("c", (214, 360, 150), (248.5, 435), 100)))
EOF
echo "✅ wrote web/title.svg and web/favicon.svg"
