const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const birdImg = new Image();
const pipeImg = new Image();
const easterEggPipeImg = new Image();
const buttonImg = document.getElementById('musicButton');
const bgMusic = document.getElementById('bgMusic');
const avatarSelect = document.getElementById('avatarSelect');

let birdSrc = avatarSelect.value;
birdImg.src = birdSrc;
pipeImg.src = 'pipes.png';
easterEggPipeImg.src = 'pipeseasteregg.png';

let bird = { x: 50, y: 150, width: 40, height: 40, gravity: 0.6, lift: -10, velocity: 0 };
let pipes = [];
let score = 0;
let gameOver = false;

function resetGame() {
  bird.y = 150;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  gameOver = false;
}

function drawBird() {
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
  pipes.forEach(pipe => {
    const img = pipe.isEasterEgg ? easterEggPipeImg : pipeImg;
    ctx.drawImage(img, pipe.x, 0, pipe.width, pipe.top);
    ctx.drawImage(img, pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
  });
}

function drawScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${score}`, 10, 30);
}

function updateBird() {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    gameOver = true;
  }
}

function updatePipes() {
  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
    const gap = 120;
    const top = Math.random() * (canvas.height - gap - 100) + 50;
    const bottom = canvas.height - top - gap;
    const isEasterEgg = Math.random() < 0.1;
    pipes.push({ x: canvas.width, width: 50, top, bottom, isEasterEgg, passed: false });
  }

  pipes.forEach(pipe => {
    pipe.x -= 2;

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      score++;
      pipe.passed = true;
    }

    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)
    ) {
      gameOver = true;
    }
  });

  pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBird();
  drawPipes();
  drawScore();
  updateBird();
  updatePipes();

  if (gameOver) {
    resetGame();
  }

  requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', () => {
  bird.velocity = bird.lift;
});

buttonImg.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play();
    buttonImg.src = 'buttonpressed.png';
  } else {
    bgMusic.pause();
    buttonImg.src = 'button.png';
  }
});

avatarSelect.addEventListener('change', () => {
  birdSrc = avatarSelect.value;
  birdImg.src = birdSrc;
});

resetGame();
gameLoop();