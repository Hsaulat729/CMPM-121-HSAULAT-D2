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

// ✅ Step 5: Add undo/redo buttons (still here)
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

// ✅ Step 5: Define interface and command implementation
interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerCommand implements DisplayCommand {
  private points: [number, number][] = [];

  constructor(start: [number, number]) {
    this.points.push(start);
  }

  drag(x: number, y: number) {
    this.points.push([x, y]);
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.beginPath();
    const [startX, startY] = this.points[0];
    ctx.moveTo(startX, startY);
    for (let i = 1; i < this.points.length; i++) {
      const [x, y] = this.points[i];
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// Use command objects instead of raw arrays
let drawing: DisplayCommand[] = [];
let redoStack: DisplayCommand[] = [];
let currentCommand: MarkerCommand | null = null;

// --- Event listeners ---
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  [lastX, lastY] = getMousePos(e);

  // start a new command
  currentCommand = new MarkerCommand([lastX, lastY]);
  drawing.push(currentCommand);
  redoStack = [];
  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !currentCommand) return;
  const [x, y] = getMousePos(e);
  currentCommand.drag(x, y);
  redraw();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentCommand = null;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  currentCommand = null;
});

// --- Clear button logic ---
clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawing = [];
  redoStack = [];
});

// --- Undo button logic ---
undoButton.addEventListener("click", () => {
  if (drawing.length === 0) return;
  const last = drawing.pop()!;
  redoStack.push(last);
  redraw();
});

// --- Redo button logic ---
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

// --- Redraw function ---
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of drawing) {
    cmd.display(ctx); // ✅ call each command’s display method
  }
}
