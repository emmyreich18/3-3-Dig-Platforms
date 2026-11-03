// Pattern Party – a tile pattern generator
//
// RULES (always the same):
//   - the canvas is a square grid of tiles
//   - every tile holds one shape, drawn from the center of the tile
//   - shapes only turn in quarter turns (0, 90, 180, 270 degrees)
//   - all colors come from one 4-color palette
//
// PARAMETERS (what the user can change):
//   shape, grid size, shape size, line thickness, petals/rings,
//   how tiles turn, how colors are placed, filled tiles on/off,
//   the 4 colors, and a random seed (Shuffle)

const SHAPES = ["arcs", "half circles", "triangles", "flowers", "bullseyes", "mix"];
const TURN_MODES = ["all the same", "checkerboard", "diagonal", "random"];
const COLOR_MODES = ["checkerboard", "stripes", "diagonal", "random"];

// color sets "Surprise me" picks from: background + 3 colors
const PALETTES = [
  ["#1b1b3a", "#ff6f59", "#ffd23f", "#3bceac"],
  ["#fdf0d5", "#c1121f", "#003049", "#669bbc"],
  ["#0b132b", "#5bc0be", "#ffcc00", "#ff5d8f"],
  ["#fff1e6", "#2a9d8f", "#e76f51", "#f4a261"],
  ["#f7f7f2", "#111111", "#ff3c38", "#2f6bff"],
  ["#2d1e2f", "#f7b2bd", "#c2f970", "#fffbfa"],
  ["#e9f5db", "#386641", "#f2a541", "#bc4749"]
];

let shapeSelect, turnSelect, colorSelect;
let gridSlider, sizeSlider, weightSlider, petalSlider;
let fillCheckbox;
let pickers = [];
let seed = 1;

function setup() {
  const c = createCanvas(600, 600);
  c.parent("sketch");

  shapeSelect = addSelect("Shape", SHAPES, "arcs");
  gridSlider = addSlider("Tiles per row", 2, 16, 8, 1);
  sizeSlider = addSlider("Shape size", 30, 100, 80, 1);
  weightSlider = addSlider("Line thickness", 2, 30, 14, 1);
  petalSlider = addSlider("Petals / rings", 3, 12, 6, 1);
  turnSelect = addSelect("How tiles turn", TURN_MODES, "random");
  colorSelect = addSelect("How colors are placed", COLOR_MODES, "checkerboard");

  const fillRow = addRow("");
  fillCheckbox = createCheckbox(" Fill tile backgrounds", false).parent(fillRow);

  const labels = ["Background", "Color 1", "Color 2", "Color 3"];
  for (let i = 0; i < 4; i++) {
    pickers.push(createColorPicker(PALETTES[0][i]).parent(addRow(labels[i])));
  }

  const buttons = createDiv("").parent("controls").class("buttons");
  createButton("Shuffle").parent(buttons).mousePressed(() => (seed = floor(random(100000))));
  createButton("Surprise me").parent(buttons).mousePressed(surprise);
  createButton("Download PNG").parent(buttons).mousePressed(() => {
    saveCanvas("pattern", "png");
  });
}

function draw() {
  // same seed = same "random" choices every frame, so the pattern holds still
  randomSeed(seed);

  const bg = pickers[0].value();
  const colors = [pickers[1].value(), pickers[2].value(), pickers[3].value()];
  background(bg);

  const n = gridSlider.value();
  const s = width / n;

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      // pick colors for this tile
      const k = colorIndex(col, row);
      const c1 = colors[k % 3];
      const c2 = colors[(k + 1) % 3];

      // pick a shape (for "mix" every tile picks its own)
      let shape = shapeSelect.value();
      if (shape === "mix") shape = random(SHAPES.slice(0, 5));

      push();
      translate(col * s + s / 2, row * s + s / 2);

      if (fillCheckbox.checked()) {
        noStroke();
        fill(colors[(k + 2) % 3]);
        rectMode(CENTER);
        rect(0, 0, s, s);
      }

      rotate(turnAmount(col, row) * HALF_PI);
      drawShape(shape, s, c1, c2, bg);
      pop();
    }
  }
}

// ---------- rules for turning and coloring ----------
function turnAmount(col, row) {
  const mode = turnSelect.value();
  if (mode === "checkerboard") return (col + row) % 2;
  if (mode === "diagonal") return (col + row) % 4;
  if (mode === "random") return floor(random(4));
  return 0;
}

function colorIndex(col, row) {
  const mode = colorSelect.value();
  if (mode === "stripes") return row % 3;
  if (mode === "diagonal") return (col + row) % 3;
  if (mode === "random") return floor(random(3));
  return (col + row) % 2;
}

// ---------- the shapes ----------
function drawShape(shape, s, c1, c2, bg) {
  const size = (sizeSlider.value() / 100) * s;
  const w = (weightSlider.value() / 100) * s;
  const petals = petalSlider.value();

  if (shape === "arcs") {
    // two quarter circles in opposite corners (a Truchet tile)
    noFill();
    strokeCap(SQUARE);
    strokeWeight(w);
    stroke(c1);
    arc(-s / 2, -s / 2, size, size, 0, HALF_PI);
    stroke(c2);
    arc(s / 2, s / 2, size, size, PI, PI + HALF_PI);
  }

  else if (shape === "half circles") {
    noStroke();
    fill(c1);
    arc(0, s / 2, size, size, PI, TWO_PI, PIE);
    fill(c2);
    circle(0, -s / 4, size * 0.25);
  }

  else if (shape === "triangles") {
    const h = size / 2;
    noStroke();
    fill(c1);
    triangle(-h, -h, h, -h, -h, h);
    fill(c2);
    circle(h * 0.4, h * 0.4, size * 0.3);
  }

  else if (shape === "flowers") {
    noStroke();
    fill(c1);
    for (let i = 0; i < petals; i++) {
      push();
      rotate((i * TWO_PI) / petals);
      ellipse(size * 0.24, 0, size * 0.48, size * 0.22);
      pop();
    }
    fill(c2);
    circle(0, 0, size * 0.28);
  }

  else if (shape === "bullseyes") {
    noStroke();
    for (let i = petals; i > 0; i--) {
      // % swaps the ring colors back and forth
      fill(i % 2 === 0 ? c1 : i % 3 === 0 ? bg : c2);
      circle(0, 0, (size * i) / petals);
    }
  }
}

// ---------- surprise me ----------
function surprise() {
  const p = random(PALETTES);
  for (let i = 0; i < 4; i++) pickers[i].value(p[i]);

  shapeSelect.selected(random(SHAPES));
  turnSelect.selected(random(TURN_MODES));
  colorSelect.selected(random(COLOR_MODES));
  gridSlider.value(floor(random(4, 13)));
  sizeSlider.value(floor(random(50, 100)));
  weightSlider.value(floor(random(6, 26)));
  petalSlider.value(floor(random(4, 10)));
  fillCheckbox.checked(random() < 0.4);
  seed = floor(random(100000));
}

// ---------- control helpers ----------
function addRow(label) {
  const row = createDiv("").parent("controls").class("row");
  if (label) createElement("label", label).parent(row);
  return row;
}

function addSlider(label, min, max, val, step) {
  return createSlider(min, max, val, step).parent(addRow(label));
}

function addSelect(label, options, selected) {
  const sel = createSelect().parent(addRow(label));
  for (const o of options) sel.option(o);
  sel.selected(selected);
  return sel;
}