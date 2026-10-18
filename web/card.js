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
  var list = textPath.textContent.replace(/\s+/g, " ").trim() + " ";
  document.getElementById("cover-skills").textContent = "Skills: " +
    list.replace(/^\* /, "").replace(/ \* /g, ", ").replace(/[ *]+$/, "") + ".";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
