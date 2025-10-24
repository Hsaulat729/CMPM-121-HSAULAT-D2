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

// ✅ --- Undo/Redo buttons ---
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
document.body.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.appendChild(redoButton);

// --- Drawing context ---
const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.strokeStyle = "black";

// --- State variables ---
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// ✅ --- Data structures for undo/redo ---
type Point = [number, number];
let drawing: Point[][] = [];
let currentStroke: Point[] | null = null;
let redoStack: Point[][] = [];

// --- Event listeners ---
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  [lastX, lastY] = getMousePos(e);

  // ✅ start new stroke
  currentStroke = [];
  drawing.push(currentStroke);
  redoStack = [];
  currentStroke.push([lastX, lastY]);
  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !currentStroke) return;
  const [x, y] = getMousePos(e);
  currentStroke.push([x, y]);
  redraw();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentStroke = null;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  currentStroke = null;
});

// --- Clear button logic ---
clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawing = [];
  redoStack = [];
});

// ✅ --- Undo button logic ---
undoButton.addEventListener("click", () => {
  if (drawing.length === 0) return;
  const last = drawing.pop()!;
  redoStack.push(last);
  redraw();
});

// ✅ --- Redo button logic ---
redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const restored = redoStack.pop()!;
  drawing.push(restored);
  redraw();
});

// --- Helper: get mouse position relative to canvas ---
function getMousePos(event: MouseEvent): [number, number] {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return [x, y];
}

// ✅ --- Redraw function ---
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  for (const stroke of drawing) {
    if (stroke.length === 0) continue;
    const [startX, startY] = stroke[0];
    ctx.moveTo(startX, startY);
    for (let i = 1; i < stroke.length; i++) {
      const [x, y] = stroke[i];
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}
