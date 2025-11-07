import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
`;

const title = document.createElement("h1");
title.textContent = "Sticker Sketchpad";
document.body.appendChild(title);

// Canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchCanvas";
document.body.appendChild(canvas);

// Marker tool buttons
const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
document.body.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
document.body.appendChild(thickButton);

// Sticker preset sets
const stickerSets = {
  friendly: ["😀", "⭐", "🌸", "😎", "🎵"],
  animals: ["🐱", "🐶", "🐸", "🐢", "🐙"],
  space: ["🚀", "🪐", "⭐", "🌙", "👽"],
};

// Sticker set selector
const stickerSetSelect = document.createElement("select");
stickerSetSelect.innerHTML = `
  <option value="friendly">Friendly Set</option>
  <option value="animals">Animal Set</option>
  <option value="space">Space Set</option>
`;
document.body.appendChild(stickerSetSelect);

// Sticker size slider
const sizeLabel = document.createElement("label");
sizeLabel.textContent = "Sticker Size: ";
document.body.appendChild(sizeLabel);

const stickerSizeInput = document.createElement("input");
stickerSizeInput.type = "range";
stickerSizeInput.min = "16";
stickerSizeInput.max = "32";
stickerSizeInput.value = "24";
document.body.appendChild(stickerSizeInput);

let currentStickerSize = 24;
stickerSizeInput.addEventListener("input", () => {
  currentStickerSize = parseInt(stickerSizeInput.value);
});

// Sticker commands
let stickers = [...stickerSets.friendly];
let stickerButtons: { emoji: string; button: HTMLButtonElement }[] = [];

// Render sticker buttons
function renderStickerButtons() {
  for (const { button } of stickerButtons) button.remove();
  stickerButtons = [];

  for (const emoji of stickers) {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
      currentTool = "sticker";
      currentSticker = emoji;

      thinButton.classList.remove("selectedTool");
      thickButton.classList.remove("selectedTool");
      stickerButtons.forEach((s) => s.button.classList.remove("selectedTool"));
      btn.classList.add("selectedTool");
    });

    stickerButtons.push({ emoji, button: btn });
  }
}

renderStickerButtons();

// Handle preset selection
stickerSetSelect.addEventListener("change", () => {
  stickers = [
    ...stickerSets[stickerSetSelect.value as keyof typeof stickerSets],
  ];
  renderStickerButtons();
});

// Custom sticker button
const addStickerButton = document.createElement("button");
addStickerButton.textContent = "Add Custom Sticker";
document.body.appendChild(addStickerButton);

addStickerButton.addEventListener("click", () => {
  const result = prompt("Enter a custom sticker (emoji or text):", "🔥");
  if (result && result.trim() !== "") {
    stickers.push(result);
    renderStickerButtons();
  }
});

// Utility buttons
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.appendChild(clearButton);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
document.body.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.appendChild(redoButton);

const exportButton = document.createElement("button");
exportButton.textContent = "Export PNG";
document.body.appendChild(exportButton);

// Canvas context
const ctx = canvas.getContext("2d")!;
ctx.lineCap = "round";

// Drawing state
let isDrawing = false;
let currentThickness = 2;

let currentTool: "marker" | "sticker" = "marker";
let currentSticker: string | null = null;

// Command interface
interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
  drag?(x: number, y: number): void;
}

// Marker command
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

// Marker preview circle
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

// Sticker preview
class StickerPreview implements DisplayCommand {
  constructor(private x: number, private y: number, private emoji: string) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.font = `${currentStickerSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// Sticker placement
class StickerCommand implements DisplayCommand {
  constructor(private x: number, private y: number, private emoji: string) {}
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = `${currentStickerSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// Global drawing data
let drawing: DisplayCommand[] = [];
let redoStack: DisplayCommand[] = [];
let currentCommand: DisplayCommand | null = null;
let toolPreview: DisplayCommand | null = null;

// Mouse events
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
    currentCommand.drag?.(x, y);

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

// Button logic
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

// Export PNG
exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(4, 4);

  for (const cmd of drawing) cmd.display(exportCtx);

  const imageData = exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageData;
  link.download = "sticker_sketchpad_export.png";
  link.click();
});

// Helpers
function getMousePos(event: MouseEvent): [number, number] {
  const rect = canvas.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top];
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of drawing) cmd.display(ctx);
  if (toolPreview && !isDrawing) toolPreview.display(ctx);
}

// Marker selection
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
