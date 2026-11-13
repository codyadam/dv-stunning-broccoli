import { changeFile, changeKind, DELETED, type CodebaseTimelapse } from "../types";

type Actor = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  lastAt: number;
  files: number[];
  /** False until the first frame, which drops the actor straight where it belongs */
  placed: boolean;
};

/** Canvas colors for one page theme. Glows and beams blend with `blend` over the files. */
type CanvasPalette = {
  blend: GlobalCompositeOperation;
  skeleton: string;
  added: string;
  deleted: string;
  modified: string;
  label: string;
};

export const DARK_PALETTE: CanvasPalette = {
  blend: "lighter",
  skeleton: "rgba(148, 163, 184, 0.16)",
  added: "#4ade80",
  deleted: "#f87171",
  modified: "#e2e8f0",
  label: "rgba(248, 250, 252, 0.9)",
};

export const LIGHT_PALETTE: CanvasPalette = {
  blend: "multiply",
  skeleton: "rgba(100, 116, 139, 0.28)",
  added: "#22c55e",
  deleted: "#ef4444",
  modified: "#94a3b8",
  label: "rgba(15, 23, 42, 0.85)",
};

type Rect = { x: number; y: number; width: number; height: number };

const UNKNOWN_PERSON = "#94a3b8";
const MAX_BEAMS = 40;
/** Pixels between parked contributors, and the cell size of the grid used to find empty space for them */
const PARK_STEP = 9;
/** Margin parked contributors keep from the canvas edges */
const PARK_EDGE = 8;

/** A block of parked contributors centered on a point in the tree's space */
type Parking = { x: number; y: number; cols: number; rows: number };

/** On-screen distance under which an easing value lands on its target */
const SETTLE_PX = 0.05;

/** Eases `from` toward `to` by `rate`, landing on `to` once within `epsilon` of it. */
function approach(from: number, to: number, rate: number, epsilon: number) {
  const next = from + (to - from) * rate;
  return Math.abs(to - next) < epsilon ? to : next;
}

type CellRect = { col: number; row: number; cols: number; rows: number };

/**
 * The empty rectangle with the highest positive `score(cols, rows)` in a row-major
 * grid where nonzero cells are taken, or null. `score` must grow with both sides.
 */
function bestEmptyRect(
  grid: Uint8Array,
  cols: number,
  rows: number,
  score: (cols: number, rows: number) => number,
): CellRect | null {
  // Every maximal empty rectangle sits on top of some row's histogram of empty cells.
  const heights = new Int32Array(cols);
  const stack: number[] = [];
  let best: CellRect | null = null;
  let bestScore = 0;
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) heights[c] = grid[row * cols + c] ? 0 : heights[c] + 1;
    stack.length = 0;
    for (let c = 0; c <= cols; c++) {
      const h = c < cols ? heights[c] : 0;
      while (stack.length && heights[stack[stack.length - 1]] >= h) {
        const height = heights[stack.pop()!];
        const left = stack.length ? stack[stack.length - 1] + 1 : 0;
        const value = height ? score(c - left, height) : 0;
        if (value > bestScore) {
          best = { col: left, row: row - height + 1, cols: c - left, rows: height };
          bestScore = value;
        }
      }
      stack.push(c);
    }
  }
  return best;
}

/**
 * Replays file events up to any point in time and draws the tree onto a
 * canvas. Seeking forward applies new commits; seeking backward replays from
 * the start, which takes a few milliseconds even for thousands of commits.
 */
export class TimelapseEngine {
  private readonly fileX: Float32Array;
  private readonly fileY: Float32Array;
  private readonly fileDir: Int32Array;
  private readonly fileLanguage: Int32Array;
  private readonly dirX: Float32Array;
  private readonly dirY: Float32Array;
  private readonly dirParent: Int32Array;
  private readonly byLanguage: number[][];

  private readonly alive: Uint8Array;
  private readonly touchedAt: Float64Array;
  private readonly touchKind: Uint8Array;
  private readonly subtree: Int32Array;
  private actors = new Map<number, Actor>();
  private cursor = 0;
  private camera = { x: 0, y: 0, scale: 0 };

  time: number;
  aliveCount = 0;
  /** Alive files per language, indexed like `data.languages` */
  readonly languageFiles: Int32Array;
  font = "ui-sans-serif, system-ui";
  /** Must match the background the canvas sits on */
  palette = DARK_PALETTE;
  /** Contributor names next to their dots while they work; parked contributors never show one */
  labels = true;
  /** Canvas regions covered by other UI, in canvas pixels. Parked contributors stay out of them. */
  blocked: Rect[] = [];
  private parking: Parking | null = null;
  private parkGrid = new Uint8Array(0);
  /** Opacity of the glow on modified files, 0 to hide it; added and deleted files keep theirs */
  modifiedGlow = 1;
  /** How far to magnify around `focus` while it is set, 1 to never zoom */
  pressZoom = 1;
  /**
   * How much further from the center than the pointer the zoom looks, so pointing
   * near an edge shows a little past it. 1 keeps the point under the pointer fixed.
   */
  zoomReach = 1.5;
  /** Where to zoom, in canvas pixels, or null to zoom back out */
  focus: { x: number; y: number } | null = null;
  private zoom = { x: 0, y: 0, z: 1 };

  constructor(private readonly data: CodebaseTimelapse) {
    const files = data.files.length;
    const dirs = data.dirs.length;
    this.fileX = new Float32Array(files);
    this.fileY = new Float32Array(files);
    this.fileDir = new Int32Array(files);
    this.fileLanguage = new Int32Array(files);
    this.byLanguage = data.languages.map(() => []);
    this.languageFiles = new Int32Array(data.languages.length);
    data.files.forEach(([dir, x, y, lang], i) => {
      this.fileX[i] = x;
      this.fileY[i] = y;
      this.fileDir[i] = dir;
      this.fileLanguage[i] = lang;
      this.byLanguage[lang]?.push(i);
    });
    this.dirX = new Float32Array(dirs);
    this.dirY = new Float32Array(dirs);
    this.dirParent = new Int32Array(dirs);
    data.dirs.forEach(([parent, x, y], i) => {
      this.dirX[i] = x;
      this.dirY[i] = y;
      this.dirParent[i] = parent;
    });
    this.alive = new Uint8Array(files);
    this.touchedAt = new Float64Array(files).fill(-Infinity);
    this.touchKind = new Uint8Array(files);
    this.subtree = new Int32Array(dirs);
    this.time = data.start;
  }

  private reset() {
    this.alive.fill(0);
    this.touchedAt.fill(-Infinity);
    this.subtree.fill(0);
    this.languageFiles.fill(0);
    this.actors.clear();
    this.cursor = 0;
    this.aliveCount = 0;
  }

  private setAlive(file: number, alive: boolean) {
    if (Boolean(this.alive[file]) === alive) return;
    this.alive[file] = alive ? 1 : 0;
    this.aliveCount += alive ? 1 : -1;
    const lang = this.fileLanguage[file];
    if (lang < this.languageFiles.length) this.languageFiles[lang] += alive ? 1 : -1;
    for (let d = this.fileDir[file]; d >= 0; d = this.dirParent[d]) {
      this.subtree[d] += alive ? 1 : -1;
    }
  }

  /** `trailWindow` is how far back (in repo seconds) commits still spawn actors. */
  seek(time: number, trailWindow: number) {
    if (time < this.time) this.reset();
    const commits = this.data.commits;
    while (this.cursor < commits.length && commits[this.cursor][0] <= time) {
      const [at, person, changes] = commits[this.cursor++];
      let cx = 0;
      let cy = 0;
      for (const code of changes) {
        const file = changeFile(code);
        const kind = changeKind(code);
        this.setAlive(file, kind !== DELETED);
        this.touchedAt[file] = at;
        this.touchKind[file] = kind;
        cx += this.fileX[file];
        cy += this.fileY[file];
      }
      if (time - at > trailWindow || !changes.length) continue;
      cx /= changes.length;
      cy /= changes.length;
      const len = Math.hypot(cx, cy) || 1;
      const tx = cx + (cx / len) * 40;
      const ty = cy + (cy / len) * 40;
      const actor = this.actors.get(person);
      const files = changes.slice(0, MAX_BEAMS).map(changeFile);
      if (actor) Object.assign(actor, { tx, ty, lastAt: at, files });
      else this.actors.set(person, { x: tx, y: ty, tx, ty, lastAt: at, files, placed: false });
    }
    this.time = time;
  }

  /**
   * Where parked contributors wait: a near-square block anchored in the tree's space,
   * so it pans and zooms with the tree while its dots keep their pixel size. The block
   * stays while its spot stays empty, otherwise it moves to the center of the empty
   * spot with the most room around it. Empty means no files and no `blocked` UI,
   * judged under the camera without the press zoom so zooming never moves it. When no
   * spot fits everyone the block shrinks to the largest square that fits, and null
   * means not even one fits.
   */
  private park(width: number, height: number, count: number): Parking | null {
    const { alive, fileX, fileY, camera } = this;
    const cols = Math.max(0, Math.floor((width - PARK_EDGE * 2) / PARK_STEP));
    const rows = Math.max(0, Math.floor((height - PARK_EDGE * 2) / PARK_STEP));
    if (this.parkGrid.length !== cols * rows) this.parkGrid = new Uint8Array(cols * rows);
    const grid = this.parkGrid;
    grid.fill(0);
    const cell = (v: number) => Math.floor((v - PARK_EDGE) / PARK_STEP);
    const mark = (x0: number, y0: number, x1: number, y1: number) => {
      const c0 = Math.max(0, cell(x0));
      const c1 = Math.min(cols - 1, cell(x1));
      for (let row = Math.max(0, cell(y0)); row <= Math.min(rows - 1, cell(y1)); row++) {
        if (c0 <= c1) grid.fill(1, row * cols + c0, row * cols + c1 + 1);
      }
    };
    const s = camera.scale;
    const ox = width / 2 - camera.x * s;
    const oy = height / 2 - camera.y * s;
    for (let i = 0; i < alive.length; i++) {
      if (!alive[i]) continue;
      const x = fileX[i] * s + ox;
      const y = fileY[i] * s + oy;
      mark(x - PARK_STEP, y - PARK_STEP, x + PARK_STEP, y + PARK_STEP);
    }
    for (const b of this.blocked) mark(b.x - PARK_EDGE, b.y - PARK_EDGE, b.x + b.width + PARK_EDGE, b.y + b.height + PARK_EDGE);

    const isEmpty = (x: number, y: number, blockCols: number, blockRows: number) => {
      const left = x * s + ox - (blockCols * PARK_STEP) / 2;
      const top = y * s + oy - (blockRows * PARK_STEP) / 2;
      const c0 = cell(left);
      const r0 = cell(top);
      const c1 = Math.ceil((left + blockCols * PARK_STEP - PARK_EDGE) / PARK_STEP) - 1;
      const r1 = Math.ceil((top + blockRows * PARK_STEP - PARK_EDGE) / PARK_STEP) - 1;
      if (c0 < 0 || r0 < 0 || c1 >= cols || r1 >= rows) return false;
      for (let row = r0; row <= r1; row++) {
        for (let c = c0; c <= c1; c++) if (grid[row * cols + c]) return false;
      }
      return true;
    };

    let blockCols = Math.ceil(Math.sqrt(count));
    let blockRows = Math.ceil(count / blockCols);
    const current = this.parking;
    if (current && isEmpty(current.x, current.y, blockCols, blockRows)) {
      this.parking = { x: current.x, y: current.y, cols: blockCols, rows: blockRows };
      return this.parking;
    }

    let found = bestEmptyRect(grid, cols, rows, (c, r) =>
      c >= blockCols && r >= blockRows ? Math.min(c - blockCols, r - blockRows) + 1 : 0,
    );
    if (!found) {
      found = bestEmptyRect(grid, cols, rows, (c, r) => Math.min(c, r));
      if (found) blockCols = blockRows = Math.min(found.cols, found.rows);
    }
    this.parking = found && {
      x: (PARK_EDGE + (found.col + found.cols / 2) * PARK_STEP - ox) / s,
      y: (PARK_EDGE + (found.row + found.rows / 2) * PARK_STEP - oy) / s,
      cols: blockCols,
      rows: blockRows,
    };
    return this.parking;
  }

  /**
   * `actorWindow` is how long (in repo seconds) contributors stay in the tree after their last commit.
   * With a `restWindow`, they then park that long in an empty spot of the tree instead of fading out.
   * When no empty spot holds them all, the longest idle leave early. On the final frame everyone parks.
   *
   * Returns whether the camera, the zoom and every contributor have reached their targets, so drawing
   * again at the same time and settings would paint the same frame.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    glowWindow: number,
    actorWindow = glowWindow * 4,
    restWindow = 0,
  ): boolean {
    const { data, alive, fileX, fileY, camera, palette } = this;
    const now = this.time;
    const named = this.labels;
    if (width <= 0 || height <= 0) return true;

    // Fit the camera to everything alive, easing so growth feels like a zoom-out.
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < alive.length; i++) {
      if (!alive[i]) continue;
      if (fileX[i] < minX) minX = fileX[i];
      if (fileX[i] > maxX) maxX = fileX[i];
      if (fileY[i] < minY) minY = fileY[i];
      if (fileY[i] > maxY) maxY = fileY[i];
    }
    if (minX === Infinity) {
      minX = minY = -50;
      maxX = maxY = 50;
    }
    const pad = 40;
    const targetScale = Math.min(width / (maxX - minX + pad * 2), height / (maxY - minY + pad * 2), 4);
    const targetX = (minX + maxX) / 2;
    const targetY = (minY + maxY) / 2;
    const ease = camera.scale === 0 ? 1 : 0.06;
    camera.scale = approach(camera.scale, targetScale, ease, targetScale * 1e-4);
    camera.x = approach(camera.x, targetX, ease, SETTLE_PX / targetScale);
    camera.y = approach(camera.y, targetY, ease, SETTLE_PX / targetScale);
    let settled = camera.scale === targetScale && camera.x === targetX && camera.y === targetY;

    // Magnify around the pointer, keeping the point under it fixed. Zooming out stays centered on where it left.
    const { zoom } = this;
    const focus = this.focus && {
      x: width / 2 + (this.focus.x - width / 2) * this.zoomReach,
      y: height / 2 + (this.focus.y - height / 2) * this.zoomReach,
    };
    if (focus && zoom.z < 1.01) Object.assign(zoom, focus);
    else if (focus) {
      zoom.x = approach(zoom.x, focus.x, 0.4, SETTLE_PX);
      zoom.y = approach(zoom.y, focus.y, 0.4, SETTLE_PX);
      settled &&= zoom.x === focus.x && zoom.y === focus.y;
    }
    const zoomTarget = focus ? this.pressZoom : 1;
    zoom.z = approach(zoom.z, zoomTarget, 0.12, 1e-3);
    settled &&= zoom.z === zoomTarget;

    const s = camera.scale * zoom.z;
    const ox = zoom.x + (width / 2 - camera.x * camera.scale - zoom.x) * zoom.z;
    const oy = zoom.y + (height / 2 - camera.y * camera.scale - zoom.y) * zoom.z;

    ctx.clearRect(0, 0, width, height);

    // Directory skeleton.
    ctx.beginPath();
    for (let d = 0; d < this.subtree.length; d++) {
      const p = this.dirParent[d];
      if (p < 0 || this.subtree[d] === 0) continue;
      ctx.moveTo(this.dirX[p] * s + ox, this.dirY[p] * s + oy);
      ctx.lineTo(this.dirX[d] * s + ox, this.dirY[d] * s + oy);
    }
    ctx.strokeStyle = palette.skeleton;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Files, batched per language.
    const r = Math.max(1.15 * s, 0.75);
    for (const [lang, files] of this.byLanguage.entries()) {
      ctx.beginPath();
      for (const i of files) {
        if (alive[i]) ctx.rect(fileX[i] * s + ox - r, fileY[i] * s + oy - r, r * 2, r * 2);
      }
      ctx.fillStyle = data.languages[lang].color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = `500 10px ${this.font}`;

    // Recently touched files glow: green added, red deleted, neutral modified.
    ctx.globalCompositeOperation = palette.blend;
    for (let i = 0; i < alive.length; i++) {
      const age = now - this.touchedAt[i];
      if (age > glowWindow || age < 0) continue;
      const a = 1 - age / glowWindow;
      const kind = this.touchKind[i];
      if (kind === 1 && this.modifiedGlow === 0) continue;
      ctx.globalAlpha = a * 0.9 * (kind === 1 ? this.modifiedGlow : 1);
      ctx.fillStyle = kind === 0 ? palette.added : kind === DELETED ? palette.deleted : palette.modified;
      ctx.beginPath();
      ctx.arc(fileX[i] * s + ox, fileY[i] * s + oy, r + 3 * a + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Contributors fly to the files they touch and beam at them. Once idle, they park in an empty spot.
    for (const [person, actor] of this.actors) {
      const age = now - actor.lastAt;
      if (age > actorWindow + restWindow || age < 0) this.actors.delete(person);
    }
    const rest = restWindow > 0;
    const finished = now >= data.end;
    // Longest idle first, so newcomers join at the end and nobody reshuffles.
    const resting = [...this.actors]
      .filter(([, a]) => rest && (finished || now - a.lastAt > actorWindow))
      .sort(([pa, a], [pb, b]) => a.lastAt - b.lastAt || pa - pb)
      .map(([person]) => person);
    const parking = resting.length ? this.park(width, height, resting.length) : null;
    const capacity = parking ? parking.cols * parking.rows : 0;
    for (const person of resting.splice(0, Math.max(0, resting.length - capacity))) this.actors.delete(person);

    ctx.textAlign = "left";
    for (const [person, actor] of this.actors) {
      const age = now - actor.lastAt;
      const slot = resting.indexOf(person);
      // Pixel offsets from the block's anchor, so parked dots keep their spacing while the tree zooms.
      const tx =
        parking && slot >= 0
          ? parking.x * s + ox + ((slot % parking.cols) - (parking.cols - 1) / 2) * PARK_STEP
          : actor.tx * s + ox;
      const ty =
        parking && slot >= 0
          ? parking.y * s + oy + (Math.floor(slot / parking.cols) - (parking.rows - 1) / 2) * PARK_STEP
          : actor.ty * s + oy;
      const ease = actor.placed ? 0.12 : 1;
      actor.placed = true;
      const ax = approach(actor.x * s + ox, tx, ease, SETTLE_PX);
      const ay = approach(actor.y * s + oy, ty, ease, SETTLE_PX);
      settled &&= ax === tx && ay === ty;
      actor.x = (ax - ox) / s;
      actor.y = (ay - oy) / s;
      const color = data.people[person]?.color ?? UNKNOWN_PERSON;
      let fade = Math.min(1, (actorWindow - age) / (actorWindow * 0.4));
      if (rest) fade = slot >= 0 ? 0.6 * Math.min(1, (actorWindow + restWindow - age) / (restWindow * 0.3)) : 1;

      if (slot < 0 && age < glowWindow) {
        ctx.globalAlpha = (1 - age / glowWindow) * 0.4;
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (const f of actor.files) {
          ctx.moveTo(ax, ay);
          ctx.lineTo(fileX[f] * s + ox, fileY[f] * s + oy);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = fade;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ax, ay, slot >= 0 ? 3 : 4, 0, Math.PI * 2);
      ctx.fill();
      if (named && slot < 0) {
        ctx.fillStyle = palette.label;
        ctx.fillText(data.people[person]?.name ?? "", ax + 8, ay + 4);
      }
      ctx.globalCompositeOperation = palette.blend;
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    return settled;
  }
}
