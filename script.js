(() => {
    'use strict';

    /* ---------- Constantes del juego ---------- */
    const COLS = 10;
    const ROWS = 20;
    const TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const SHAPES = {
      I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      O: [[1, 1], [1, 1]],
      S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
    };
    const KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-2, 0], [2, 0], [0, -2]];
    const LINE_SCORE = [0, 100, 300, 500, 800];
    const GRAVITY = [0.85, 0.73, 0.62, 0.52, 0.43, 0.35, 0.28, 0.22, 0.16, 0.12, 0.09, 0.07, 0.055, 0.045, 0.035];
    const LOCK_DELAY = 0.45;
    const CLEAR_TIME = 0.16;
    const SOFT_INTERVAL = 0.04;
    const BEST_KEY = 'nova-blocks-best';
    const MUTE_KEY = 'nova-blocks-muted';

    /* ---------- Referencias del DOM ---------- */
    const $ = (id) => document.getElementById(id);
    const boardCanvas = $('board');
    const ctx = boardCanvas.getContext('2d');
    const nextCanvas = $('next');
    const nextCtx = nextCanvas.getContext('2d');
    const holdCanvas = $('hold');
    const holdCtx = holdCanvas.getContext('2d');
    const scoreEl = $('score');
    const levelEl = $('level');
    const linesEl = $('lines');
    const bestEl = $('best');
    const overlay = $('overlay');
    const ovTitle = $('ovTitle');
    const ovText = $('ovText');
    const ovHint = $('ovHint');
    const ovResult = $('ovResult');
    const ovScore = $('ovScore');
    const ovBest = $('ovBest');
    const ovPrimary = $('ovPrimary');
    const ovSecondary = $('ovSecondary');
    const pauseBtn = $('pauseBtn');
    const iconPause = $('iconPause');
    const iconPlay = $('iconPlay');
    const soundBtn = $('soundBtn');
    const iconSoundOn = $('iconSoundOn');
    const iconSoundOff = $('iconSoundOff');
    const restartBtn = $('restartBtn');
    const restartTop = $('restartTop');
    const liveEl = $('live');

    /* ---------- Tokens de color ---------- */
    const rootCss = getComputedStyle(document.documentElement);
    const token = (name, fallback) => rootCss.getPropertyValue(name).trim() || fallback;
    const COLORS = {
      board: token('--board', '#080a0f'),
      grid: token('--grid-line', 'rgba(255,255,255,0.04)'),
      flash: token('--flash', '#ffffff'),
      gloss: token('--gloss', '#ffffff'),
      shade: token('--shade', '#000000'),
      accent: token('--accent', '#6ef2b5'),
      muted: token('--muted', '#8e99ab')
    };
    const PIECE = {
      I: token('--piece-i', '#4fd6ee'),
      J: token('--piece-j', '#5b8cff'),
      L: token('--piece-l', '#ffa14f'),
      O: token('--piece-o', '#ffd45e'),
      S: token('--piece-s', '#67de8f'),
      T: token('--piece-t', '#c98bff'),
      Z: token('--piece-z', '#ff7070')
    };
    const FONT_MONO = token('--font-mono', 'monospace');
    const nf = new Intl.NumberFormat('es-CO');

    const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = reduceMQ.matches;
    reduceMQ.addEventListener('change', (e) => { reduceMotion = e.matches; });

    const compactMQ = window.matchMedia('(max-width: 820px)');
    let compact = compactMQ.matches;
    compactMQ.addEventListener('change', (e) => { compact = e.matches; });

    const coarse = window.matchMedia('(pointer: coarse)').matches;

    /* ---------- Estado ---------- */
    let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let piece = null;
    let queue = [];
    let bag = [];
    let holdType = null;
    let holdUsed = false;
    let score = 0;
    let lines = 0;
    let level = 1;
    let state = 'idle';
    let dropTimer = 0;
    let lockTimer = 0;
    let lockResets = 15;
    let softKey = false;
    let softTouch = false;
    let clearing = null;
    let particles = [];
    let popups = [];
    let shake = 0;
    let best = 0;
    let muted = false;

    let boardW = 300;
    let boardH = 600;
    let boardDpr = 1;
    let cellW = 30;
    let cellH = 30;
    let nextBox = { w: 0, h: 0 };
    let holdBox = { w: 0, h: 0 };

    /* ---------- Lienzos y medidas ---------- */
    function prepareCanvas(cv, c, w, h) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(1, Math.round(w * dpr));
      const H = Math.max(1, Math.round(h * dpr));
      if (cv.width !== W || cv.height !== H) {
        cv.width = W;
        cv.height = H;
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      return dpr;
    }

    function measureBoxes() {
      const r1 = nextCanvas.getBoundingClientRect();
      const r2 = holdCanvas.getBoundingClientRect();
      nextBox = { w: r1.width, h: r1.height };
      holdBox = { w: r2.width, h: r2.height };
    }

    function fitBoard() {
      const rect = boardCanvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      boardDpr = prepareCanvas(boardCanvas, ctx, rect.width, rect.height);
      boardW = rect.width;
      boardH = rect.height;
      cellW = boardW / COLS;
      cellH = boardH / ROWS;
      measureBoxes();
    }

    /* ---------- Dibujo ---------- */
    function pathRoundRect(c, x, y, w, h, r) {
      const rr = Math.max(0, Math.min(r, w / 2, h / 2));
      c.beginPath();
      c.moveTo(x + rr, y);
      c.arcTo(x + w, y, x + w, y + h, rr);
      c.arcTo(x + w, y + h, x, y + h, rr);
      c.arcTo(x, y + h, x, y, rr);
      c.arcTo(x, y, x + w, y, rr);
      c.closePath();
    }

    function drawBlock(c, x, y, w, h, color, alpha = 1, ghost = false) {
      const pad = Math.max(1, Math.min(w, h) * 0.06);
      const r = Math.max(2, Math.min(w, h) * 0.19);
      const bx = x + pad;
      const by = y + pad;
      const bw = w - pad * 2;
      const bh = h - pad * 2;

      if (ghost) {
        pathRoundRect(c, bx, by, bw, bh, r);
        c.globalAlpha = 0.42 * alpha;
        c.strokeStyle = color;
        c.lineWidth = Math.max(1.4, Math.min(w, h) * 0.06);
        c.stroke();
        c.globalAlpha = 0.08 * alpha;
        c.fillStyle = color;
        c.fill();
        c.globalAlpha = 1;
        return;
      }

      pathRoundRect(c, bx, by, bw, bh, r);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.fill();

      c.globalAlpha = 0.2 * alpha;
      c.fillStyle = COLORS.gloss;
      pathRoundRect(c, bx + bw * 0.12, by + bh * 0.1, bw * 0.76, bh * 0.27, r * 0.7);
      c.fill();

      c.globalAlpha = 0.14 * alpha;
      c.fillStyle = COLORS.shade;
      c.fillRect(bx + bw * 0.12, by + bh * 0.77, bw * 0.76, bh * 0.13);
      c.globalAlpha = 1;
    }

    function boundsOf(m) {
      let minR = 99, maxR = -1, minC = 99, maxC = -1;
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (!m[r][c]) continue;
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
      return { minR, maxR, minC, maxC };
    }

    function drawPreview(cv, c, box, items) {
      if (!box.w || !box.h) return;
      prepareCanvas(cv, c, box.w, box.h);
      c.clearRect(0, 0, box.w, box.h);

      if (!items.length) {
        const s = Math.min(box.w, box.h) * 0.4;
        c.globalAlpha = 0.5;
        c.strokeStyle = COLORS.muted;
        c.lineWidth = 1.4;
        c.setLineDash([4, 4]);
        pathRoundRect(c, (box.w - s) / 2, (box.h - s) / 2, s, s, 8);
        c.stroke();
        c.setLineDash([]);
        c.globalAlpha = 1;
        return;
      }

      const slotH = box.h / items.length;
      let widest = 1;
      let tallest = 1;
      for (const it of items) {
        const b = boundsOf(SHAPES[it.type]);
        widest = Math.max(widest, b.maxC - b.minC + 1);
        tallest = Math.max(tallest, b.maxR - b.minR + 1);
      }
      const size = Math.min(box.w / (widest + 1.6), slotH / (tallest + 0.7), 22);

      items.forEach((it, i) => {
        const m = SHAPES[it.type];
        const b = boundsOf(m);
        const pw = (b.maxC - b.minC + 1) * size;
        const ph = (b.maxR - b.minR + 1) * size;
        const ox = (box.w - pw) / 2 - b.minC * size;
        const oy = i * slotH + (slotH - ph) / 2 - b.minR * size;
        for (let r = 0; r < m.length; r++) {
          for (let cc = 0; cc < m[r].length; cc++) {
            if (!m[r][cc]) continue;
            drawBlock(c, ox + cc * size, oy + r * size, size, size, PIECE[it.type] || COLORS.accent, it.alpha);
          }
        }
      });
    }

    function drawPreviews() {
      const nextItems = queue.slice(0, compact ? 1 : 3).map((type) => ({ type, alpha: 1 }));
      drawPreview(nextCanvas, nextCtx, nextBox, nextItems);
      const holdItems = holdType ? [{ type: holdType, alpha: holdUsed ? 0.38 : 1 }] : [];
      drawPreview(holdCanvas, holdCtx, holdBox, holdItems);
    }

    /* ---------- Render del tablero ---------- */
    function ghostDistance() {
      let d = 0;
      while (!collides(piece, 0, d + 1)) d++;
      return d;
    }

    function draw() {
      ctx.setTransform(boardDpr, 0, 0, boardDpr, 0, 0);
      ctx.fillStyle = COLORS.board;
      ctx.fillRect(0, 0, boardW, boardH);

      ctx.save();
      if (shake > 0.002 && !reduceMotion) {
        const amp = shake * Math.min(cellW, cellH) * 0.16;
        ctx.translate((Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp);
        ctx.fillStyle = COLORS.board;
        ctx.fillRect(-40, -40, boardW + 80, boardH + 80);
      }

      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 1; c < COLS; c++) {
        const x = c * cellW;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, boardH);
      }
      for (let r = 1; r < ROWS; r++) {
        const y = r * cellH;
        ctx.moveTo(0, y);
        ctx.lineTo(boardW, y);
      }
      ctx.stroke();

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const type = grid[r][c];
          if (type) drawBlock(ctx, c * cellW, r * cellH, cellW, cellH, PIECE[type] || COLORS.accent);
        }
      }

      if (piece && state === 'playing' && !clearing) {
        const d = ghostDistance();
        if (d > 0) {
          const m = piece.m;
          for (let r = 0; r < m.length; r++) {
            for (let c = 0; c < m[r].length; c++) {
              if (!m[r][c]) continue;
              drawBlock(ctx, (piece.x + c) * cellW, (piece.y + r + d) * cellH, cellW, cellH, PIECE[piece.type] || COLORS.accent, 1, true);
            }
          }
        }
      }

      if (piece) {
        const color = PIECE[piece.type] || COLORS.accent;
        const m = piece.m;
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.max(3, cellW * 0.5);
        for (let r = 0; r < m.length; r++) {
          for (let c = 0; c < m[r].length; c++) {
            if (!m[r][c]) continue;
            drawBlock(ctx, (piece.x + c) * cellW, (piece.y + r) * cellH, cellW, cellH, color);
          }
        }
        ctx.restore();
      }

      if (clearing) {
        const t = Math.min(1, clearing.t / CLEAR_TIME);
        ctx.globalAlpha = Math.sin(t * Math.PI) * 0.65;
        ctx.fillStyle = COLORS.flash;
        for (const r of clearing.rows) ctx.fillRect(0, r * cellH, boardW, cellH);
        ctx.globalAlpha = 1;
      }

      for (const p of particles) {
        const a = Math.max(0, p.life / p.max);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        const s = p.size * cellW;
        ctx.fillRect(p.x * cellW - s / 2, p.y * cellH - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const p of popups) {
        const a = Math.max(0, 1 - p.t / p.life);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color || COLORS.accent;
        ctx.font = '700 ' + Math.max(12, Math.min(cellW * 0.62, 22)) + 'px ' + FONT_MONO;
        ctx.fillText(p.text, p.x * cellW, (p.y - p.t * 1.3) * cellH);
      }
      ctx.globalAlpha = 1;

      ctx.restore();
      drawPreviews();
    }

    /* ---------- Piezas y bolsa de siete ---------- */
    function refillBag() {
      bag = TYPES.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = bag[i];
        bag[i] = bag[j];
        bag[j] = tmp;
      }
    }

    function takeFromBag() {
      if (!bag.length) refillBag();
      return bag.pop();
    }

    function refillQueue() {
      while (queue.length < 4) queue.push(takeFromBag());
    }

    function nextType() {
      refillQueue();
      const t = queue.shift();
      refillQueue();
      return t;
    }

    function gravityForLevel() {
      return GRAVITY[Math.min(level - 1, GRAVITY.length - 1)];
    }

    function isSoft() {
      return softKey || softTouch;
    }

    /* ---------- Colisiones y movimiento ---------- */
    function collides(p, dx = 0, dy = 0, m = p.m) {
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (!m[r][c]) continue;
          const x = p.x + c + dx;
          const y = p.y + r + dy;
          if (x < 0 || x >= COLS || y >= ROWS) return true;
          if (y >= 0 && grid[y][x]) return true;
        }
      }
      return false;
    }

    function resetLock() {
      if (lockResets > 0) {
        lockTimer = 0;
        lockResets--;
      }
    }

    function spawnPiece(type) {
      const next = type || nextType();
      const m = SHAPES[next].map((row) => row.slice());
      piece = {
        type: next,
        m,
        x: Math.floor((COLS - m[0].length) / 2),
        y: 0
      };
      holdUsed = false;
      dropTimer = 0;
      lockTimer = 0;
      lockResets = 15;
      if (collides(piece)) {
        piece = null;
        gameOver();
      }
    }

    function move(dx) {
      if (state !== 'playing' || !piece || clearing) return false;
      if (collides(piece, dx, 0)) return false;
      piece.x += dx;
      if (collides(piece, 0, 1)) resetLock();
      sfx.move();
      return true;
    }

    function rotateMatrix(m, dir) {
      const n = m.length;
      const out = Array.from({ length: n }, () => Array(n).fill(0));
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (dir > 0) out[c][n - 1 - r] = m[r][c];
          else out[n - 1 - c][r] = m[r][c];
        }
      }
      return out;
    }

    function rotate(dir) {
      if (state !== 'playing' || !piece || clearing) return false;
      const m = rotateMatrix(piece.m, dir);
      for (const [kx, ky] of KICKS) {
        if (!collides(piece, kx, ky, m)) {
          piece.m = m;
          piece.x += kx;
          piece.y += ky;
          if (collides(piece, 0, 1)) resetLock();
          sfx.rotate();
          return true;
        }
      }
      return false;
    }

    function stepDown(byDrop = false) {
      if (!piece || collides(piece, 0, 1)) return false;
      piece.y++;
      lockTimer = 0;
      if (byDrop || isSoft()) addScore(1);
      return true;
    }

    /* ---------- Caída, bloqueo y líneas ---------- */
    function hardDrop() {
      if (state !== 'playing' || !piece || clearing) return;
      let d = 0;
      while (!collides(piece, 0, d + 1)) d++;
      if (d > 0) {
        piece.y += d;
        addScore(d * 2);
      }
      shake = Math.max(shake, 0.7);
      sfx.drop();
      lockPiece();
    }

    function lockPiece() {
      if (!piece) return;
      const m = piece.m;
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (!m[r][c]) continue;
          const y = piece.y + r;
          const x = piece.x + c;
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) grid[y][x] = piece.type;
        }
      }
      piece = null;

      const full = [];
      for (let r = 0; r < ROWS; r++) {
        if (grid[r].every(Boolean)) full.push(r);
      }

      if (full.length) startClear(full);
      else {
        sfx.lock();
        spawnPiece();
      }
    }

    function startClear(rows) {
      const count = rows.length;
      const gain = LINE_SCORE[count] * level;
      score += gain;
      clearing = { rows: rows.slice(), t: 0 };

      for (const r of rows) {
        for (let c = 0; c < COLS; c++) {
          const type = grid[r][c];
          if (!type) continue;
          const life = 0.5 + Math.random() * 0.35;
          particles.push({
            x: c + 0.5,
            y: r + 0.5,
            vx: (Math.random() - 0.5) * 6,
            vy: -(0.8 + Math.random() * 3),
            life,
            max: life,
            color: PIECE[type] || COLORS.accent,
            size: 0.22 + Math.random() * 0.26
          });
        }
      }

      addPopup('+' + nf.format(gain), COLS / 2, rows[0] + 0.5, COLORS.accent);
      shake = Math.max(shake, count === 4 ? 1 : 0.45);

      if (count === 4) {
        sfx.clear(4);
        announce('Cuatro líneas. ' + nf.format(gain) + ' puntos');
      } else {
        sfx.clear(count);
      }
      if (count >= 2) pulseScore();
      syncHUD();
    }

    function finishClear() {
      if (!clearing) return;
      const rows = clearing.rows.slice().sort((a, b) => b - a);
      for (const r of rows) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(null));
      }
      lines += rows.length;

      const nextLevel = Math.min(15, 1 + Math.floor(lines / 10));
      if (nextLevel > level) {
        level = nextLevel;
        addPopup('Nivel ' + level, COLS / 2, 4, COLORS.flash);
        sfx.level();
        announce('Nivel ' + level);
      }

      clearing = null;
      spawnPiece();
      syncHUD();
    }

    function holdPiece() {
      if (state !== 'playing' || !piece || clearing || holdUsed) return;
      const current = piece.type;
      if (holdType) {
        const swap = holdType;
        holdType = current;
        spawnPiece(swap);
      } else {
        holdType = current;
        spawnPiece();
      }
      holdUsed = true;
      sfx.hold();
    }

    function addScore(n) {
      score += n;
      syncHUD();
    }

    function addPopup(text, x, y, color) {
      popups.push({ text, x, y, color, t: 0, life: 0.85 });
    }

    function resetGame() {
      grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      bag = [];
      queue = [];
      refillQueue();
      holdType = null;
      holdUsed = false;
      score = 0;
      lines = 0;
      level = 1;
      dropTimer = 0;
      lockTimer = 0;
      lockResets = 15;
      softKey = false;
      softTouch = false;
      clearing = null;
      particles = [];
      popups = [];
      shake = 0;
      spawnPiece();
      syncHUD();
    }

    /* ---------- Bucle de actualización ---------- */
    function update(dt) {
      if (clearing) {
        clearing.t += dt;
        if (clearing.t >= CLEAR_TIME) finishClear();
        return;
      }
      if (!piece) return;

      const interval = isSoft() ? SOFT_INTERVAL : gravityForLevel();
      dropTimer += dt;
      let guard = 0;
      while (dropTimer >= interval && guard < 20) {
        dropTimer -= interval;
        if (!stepDown(false)) {
          dropTimer = 0;
          break;
        }
        guard++;
      }

      if (piece && collides(piece, 0, 1)) {
        lockTimer += dt;
        if (lockTimer >= LOCK_DELAY) lockPiece();
      } else {
        lockTimer = 0;
      }
    }

    function updateFx(dt) {
      if (shake > 0) shake = Math.max(0, shake - dt * 3.2);
      for (const p of particles) {
        p.life -= dt;
        p.vy += 11 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      particles = particles.filter((p) => p.life > 0);
      for (const p of popups) p.t += dt;
      popups = popups.filter((p) => p.t < p.life);
    }

    /* ---------- Interfaz y estado ---------- */
    function syncHUD() {
      scoreEl.textContent = nf.format(score);
      levelEl.textContent = String(level);
      linesEl.textContent = String(lines);
      bestEl.textContent = 'Mejor ' + nf.format(best);
    }

    function pulseScore() {
      if (reduceMotion) return;
      scoreEl.classList.remove('is-bump');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('is-bump');
    }

    function syncPauseButton() {
      const paused = state === 'paused';
      pauseBtn.disabled = state === 'idle' || state === 'over';
      iconPause.hidden = paused;
      iconPlay.hidden = !paused;
      pauseBtn.setAttribute('aria-label', paused ? 'Reanudar partida' : 'Pausar partida');
      pauseBtn.title = paused ? 'Reanudar' : 'Pausar';
    }

    function syncSoundButton() {
      soundBtn.setAttribute('aria-pressed', String(!muted));
      iconSoundOn.hidden = muted;
      iconSoundOff.hidden = !muted;
      soundBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
      soundBtn.title = muted ? 'Activar sonido' : 'Silenciar';
    }

    let announceTimer = 0;
    function announce(msg) {
      clearTimeout(announceTimer);
      announceTimer = window.setTimeout(() => { liveEl.textContent = msg; }, 30);
    }

    function loadBest() {
      try {
        const v = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
        return Number.isFinite(v) && v > 0 ? v : 0;
      } catch (err) {
        return 0;
      }
    }

    function saveBest() {
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (err) { /* almacenamiento no disponible */ }
    }

    function loadMuted() {
      try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { return false; }
    }

    function saveMuted() {
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (err) { /* sin almacenamiento */ }
    }

    function showOverlay(kind, record = false) {
      overlay.hidden = false;

      if (kind === 'paused') {
        ovTitle.textContent = 'Pausa';
        ovText.textContent = 'El tablero te espera. Puedes continuar o empezar de cero.';
        ovResult.hidden = true;
        ovPrimary.textContent = 'Continuar';
        ovSecondary.hidden = false;
        ovHint.textContent = 'P o Esc para continuar';
      } else if (kind === 'over') {
        ovTitle.textContent = record ? 'Nuevo récord' : 'Fin del juego';
        ovText.textContent = record
          ? 'Superaste tu mejor marca. ¿Juegas otra ronda?'
          : 'La pila llegó arriba. Prueba otra vez y cuida el espacio.';
        ovResult.hidden = false;
        ovScore.textContent = nf.format(score);
        ovBest.textContent = nf.format(best);
        ovPrimary.textContent = 'Jugar de nuevo';
        ovSecondary.hidden = true;
        ovHint.textContent = 'Enter para reintentar';
      } else {
        ovTitle.textContent = 'Nova Blocks';
        ovText.textContent = 'Completa líneas con las piezas que caen. Cada diez líneas la caída se acelera.';
        ovResult.hidden = true;
        ovPrimary.textContent = 'Jugar';
        ovSecondary.hidden = true;
        ovHint.textContent = (compact || coarse) ? 'Toca Jugar para empezar' : 'Enter para empezar';
      }

      const active = document.activeElement;
      if (active && overlay.contains(active)) active.blur();
    }

    function hideOverlay() {
      const active = document.activeElement;
      if (active && overlay.contains(active)) active.blur();
      overlay.hidden = true;
    }

    function startGame() {
      resetGame();
      state = 'playing';
      syncPauseButton();
      hideOverlay();
      syncHUD();
      sfx.start();
      announce('Partida iniciada');
    }

    function pauseGame() {
      if (state !== 'playing') return;
      state = 'paused';
      softKey = false;
      softTouch = false;
      syncPauseButton();
      showOverlay('paused');
      sfx.pause();
      announce('Juego en pausa');
    }

    function resumeGame() {
      if (state !== 'paused') return;
      state = 'playing';
      syncPauseButton();
      hideOverlay();
      announce('Continuación');
    }

    function togglePause() {
      if (state === 'playing') pauseGame();
      else if (state === 'paused') resumeGame();
    }

    function gameOver() {
      state = 'over';
      const record = score > best;
      if (record) {
        best = score;
        saveBest();
      }
      syncPauseButton();
      syncHUD();
      showOverlay('over', record);
      sfx.over();
      announce('Fin del juego. ' + nf.format(score) + ' puntos.');
    }

    /* ---------- Sonido sintetizado ---------- */
    let audioCtx = null;

    function audio() {
      if (muted) return null;
      try {
        if (!audioCtx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          audioCtx = new AC();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
      } catch (err) {
        return null;
      }
    }

    function tone(freq, dur = 0.08, opts = {}) {
      const ac = audio();
      if (!ac) return;
      const type = opts.type || 'sine';
      const gain = opts.gain != null ? opts.gain : 0.025;
      const delay = opts.delay || 0;
      const slide = opts.slide || 0;
      const t0 = ac.currentTime + delay;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    const sfx = {
      move() { tone(190, 0.035, { type: 'square', gain: 0.009 }); },
      rotate() { tone(320, 0.05, { type: 'triangle', gain: 0.018 }); },
      lock() { tone(130, 0.08, { type: 'sine', gain: 0.028 }); },
      drop() { tone(90, 0.09, { type: 'square', gain: 0.022, slide: -30 }); },
      hold() { tone(440, 0.06, { type: 'sine', gain: 0.018 }); },
      clear(n) {
        const notes = [523, 659, 784, 1047];
        for (let i = 0; i < n; i++) {
          tone(notes[i], 0.09, { type: 'triangle', gain: 0.024, delay: i * 0.055 });
        }
      },
      level() {
        [392, 523, 659].forEach((f, i) => tone(f, 0.1, { type: 'triangle', gain: 0.026, delay: i * 0.07 }));
      },
      over() {
        [392, 330, 262, 196].forEach((f, i) => {
          tone(f, 0.18, { type: 'sawtooth', gain: 0.018, delay: i * 0.11, slide: -20 });
        });
      },
      start() {
        [392, 523, 659].forEach((f, i) => tone(f, 0.08, { type: 'triangle', gain: 0.023, delay: i * 0.06 }));
      },
      pause() { tone(294, 0.06, { type: 'sine', gain: 0.018 }); }
    };

    function toggleMute() {
      muted = !muted;
      saveMuted();
      syncSoundButton();
      if (!muted) sfx.rotate();
    }

    /* ---------- Entrada táctil ---------- */
    function tap(el, fn) {
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        fn();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fn();
        }
      });
    }

    function bindRepeat(el, fn) {
      if (!el) return;
      let to = 0;
      let iv = 0;
      const stop = () => {
        if (to) { clearTimeout(to); to = 0; }
        if (iv) { clearInterval(iv); iv = 0; }
        el.classList.remove('is-active');
      };
      const start = () => {
        fn();
        el.classList.add('is-active');
        to = window.setTimeout(() => { iv = window.setInterval(fn, 55); }, 190);
      };
      el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        if (el.setPointerCapture) {
          try { el.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
        }
        start();
      });
      ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach((ev) => {
        el.addEventListener(ev, stop);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!e.repeat) fn();
        }
      });
      el.addEventListener('blur', stop);
    }

    const touchLeft = document.querySelector('[data-action="left"]');
    const touchRight = document.querySelector('[data-action="right"]');
    const touchRotate = document.querySelector('[data-action="rotate"]');
    const touchSoft = document.querySelector('[data-action="soft"]');
    const touchHard = document.querySelector('[data-action="hard"]');
    const touchHold = document.querySelector('[data-action="hold"]');

    bindRepeat(touchLeft, () => move(-1));
    bindRepeat(touchRight, () => move(1));
    tap(touchRotate, () => rotate(1));
    tap(touchHard, () => hardDrop());
    tap(touchHold, () => holdPiece());

    if (touchSoft) {
      touchSoft.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        softTouch = true;
        touchSoft.classList.add('is-active');
        stepDown(true);
        if (touchSoft.setPointerCapture) {
          try { touchSoft.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
        }
      });
      const releaseSoft = () => {
        softTouch = false;
        touchSoft.classList.remove('is-active');
      };
      ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture', 'blur'].forEach((ev) => {
        touchSoft.addEventListener(ev, releaseSoft);
      });
    }

    let gesture = null;
    boardCanvas.addEventListener('pointerdown', (e) => {
      if (state !== 'playing') return;
      e.preventDefault();
      gesture = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
        t: performance.now()
      };
      try { boardCanvas.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
    });

    boardCanvas.addEventListener('pointermove', (e) => {
      if (!gesture || e.pointerId !== gesture.id || state !== 'playing') return;
      e.preventDefault();
      const stepX = Math.max(16, cellW * 0.85);
      const dx = e.clientX - gesture.lastX;
      if (Math.abs(dx) >= stepX) {
        const n = Math.trunc(dx / stepX);
        for (let i = 0; i < Math.abs(n); i++) move(Math.sign(n));
        gesture.lastX += n * stepX;
        gesture.moved = true;
      }
      const stepY = Math.max(18, cellH * 0.9);
      const dy = e.clientY - gesture.lastY;
      if (dy >= stepY) {
        const n = Math.trunc(dy / stepY);
        for (let i = 0; i < Math.abs(n); i++) stepDown(true);
        gesture.lastY += n * stepY;
        gesture.moved = true;
      }
    });

    boardCanvas.addEventListener('pointerup', (e) => {
      if (!gesture || e.pointerId !== gesture.id) return;
      const g = gesture;
      gesture = null;
      if (state !== 'playing') return;
      const totalX = e.clientX - g.x;
      const totalY = e.clientY - g.y;
      const elapsed = performance.now() - g.t;
      if (totalY > Math.max(56, cellH * 1.8) && elapsed < 500) {
        hardDrop();
      } else if (!g.moved && Math.abs(totalX) < 14 && Math.abs(totalY) < 14 && elapsed < 350) {
        rotate(1);
      }
    });

    boardCanvas.addEventListener('pointercancel', () => { gesture = null; });

    /* ---------- Teclado ---------- */
    document.addEventListener('keydown', (e) => {
      const key = e.key;

      if (key === 'Enter') {
        const active = document.activeElement;
        if (active && overlay.contains(active) && active.tagName === 'BUTTON') return;
        if (state === 'idle' || state === 'over') {
          e.preventDefault();
          startGame();
        } else if (state === 'paused') {
          e.preventDefault();
          resumeGame();
        }
        return;
      }

      if (key === 'p' || key === 'P' || key === 'Escape') {
        if (state === 'playing' || state === 'paused') {
          e.preventDefault();
          togglePause();
        }
        return;
      }

      if (state !== 'playing') return;

      switch (key) {
        case 'ArrowLeft':
          e.preventDefault();
          move(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          softKey = true;
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          e.preventDefault();
          if (!e.repeat) rotate(1);
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          if (!e.repeat) rotate(-1);
          break;
        case ' ':
          e.preventDefault();
          if (!e.repeat) hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          e.preventDefault();
          if (!e.repeat) holdPiece();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          startGame();
          break;
        default:
          break;
      }
    }, { passive: false });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowDown') softKey = false;
    });

    window.addEventListener('blur', () => {
      softKey = false;
      softTouch = false;
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state === 'playing') pauseGame();
    });

    /* ---------- Botones principales ---------- */
    function onClick(el, fn) {
      if (!el) return;
      el.addEventListener('click', () => {
        fn();
        el.blur();
      });
    }

    onClick(ovPrimary, () => {
      if (state === 'paused') resumeGame();
      else startGame();
    });
    onClick(ovSecondary, () => startGame());
    onClick(restartBtn, () => startGame());
    onClick(restartTop, () => startGame());
    onClick(pauseBtn, () => togglePause());
    onClick(soundBtn, () => toggleMute());

    /* ---------- Redimensionado ---------- */
    let fitQueued = false;
    function scheduleFit() {
      if (fitQueued) return;
      fitQueued = true;
      requestAnimationFrame(() => {
        fitQueued = false;
        fitBoard();
      });
    }

    window.addEventListener('resize', scheduleFit);
    window.addEventListener('orientationchange', scheduleFit);

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(scheduleFit);
      const shell = document.querySelector('.board-shell');
      const previews = document.querySelector('.previews');
      if (shell) ro.observe(shell);
      if (previews) ro.observe(previews);
    }

    /* ---------- Desbloqueo del audio en el primer gesto ---------- */
    window.addEventListener('pointerdown', () => { audio(); }, { once: true });
    window.addEventListener('keydown', () => { audio(); }, { once: true });



    /* ---------- Bucle principal ---------- */
    let lastT = performance.now();

    function frame(t) {
      const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000));
      lastT = t;
      if (state === 'playing') update(dt);
      updateFx(dt);
      draw();
      requestAnimationFrame(frame);
    }

    function boot() {
      best = loadBest();
      muted = loadMuted();
      syncSoundButton();
      syncPauseButton();
      syncHUD();
      refillQueue();
      fitBoard();
      showOverlay('idle');
      lastT = performance.now();
      requestAnimationFrame(frame);
    }

    boot();
  })();
