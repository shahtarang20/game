(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const BASE_W = 480;
  const BASE_H = 640;

  const startScreen = document.getElementById('start-screen');
  const gameoverScreen = document.getElementById('gameover-screen');
  const adWatchingScreen = document.getElementById('ad-watching-screen');
  const skinsScreen = document.getElementById('skins-screen');
  const achievementsScreen = document.getElementById('achievements-screen');
  const spinResultScreen = document.getElementById('spin-result-screen');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const continueBtn = document.getElementById('continue-btn');
  const doubleCoinsBtn = document.getElementById('double-coins-btn');
  const spinBtn = document.getElementById('spin-btn');
  const skinsBtn = document.getElementById('skins-btn');
  const skinsCloseBtn = document.getElementById('skins-close-btn');
  const achievementsBtn = document.getElementById('achievements-btn');
  const achievementsCloseBtn = document.getElementById('achievements-close-btn');
  const achievementsList = document.getElementById('achievements-list');
  const achievementToast = document.getElementById('achievement-toast');
  const spinCloseBtn = document.getElementById('spin-close-btn');
  const skinsGrid = document.getElementById('skins-grid');
  const spinRewardEl = document.getElementById('spin-reward');
  const finalScoreEl = document.getElementById('final-score');
  const finalLevelEl = document.getElementById('final-level');
  const finalCoinsEl = document.getElementById('final-coins');
  const finalComboEl = document.getElementById('final-combo');
  const highScoreStartEl = document.getElementById('high-score-start');
  const highScoreEndEl = document.getElementById('high-score-end');
  const coinTotalStartEl = document.getElementById('coin-total-start');
  const streakBannerEl = document.getElementById('streak-banner');
  const progressFillEl = document.getElementById('progress-fill');
  const progressLabelEl = document.getElementById('progress-label-text');

  const HIGH_SCORE_KEY = 'flappyLevelsHighScore';
  const COIN_TOTAL_KEY = 'flappyLevelsCoins';
  const LAST_PLAYED_KEY = 'flappyLevelsLastPlayed';
  const STREAK_KEY = 'flappyLevelsStreak';
  const LAST_SPIN_KEY = 'flappyLevelsLastSpin';
  const UNLOCKED_SKINS_KEY = 'flappyLevelsUnlockedSkins';
  const SELECTED_SKIN_KEY = 'flappyLevelsSelectedSkin';
  const LIFETIME_KEY = 'flappyLevelsLifetimeStats';
  const UNLOCKED_ACHIEVEMENTS_KEY = 'flappyLevelsAchievements';

  const ACHIEVEMENTS = [
    { id: 'first_flight', label: 'First Flight',   desc: 'Play your first game',        reward: 5,  check: (s) => s.plays >= 1 },
    { id: 'pipe_50',      label: 'Getting Warmed Up', desc: 'Pass 50 pipes lifetime',    reward: 20, check: (s) => s.pipes >= 50 },
    { id: 'pipe_200',     label: 'Pipe Veteran',   desc: 'Pass 200 pipes lifetime',      reward: 50, check: (s) => s.pipes >= 200 },
    { id: 'coin_100',     label: 'Coin Collector', desc: 'Reach 100 total coins',        reward: 15, check: (s) => getCoinTotal() >= 100 },
    { id: 'coin_500',     label: 'Coin Hoarder',   desc: 'Reach 500 total coins',        reward: 40, check: (s) => getCoinTotal() >= 500 },
    { id: 'theme_4',      label: 'Space Explorer', desc: 'Reach the Space level',        reward: 25, check: (s) => s.maxTheme >= 4 },
    { id: 'theme_8',      label: 'Volcano Survivor', desc: 'Reach the Volcano level',    reward: 60, check: (s) => s.maxTheme >= 8 },
    { id: 'combo_10',     label: 'Combo Master',   desc: 'Reach a x10 combo in one run', reward: 30, check: (s) => s.bestComboThisRun >= 10 },
  ];

  const SKINS = [
    { id: 'default', label: 'Default', color: null },
    { id: 'crimson', label: 'Crimson', color: '#e53935' },
    { id: 'emerald', label: 'Emerald', color: '#43a047' },
    { id: 'gold',    label: 'Gold',    color: '#fbc02d' },
    { id: 'violet',  label: 'Violet',  color: '#8e24aa' },
    { id: 'ice',     label: 'Ice',     color: '#4dd0e1' },
  ];

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
  let coinsThisRun, activeEffects, shieldHit, usedContinue, usedDoubleCoins;
  let shakeTime, shakeMag, ballSpin;
  let comboCount, comboMultiplier, bestComboThisRun, slowFramesRemaining;
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

  function canDailySpin() {
    return localStorage.getItem(LAST_SPIN_KEY) !== todayStr();
  }
  function markDailySpinUsed() {
    localStorage.setItem(LAST_SPIN_KEY, todayStr());
  }

  function getUnlockedSkins() {
    try {
      return JSON.parse(localStorage.getItem(UNLOCKED_SKINS_KEY)) || ['default'];
    } catch {
      return ['default'];
    }
  }
  function unlockSkin(id) {
    const unlocked = getUnlockedSkins();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem(UNLOCKED_SKINS_KEY, JSON.stringify(unlocked));
    }
  }
  function getSelectedSkin() {
    return localStorage.getItem(SELECTED_SKIN_KEY) || 'default';
  }
  function setSelectedSkin(id) {
    localStorage.setItem(SELECTED_SKIN_KEY, id);
  }

  function getLifetimeStats() {
    try {
      return Object.assign({ pipes: 0, plays: 0, maxTheme: 0, bestComboThisRun: 0 }, JSON.parse(localStorage.getItem(LIFETIME_KEY)));
    } catch {
      return { pipes: 0, plays: 0, maxTheme: 0, bestComboThisRun: 0 };
    }
  }
  function saveLifetimeStats(stats) {
    localStorage.setItem(LIFETIME_KEY, JSON.stringify(stats));
  }
  function getUnlockedAchievements() {
    try {
      return JSON.parse(localStorage.getItem(UNLOCKED_ACHIEVEMENTS_KEY)) || [];
    } catch {
      return [];
    }
  }
  function checkNewAchievements(stats) {
    const unlocked = getUnlockedAchievements();
    const newlyUnlocked = [];
    for (const a of ACHIEVEMENTS) {
      if (!unlocked.includes(a.id) && a.check(stats)) {
        unlocked.push(a.id);
        addCoins(a.reward);
        newlyUnlocked.push(a);
      }
    }
    if (newlyUnlocked.length) {
      localStorage.setItem(UNLOCKED_ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
    }
    return newlyUnlocked;
  }

  // ---------- generic "watch ad" flow ----------
  // Shows the ad-watching placeholder screen, then invokes the reward callback.
  // Real ad SDK integration point: replace the setTimeout with your ad network's
  // "show interstitial/rewarded ad" call and invoke onReward from its completion callback.
  function watchAd(onReward, delay = 1500) {
    adWatchingScreen.classList.remove('hidden');
    setTimeout(() => {
      adWatchingScreen.classList.add('hidden');
      onReward();
    }, delay);
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
    nearMiss: () => beep(1500, 0.06, 'sine', 0.08),
    comboBreak: () => beep(200, 0.15, 'triangle', 0.1),
    achievement: () => { beep(700, 0.1, 'sine', 0.12); setTimeout(() => beep(1000, 0.15, 'sine', 0.14), 100); },
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
    usedDoubleCoins = false;
    shakeTime = 0;
    shakeMag = 0;
    ballSpin = 0;
    comboCount = 0;
    comboMultiplier = 1;
    bestComboThisRun = 0;
    slowFramesRemaining = 0;
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
    pipes.push({ x: BASE_W + PIPE_WIDTH, topHeight, gap, passed: false, nearMissChecked: false });

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

  const NEAR_MISS_MARGIN = 10;

  function resetCombo() {
    if (comboCount >= 3) sfx.comboBreak();
    comboCount = 0;
    comboMultiplier = 1;
  }

  function update() {
    if (gameState !== 'playing') return;

    const ts = slowFramesRemaining > 0 ? 0.4 : 1;
    if (slowFramesRemaining > 0) slowFramesRemaining--;

    bird.vy += GRAVITY * ts;
    bird.y += bird.vy * ts;

    const speed = pipeSpeed() * ts;
    groundOffset = (groundOffset - speed) % 40;

    if (frame % Math.max(40, Math.round(PIPE_INTERVAL / currentTheme().speedMul)) === 0) {
      spawnPipe();
    }

    for (const p of pipes) {
      p.x -= speed;
      if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
        p.passed = true;
        const gained = (activeEffects.x2 ? 2 : 1) * comboMultiplier;
        score += Math.round(gained);
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
        comboCount++;
        bestComboThisRun = Math.max(bestComboThisRun, comboCount);
        comboMultiplier = Math.min(1 + Math.floor(comboCount / 3) * 0.5, 4);
        coinsThisRun += Math.round(comboMultiplier);
        sfx.coin();
        spawnParticles(c.x, c.y, 6, '#ffd700');
      } else if (!c.collected && c.x <= -30) {
        resetCombo();
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
      resetCombo();
      handleHit();
      return;
    }
    for (const p of pipes) {
      const withinX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_WIDTH;
      if (withinX) {
        const withinGapTop = bird.y - bird.r < p.topHeight;
        const withinGapBottom = bird.y + bird.r > p.topHeight + p.gap;
        if (withinGapTop || withinGapBottom) {
          resetCombo();
          handleHit();
          return;
        }
        if (!p.nearMissChecked) {
          const distTop = (bird.y - bird.r) - p.topHeight;
          const distBottom = (p.topHeight + p.gap) - (bird.y + bird.r);
          if (distTop < NEAR_MISS_MARGIN || distBottom < NEAR_MISS_MARGIN) {
            p.nearMissChecked = true;
            triggerNearMiss();
          }
        }
      }
    }

    frame++;
  }

  function triggerNearMiss() {
    sfx.nearMiss();
    triggerShake(1.5, 6);
    spawnParticles(bird.x, bird.y, 5, '#ffffff');
    slowFramesRemaining = 10;
    if (navigator.vibrate) navigator.vibrate(15);
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

    const lifetime = getLifetimeStats();
    lifetime.pipes += pipesPassed;
    lifetime.plays += 1;
    lifetime.maxTheme = Math.max(lifetime.maxTheme, level + 1);
    lifetime.bestComboThisRun = bestComboThisRun;
    saveLifetimeStats(lifetime);

    finalScoreEl.textContent = score;
    finalLevelEl.textContent = level + 1;
    finalCoinsEl.textContent = coinsThisRun;
    finalComboEl.textContent = bestComboThisRun;
    highScoreEndEl.textContent = best;
    continueBtn.classList.toggle('hidden', usedContinue);
    doubleCoinsBtn.classList.toggle('hidden', usedDoubleCoins || coinsThisRun <= 0);
    gameoverScreen.classList.remove('hidden');

    const newlyUnlocked = checkNewAchievements(lifetime);
    if (newlyUnlocked.length) {
      sfx.achievement();
      achievementToast.textContent = `Achievement unlocked: ${newlyUnlocked.map(a => a.label).join(', ')}!`;
      achievementToast.classList.remove('hidden');
    } else {
      achievementToast.classList.add('hidden');
    }
  }

  function continueAfterAd() {
    usedContinue = true;
    gameoverScreen.classList.add('hidden');
    watchAd(() => {
      bird.y = BASE_H / 2;
      bird.vy = 0;
      shieldHit = true;
      pipes = pipes.filter(p => p.x > bird.x + 150);
      gameState = 'playing';
    });
  }

  function doubleCoinsAfterAd() {
    usedDoubleCoins = true;
    doubleCoinsBtn.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    watchAd(() => {
      addCoins(coinsThisRun);
      coinsThisRun *= 2;
      finalCoinsEl.textContent = coinsThisRun;
      gameoverScreen.classList.remove('hidden');
    });
  }

  function spinForBonus() {
    if (!canDailySpin()) return;
    startScreen.classList.add('hidden');
    watchAd(() => {
      markDailySpinUsed();
      const reward = 10 + Math.floor(Math.random() * 41); // 10-50
      addCoins(reward);
      spinRewardEl.textContent = reward;
      spinResultScreen.classList.remove('hidden');
    });
  }

  function closeSpinResult() {
    spinResultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    coinTotalStartEl.textContent = getCoinTotal();
    updateProgressBar();
    spinBtn.classList.add('hidden');
  }

  function renderSkinsGrid() {
    const unlocked = getUnlockedSkins();
    const selected = getSelectedSkin();
    skinsGrid.innerHTML = '';
    for (const skin of SKINS) {
      const isUnlocked = skin.id === 'default' || unlocked.includes(skin.id);
      const item = document.createElement('div');
      item.className = 'skin-item' + (skin.id === selected ? ' selected' : '');
      const swatch = document.createElement('div');
      swatch.className = 'skin-swatch';
      swatch.style.background = skin.color || '#ffeb3b';
      const label = document.createElement('div');
      label.className = 'skin-label';
      label.textContent = skin.label;
      item.appendChild(swatch);
      item.appendChild(label);
      if (!isUnlocked) {
        const lock = document.createElement('div');
        lock.className = 'skin-lock';
        lock.textContent = 'Watch ad to unlock';
        item.appendChild(lock);
        item.addEventListener('click', () => {
          skinsScreen.classList.add('hidden');
          watchAd(() => {
            unlockSkin(skin.id);
            setSelectedSkin(skin.id);
            skinsScreen.classList.remove('hidden');
            renderSkinsGrid();
          });
        });
      } else {
        item.addEventListener('click', () => {
          setSelectedSkin(skin.id);
          renderSkinsGrid();
        });
      }
      skinsGrid.appendChild(item);
    }
  }

  function renderAchievementsList() {
    const unlocked = getUnlockedAchievements();
    achievementsList.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
      const isUnlocked = unlocked.includes(a.id);
      const item = document.createElement('div');
      item.className = 'achievement-item' + (isUnlocked ? ' unlocked' : '');
      item.innerHTML = `
        <div>
          <div class="achievement-name">${isUnlocked ? '✓ ' : '\u{1F512} '}${a.label}</div>
          <div class="achievement-desc">${a.desc}</div>
        </div>
        <div class="achievement-reward">+${a.reward}</div>
      `;
      achievementsList.appendChild(item);
    }
  }

  const PROGRESS_STEP = 100;
  function updateProgressBar() {
    const coins = getCoinTotal();
    const nextMilestone = (Math.floor(coins / PROGRESS_STEP) + 1) * PROGRESS_STEP;
    const prevMilestone = nextMilestone - PROGRESS_STEP;
    const pct = ((coins - prevMilestone) / PROGRESS_STEP) * 100;
    progressFillEl.style.width = pct + '%';
    progressLabelEl.textContent = `${coins} / ${nextMilestone}`;
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

    const skinId = getSelectedSkin();
    const skin = SKINS.find(s => s.id === skinId);
    const ballColor = (skin && skin.color) || theme.bird;

    const grad = ctx.createRadialGradient(-bird.r * 0.35, -bird.r * 0.35, 1, 0, 0, bird.r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, ballColor);
    grad.addColorStop(1, shadeColor(ballColor, -30));
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

    if (comboCount >= 3) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#ff9800';
      const comboText = `COMBO x${comboMultiplier.toFixed(1)}`;
      ctx.strokeText(comboText, BASE_W / 2, BASE_H - 60);
      ctx.fillText(comboText, BASE_W / 2, BASE_H - 60);
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
  doubleCoinsBtn.addEventListener('click', doubleCoinsAfterAd);
  spinBtn.addEventListener('click', spinForBonus);
  spinCloseBtn.addEventListener('click', closeSpinResult);
  skinsBtn.addEventListener('click', () => {
    renderSkinsGrid();
    startScreen.classList.add('hidden');
    skinsScreen.classList.remove('hidden');
  });
  skinsCloseBtn.addEventListener('click', () => {
    skinsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
  });
  achievementsBtn.addEventListener('click', () => {
    renderAchievementsList();
    startScreen.classList.add('hidden');
    achievementsScreen.classList.remove('hidden');
  });
  achievementsCloseBtn.addEventListener('click', () => {
    achievementsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
  });

  highScoreStartEl.textContent = getHighScore();
  coinTotalStartEl.textContent = getCoinTotal();
  spinBtn.classList.toggle('hidden', !canDailySpin());
  updateProgressBar();

  const streakInfo = checkDailyStreak();
  if (streakInfo.isNew) {
    streakBannerEl.textContent = `Daily streak: ${streakInfo.streak} day${streakInfo.streak > 1 ? 's' : ''}! +${streakInfo.bonus} coins`;
    streakBannerEl.classList.remove('hidden');
    coinTotalStartEl.textContent = getCoinTotal();
    updateProgressBar();
  }

  resizeCanvas();
  initStars();
  reset();
  loop();
})();
