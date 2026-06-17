// ===== 拼豆图纸生成器 主逻辑 =====
(function () {
  'use strict';

  if (!window.MARD221) { throw new Error('mard221.js 未加载'); }
  const PALETTE = window.MARD221.palette;
  const BY_CODE = window.MARD221.byCode;

  // ===== 状态 =====
  const state = {
    srcImage: null,        // HTMLImageElement
    grid: null,            // 二维数组 grid[y][x] = palette index (或 -1 = 空/透明)
    gridW: 71,
    gridH: 71,
    cellSize: 16,          // 当前每格的像素大小 (受缩放影响)
    baseCellSize: 16,      // 100% 缩放时的格子大小
    zoom: 1,
    tool: 'move',
    currentColor: 0,       // palette index
    showGrid: true,
    showCodes: true,
    includeTransparent: true,
    dither: false,
    lockRatio: true,
    history: [],
    historyIdx: -1,
    isDrawing: false,
    spacePanning: false,
    lastPan: null,
    hoverCell: null
  };

  const MAX_HISTORY = 60;
  const TRANSPARENT = -1;

  // ===== DOM =====
  const $ = (id) => document.getElementById(id);
  const board = $('board');
  const ctx = board.getContext('2d');

  // ===== 工具函数 =====
  function toast(msg, ms) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add('hidden'), ms || 1800);
  }

  function cloneGrid(g) {
    return g.map((row) => row.slice());
  }

  function emptyGrid(w, h) {
    const g = new Array(h);
    for (let y = 0; y < h; y++) g[y] = new Array(w).fill(TRANSPARENT);
    return g;
  }

  // ===== 历史记录 =====
  function pushHistory() {
    if (!state.grid) return;
    // 截断 redo 分支
    state.history = state.history.slice(0, state.historyIdx + 1);
    state.history.push(cloneGrid(state.grid));
    if (state.history.length > MAX_HISTORY) state.history.shift();
    else state.historyIdx++;
    updateHistoryButtons();
  }

  function undo() {
    if (state.historyIdx <= 0) return;
    state.historyIdx--;
    state.grid = cloneGrid(state.history[state.historyIdx]);
    render();
    updateMaterials();
    updateHistoryButtons();
  }

  function redo() {
    if (state.historyIdx >= state.history.length - 1) return;
    state.historyIdx++;
    state.grid = cloneGrid(state.history[state.historyIdx]);
    render();
    updateMaterials();
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $('btn-undo').disabled = state.historyIdx <= 0;
    $('btn-redo').disabled = state.historyIdx >= state.history.length - 1;
  }

  // ===== 图像处理: 生成图纸 =====
  function generatePattern() {
    if (!state.srcImage) return;

    const w = clampInt($('grid-w').value, 4, 200);
    let h = clampInt($('grid-h').value, 4, 200);
    state.gridW = w;
    state.gridH = h;

    state.includeTransparent = $('opt-include-transparent').checked;
    state.dither = $('opt-dither').checked;

    // 把原图绘制到离屏 canvas, 缩放到目标格数
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.clearRect(0, 0, w, h);
    octx.drawImage(state.srcImage, 0, 0, w, h);
    const imgData = octx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const grid = emptyGrid(w, h);

    if (state.dither) {
      // Floyd-Steinberg 抖动: RGB 缓存 + LAB 空间误差计算 + 误差钳位
      const rgbToLab = window.MARD221.rgbToLab;
      const buf = new Float32Array(w * h * 3);
      for (let i = 0; i < w * h; i++) {
        buf[i * 3] = data[i * 4];
        buf[i * 3 + 1] = data[i * 4 + 1];
        buf[i * 3 + 2] = data[i * 4 + 2];
      }
      var MAX_LAB_ERR = 22;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 3;
          const r = buf[i], g = buf[i + 1], b = buf[i + 2];
          const idx = window.MARD221.nearestIndex(
            clampByte(r), clampByte(g), clampByte(b), state.includeTransparent
          );
          grid[y][x] = idx;
          const pal = PALETTE[idx].rgb;
          // 在 LAB 空间计算误差 (感知均匀)
          const curLab = rgbToLab(clampByte(r), clampByte(g), clampByte(b));
          const palLab = window.MARD221.getLab(idx);
          var eL = curLab.L - palLab.L;
          var ea = curLab.a - palLab.a;
          var eb = curLab.b - palLab.b;
          // 钳位: 限制单像素误差幅度
          var mag = Math.sqrt(eL * eL + ea * ea + eb * eb);
          if (mag > MAX_LAB_ERR) { var s = MAX_LAB_ERR / mag; eL *= s; ea *= s; eb *= s; }
          // 将 LAB 误差按比例映射回 RGB 空间用于扩散
          var dr = r - pal.r, dg = g - pal.g, db = b - pal.b;
          var rgbMag = Math.sqrt(dr * dr + dg * dg + db * db);
          var labMag = Math.sqrt(eL * eL + ea * ea + eb * eb);
          var ratio = rgbMag > 0.5 ? labMag / rgbMag : 0;
          dr *= ratio; dg *= ratio; db *= ratio;
          distribute(buf, w, h, x + 1, y, dr, dg, db, 7 / 16);
          distribute(buf, w, h, x - 1, y + 1, dr, dg, db, 3 / 16);
          distribute(buf, w, h, x, y + 1, dr, dg, db, 5 / 16);
          distribute(buf, w, h, x + 1, y + 1, dr, dg, db, 1 / 16);
        }
      }
    } else {
      // 直接最近色匹配
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const a = data[i + 3];
          if (a < 128 && state.includeTransparent) { grid[y][x] = TRANSPARENT; continue; }
          grid[y][x] = window.MARD221.nearestIndex(
            data[i], data[i + 1], data[i + 2], state.includeTransparent
          );
        }
      }
    }

    state.grid = grid;
    state.history = [cloneGrid(grid)];
    state.historyIdx = 0;
    updateHistoryButtons();
    fitZoom();
    render();
    updateMaterials();
    enableEditingUI(true);
  }

  function distribute(buf, w, h, x, y, er, eg, eb, factor) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = (y * w + x) * 3;
    buf[i] += er * factor;
    buf[i + 1] += eg * factor;
    buf[i + 2] += eb * factor;
  }

  function clampByte(v) { return Math.min(255, Math.max(0, Math.round(v))); }
  function clampInt(v, lo, hi) {
    v = parseInt(v, 10);
    if (isNaN(v)) v = lo;
    return Math.max(lo, Math.min(hi, v));
  }

  // ===== 渲染 =====
  var RULER = 28;

  function render() {
    if (!state.grid) return;
    const cs = state.cellSize;
    const w = state.gridW, h = state.gridH;
    const cw = w * cs, ch = h * cs;
    board.width = cw + RULER;
    board.height = ch + RULER;
    const ox = RULER, oy = RULER;

    // 背景: 棋盘格透明示意
    ctx.clearRect(0, 0, board.width, board.height);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = state.grid[y][x];
        const px = ox + x * cs, py = oy + y * cs;
        if (idx === TRANSPARENT) {
          const dark = (x + y) % 2 === 0;
          ctx.fillStyle = dark ? '#f0f0f0' : '#e4e4e4';
          ctx.fillRect(px, py, cs, cs);
        } else {
          ctx.fillStyle = PALETTE[idx].hex;
          ctx.fillRect(px, py, cs, cs);
        }
      }
    }

    // 网格线
    if (state.showGrid && cs >= 6) {
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x++) {
        ctx.moveTo(ox + x * cs + 0.5, oy);
        ctx.lineTo(ox + x * cs + 0.5, oy + ch);
      }
      for (let y = 0; y <= h; y++) {
        ctx.moveTo(ox, oy + y * cs + 0.5);
        ctx.lineTo(ox + cw, oy + y * cs + 0.5);
      }
      ctx.stroke();

      // 每 10 格加粗线
      ctx.strokeStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath();
      for (let x = 0; x <= w; x += 10) {
        ctx.moveTo(ox + x * cs + 0.5, oy);
        ctx.lineTo(ox + x * cs + 0.5, oy + ch);
      }
      for (let y = 0; y <= h; y += 10) {
        ctx.moveTo(ox, oy + y * cs + 0.5);
        ctx.lineTo(ox + cw, oy + y * cs + 0.5);
      }
      ctx.stroke();
    }

    // 色号文字
    if (state.showCodes && cs >= 14) {
      ctx.font = `${Math.floor(cs / 3.2)}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = state.grid[y][x];
          if (idx === TRANSPARENT) continue;
          const c = PALETTE[idx];
          const rgb = c.rgb;
          const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
          ctx.fillStyle = lum > 0.55 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
          ctx.fillText(c.code, ox + x * cs + cs / 2, oy + y * cs + cs / 2);
        }
      }
    }

    // ===== 坐标刻度尺 =====
    drawRuler(w, h, cs, ox, oy, cw, ch);
  }

  function drawRuler(w, h, cs, ox, oy, cw, ch) {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, board.width, RULER);
    ctx.fillRect(0, 0, RULER, board.height);
    ctx.strokeStyle = '#d0d4da';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(RULER - 0.5, 0); ctx.lineTo(RULER - 0.5, board.height);
    ctx.moveTo(0, RULER - 0.5); ctx.lineTo(board.width, RULER - 0.5);
    ctx.stroke();

    var tickFont = Math.max(9, Math.min(11, cs * 0.55));
    ctx.font = tickFont + 'px ui-monospace, Menlo, monospace';
    ctx.fillStyle = '#5c6470';
    ctx.strokeStyle = '#8a929c';
    ctx.lineWidth = 1;

    // 顶部 X 轴
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let x = 0; x <= w; x++) {
      var px = ox + x * cs;
      var isMajor = x % 10 === 0;
      ctx.beginPath();
      ctx.moveTo(px + 0.5, RULER - (isMajor ? 8 : 4));
      ctx.lineTo(px + 0.5, RULER);
      ctx.stroke();
      if (isMajor && x < w) {
        ctx.fillText(String(x), px + cs / 2, RULER - 9);
      }
    }

    // 左侧 Y 轴
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = 0; y <= h; y++) {
      var py = oy + y * cs;
      var isMajor = y % 10 === 0;
      ctx.beginPath();
      ctx.moveTo(RULER - (isMajor ? 8 : 4), py + 0.5);
      ctx.lineTo(RULER, py + 0.5);
      ctx.stroke();
      if (isMajor && y < h) {
        ctx.fillText(String(y), RULER - 9, py + cs / 2);
      }
    }

    // 右侧 X 轴 (镜像)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    var rx = ox + cw;
    for (let x = 0; x <= w; x++) {
      var px = ox + x * cs;
      var isMajor = x % 10 === 0;
      ctx.beginPath();
      ctx.moveTo(px + 0.5, RULER - (isMajor ? 8 : 4));
      ctx.lineTo(px + 0.5, RULER);
      ctx.stroke();
    }

    // 底部 Y 轴 (镜像)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    var by = oy + ch;
    for (let y = 0; y <= h; y++) {
      var py = oy + y * cs;
      var isMajor = y % 10 === 0;
      ctx.beginPath();
      ctx.moveTo(RULER - (isMajor ? 8 : 4), py + 0.5);
      ctx.lineTo(RULER, py + 0.5);
      ctx.stroke();
    }
  }

  // ===== 编辑工具 =====
  function eventToCell(e) {
    const rect = board.getBoundingClientRect();
    const scaleX = board.width / rect.width;
    const scaleY = board.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX - RULER;
    const py = (e.clientY - rect.top) * scaleY - RULER;
    const x = Math.floor(px / state.cellSize);
    const y = Math.floor(py / state.cellSize);
    if (x < 0 || x >= state.gridW || y < 0 || y >= state.gridH) return null;
    return { x, y };
  }

  function applyTool(cell, recordHistory) {
    if (!cell || !state.grid) return false;
    const { x, y } = cell;
    const cur = state.grid[y][x];
    let changed = false;
    switch (state.tool) {
      case 'brush':
        if (cur !== state.currentColor) { state.grid[y][x] = state.currentColor; changed = true; }
        break;
      case 'eraser':
        if (cur !== TRANSPARENT) { state.grid[y][x] = TRANSPARENT; changed = true; }
        break;
      case 'eyedropper':
        if (cur !== TRANSPARENT) { setCurrentColor(cur); toast('已拾取: ' + PALETTE[cur].code); }
        break;
      case 'fill':
        changed = floodFill(x, y, state.currentColor);
        break;
    }
    return changed;
  }

  function floodFill(sx, sy, newIdx) {
    const target = state.grid[sy][sx];
    if (target === newIdx) return false;
    const w = state.gridW, h = state.gridH;
    let changed = false;
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      if (state.grid[y][x] !== target) continue;
      state.grid[y][x] = newIdx;
      changed = true;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return changed;
  }

  function globalReplace(fromIdx, toIdx) {
    if (!state.grid || fromIdx === toIdx) return;
    let count = 0;
    for (let y = 0; y < state.gridH; y++) {
      for (let x = 0; x < state.gridW; x++) {
        if (state.grid[y][x] === fromIdx) { state.grid[y][x] = toIdx; count++; }
      }
    }
    return count;
  }

  // ===== 当前色 / 调色板 =====
  function setCurrentColor(idx) {
    state.currentColor = idx;
    const c = PALETTE[idx];
    $('cur-swatch').style.background = c.hex;
    $('cur-code').textContent = c.code + (c.transparent ? ' (透)' : '');
    document.querySelectorAll('.pc').forEach((el) => {
      el.classList.toggle('selected', el.dataset.idx == idx);
    });
  }

  function buildPalette() {
    const grid = $('palette-grid');
    grid.innerHTML = '';
    const filter = $('palette-filter').querySelector('.pf.active').dataset.series;
    const q = $('palette-search').value.trim().toLowerCase();
    PALETTE.forEach((c, idx) => {
      if (filter !== 'ALL' && c.series !== filter) return;
      if (q) {
        const hay = (c.code + ' ' + c.name + ' ' + c.hex).toLowerCase();
        if (!hay.includes(q)) return;
      }
      const el = document.createElement('div');
      el.className = 'pc' + (c.transparent ? ' transparent-mark' : '');
      el.style.background = c.hex;
      el.title = `${c.code} · ${c.name} · ${c.hex}`;
      el.dataset.idx = idx;
      if (idx === state.currentColor) el.classList.add('selected');
      el.addEventListener('click', () => setCurrentColor(idx));
      grid.appendChild(el);
    });
  }

  // ===== 材料清单 =====
  function updateMaterials() {
    if (!state.grid) { return; }
    const counts = {};
    let total = 0;
    for (let y = 0; y < state.gridH; y++) {
      for (let x = 0; x < state.gridW; x++) {
        const idx = state.grid[y][x];
        if (idx === TRANSPARENT) continue;
        counts[idx] = (counts[idx] || 0) + 1;
        total++;
      }
    }
    const list = $('materials-list');
    list.innerHTML = '';
    if (total === 0) {
      list.innerHTML = '<p class="muted">图纸为空</p>';
      $('mat-summary').textContent = '';
      return;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    $('mat-summary').textContent = `${entries.length} 种色 · 共 ${total} 颗`;
    entries.forEach(([idx, cnt]) => {
      const c = PALETTE[idx];
      const row = document.createElement('div');
      row.className = 'mat-row';
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = c.hex;
      const code = document.createElement('span');
      code.className = 'mat-code';
      code.textContent = c.code;
      const name = document.createElement('span');
      name.className = 'mat-name';
      name.textContent = c.name + (c.transparent ? ' (透)' : '');
      const count = document.createElement('span');
      count.className = 'mat-count';
      count.textContent = cnt;
      row.appendChild(swatch);
      row.appendChild(code);
      row.appendChild(name);
      row.appendChild(count);
      row.addEventListener('click', () => setCurrentColor(parseInt(idx, 10)));
      list.appendChild(row);
    });
  }

  // ===== 缩放 =====
  function setZoom(z) {
    state.zoom = Math.max(0.25, Math.min(6, z));
    state.cellSize = Math.max(2, Math.round(state.baseCellSize * state.zoom));
    $('zoom-label').textContent = Math.round(state.zoom * 100) + '%';
    render();
  }
  function fitZoom() {
    if (!state.grid) return;
    const wrap = $('canvas-wrap');
    const availW = wrap.clientWidth - 32;
    const availH = wrap.clientHeight - 32;
    const fitX = availW / (state.gridW * state.baseCellSize);
    const fitY = availH / (state.gridH * state.baseCellSize);
    setZoom(Math.min(fitX, fitY, 4));
  }

  // ===== UI 启用/禁用 =====
  function enableEditingUI(on) {
    $('btn-regen').disabled = !on;
    $('grid-w').disabled = !on;
    $('grid-h').disabled = !on;
    $('opt-dither').disabled = !on;
    $('opt-include-transparent').disabled = !on;
    $('btn-export-coded').disabled = !on;
    $('btn-export-png').disabled = !on;
    $('btn-export-csv').disabled = !on;
    $('btn-replace').disabled = !on;
    $('grid-info').textContent = on ? `${state.gridW} × ${state.gridH} 格` : '';
    $('canvas-empty').classList.toggle('hidden', on);
    $('canvas-wrap').classList.toggle('hidden', !on);
    $('canvas-toolbar').classList.toggle('hidden', !on);
  }

  function updateBoardCursor() {
    board.style.cursor = state.tool === 'move' ? 'grab' : 'crosshair';
  }

  // ===== 导出 =====
  var MAX_CANVAS_PX = 8192;

  function calcExportCellSize(desiredCs, w, h) {
    var cs = desiredCs;
    if (w * cs > MAX_CANVAS_PX) cs = Math.floor(MAX_CANVAS_PX / w);
    if (h * cs > MAX_CANVAS_PX) cs = Math.min(cs, Math.floor(MAX_CANVAS_PX / h));
    return Math.max(4, cs);
  }

  function exportCodedPNG() {
    if (!state.grid) return;
    var w = state.gridW, h = state.gridH;
    var cs = calcExportCellSize(48, w, h);
    var c = document.createElement('canvas');
    c.width = w * cs; c.height = h * cs;
    const x = c.getContext('2d');
    // 白底
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < h; y++) {
      for (let i = 0; i < w; i++) {
        const idx = state.grid[y][i];
        const px = i * cs, py = y * cs;
        if (idx === TRANSPARENT) {
          // 透明格画斜线纹
          x.fillStyle = '#f6f6f6'; x.fillRect(px, py, cs, cs);
          x.strokeStyle = '#ccc'; x.lineWidth = 1;
          x.beginPath();
          x.moveTo(px, py + cs); x.lineTo(px + cs, py);
          x.stroke();
        } else {
          x.fillStyle = PALETTE[idx].hex; x.fillRect(px, py, cs, cs);
        }
      }
    }
    // 网格线
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1;
    x.beginPath();
    for (let i = 0; i <= w; i++) { x.moveTo(i * cs + 0.5, 0); x.lineTo(i * cs + 0.5, h * cs); }
    for (let j = 0; j <= h; j++) { x.moveTo(0, j * cs + 0.5); x.lineTo(w * cs, j * cs + 0.5); }
    x.stroke();
    x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 2;
    x.beginPath();
    for (let i = 0; i <= w; i += 10) { x.moveTo(i * cs, 0); x.lineTo(i * cs, h * cs); }
    for (let j = 0; j <= h; j += 10) { x.moveTo(0, j * cs); x.lineTo(w * cs, j * cs); }
    x.stroke();
    // 色号
    x.font = `600 ${Math.floor(cs / 3)}px ui-monospace, Menlo, monospace`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let y = 0; y < h; y++) {
      for (let i = 0; i < w; i++) {
        const idx = state.grid[y][i];
        if (idx === TRANSPARENT) continue;
        const col = PALETTE[idx];
        const rgb = col.rgb;
        const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        x.fillStyle = lum > 0.55 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)';
        x.fillText(col.code, i * cs + cs / 2, y * cs + cs / 2);
      }
    }
    downloadCanvas(c, '拼豆图纸-带色号.png');
    toast('已导出带色号图纸');
  }

  function exportBitmapPNG() {
    if (!state.grid) return;
    var w = state.gridW, h = state.gridH;
    var cs = calcExportCellSize(24, w, h);
    var c = document.createElement('canvas');
    c.width = w * cs; c.height = h * cs;
    const x = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let i = 0; i < w; i++) {
        const idx = state.grid[y][i];
        if (idx === TRANSPARENT) continue;
        x.fillStyle = PALETTE[idx].hex;
        x.fillRect(i * cs, y * cs, cs, cs);
      }
    }
    downloadCanvas(c, '拼豆图纸-位图.png');
    toast('已导出位图');
  }

  function exportCSV() {
    if (!state.grid) return;
    const counts = {};
    for (let y = 0; y < state.gridH; y++) {
      for (let i = 0; i < state.gridW; i++) {
        const idx = state.grid[y][i];
        if (idx === TRANSPARENT) continue;
        counts[idx] = (counts[idx] || 0) + 1;
      }
    }
    const entries = Object.entries(counts)
      .map(([idx, cnt]) => ({ c: PALETTE[idx], n: cnt }))
      .sort((a, b) => b.n - a.n);
    const total = entries.reduce((s, e) => s + e.n, 0);
    let csv = '\uFEFF色号,名称,HEX,系列,透明,数量,占比(%)\n';
    entries.forEach((e) => {
      const pct = ((e.n / total) * 100).toFixed(1);
      csv += `${e.c.code},${e.c.name},${e.c.hex},${e.c.series},${e.c.transparent ? '是' : '否'},${e.n},${pct}\n`;
    });
    csv += `,,,,合计,${total},100\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = '拼豆材料清单.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出材料清单');
  }

  function downloadCanvas(canvas, filename) {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ===== 文件上传 =====
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      toast('请选择图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.srcImage = img;
        $('src-img').src = e.target.result;
        $('src-preview').classList.remove('hidden');
        // 自适应默认宽度 ~48, 高度按比例
        const ratio = img.height / img.width;
        let w = 71;
        let h = Math.round(w * ratio);
        if (h > 64) { h = 64; w = Math.round(h / ratio); }
        w = clampInt(w, 4, 200);
        h = clampInt(h, 4, 200);
        $('grid-w').value = w;
        $('grid-h').value = h;
        state.gridW = w; state.gridH = h;
        generatePattern();
        toast('图纸已生成');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ===== 事件绑定 =====
  function bind() {
    // 上传
    const dz = $('dropzone');
    dz.addEventListener('click', () => $('file-input').click());
    $('file-input').addEventListener('change', (e) => handleFile(e.target.files[0]));
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault(); dz.classList.remove('drag');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    $('btn-reupload').addEventListener('click', () => $('file-input').click());

    // 设置
    $('btn-regen').addEventListener('click', () => { generatePattern(); toast('已重新生成'); });
    $('grid-w').addEventListener('change', () => {
      if (state.lockRatio && state.srcImage) {
        const ratio = state.srcImage.height / state.srcImage.width;
        $('grid-h').value = clampInt(Math.round(clampInt($('grid-w').value, 4, 200) * ratio), 4, 200);
      }
    });
    $('grid-h').addEventListener('change', () => {
      if (state.lockRatio && state.srcImage) {
        const ratio = state.srcImage.width / state.srcImage.height;
        $('grid-w').value = clampInt(Math.round(clampInt($('grid-h').value, 4, 200) * ratio), 4, 200);
      }
    });

    // 工具
    document.querySelectorAll('#tool-buttons .tool').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#tool-buttons .tool').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        state.tool = b.dataset.tool;
        updateBoardCursor();
      });
    });

    $('btn-undo').addEventListener('click', undo);
    $('btn-redo').addEventListener('click', redo);

    // 调色板
    $('palette-search').addEventListener('input', buildPalette);
    $('palette-filter').addEventListener('click', (e) => {
      const btn = e.target.closest('.pf');
      if (!btn) return;
      $('palette-filter').querySelectorAll('.pf').forEach((x) => x.classList.remove('active'));
      btn.classList.add('active');
      buildPalette();
    });

    // 画布交互
    board.addEventListener('mousedown', (e) => {
      if (!state.grid) return;
      if (state.spacePanning || state.tool === 'move') {
        state.isDrawing = false;
        state.lastPan = { x: e.clientX, y: e.clientY };
        $('canvas-wrap').style.cursor = 'grabbing';
        return;
      }
      const cell = eventToCell(e);
      if (state.tool === 'fill') {
        if (cell) { applyTool(cell); render(); updateMaterials(); pushHistory(); }
        return;
      }
      state.isDrawing = true;
      let changed = applyTool(cell);
      if (changed) { render(); updateMaterials(); }
    });
    board.addEventListener('mousemove', (e) => {
      if (!state.grid) return;
      if (state.lastPan) {
        const wrap = $('canvas-wrap');
        wrap.scrollLeft -= e.clientX - state.lastPan.x;
        wrap.scrollTop -= e.clientY - state.lastPan.y;
        state.lastPan = { x: e.clientX, y: e.clientY };
        return;
      }
      const cell = eventToCell(e);
      state.hoverCell = cell;
      // hover tip
      updateHoverTip(e, cell);
      if (state.isDrawing && cell && (state.tool === 'brush' || state.tool === 'eraser')) {
        if (applyTool(cell)) { render(); updateMaterials(); }
      }
    });
    board.addEventListener('mouseleave', () => {
      $('hover-tip').classList.add('hidden');
      state.hoverCell = null;
    });
    window.addEventListener('mouseup', () => {
      if (state.lastPan) {
        state.lastPan = null;
        $('canvas-wrap').style.cursor = '';
      }
      if (state.isDrawing) { state.isDrawing = false; pushHistory(); }
    });

    // 缩放
    $('btn-zoom-in').addEventListener('click', () => setZoom(state.zoom * 1.25));
    $('btn-zoom-out').addEventListener('click', () => setZoom(state.zoom / 1.25));
    $('btn-zoom-fit').addEventListener('click', fitZoom);
    $('canvas-wrap').addEventListener('wheel', (e) => {
      if (!state.grid) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(state.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
      }
    }, { passive: false });

    // 显示选项
    $('opt-show-grid').addEventListener('change', (e) => { state.showGrid = e.target.checked; render(); });
    $('opt-show-codes').addEventListener('change', (e) => { state.showCodes = e.target.checked; render(); });

    // 全局替换对话框
    $('btn-replace').addEventListener('click', openReplaceModal);
    $('rep-cancel').addEventListener('click', () => $('replace-modal').classList.add('hidden'));
    $('rep-from-select').addEventListener('change', updateReplaceFromSwatch);
    $('rep-to-input').addEventListener('input', updateReplaceToSwatch);
    $('rep-ok').addEventListener('click', () => {
      const fromIdx = parseInt($('rep-from-select').value, 10);
      const toCode = $('rep-to-input').value.trim().toUpperCase();
      const toColor = BY_CODE[toCode];
      if (!toColor) { toast('找不到目标色号'); return; }
      const toIdx = PALETTE.indexOf(toColor);
      const n = globalReplace(fromIdx, toIdx);
      render(); updateMaterials(); pushHistory();
      $('replace-modal').classList.add('hidden');
      toast(`已替换 ${n || 0} 格`);
    });

    // 导出
    $('btn-export-coded').addEventListener('click', exportCodedPNG);
    $('btn-export-png').addEventListener('click', exportBitmapPNG);
    $('btn-export-csv').addEventListener('click', exportCSV);

    // 键盘
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if (e.code === 'Space' && !state.spacePanning && !e.repeat) {
        e.preventDefault();
        state.spacePanning = true;
        $('canvas-wrap').style.cursor = 'grab';
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      const map = { KeyV: 'move', KeyB: 'brush', KeyI: 'eyedropper', KeyE: 'eraser', KeyG: 'fill' };
      const t = map[e.code];
      if (t) {
        state.tool = t;
        document.querySelectorAll('#tool-buttons .tool').forEach((x) =>
          x.classList.toggle('active', x.dataset.tool === t));
        updateBoardCursor();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        state.spacePanning = false;
        $('canvas-wrap').style.cursor = '';
      }
    });
  }

  function updateHoverTip(e, cell) {
    const tip = $('hover-tip');
    if (!cell) { tip.classList.add('hidden'); return; }
    const idx = state.grid[cell.y][cell.x];
    if (idx === TRANSPARENT) {
      tip.textContent = `(${cell.x}, ${cell.y}) 空`;
    } else {
      const c = PALETTE[idx];
      tip.textContent = `${c.code} ${c.name}`;
    }
    tip.classList.remove('hidden');
    const wrapRect = $('canvas-wrap').getBoundingClientRect();
    tip.style.left = (e.clientX - wrapRect.left + 12) + 'px';
    tip.style.top = (e.clientY - wrapRect.top + 12) + 'px';
  }

  function openReplaceModal() {
    if (!state.grid) return;
    // 填充"从色号"为图中用到的色
    const sel = $('rep-from-select');
    sel.innerHTML = '';
    const counts = {};
    for (let y = 0; y < state.gridH; y++)
      for (let x = 0; x < state.gridW; x++) {
        const idx = state.grid[y][x];
        if (idx !== TRANSPARENT) counts[idx] = (counts[idx] || 0) + 1;
      }
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([idx, cnt]) => {
      const c = PALETTE[idx];
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${c.code} ${c.name} (${cnt}颗)`;
      sel.appendChild(opt);
    });
    updateReplaceFromSwatch();
    $('rep-to-input').value = '';
    updateReplaceToSwatch();
    $('replace-modal').classList.remove('hidden');
  }
  function updateReplaceFromSwatch() {
    const idx = parseInt($('rep-from-select').value, 10);
    if (!isNaN(idx)) $('rep-from-swatch').style.background = PALETTE[idx].hex;
  }
  function updateReplaceToSwatch() {
    const code = $('rep-to-input').value.trim().toUpperCase();
    const c = BY_CODE[code];
    $('rep-to-swatch').style.background = c ? c.hex : 'transparent';
  }

  // ===== 初始化 =====
  function init() {
    buildPalette();
    setCurrentColor(0);
    bind();
    enableEditingUI(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
