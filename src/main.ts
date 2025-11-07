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

// --- Marker Tool Buttons ---
const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
document.body.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
document.body.appendChild(thickButton);

// --- Sticker List (data-driven, Step 9) ---
const stickers: string[] = ["😀", "⭐", "🌸"];
let stickerButtons: { emoji: string; button: HTMLButtonElement }[] = [];

// Render all sticker buttons
function renderStickerButtons() {
  for (const { button } of stickerButtons) {
    button.remove();
  }
  stickerButtons = [];

  for (const emoji of stickers) {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
      currentTool = "sticker";
      currentSticker = emoji;

      // UI feedback
      thinButton.classList.remove("selectedTool");
      thickButton.classList.remove("selectedTool");
      stickerButtons.forEach((s) => s.button.classList.remove("selectedTool"));
      btn.classList.add("selectedTool");
    });

    stickerButtons.push({ emoji, button: btn });
  }
}

renderStickerButtons();

// --- Custom Sticker Button (Step 9) ---
const addStickerButton = document.createElement("button");
addStickerButton.textContent = "➕ Custom Sticker";
document.body.appendChild(addStickerButton);

addStickerButton.addEventListener("click", () => {
  const result = prompt("Enter a custom sticker (emoji or text):", "🔥");
  if (result && result.trim() !== "") {
    stickers.push(result);
    renderStickerButtons();
  }
});

// --- Clear / Undo / Redo ---
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.appendChild(clearButton);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
document.body.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.appendChild(redoButton);

// ✅ Export PNG (Step 10)
const exportButton = document.createElement("button");
exportButton.textContent = "Export PNG";
document.body.appendChild(exportButton);

// Drawing context
const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.strokeStyle = "black";

// State
let isDrawing = false;
let currentThickness = 2;

let currentTool: "marker" | "sticker" = "marker";
let currentSticker: string | null = null;

// --- DisplayCommand interface ---
interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

// --- MarkerCommand ---
class MarkerCommand implements DisplayCommand {
  private points: [number, number][] = [];
  constructor(start: [number, number], private thickness: number) {
    this.points.push(start);
  }
  drag(x: number, y: number) {
    this.points.push([x, y]);
  }
  display(ctx: CanvasRenderingContext2D) {
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

// --- ToolPreview (red circle) ---
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
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// --- StickerPreview ---
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

// --- StickerCommand ---
class StickerCommand implements DisplayCommand {
  constructor(private x: number, private y: number, private emoji: string) {}
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// Global variables
let toolPreview: DisplayCommand | null = null;
let drawing: DisplayCommand[] = [];
let redoStack: DisplayCommand[] = [];
let currentCommand: DisplayCommand | null = null;

// ---------- Mouse Events ----------
canvas.addEventListener("mousedown", (e) => {
  const [x, y] = getMousePos(e);
  isDrawing = true;

  if (currentTool === "marker") {
    currentCommand = new MarkerCommand([x, y], currentThickness);
  } else if (currentTool === "sticker" && currentSticker) {
    currentCommand = new StickerCommand(x, y, currentSticker);
  }

  if (currentCommand) {
    drawing.push(currentCommand);
    redoStack = [];
    toolPreview = null;
  }

  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  const [x, y] = getMousePos(e);

  if (!isDrawing) {
    if (currentTool === "marker") {
      toolPreview = new ToolPreview(x, y, currentThickness);
    } else if (currentTool === "sticker" && currentSticker) {
      toolPreview = new StickerPreview(x, y, currentSticker);
    }
    redraw();
  } else if (currentCommand) {
    if (currentCommand instanceof MarkerCommand) {
      currentCommand.drag(x, y);
    } else if (currentCommand instanceof StickerCommand) {
      currentCommand.drag(x, y);
    }
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

// ---------- Buttons ----------
clearButton.addEventListener("click", () => {
  drawing = [];
  redoStack = [];
  redraw();
});

undoButton.addEventListener("click", () => {
  if (drawing.length === 0) return;
  redoStack.push(drawing.pop()!);
  redraw();
});

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  drawing.push(redoStack.pop()!);
  redraw();
});

//  --- Export PNG Logic ---
exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;

  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(4, 4); // upscale 256 → 1024

  for (const cmd of drawing) {
    cmd.display(exportCtx);
  }

  const imageData = exportCanvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = imageData;
  link.download = "sticker_sketchpad_export.png";
  link.click();
});

// ---------- Helpers ----------
function getMousePos(event: MouseEvent): [number, number] {
  const rect = canvas.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top];
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of drawing) cmd.display(ctx);
  if (toolPreview && !isDrawing) toolPreview.display(ctx);
}

// ---------- Marker Tool Selection ----------
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
