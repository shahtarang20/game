(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const BASE_W = 480;
  const BASE_H = 640;

  const startScreen = document.getElementById('start-screen');
  const gameoverScreen = document.getElementById('gameover-screen');
  const adWatchingScreen = document.getElementById('ad-watching-screen');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const continueBtn = document.getElementById('continue-btn');
  const finalScoreEl = document.getElementById('final-score');
  const finalLevelEl = document.getElementById('final-level');
  const finalCoinsEl = document.getElementById('final-coins');
  const highScoreStartEl = document.getElementById('high-score-start');
  const highScoreEndEl = document.getElementById('high-score-end');
  const coinTotalStartEl = document.getElementById('coin-total-start');
  const streakBannerEl = document.getElementById('streak-banner');

  const HIGH_SCORE_KEY = 'flappyLevelsHighScore';
  const COIN_TOTAL_KEY = 'flappyLevelsCoins';
  const LAST_PLAYED_KEY = 'flappyLevelsLastPlayed';
  const STREAK_KEY = 'flappyLevelsStreak';

  const PIPES_PER_LEVEL = 10;

  const THEMES = [
    { name: 'Day',       sky: ['#70c5ce', '#a1e3ea'], ground: '#ded895', pipeColor: '#4CAF50', pipeShape: 'rect',   bird: '#ffeb3b', speedMul: 1.00, gapMul: 1.00 },
    { name: 'Sunset',    sky: ['#ff7e5f', '#feb47b'], ground: '#c98b5e', pipeColor: '#e65100', pipeShape: 'rect',   bird: '#ff8a65', speedMul: 1.03, gapMul: 0.99 },
    { name: 'Night',     sky: ['#0f2027', '#203a43'], ground: '#1a1a2e', pipeColor: '#546e7a', pipeShape: 'rect',   bird: '#fff59d', speedMul: 1.06, gapMul: 0.98 },
    { name: 'Space',     sky: ['#000000', '#1a0033'], ground: '#2d0a4e', pipeColor: '#9c27b0', pipeShape: 'crystal',bird: '#00e5ff', speedMul: 1.09, gapMul: 0.97 },
    { name: 'Underwater',sky: ['#01579b', '#0288d1'], ground: '#004d40', pipeColor: '#00897b', pipeShape: 'rock',   bird: '#ffca28', speedMul: 1.12, gapMul: 0.96 },
    { name: 'Desert',    sky: ['#f2b880', '#f6d29c'], ground: '#deb887', pipeColor: '#8d6e63', pipeShape: 'rock',   bird: '#d84315', speedMul: 1.15, gapMul: 0.95 },
    { name: 'Cyberpunk', sky: ['#0d0221', '#190a3e'], ground: '#0d0221', pipeColor: '#ff00ff', pipeShape: 'crystal',bird: '#00ff9c', speedMul: 1.18, gapMul: 0.94 },
    { name: 'Volcano',   sky: ['#3e0000', '#7f0000'], ground: '#1a0000', pipeColor: '#ff5722', pipeShape: 'rock',   bird: '#ffab00', speedMul: 1.21, gapMul: 0.93 },
  ];

  const GRAVITY = 0.35;
  const FLAP_VELOCITY = -6.8;
  const BASE_PIPE_SPEED = 3.1;
  const BASE_GAP = 175;
  const PIPE_WIDTH = 62;
  const PIPE_INTERVAL = 95;
  const POWERUP_TYPES = ['shield', 'slowmo', 'x2'];
  const POWERUP_DURATION = { slowmo: 300, x2: 400 };

  let bird, pipes, coins, powerups, particles, stars;
  let frame, score, pipesPassed, level, gameState, groundOffset;
  let coinsThisRun, activeEffects, shieldHit, usedContinue;
  let shakeTime, shakeMag, ballSpin;
  let dpr = 1;

  function shadeColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.max(0, Math.min(255, (num >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // ---------- persistence ----------
  function getHighScore() { return Number(localStorage.getItem(HIGH_SCORE_KEY) || 0); }
  function setHighScore(v) { localStorage.setItem(HIGH_SCORE_KEY, String(v)); }
  function getCoinTotal() { return Number(localStorage.getItem(COIN_TOTAL_KEY) || 0); }
  function addCoins(v) { localStorage.setItem(COIN_TOTAL_KEY, String(getCoinTotal() + v)); }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function checkDailyStreak() {
    const last = localStorage.getItem(LAST_PLAYED_KEY);
    let streak = Number(localStorage.getItem(STREAK_KEY) || 0);
    const today = todayStr();
    if (last === today) {
      return { streak, bonus: 0, isNew: false };
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = (last === yesterday) ? streak + 1 : 1;
    localStorage.setItem(LAST_PLAYED_KEY, today);
    localStorage.setItem(STREAK_KEY, String(streak));
    const bonus = 5 * streak;
    addCoins(bonus);
    return { streak, bonus, isNew: true };
  }

  // ---------- audio (WebAudio, no external files) ----------
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }
  function beep(freq, duration, type = 'sine', volume = 0.15) {
    const ac = getAudioCtx();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.stop(ac.currentTime + duration);
  }
  const sfx = {
    flap: () => beep(420, 0.08, 'square', 0.08),
    score: () => beep(880, 0.12, 'sine', 0.12),
    coin: () => beep(1200, 0.08, 'sine', 0.1),
    powerup: () => beep(660, 0.2, 'triangle', 0.15),
    hit: () => beep(120, 0.3, 'sawtooth', 0.2),
    levelup: () => { beep(500, 0.15, 'sine', 0.12); setTimeout(() => beep(700, 0.15, 'sine', 0.12), 120); },
  };

  // ---------- responsive canvas ----------
  const gameWrap = document.getElementById('game-wrap');
  const adTop = document.getElementById('ad-slot-top');
  const adBottom = document.getElementById('ad-slot-bottom');

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;

    const wrapStyle = getComputedStyle(gameWrap);
    const gap = parseFloat(wrapStyle.rowGap || wrapStyle.gap || '0') || 0;
    const paddingV = parseFloat(wrapStyle.paddingTop) + parseFloat(wrapStyle.paddingBottom);
    const paddingH = parseFloat(wrapStyle.paddingLeft) + parseFloat(wrapStyle.paddingRight);

    const reservedHeight = adTop.offsetHeight + adBottom.offsetHeight + gap * 2 + paddingV;
    const availableHeight = window.innerHeight - reservedHeight;
    const availableWidth = window.innerWidth - paddingH;

    const scale = Math.max(0.3, Math.min(availableWidth / BASE_W, availableHeight / BASE_H, 1.4));

    canvas.style.width = Math.floor(BASE_W * scale) + 'px';
    canvas.style.height = Math.floor(BASE_H * scale) + 'px';
    canvas.width = BASE_W * dpr;
    canvas.height = BASE_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));

  function currentTheme() { return THEMES[level % THEMES.length]; }

  function reset() {
    bird = { x: 90, y: BASE_H / 2, vy: 0, r: 14 };
    pipes = [];
    coins = [];
    powerups = [];
    particles = [];
    frame = 0;
    score = 0;
    pipesPassed = 0;
    level = 0;
    groundOffset = 0;
    coinsThisRun = 0;
    activeEffects = {};
    shieldHit = false;
    usedContinue = false;
    shakeTime = 0;
    shakeMag = 0;
    ballSpin = 0;
    gameState = 'ready';
  }

  function flap() {
    if (gameState === 'ready') gameState = 'playing';
    if (gameState === 'playing') {
      bird.vy = FLAP_VELOCITY;
      sfx.flap();
      spawnParticles(bird.x - 10, bird.y, 4, '#fff');
    }
  }

  function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 20 + Math.random() * 10,
        maxLife: 30,
        color,
      });
    }
  }

  function triggerShake(mag, time) {
    shakeMag = mag;
    shakeTime = time;
  }

  function spawnPipe() {
    const theme = currentTheme();
    const gap = BASE_GAP * theme.gapMul;
    const margin = 60;
    const topHeight = margin + Math.random() * (BASE_H - 2 * margin - gap - 100);
    pipes.push({ x: BASE_W + PIPE_WIDTH, topHeight, gap, passed: false });

    const midY = topHeight + gap / 2;
    if (Math.random() < 0.5) {
      coins.push({ x: BASE_W + PIPE_WIDTH / 2, y: midY, r: 8, collected: false });
    } else if (Math.random() < 0.25) {
      const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      powerups.push({ x: BASE_W + PIPE_WIDTH / 2, y: midY, r: 11, type, collected: false });
    }
  }

  function pipeSpeed() {
    const mul = activeEffects.slowmo ? 0.55 : 1;
    return BASE_PIPE_SPEED * currentTheme().speedMul * mul;
  }

  function activatePowerup(type) {
    sfx.powerup();
    if (type === 'shield') {
      shieldHit = true;
    } else {
      activeEffects[type] = POWERUP_DURATION[type];
    }
  }

  function tickEffects() {
    for (const key of Object.keys(activeEffects)) {
      activeEffects[key]--;
      if (activeEffects[key] <= 0) delete activeEffects[key];
    }
  }

  function update() {
    if (gameState !== 'playing') return;

    bird.vy += GRAVITY;
    bird.y += bird.vy;

    const speed = pipeSpeed();
    groundOffset = (groundOffset - speed) % 40;

    if (frame % Math.max(40, Math.round(PIPE_INTERVAL / currentTheme().speedMul)) === 0) {
      spawnPipe();
    }

    for (const p of pipes) {
      p.x -= speed;
      if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
        p.passed = true;
        const gained = activeEffects.x2 ? 2 : 1;
        score += gained;
        pipesPassed++;
        sfx.score();
        if (pipesPassed % PIPES_PER_LEVEL === 0) {
          level++;
          sfx.levelup();
          triggerShake(2, 10);
        }
      }
    }
    pipes = pipes.filter(p => p.x > -PIPE_WIDTH);

    for (const c of coins) {
      c.x -= speed;
      if (!c.collected && dist(bird, c) < bird.r + c.r) {
        c.collected = true;
        coinsThisRun++;
        sfx.coin();
        spawnParticles(c.x, c.y, 6, '#ffd700');
      }
    }
    coins = coins.filter(c => c.x > -30 && !c.collected);

    for (const p of powerups) {
      p.x -= speed;
      if (!p.collected && dist(bird, p) < bird.r + p.r) {
        p.collected = true;
        activatePowerup(p.type);
        spawnParticles(p.x, p.y, 8, '#29b6f6');
      }
    }
    powerups = powerups.filter(p => p.x > -30 && !p.collected);

    for (const pt of particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
    }
    particles = particles.filter(pt => pt.life > 0);

    tickEffects();
    if (shakeTime > 0) shakeTime--;

    if (bird.y + bird.r > BASE_H - 40 || bird.y - bird.r < 0) {
      handleHit();
      return;
    }
    for (const p of pipes) {
      const withinX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_WIDTH;
      if (withinX) {
        const withinGapTop = bird.y - bird.r < p.topHeight;
        const withinGapBottom = bird.y + bird.r > p.topHeight + p.gap;
        if (withinGapTop || withinGapBottom) {
          handleHit();
          return;
        }
      }
    }

    frame++;
  }

  function dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function handleHit() {
    if (shieldHit) {
      shieldHit = false;
      bird.y = Math.max(20, Math.min(BASE_H - 60, bird.y));
      bird.vy = FLAP_VELOCITY * 0.6;
      triggerShake(4, 12);
      spawnParticles(bird.x, bird.y, 10, '#29b6f6');
      return;
    }
    endGame();
  }

  function endGame() {
    gameState = 'gameover';
    sfx.hit();
    triggerShake(6, 18);
    const best = Math.max(getHighScore(), score);
    setHighScore(best);
    addCoins(coinsThisRun);
    finalScoreEl.textContent = score;
    finalLevelEl.textContent = level + 1;
    finalCoinsEl.textContent = coinsThisRun;
    highScoreEndEl.textContent = best;
    continueBtn.classList.toggle('hidden', usedContinue);
    gameoverScreen.classList.remove('hidden');
  }

  function continueAfterAd() {
    usedContinue = true;
    gameoverScreen.classList.add('hidden');
    adWatchingScreen.classList.remove('hidden');
    setTimeout(() => {
      adWatchingScreen.classList.add('hidden');
      bird.y = BASE_H / 2;
      bird.vy = 0;
      shieldHit = true;
      pipes = pipes.filter(p => p.x > bird.x + 150);
      gameState = 'playing';
    }, 1500);
  }

  // ---------- drawing ----------
  function drawBackground(theme) {
    const grad = ctx.createLinearGradient(0, 0, 0, BASE_H);
    grad.addColorStop(0, theme.sky[0]);
    grad.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    // parallax stars/clouds layer
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGround(theme) {
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, BASE_H - 40, BASE_W, 40);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let x = groundOffset; x < BASE_W; x += 40) {
      ctx.fillRect(x, BASE_H - 40, 20, 6);
    }
  }

  function drawPipe(p, theme) {
    ctx.fillStyle = theme.pipeColor;
    const shape = theme.pipeShape;

    function segment(x, y, w, h) {
      if (shape === 'rect') {
        ctx.fillRect(x, y, w, h);
      } else if (shape === 'crystal') {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h * 0.15);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + h * 0.15);
        ctx.closePath();
        ctx.fill();
      } else if (shape === 'rock') {
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x, y + h * 0.3);
        ctx.lineTo(x + w * 0.3, y);
        ctx.lineTo(x + w * 0.7, y + h * 0.1);
        ctx.lineTo(x + w, y + h * 0.35);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(0, p.topHeight);
    ctx.scale(1, -1);
    segment(p.x, 0, PIPE_WIDTH, p.topHeight);
    ctx.restore();

    segment(p.x, p.topHeight + p.gap, PIPE_WIDTH, BASE_H - 40 - (p.topHeight + p.gap));
  }

  function drawCoin(c) {
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const POWERUP_COLORS = { shield: '#29b6f6', slowmo: '#ab47bc', x2: '#ff7043' };
  const POWERUP_LABELS = { shield: 'S', slowmo: 'Z', x2: '2x' };

  function drawPowerup(p) {
    ctx.fillStyle = POWERUP_COLORS[p.type];
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(POWERUP_LABELS[p.type], p.x, p.y + 1);
    ctx.textBaseline = 'alphabetic';
  }

  function drawParticles() {
    for (const pt of particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawBird(theme) {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ballSpin += 0.15 + Math.abs(bird.vy) * 0.02;
    ctx.rotate(ballSpin);

    if (shieldHit) {
      ctx.strokeStyle = '#29b6f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, bird.r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    const grad = ctx.createRadialGradient(-bird.r * 0.35, -bird.r * 0.35, 1, 0, 0, bird.r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, theme.bird);
    grad.addColorStop(1, shadeColor(theme.bird, -30));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-bird.r, 0);
    ctx.lineTo(bird.r, 0);
    ctx.moveTo(0, -bird.r);
    ctx.lineTo(0, bird.r);
    ctx.stroke();

    ctx.restore();
  }

  function drawHUD(theme) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.strokeText(String(score), BASE_W / 2, 50);
    ctx.fillText(String(score), BASE_W / 2, 50);

    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.strokeText(`Level ${level + 1}: ${theme.name}`, 12, 24);
    ctx.fillText(`Level ${level + 1}: ${theme.name}`, 12, 24);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    ctx.strokeText(`● ${coinsThisRun}`, BASE_W - 12, 24);
    ctx.fillText(`● ${coinsThisRun}`, BASE_W - 12, 24);

    let effectY = 70;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    for (const key of Object.keys(activeEffects)) {
      ctx.fillStyle = POWERUP_COLORS[key] || '#fff';
      const label = key === 'slowmo' ? 'SLOW-MO' : key.toUpperCase();
      ctx.fillText(`${label} ${Math.ceil(activeEffects[key] / 60)}s`, 12, effectY);
      effectY += 16;
    }
  }

  function draw() {
    const theme = currentTheme();
    ctx.save();
    if (shakeTime > 0) {
      ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
    }
    drawBackground(theme);
    for (const c of coins) drawCoin(c);
    for (const p of powerups) drawPowerup(p);
    for (const p of pipes) drawPipe(p, theme);
    drawGround(theme);
    drawBird(theme);
    drawParticles();
    if (gameState === 'playing') drawHUD(theme);
    ctx.restore();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < 25; i++) {
      stars.push({ x: Math.random() * BASE_W, y: Math.random() * (BASE_H - 40), r: Math.random() * 1.5 + 0.5 });
    }
  }

  function startGame() {
    reset();
    initStars();
    gameState = 'playing';
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    const ac = getAudioCtx();
    if (ac && ac.state === 'suspended') ac.resume();
  }

  canvas.addEventListener('mousedown', flap);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); flap(); }
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  continueBtn.addEventListener('click', continueAfterAd);

  highScoreStartEl.textContent = getHighScore();
  coinTotalStartEl.textContent = getCoinTotal();

  const streakInfo = checkDailyStreak();
  if (streakInfo.isNew) {
    streakBannerEl.textContent = `Daily streak: ${streakInfo.streak} day${streakInfo.streak > 1 ? 's' : ''}! +${streakInfo.bonus} coins`;
    streakBannerEl.classList.remove('hidden');
    coinTotalStartEl.textContent = getCoinTotal();
  }

  resizeCanvas();
  initStars();
  reset();
  loop();
})();
