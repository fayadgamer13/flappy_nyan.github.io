const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

const menu = document.getElementById("menu");
const playBtn = document.getElementById("play-btn");
const avatarsDiv = document.getElementById("avatars");
const music = document.getElementById("bg-music");
const musicToggle = document.getElementById("music-toggle");

let playerImg = new Image();
playerImg.src = "player.gif";

let pipeImg = new Image();
pipeImg.src = "pipes.png";

let allImagesLoaded = false;
let gravity = 0.5;
let jump = -8;
let pipes = [];
let score = 0;
let bestScore = 0;
let gameStarted = false;
let yVel = 0;
let playerY = canvas.height / 2;
let pipeSpeed = 2;

// Avatar list
const avatarFiles = [
  "player.gif","player2.gif","player3.webp","player4.webp","player5.webp","player6.webp",
  "player7.webp","player8.webp","player9.webp","player10.webp","player11.webp","player12.webp",
  "player13.png","player14.webp","player15.webp","player16.webp","player17.webp","player18.png"
];

// Create avatar buttons
avatarFiles.forEach(src => {
  const img = document.createElement("img");
  img.src = src;
  img.onclick = () => {
    document.querySelectorAll("#avatars img").forEach(i => i.classList.remove("selected"));
    img.classList.add("selected");
    playerImg.src = src;
  };
  avatarsDiv.appendChild(img);
});

// Preload all essential images
function preloadImages(images, callback) {
  let loadedCount = 0;
  const total = images.length;

  images.forEach(src => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === total) callback();
    };
    img.onerror = () => {
      console.warn("Image failed to load:", src);
      loadedCount++;
      if (loadedCount === total) callback();
    };
    img.src = src;
  });
}

// Toggle music
let musicOn = false;
musicToggle.onclick = () => {
  musicOn = !musicOn;
  if (musicOn) {
    music.play();
    musicToggle.textContent = "Music On";
  } else {
    music.pause();
    musicToggle.textContent = "Music Off";
  }
};

// Start game
playBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";

  if (!allImagesLoaded) {
    preloadImages([pipeImg.src, playerImg.src], () => {
      allImagesLoaded = true;
      startGame();
    });
  } else {
    startGame();
  }
};

function startGame() {
  pipes = [];
  score = 0;
  playerY = canvas.height / 2;
  yVel = 0;
  gameStarted = true;
  spawnPipe();
  document.addEventListener("keydown", jumpFlap);
  canvas.addEventListener("click", jumpFlap);
  requestAnimationFrame(gameLoop);
}

function jumpFlap() {
  if (!gameStarted) return;
  yVel = jump;
}

function spawnPipe() {
  const gap = 140;
  const topHeight = Math.floor(Math.random() * (canvas.height - gap - 100)) + 50;
  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + gap,
  });
}

function update() {
  yVel += gravity;
  playerY += yVel;

  if (playerY + 24 > canvas.height || playerY < 0) {
    gameOver();
  }

  for (let i = 0; i < pipes.length; i++) {
    pipes[i].x -= pipeSpeed;

    if (pipes[i].x === 180) spawnPipe();
    if (pipes[i].x + 52 < 0) {
      pipes.splice(i, 1);
      i--;
      score++;
      if (score > bestScore) bestScore = score;
    }
  }

  for (let p of pipes) {
    if (
      50 < p.x + 52 &&
      50 + 34 > p.x &&
      (playerY < p.top || playerY + 24 > p.bottom)
    ) {
      gameOver();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw pipes safely
  if (pipeImg.complete && pipeImg.naturalWidth > 0) {
    pipes.forEach(p => {
      ctx.drawImage(pipeImg, p.x, p.top - pipeImg.height, 52, pipeImg.height);
      ctx.save();
      ctx.translate(p.x, p.bottom);
      ctx.scale(1, -1);
      ctx.drawImage(pipeImg, 0, 0, 52, pipeImg.height);
      ctx.restore();
    });
  }

  ctx.drawImage(playerImg, 50, playerY, 34, 24);

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Best: ${bestScore}`, 10, 60);
}

function gameLoop() {
  if (!gameStarted) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameStarted = false;
  menu.style.display = "flex";
  canvas.style.display = "none";
}
