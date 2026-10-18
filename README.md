# sandbergcreative.net

Ben Sandberg's 2008 Sandberg Creative business card, as a web page. The page opens on
the green cover; a click turns it over to the name side. The cover's border is a loop of
skills, in a new order on every visit, that streams in and out at a seam in the middle of the
bottom edge, under a badge naming the commit the page was deployed from.

- `web/`: the site, plain HTML, CSS and one script. No build step.
- `site/`: the [flarepress](https://github.com/pdxfixit/flarepress) site folder
  (`wrangler.toml`, `site.conf`).
- `art/`: the 2008 card art, exported from the original Photoshop files.
- `tools/trace-title.sh`: makes `web/title.svg` and `web/favicon.svg` from `art/cover.jpg`.

## Fonts

The card was set in Eccentric Std (the title), Impact (the skills) and Times New Roman (the
name side). Eccentric Std is a commercial Adobe face, so the title is a vector trace of the
printed card, not text in that font. The skills and the name side use the visitor's own
Impact and Times, with similar fallbacks.

## Edit the skills

The list is the text inside `<textPath id="skills">` in `web/index.html`: terms separated by
` * `. `web/card.js` shuffles it, repeats it as needed and moves it around the border; nothing
else needs to change.

## Preview

```sh
python3 -m http.server 8742 --directory web
```

## Deploy

Every push to `main` deploys through `.github/workflows/deploy.yml` (the flarepress action),
which checks the live site serves the new commit. From the Mac: `just push ~/src/sandbergcreative/site`
in flarepress.
