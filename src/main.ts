import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
`;

const title = document.createElement("h1");
title.textContent = "Sticker Sketchpad";
document.body.appendChild(title);

// Create canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchCanvas";
document.body.appendChild(canvas);

// --- Clear button ---
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.appendChild(clearButton);

// --- Drawing context ---
const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.strokeStyle = "black";

// --- Data model ---
type Point = { x: number; y: number };
let drawing: Point[][] = []; // array of strokes, each stroke = array of points
let currentStroke: Point[] | null = null;

// --- Helper: get mouse position ---
function getMousePos(event: MouseEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

// --- Redraw function ---
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  for (const stroke of drawing) {
    if (stroke.length === 0) continue;
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      const p = stroke[i];
      ctx.lineTo(p.x, p.y);
    }
  }

  ctx.stroke();
}

// --- Event observer for "drawing-changed" ---
canvas.addEventListener("drawing-changed", redraw);

// --- Dispatch helper ---
function notifyDrawingChanged() {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
}

// --- Mouse event handlers ---
canvas.addEventListener("mousedown", (e) => {
  currentStroke = [];
  drawing.push(currentStroke);
  currentStroke.push(getMousePos(e));
  notifyDrawingChanged();
});

canvas.addEventListener("mousemove", (e) => {
  if (!currentStroke) return;
  currentStroke.push(getMousePos(e));
  notifyDrawingChanged();
});

canvas.addEventListener("mouseup", () => {
  currentStroke = null;
});

canvas.addEventListener("mouseleave", () => {
  currentStroke = null;
});

// --- Clear button logic ---
clearButton.addEventListener("click", () => {
  drawing = [];
  notifyDrawingChanged();
});
