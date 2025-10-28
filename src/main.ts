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

// --- Tool buttons (Step 6: thin/thick markers) ---
const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
document.body.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
document.body.appendChild(thickButton);

// --- Clear button ---
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.appendChild(clearButton);

// --- Undo/Redo buttons ---
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

// --- Marker thickness state ---
let currentThickness = 2;

// --- Interface and command implementation ---
interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerCommand implements DisplayCommand {
  private points: [number, number][] = [];
  private thickness: number;

  constructor(start: [number, number], thickness: number) {
    this.points.push(start);
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push([x, y]);
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.save();
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    const [startX, startY] = this.points[0];
    ctx.moveTo(startX, startY);
    for (let i = 1; i < this.points.length; i++) {
      const [x, y] = this.points[i];
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// --- Tool preview command (Step 7) ---
class ToolPreview implements DisplayCommand {
  constructor(
    private x: number,
    private y: number,
    private thickness: number,
  ) {}

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = 0.7; // visible transparency
    ctx.strokeStyle = "red"; // 🔴 red outline
    ctx.fillStyle = "rgba(255,0,0,0.15)"; // 🔴 light red fill
    ctx.lineWidth = 1;
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// --- Global data ---
let toolPreview: ToolPreview | null = null;
let drawing: DisplayCommand[] = [];
let redoStack: DisplayCommand[] = [];
let currentCommand: MarkerCommand | null = null;

// --- Event listeners ---
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  [lastX, lastY] = getMousePos(e);

  currentCommand = new MarkerCommand([lastX, lastY], currentThickness);
  drawing.push(currentCommand);
  redoStack = [];
  toolPreview = null;
  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  const [x, y] = getMousePos(e);

  if (!isDrawing) {
    toolPreview = new ToolPreview(x, y, currentThickness);
    redraw();
  } else if (currentCommand) {
    currentCommand.drag(x, y);
    redraw();
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentCommand = null;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  currentCommand = null;
  toolPreview = null;
  redraw();
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
    cmd.display(ctx);
  }
  if (toolPreview && !isDrawing) {
    toolPreview.display(ctx);
  }
}

// --- Tool selection logic ---
thinButton.addEventListener("click", () => {
  currentThickness = 2;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});
