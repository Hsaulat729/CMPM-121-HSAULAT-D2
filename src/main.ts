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

// --- Marker tool buttons ---
const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
document.body.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
document.body.appendChild(thickButton);

// --- Sticker buttons (✅ Step 8) ---
const stickerButtons: { emoji: string; button: HTMLButtonElement }[] = [];
const stickers = ["😀", "⭐", "🌸"];

for (const emoji of stickers) {
  const btn = document.createElement("button");
  btn.textContent = emoji;
  document.body.appendChild(btn);
  stickerButtons.push({ emoji, button: btn });
}

// --- Clear / Undo / Redo buttons ---
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.appendChild(clearButton);

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

// --- Tool state ---
let currentThickness = 2;
let currentTool: "marker" | "sticker" = "marker";
let currentSticker: string | null = null;

// --- Interfaces and commands ---
interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

// --- MarkerCommand (lines) ---
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
    const [sx, sy] = this.points[0];
    ctx.moveTo(sx, sy);
    for (let i = 1; i < this.points.length; i++) {
      const [x, y] = this.points[i];
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// --- ToolPreview (red circle for markers) ---
class ToolPreview implements DisplayCommand {
  constructor(
    private x: number,
    private y: number,
    private thickness: number,
  ) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "red";
    ctx.fillStyle = "rgba(255,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// --- StickerPreview (✅ Step 8: shows ghost sticker before placement) ---
class StickerPreview implements DisplayCommand {
  constructor(private x: number, private y: number, private emoji: string) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// --- StickerCommand (✅ Step 8: permanent sticker) ---
class StickerCommand implements DisplayCommand {
  private x: number;
  private y: number;
  private emoji: string;
  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }
  drag(x: number, y: number) {
    this.x = x;
    this.y = y; // reposition sticker while dragging
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// --- Global data ---
let toolPreview: DisplayCommand | null = null;
let drawing: DisplayCommand[] = [];
let redoStack: DisplayCommand[] = [];
let currentCommand: DisplayCommand | null = null;

// --- Event listeners ---
canvas.addEventListener("mousedown", (e) => {
  const [x, y] = getMousePos(e);
  isDrawing = true;

  if (currentTool === "marker") {
    currentCommand = new MarkerCommand([x, y], currentThickness);
    drawing.push(currentCommand);
    redoStack = [];
    toolPreview = null;
  } else if (currentTool === "sticker" && currentSticker) {
    currentCommand = new StickerCommand(x, y, currentSticker);
    drawing.push(currentCommand);
    redoStack = [];
    toolPreview = null;
  }

  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  const [x, y] = getMousePos(e);

  if (!isDrawing) {
    // Show preview depending on tool
    if (currentTool === "marker") {
      toolPreview = new ToolPreview(x, y, currentThickness);
    } else if (currentTool === "sticker" && currentSticker) {
      toolPreview = new StickerPreview(x, y, currentSticker);
    }
    redraw();
  } else if (currentCommand instanceof MarkerCommand) {
    currentCommand.drag(x, y);
    redraw();
  } else if (currentCommand instanceof StickerCommand) {
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
  drawing = [];
  redoStack = [];
  redraw();
});

// --- Undo / Redo logic ---
undoButton.addEventListener("click", () => {
  if (drawing.length === 0) return;
  const last = drawing.pop()!;
  redoStack.push(last);
  redraw();
});

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const restored = redoStack.pop()!;
  drawing.push(restored);
  redraw();
});

// --- Helper ---
function getMousePos(event: MouseEvent): [number, number] {
  const rect = canvas.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top];
}

// --- Redraw function ---
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of drawing) cmd.display(ctx);
  if (toolPreview && !isDrawing) toolPreview.display(ctx);
}

// --- Tool selection logic ---
thinButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = 2;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  stickerButtons.forEach((s) => s.button.classList.remove("selectedTool"));
});

thickButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = 6;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
  stickerButtons.forEach((s) => s.button.classList.remove("selectedTool"));
});

// ✅ Sticker tool selection logic
for (const { emoji, button } of stickerButtons) {
  button.addEventListener("click", () => {
    currentTool = "sticker";
    currentSticker = emoji;
    thinButton.classList.remove("selectedTool");
    thickButton.classList.remove("selectedTool");
    stickerButtons.forEach((s) => s.button.classList.remove("selectedTool"));
    button.classList.add("selectedTool");
  });
}
