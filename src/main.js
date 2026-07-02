import "./styles.css";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const progressEl = document.querySelector("#social-progress");
const lossOverlay = document.querySelector("#loss-overlay");

const SOCIALS = [
  {
    id: "linkedin",
    name: "LinkedIn",
    label: "in",
    color: "#0a66c2",
    glow: "rgba(10, 102, 194, 0.55)",
    url: "https://www.linkedin.com/in/nathanjblack/",
  },
  {
    id: "instagram",
    name: "Instagram",
    label: "ig",
    color: "#ff3b8d",
    glow: "rgba(255, 59, 141, 0.55)",
    url: "https://www.instagram.com/nathan.j.black/",
  },
  {
    id: "github",
    name: "GitHub",
    label: "gh",
    color: "#f7fff7",
    glow: "rgba(247, 255, 247, 0.45)",
    url: "https://github.com/nathanboktae/",
  },
];

const keys = new Set();
const pointer = {
  active: false,
  x: 0,
};

const game = {
  width: 0,
  height: 0,
  dpr: 1,
  cell: 24,
  topGutter: 98,
  playerLane: 118,
  lastTime: 0,
  fireTimer: 0,
  screenShake: 0,
  state: "playing",
  restartTimer: 0,
  redirectTimeoutId: null,
  player: {
    x: 0,
    y: 0,
    vx: 0,
    size: 28,
    cooldown: 0,
  },
  bullets: [],
  sparks: [],
  mushrooms: [],
  centipedes: [],
  stars: [],
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clearScheduledRedirect() {
  if (game.redirectTimeoutId === null) {
    return;
  }

  window.clearTimeout(game.redirectTimeoutId);
  game.redirectTimeoutId = null;
}

function makeProgressHud() {
  progressEl.innerHTML = SOCIALS.map(
    (social) => `
      <div class="progress-chip" data-social="${social.id}" style="color: ${social.color}; --health: 1">
        <span class="chip-icon ${social.id}">${social.label}</span>
        <span class="progress-track"><span class="progress-fill"></span></span>
      </div>
    `,
  ).join("");
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  game.dpr = Math.min(window.devicePixelRatio || 1, 2);
  game.width = Math.max(320, rect.width);
  game.height = Math.max(420, rect.height);
  canvas.width = Math.floor(game.width * game.dpr);
  canvas.height = Math.floor(game.height * game.dpr);
  ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
  game.cell = clamp(Math.floor(game.width / 34), 18, 28);
  game.topGutter = clamp(game.height * 0.16, 82, 128);
  game.playerLane = clamp(game.height * 0.24, 108, 170);
  game.player.y = clamp(game.player.y || game.height - 58, game.height - game.playerLane, game.height - 42);
  game.player.x = clamp(game.player.x || game.width / 2, 28, game.width - 28);
  makeStars();
}

function makeStars() {
  const count = Math.floor((game.width * game.height) / 22000);
  game.stars = Array.from({ length: count }, () => ({
    x: rand(0, game.width),
    y: rand(game.topGutter * 0.55, game.height),
    r: rand(0.8, 1.8),
    pulse: rand(0, Math.PI * 2),
  }));
}

function resetGame() {
  clearScheduledRedirect();
  game.state = "playing";
  game.restartTimer = 0;
  game.fireTimer = 0;
  game.screenShake = 0;
  game.bullets = [];
  game.sparks = [];
  game.mushrooms = makeMushrooms();
  game.centipedes = makeCentipedes();
  game.player.x = game.width / 2;
  game.player.y = game.height - 58;
  game.player.cooldown = 0;
  lossOverlay.hidden = true;
  updateHud();
}

function makeMushrooms() {
  const cols = Math.floor(game.width / game.cell);
  const rows = Math.floor((game.height - game.topGutter - game.playerLane) / game.cell);
  const total = clamp(Math.floor(cols * rows * 0.075), 16, 42);
  const mushrooms = [];
  const occupied = new Set();

  while (mushrooms.length < total) {
    const col = Math.floor(rand(1, cols - 1));
    const row = Math.floor(rand(2, rows));
    const key = `${col}:${row}`;

    if (occupied.has(key)) {
      continue;
    }

    occupied.add(key);
    mushrooms.push({
      x: col * game.cell + game.cell / 2,
      y: game.topGutter + row * game.cell,
      hp: 3,
      maxHp: 3,
      wobble: rand(0, Math.PI * 2),
    });
  }

  return mushrooms;
}

function makeCentipedes() {
  const top = game.topGutter + game.cell;
  return SOCIALS.map((social, index) => {
    const segmentCount = 9;
    const y = top + index * game.cell * 2.1;
    const direction = index % 2 === 0 ? 1 : -1;
    const x = direction === 1 ? game.cell * 1.5 : game.width - game.cell * 1.5;
    const centipede = {
      id: social.id,
      social,
      x,
      y,
      dir: direction,
      speed: 105 + index * 12,
      moveCarry: 0,
      segmentCount,
      segmentGap: game.cell * 0.92,
      alive: Array.from({ length: segmentCount }, () => true),
      trail: [],
      dropPulse: 0,
    };

    centipede.trail = Array.from({ length: segmentCount * 8 }, (_, trailIndex) => ({
      x: x - direction * trailIndex * centipede.segmentGap,
      y,
    }));

    return centipede;
  });
}

function fireBullet() {
  if (game.player.cooldown > 0 || game.state !== "playing") {
    return;
  }

  game.bullets.push({
    x: game.player.x,
    y: game.player.y - 24,
    radius: 4,
    vy: -720,
  });
  game.player.cooldown = 0.105;
}

function controlsFireActive() {
  return keys.has("Space") || keys.has("Enter") || pointer.active;
}

function updatePlayer(dt) {
  const player = game.player;
  const speed = 430;
  let ax = 0;
  let ay = 0;

  if (keys.has("ArrowLeft")) ax -= 1;
  if (keys.has("ArrowRight")) ax += 1;
  if (keys.has("ArrowUp")) ay -= 1;
  if (keys.has("ArrowDown")) ay += 1;

  if (pointer.active) {
    player.x += (pointer.x - player.x) * clamp(dt * 18, 0, 1);
  } else if (ax || ay) {
    player.x += ax * speed * dt;
    player.y += ay * speed * 0.72 * dt;
  }

  player.x = clamp(player.x, 24, game.width - 24);
  player.y = clamp(player.y, game.height - game.playerLane, game.height - 42);
  player.cooldown = Math.max(0, player.cooldown - dt);

  if (controlsFireActive()) {
    fireBullet();
  }
}

function getCentipedeSegments(centipede) {
  const segments = [];
  const step = Math.max(1, Math.floor(centipede.segmentGap / 5));

  for (let index = 0; index < centipede.segmentCount; index += 1) {
    const trailIndex = Math.min(centipede.trail.length - 1, index * step);
    const point = centipede.trail[trailIndex] || centipede.trail.at(-1);

    segments.push({
      index,
      x: point.x,
      y: point.y,
      alive: centipede.alive[index],
      isHead: index === firstAliveIndex(centipede),
    });
  }

  return segments;
}

function firstAliveIndex(centipede) {
  return centipede.alive.findIndex(Boolean);
}

function shouldDrop(centipede, nextX) {
  if (nextX < game.cell * 0.75 || nextX > game.width - game.cell * 0.75) {
    return true;
  }

  return game.mushrooms.some((mushroom) => {
    if (mushroom.hp <= 0) return false;
    return Math.abs(mushroom.x - nextX) < game.cell * 0.74 && Math.abs(mushroom.y - centipede.y) < game.cell * 0.62;
  });
}

function updateCentipedes(dt) {
  for (const centipede of game.centipedes) {
    if (!centipede.alive.some(Boolean)) {
      continue;
    }

    centipede.moveCarry += centipede.speed * dt;
    centipede.dropPulse = Math.max(0, centipede.dropPulse - dt);

    while (centipede.moveCarry >= 5) {
      centipede.moveCarry -= 5;
      const nextX = centipede.x + centipede.dir * 5;

      if (shouldDrop(centipede, nextX)) {
        centipede.dir *= -1;
        centipede.y += game.cell;
        centipede.dropPulse = 0.18;
      } else {
        centipede.x = nextX;
      }

      if (centipede.y > game.height - game.playerLane + 20) {
        triggerLoss();
        return;
      }

      centipede.trail.unshift({ x: centipede.x, y: centipede.y });
      centipede.trail.length = centipede.segmentCount * 12;
    }
  }
}

function updateBullets(dt) {
  for (const bullet of game.bullets) {
    bullet.y += bullet.vy * dt;
  }

  game.bullets = game.bullets.filter((bullet) => bullet.y > -20);
}

function updateSparks(dt) {
  for (const spark of game.sparks) {
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vy += 120 * dt;
    spark.life -= dt;
  }

  game.sparks = game.sparks.filter((spark) => spark.life > 0);
}

function makeSparks(x, y, color, count = 10) {
  for (let index = 0; index < count; index += 1) {
    game.sparks.push({
      x,
      y,
      vx: rand(-90, 90),
      vy: rand(-150, 40),
      radius: rand(1.2, 3.4),
      life: rand(0.24, 0.58),
      color,
    });
  }
}

function resolveHits() {
  for (const bullet of game.bullets) {
    if (bullet.hit) {
      continue;
    }

    for (const mushroom of game.mushrooms) {
      if (mushroom.hp <= 0) {
        continue;
      }

      if (distance(bullet, mushroom) < game.cell * 0.52) {
        mushroom.hp -= 1;
        bullet.hit = true;
        makeSparks(bullet.x, bullet.y, "#ffd166", 5);
        break;
      }
    }

    if (bullet.hit) {
      continue;
    }

    for (const centipede of game.centipedes) {
      if (!centipede.alive.some(Boolean)) {
        continue;
      }

      for (const segment of getCentipedeSegments(centipede)) {
        if (!segment.alive) {
          continue;
        }

        if (distance(bullet, segment) < game.cell * 0.58) {
          centipede.alive[segment.index] = false;
          bullet.hit = true;
          game.screenShake = 0.12;
          makeSparks(segment.x, segment.y, centipede.social.color, segment.isHead ? 22 : 12);
          pulseHud(centipede);

          if (!centipede.alive.some(Boolean)) {
            triggerVictory(centipede.social);
          } else if (Math.random() > 0.45) {
            game.mushrooms.push({
              x: segment.x,
              y: segment.y,
              hp: 2,
              maxHp: 2,
              wobble: rand(0, Math.PI * 2),
            });
          }

          break;
        }
      }

      if (bullet.hit) {
        break;
      }
    }
  }

  game.bullets = game.bullets.filter((bullet) => !bullet.hit);
  game.mushrooms = game.mushrooms.filter((mushroom) => mushroom.hp > 0);
}

function resolvePlayerCollision() {
  for (const centipede of game.centipedes) {
    for (const segment of getCentipedeSegments(centipede)) {
      if (segment.alive && distance(segment, game.player) < game.cell * 0.65 + game.player.size * 0.42) {
        triggerLoss();
        return;
      }
    }
  }
}

function triggerLoss() {
  if (game.state !== "playing") {
    return;
  }

  game.state = "lost";
  game.restartTimer = 2.85;
  game.screenShake = 0.36;
  lossOverlay.hidden = false;
  makeSparks(game.player.x, game.player.y, "#ff3b8d", 36);
}

function triggerVictory(social) {
  if (game.state !== "playing") {
    return;
  }

  game.state = "won";
  clearScheduledRedirect();
  game.redirectTimeoutId = window.setTimeout(() => {
    game.redirectTimeoutId = null;
    window.location.assign(social.url);
  }, 550);
  game.screenShake = 0.22;
}

function updateHud() {
  for (const centipede of game.centipedes) {
    const chip = progressEl.querySelector(`[data-social="${centipede.id}"]`);
    if (!chip) {
      continue;
    }

    const alive = centipede.alive.filter(Boolean).length;
    const health = alive / centipede.segmentCount;
    chip.style.setProperty("--health", health.toFixed(3));
  }
}

function pulseHud(centipede) {
  const chip = progressEl.querySelector(`[data-social="${centipede.id}"]`);
  if (!chip) {
    return;
  }

  chip.classList.remove("is-hit");
  window.requestAnimationFrame(() => {
    chip.classList.add("is-hit");
  });
}

function update(dt) {
  if (game.state === "lost") {
    game.restartTimer -= dt;
    updateSparks(dt);
    if (game.restartTimer <= 0) {
      resetGame();
    }
    return;
  }

  if (game.state === "won") {
    updateSparks(dt);
    return;
  }

  updatePlayer(dt);
  updateCentipedes(dt);
  updateBullets(dt);
  resolveHits();
  resolvePlayerCollision();
  updateSparks(dt);
  updateHud();
  game.screenShake = Math.max(0, game.screenShake - dt);
}

function drawBackground(time) {
  ctx.fillStyle = "#050605";
  ctx.fillRect(0, 0, game.width, game.height);

  ctx.save();
  ctx.globalAlpha = 0.65;
  for (const star of game.stars) {
    const alpha = 0.32 + Math.sin(time * 0.0015 + star.pulse) * 0.2;
    ctx.fillStyle = `rgba(145, 255, 188, ${alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(145, 255, 188, 0.13)";
  ctx.lineWidth = 1;
  const offset = (time * 0.018) % game.cell;
  for (let x = -offset; x < game.width + game.cell; x += game.cell) {
    ctx.beginPath();
    ctx.moveTo(x, game.topGutter * 0.7);
    ctx.lineTo(x, game.height);
    ctx.stroke();
  }
  for (let y = game.topGutter - offset; y < game.height; y += game.cell) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(game.width, y);
    ctx.stroke();
  }
  ctx.restore();

  const laneTop = game.height - game.playerLane;
  const laneGradient = ctx.createLinearGradient(0, laneTop, 0, game.height);
  laneGradient.addColorStop(0, "rgba(53, 194, 255, 0)");
  laneGradient.addColorStop(0.08, "rgba(53, 194, 255, 0.18)");
  laneGradient.addColorStop(1, "rgba(255, 59, 141, 0.08)");
  ctx.fillStyle = laneGradient;
  ctx.fillRect(0, laneTop, game.width, game.playerLane);
  ctx.strokeStyle = "rgba(53, 194, 255, 0.42)";
  ctx.beginPath();
  ctx.moveTo(0, laneTop);
  ctx.lineTo(game.width, laneTop);
  ctx.stroke();
}

function drawMushroom(mushroom, time) {
  const size = game.cell * 0.58;
  const wobble = Math.sin(time * 0.004 + mushroom.wobble) * 1.2;
  const alpha = 0.42 + mushroom.hp / mushroom.maxHp * 0.58;

  ctx.save();
  ctx.translate(mushroom.x, mushroom.y + wobble);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.16, size * 0.72, size * 0.44, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#ff3b8d";
  ctx.fillRect(-size * 0.34, -size * 0.08, size * 0.68, size * 0.56);
  ctx.fillStyle = "rgba(247, 255, 247, 0.82)";
  ctx.beginPath();
  ctx.arc(-size * 0.24, -size * 0.2, size * 0.12, 0, Math.PI * 2);
  ctx.arc(size * 0.18, -size * 0.28, size * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBullets() {
  ctx.save();
  ctx.shadowColor = "#52ff8f";
  ctx.shadowBlur = 16;
  for (const bullet of game.bullets) {
    const gradient = ctx.createLinearGradient(bullet.x, bullet.y + 14, bullet.x, bullet.y - 18);
    gradient.addColorStop(0, "rgba(82, 255, 143, 0)");
    gradient.addColorStop(1, "#f7fff7");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bullet.x, bullet.y + 14);
    ctx.lineTo(bullet.x, bullet.y - 18);
    ctx.stroke();
    ctx.fillStyle = "#f7fff7";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y - 18, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCentipedes(time) {
  for (const centipede of game.centipedes) {
    const segments = getCentipedeSegments(centipede).reverse();

    for (const segment of segments) {
      if (!segment.alive) {
        continue;
      }

      drawSegment(segment, centipede, time);
    }
  }
}

function drawSegment(segment, centipede, time) {
  const radius = game.cell * (segment.isHead ? 0.56 : 0.46);
  const pulse = Math.sin(time * 0.006 + segment.index * 0.7) * 0.08;

  ctx.save();
  ctx.translate(segment.x, segment.y + (centipede.dropPulse > 0 ? Math.sin(time * 0.04) * 2 : 0));
  ctx.shadowColor = centipede.social.glow;
  ctx.shadowBlur = segment.isHead ? 24 : 14;

  if (segment.isHead) {
    drawHead(centipede.social, radius * (1 + pulse));
  } else {
    const bodyGradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.4, 1, 0, 0, radius);
    bodyGradient.addColorStop(0, "#f7fff7");
    bodyGradient.addColorStop(0.32, centipede.social.color);
    bodyGradient.addColorStop(1, "#111711");
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (1 + pulse), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(5, 6, 5, 0.62)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHead(social, radius) {
  if (social.id === "instagram") {
    const gradient = ctx.createRadialGradient(-radius * 0.48, radius * 0.58, 2, 0, 0, radius * 1.4);
    gradient.addColorStop(0, "#ffdc80");
    gradient.addColorStop(0.24, "#fcaf45");
    gradient.addColorStop(0.5, "#f56040");
    gradient.addColorStop(0.72, "#c13584");
    gradient.addColorStop(1, "#405de6");
    ctx.fillStyle = gradient;
  } else if (social.id === "github") {
    ctx.fillStyle = "#0d1117";
  } else {
    ctx.fillStyle = social.color;
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(247, 255, 247, 0.86)";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (social.id === "linkedin") {
    drawLinkedInIcon(radius);
  } else if (social.id === "instagram") {
    drawInstagramIcon(radius);
  } else {
    drawGitHubIcon(radius);
  }
}

function drawLinkedInIcon(radius) {
  ctx.fillStyle = "#fff";
  ctx.font = `900 ${radius * 1.08}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("in", radius * 0.02, radius * 0.03);
}

function drawInstagramIcon(radius) {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(2, radius * 0.12);
  ctx.lineJoin = "round";
  ctx.strokeRect(-radius * 0.42, -radius * 0.42, radius * 0.84, radius * 0.84);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(radius * 0.27, -radius * 0.28, radius * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function drawGitHubIcon(radius) {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, radius * 0.1, radius * 0.46, Math.PI * 0.08, Math.PI * 0.92);
  ctx.arc(-radius * 0.26, -radius * 0.2, radius * 0.18, Math.PI * 1.05, Math.PI * 1.92);
  ctx.arc(radius * 0.26, -radius * 0.2, radius * 0.18, Math.PI * 1.08, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0d1117";
  ctx.beginPath();
  ctx.arc(-radius * 0.18, radius * 0.04, radius * 0.055, 0, Math.PI * 2);
  ctx.arc(radius * 0.18, radius * 0.04, radius * 0.055, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(time) {
  const player = game.player;
  const bob = Math.sin(time * 0.008) * 2;

  ctx.save();
  ctx.translate(player.x, player.y + bob);
  ctx.shadowColor = "rgba(82, 255, 143, 0.7)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#52ff8f";
  ctx.beginPath();
  ctx.moveTo(0, -player.size * 0.82);
  ctx.lineTo(player.size * 0.72, player.size * 0.68);
  ctx.lineTo(0, player.size * 0.38);
  ctx.lineTo(-player.size * 0.72, player.size * 0.68);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#050605";
  ctx.beginPath();
  ctx.moveTo(0, -player.size * 0.46);
  ctx.lineTo(player.size * 0.28, player.size * 0.32);
  ctx.lineTo(0, player.size * 0.18);
  ctx.lineTo(-player.size * 0.28, player.size * 0.32);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(247, 255, 247, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -player.size * 0.82);
  ctx.lineTo(player.size * 0.72, player.size * 0.68);
  ctx.lineTo(0, player.size * 0.38);
  ctx.lineTo(-player.size * 0.72, player.size * 0.68);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawSparks() {
  ctx.save();
  for (const spark of game.sparks) {
    ctx.globalAlpha = clamp(spark.life * 2, 0, 1);
    ctx.fillStyle = spark.color;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function render(time) {
  ctx.save();

  if (game.screenShake > 0) {
    const shake = game.screenShake * 14;
    ctx.translate(rand(-shake, shake), rand(-shake, shake));
  }

  drawBackground(time);
  for (const mushroom of game.mushrooms) {
    drawMushroom(mushroom, time);
  }
  drawBullets();
  drawCentipedes(time);
  drawPlayer(time);
  drawSparks();

  if (game.state === "won") {
    ctx.fillStyle = "rgba(247, 255, 247, 0.12)";
    ctx.fillRect(0, 0, game.width, game.height);
  }

  ctx.restore();
}

function tick(time) {
  const dt = Math.min((time - game.lastTime) / 1000 || 0, 0.033);
  game.lastTime = time;
  update(dt);
  render(time);
  requestAnimationFrame(tick);
}

function pointerXFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return clamp(event.clientX - rect.left, 24, game.width - 24);
}

window.addEventListener("resize", resize);

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Enter"].includes(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

canvas.addEventListener("pointerdown", (event) => {
  pointer.active = true;
  pointer.x = pointerXFromEvent(event);
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!pointer.active) {
    return;
  }

  pointer.x = pointerXFromEvent(event);
});

canvas.addEventListener("pointerup", () => {
  pointer.active = false;
});

canvas.addEventListener("pointercancel", () => {
  pointer.active = false;
});

makeProgressHud();
resize();
resetGame();
requestAnimationFrame(tick);
