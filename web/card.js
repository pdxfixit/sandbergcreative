// The card: turning it over, and the skills that run around the cover's border.
// Loaded in <head> so the "js" class is set before the page first paints.
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  var card = document.getElementById("card");
  var button = document.getElementById("flip");
  var cover = card.querySelector(".cover");
  var front = card.querySelector(".front");

  // Turning over: a click on the card (not on a link) or the Flip button.
  function show(flipped) {
    card.classList.toggle("flipped", flipped);
    // The side facing away is out of reach for the keyboard and screen readers.
    cover.inert = flipped;
    front.inert = !flipped;
    button.setAttribute("aria-pressed", String(flipped));
  }
  card.addEventListener("click", function (event) {
    if (event.target.closest("a")) return;
    show(!card.classList.contains("flipped"));
  });
  button.addEventListener("click", function () {
    show(!card.classList.contains("flipped"));
  });
  show(false);

  // The loop: the list is far longer than the border, so it streams in at the seam,
  // goes once around and back out at the seam. Without the script (or with reduced
  // motion) the border holds the list's first lap, still.
  var path = document.getElementById("loop");
  var textPath = document.getElementById("skills");
  var terms = textPath.textContent.split("*").map(function (t) {
    return t.replace(/\s+/g, " ").trim();
  }).filter(Boolean);
  document.getElementById("cover-skills").textContent = "Skills: " + terms.join(", ") + ".";
  // A new order on every visit (Fisher-Yates).
  for (var i = terms.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var swap = terms[i];
    terms[i] = terms[j];
    terms[j] = swap;
  }
  var list = "* " + terms.join(" * ") + " ";
  textPath.textContent = list;

  // The badge at the seam names the deployed commit. Without a stamp (a local preview)
  // or with one that is not a commit id, it stays hidden: no badge beats a wrong one.
  fetch("version.json", { cache: "no-store" })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (stamp) {
      var commit = stamp && typeof stamp.commit === "string" ? stamp.commit : "";
      if (!/^[0-9a-f]{7,40}$/.test(commit)) return;
      var badge = document.getElementById("build");
      var label = badge.querySelector("text");
      var pill = badge.querySelector("rect");
      label.textContent = commit.slice(0, 7);
      var width = label.getComputedTextLength() + 22;
      pill.setAttribute("x", (544 - width / 2).toFixed(1));
      pill.setAttribute("width", width.toFixed(1));
      badge.setAttribute("href", "https://github.com/pdxfixit/sandbergcreative/commit/" + commit);
      badge.setAttribute("visibility", "visible");
    })
    .catch(function () {});

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // The wave in the title. On the card SANDBERG's bottoms and CREATIVE's tops follow one
  // curve, about 95 units apart all the way across: the letters are tallest at the left of
  // SANDBERG and shortest near its R. Here that curve's crest follows the pointer. Each
  // letter stretches or shrinks with its outer edge pinned (SANDBERG's tops, CREATIVE's
  // bottoms), and both words take the same shift, so the gap between them keeps its shape.
  // At rest, or with the pointer off the page, the title is exactly the card.
  //
  // Each letter as measured on art/cover.jpg: its column (x0-x1) and its top and bottom.
  var LETTERS = [
    // SANDBERG: the bottom edge moves.
    [200, 277, 137, 273, "bottom"], [277, 377, 142, 278, "bottom"], [377, 466, 141, 277, "bottom"],
    [466, 551, 140, 272, "bottom"], [551, 641, 139, 266, "bottom"], [641, 719, 136, 258, "bottom"],
    [719, 801, 137, 256, "bottom"], [801, 885, 132, 264, "bottom"],
    // CREATIVE: the top edge moves.
    [200, 291, 365, 505, "top"], [291, 385, 375, 505, "top"], [385, 468, 371, 505, "top"],
    [468, 571, 364, 503, "top"], [571, 648, 355, 498, "top"], [648, 700, 353, 496, "top"],
    [700, 800, 352, 495, "top"], [800, 885, 354, 500, "top"]
  ];
  var WAVE = { amplitude: 11, length: 860, rest: 330 }; // fitted to the card's curve, crest at x 330
  function wave(x, crest) {
    return WAVE.amplitude * Math.cos(2 * Math.PI * (x - crest) / WAVE.length);
  }

  var svgNS = "http://www.w3.org/2000/svg";
  var title = document.getElementById("title");
  var lettering = title.querySelector("use");
  var defs = document.createElementNS(svgNS, "defs");
  title.appendChild(defs);
  var letters = LETTERS.map(function (l, i) {
    var clip = document.createElementNS(svgNS, "clipPath");
    clip.id = "letter-" + i;
    clip.setAttribute("clipPathUnits", "userSpaceOnUse");
    var rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", l[0]);
    rect.setAttribute("width", l[1] - l[0]);
    rect.setAttribute("y", l[4] === "bottom" ? 0 : 315);
    rect.setAttribute("height", l[4] === "bottom" ? 315 : 323);
    clip.appendChild(rect);
    defs.appendChild(clip);
    var g = document.createElementNS(svgNS, "g");
    var use = lettering.cloneNode();
    use.setAttribute("clip-path", "url(#letter-" + i + ")");
    g.appendChild(use);
    title.appendChild(g);
    return { g: g, center: (l[0] + l[1]) / 2, top: l[2], bottom: l[3], moves: l[4] };
  });
  lettering.remove();

  var crest = WAVE.rest;
  var aim = WAVE.rest;
  window.addEventListener("pointermove", function (event) {
    var box = card.getBoundingClientRect();
    aim = (event.clientX - box.left) / box.width * 1088;
  });
  document.documentElement.addEventListener("pointerleave", function () { aim = WAVE.rest; });
  function ripple() {
    if (Math.abs(aim - crest) > 0.05) {
      crest += (aim - crest) * 0.08;
      letters.forEach(function (l) {
        var shift = wave(l.center, crest) - wave(l.center, WAVE.rest);
        var height = l.bottom - l.top;
        // SANDBERG's bottoms move down as the crest passes; CREATIVE's tops move with them.
        var scale = l.moves === "bottom" ? (height + shift) / height : (height - shift) / height;
        var pin = l.moves === "bottom" ? l.top : l.bottom;
        l.g.setAttribute("transform",
          "matrix(1 0 0 " + scale.toFixed(4) + " 0 " + (pin * (1 - scale)).toFixed(2) + ")");
      });
    }
    requestAnimationFrame(ripple);
  }
  requestAnimationFrame(ripple);

  var SPEED = 36; // card units (1/1088 of its width) per second
  var lap = path.getTotalLength();
  var hovering = false;
  cover.addEventListener("mouseenter", function () { hovering = true; });
  cover.addEventListener("mouseleave", function () { hovering = false; });

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
    // One copy's length, measured off the path, where nothing is clipped.
    var probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
    probe.setAttribute("class", "skills");
    probe.setAttribute("visibility", "hidden");
    probe.textContent = list;
    textPath.ownerSVGElement.appendChild(probe);
    var length = probe.getComputedTextLength();
    probe.remove();
    if (!(length > 0)) return; // a failed measure must not look like a real one

    // Enough copies that the border is always full as the text slides back.
    textPath.textContent = new Array(Math.ceil(lap / length) + 2).join(list);
    textPath.setAttribute("aria-hidden", "true");

    var offset = 0;
    var last = null;
    function step(now) {
      if (last !== null && !hovering && !card.classList.contains("flipped")) {
        offset = (offset + SPEED * (now - last) / 1000) % length;
        textPath.setAttribute("startOffset", String(-offset));
      }
      last = now;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
});
