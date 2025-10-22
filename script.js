const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 640;

const startMenu = document.getElementById('start-menu');
const customiseMenu = document.getElementById('customise-menu');
const playBtn = document.getElementById('play-btn');
const customiseBtn = document.getElementById('customise-btn');
const backBtn = document.getElementById('back-btn');
const bgMusic = document.getElementById('bg-music');

let avatar = 'player.gif';
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gravity = 0.6;
let velocity = 0;
let birdY = canvas.height / 2;
let pipes = [];
let gameRunning = false;

const pipeImg = new Image();
pipeImg.src = 'rarepipe.png';

const pieImg = new Image();
pieImg.src = 'pie.png';

function drawBird() {
  const birdImg = new Image();
  birdImg.src = avatar;
  ctx.drawImage(birdImg, 50, birdY, 40, 40);
}

function drawPipe(pipe) {
  ctx.drawImage(pipeImg, pipe.x, pipe.y, 60, 400);
}

function drawScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Best: ${bestScore}`, 20, 60);
}

function resetGame() {
  score = 0;
  velocity = 0;
  birdY = canvas.height / 2;
  pipes = [];
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  velocity += gravity;
  birdY += velocity;

  if (birdY + 40 > canvas.height || birdY < 0) {
    gameRunning = false;
    startMenu.classList.remove('hidden');
    canvas.classList.add('hidden');
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('bestScore', bestScore);
    }
    return;
  }

  if (Math.random() < 0.02) {
    const gap = 150;
    const topY = Math.random() * -200;
    pipes.push({ x: canvas.width, y: topY });
  }

  pipes.forEach((pipe, index) => {
    pipe.x -= 2;
    drawPipe(pipe);

    if (pipe.x + 60 < 0) {
      pipes.splice(index, 1);
      score++;
    }

    if (
      50 < pipe.x + 60 &&
      90 > pipe.x &&
      (birdY < pipe.y + 400 || birdY + 40 > pipe.y + 400 + 150)
    ) {
      gameRunning = false;
    }
  });

  drawBird();
  drawScore();
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', () => {
  velocity = -10;
});

playBtn.addEventListener('click', () => {
  startMenu.classList.add('hidden');
  canvas.classList.remove('hidden');
  bgMusic.play();
  resetGame();
  gameRunning = true;
  gameLoop();
});

customiseBtn.addEventListener('click', () => {
  startMenu.classList.add('hidden');
  customiseMenu.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
  customiseMenu.classList.add('hidden');
  startMenu.classList.remove('hidden');
});

document.querySelectorAll('.avatar-grid img').forEach(img => {
  img.addEventListener('click', () => {
    document.querySelectorAll('.avatar-grid img').forEach(i => i.classList.remove('selected'));
    img.classList.add('selected');
    avatar = img.dataset.avatar;
  });
});