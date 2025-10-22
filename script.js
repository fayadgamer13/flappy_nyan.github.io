// --- Configuration & Assets ---
const CANVAS = document.getElementById('game-canvas');
const CTX = CANVAS.getContext('2d');
const GAME_WIDTH = CANVAS.width;
const GAME_HEIGHT = CANVAS.height;

// Game State Variables
let gameLoopInterval;
let gameRunning = false;
let currentScore = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;

// Player/Bird Configuration
const PLAYER_SIZE = 40;
let playerY = GAME_HEIGHT / 2;
let playerVelocity = 0;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;

// Pipe Configuration
const PIPE_WIDTH = 50;
const PIPE_GAP = 120;
const PIPE_SPEED = 3;
let pipes = [];
let frameCount = 0;
const PIPE_SPAWN_RATE = 100; // Spawn a pipe every 100 frames (~2 seconds)

// Asset Loading (Use your provided files)
const assets = {
    player: new Image(),
    pipe: new Image(),
    rarepipe: new Image(),
    background: new Image(),
    music: document.getElementById('game-music'),
    // ... other images could be loaded here if needed for drawing on canvas
};

// Player Avatars (Used for selection and drawing)
const PLAYER_ASSETS = {
    'default': 'player.gif',
    'player2': 'player2.gif',
    'player3': 'player3.webp',
    'player4': 'player4.webp',
    'player5': 'player5.webp',
    'player6': 'player6.webp',
    'player7': 'player7.webp',
    'player8': 'player8.webp',
    'player9': 'player9.webp',
    'player10': 'player10.webp',
    'player11': 'player11.webp'
};

let currentAvatarKey = 'default';

// Set image sources and load initial player
assets.player.src = PLAYER_ASSETS[currentAvatarKey];
assets.pipe.src = 'pipe.png';
assets.rarepipe.src = 'rarepipe.png';
assets.background.src = 'background.png';

// --- DOM Elements ---
const startMenu = document.getElementById('start-menu');
const customizeMenu = document.getElementById('customize-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const scoreOverlay = document.getElementById('score-overlay');

const highScoreDisplay = document.getElementById('high-score-display');
const currentScoreDisplay = document.getElementById('current-score-display');
const finalScoreDisplay = document.getElementById('final-score-display');
const bestScoreDisplay = document.getElementById('best-score-display');
const avatarSelection = document.getElementById('avatar-selection');
const debugOutput = document.getElementById('debug-output');


// --- Utility Functions ---

/** Logs a message to the in-game debug log. */
function debugLog(message) {
    console.log(`[DEBUG] ${message}`);
    const time = new Date().toLocaleTimeString();
    debugOutput.innerHTML = `<div>[${time}] ${message}</div>` + debugOutput.innerHTML;
}

/** Updates the high score and saves it to local storage. */
function updateHighScore() {
    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem('flappyHighScore', highScore);
    }
    highScoreDisplay.textContent = highScore;
    bestScoreDisplay.textContent = highScore;
}

/** Hides all game screens/menus. */
function hideAllScreens() {
    startMenu.classList.add('hidden');
    customizeMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    scoreOverlay.classList.add('hidden');
}

/** Switches to a specific screen/menu. */
function showScreen(element) {
    hideAllScreens();
    element.classList.remove('hidden');
}

/** Handles the bird's jump action. */
function jump() {
    if (!gameRunning) return;
    playerVelocity = JUMP_FORCE;
    debugLog("Jump!");
}

// --- Game Logic ---

/** Resets the game state and starts the game loop. */
function startGame() {
    if (gameRunning) return;

    // Reset state
    playerY = GAME_HEIGHT / 2;
    playerVelocity = 0;
    pipes = [];
    currentScore = 0;
    frameCount = 0;
    gameRunning = true;

    // UI updates
    showScreen(scoreOverlay);
    currentScoreDisplay.textContent = currentScore;

    // Start audio (requires user interaction first)
    assets.music.play().catch(e => debugLog("Music autoplay blocked."));

    // Start the loop
    gameLoopInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    debugLog("Game Started.");
}

/** Stops the game loop and shows the game over screen. */
function gameOver() {
    if (!gameRunning) return;
    clearInterval(gameLoopInterval);
    gameRunning = false;

    // UI & Score updates
    updateHighScore();
    finalScoreDisplay.textContent = currentScore;
    showScreen(gameOverMenu);

    // Stop audio
    assets.music.pause();
    assets.music.currentTime = 0;

    debugLog(`Game Over! Score: ${currentScore}`);
}

/**
 * The main game loop function, called repeatedly.
 */
function gameLoop() {
    // 1. Clear the canvas (draw background)
    CTX.drawImage(assets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Update and Draw Player
    playerVelocity += GRAVITY;
    playerY += playerVelocity;

    // Draw the current player avatar
    CTX.drawImage(assets.player, 50, playerY, PLAYER_SIZE, PLAYER_SIZE);

    // 3. Generate Pipes
    frameCount++;
    if (frameCount % PIPE_SPAWN_RATE === 0) {
        const pipeHeight = Math.floor(Math.random() * (GAME_HEIGHT - 2 * PIPE_GAP)) + PIPE_GAP / 2;
        const isRare = Math.random() < 0.1; // 10% chance for rare pipe
        pipes.push({
            x: GAME_WIDTH,
            y: pipeHeight, // Center of the gap
            isPassed: false,
            isRare: isRare
        });
        debugLog(`Pipe spawned. Rare: ${isRare}`);
    }

    // 4. Update, Draw, and Check Pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= PIPE_SPEED;

        const pipeAsset = p.isRare ? assets.rarepipe : assets.pipe;

        // Draw top pipe
        const topPipeHeight = p.y - PIPE_GAP / 2;
        CTX.drawImage(pipeAsset, p.x, 0, PIPE_WIDTH, topPipeHeight);

        // Draw bottom pipe (flipped, but using same image for simplicity)
        const bottomPipeY = p.y + PIPE_GAP / 2;
        const bottomPipeHeight = GAME_HEIGHT - bottomPipeY;
        CTX.drawImage(pipeAsset, p.x, bottomPipeY, PIPE_WIDTH, bottomPipeHeight);

        // Score Check
        if (p.x + PIPE_WIDTH < 50 && !p.isPassed) {
            currentScore += p.isRare ? 5 : 1; // Rare pipe gives more points
            currentScoreDisplay.textContent = currentScore;
            p.isPassed = true;
            debugLog(`Scored! Current Score: ${currentScore}`);
        }

        // Collision Check (Simple bounding box)
        const playerX = 50;
        const playerRight = playerX + PLAYER_SIZE;
        const playerBottom = playerY + PLAYER_SIZE;

        if (playerRight > p.x && playerX < p.x + PIPE_WIDTH) { // X-overlap
            if (playerY < topPipeHeight || playerBottom > bottomPipeY) { // Y-overlap
                gameOver();
                return; // Stop the loop execution immediately
            }
        }

        // Remove pipes that are off-screen
        if (p.x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }

    // 5. Ground and Ceiling Collision
    if (playerY + PLAYER_SIZE > GAME_HEIGHT || playerY < 0) {
        gameOver();
        return;
    }
}

// --- Customization Menu Handlers ---

/** Renders the list of avatars in the customization menu. */
function renderAvatars() {
    avatarSelection.innerHTML = ''; // Clear previous options
    Object.keys(PLAYER_ASSETS).forEach(key => {
        const img = document.createElement('img');
        img.src = PLAYER_ASSETS[key];
        img.classList.add('avatar-option');
        img.dataset.key = key;

        if (key === currentAvatarKey) {
            img.classList.add('selected');
        }

        img.addEventListener('click', () => {
            selectAvatar(key);
        });

        avatarSelection.appendChild(img);
    });
}

/** Sets the selected avatar. */
function selectAvatar(key) {
    currentAvatarKey = key;
    assets.player.src = PLAYER_ASSETS[key];
    localStorage.setItem('flappyAvatar', key);

    // Update selection highlight
    document.querySelectorAll('.avatar-option').forEach(img => {
        img.classList.remove('selected');
        if (img.dataset.key === key) {
            img.classList.add('selected');
        }
    });

    debugLog(`Avatar set to: ${key}`);
}

// --- Initialization & Event Listeners ---

// 1. Initial High Score Load
highScoreDisplay.textContent = highScore;

// 2. Initial Avatar Load
const savedAvatar = localStorage.getItem('flappyAvatar');
if (savedAvatar && PLAYER_ASSETS[savedAvatar]) {
    selectAvatar(savedAvatar);
} else {
    // Rerun selection logic to ensure 'default' is highlighted
    selectAvatar(currentAvatarKey);
}

// 3. Menu Button Listeners
document.getElementById('play-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', startGame);

document.getElementById('customize-button').addEventListener('click', () => {
    renderAvatars(); // Render every time menu is opened
    showScreen(customizeMenu);
});

document.getElementById('back-button').addEventListener('click', () => {
    showScreen(startMenu);
});

document.getElementById('menu-button-from-gameover').addEventListener('click', () => {
    showScreen(startMenu);
});

// 4. Game Input Listener (Jump)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); // Stop scrolling when pressing space
        jump();
    }
});

CANVAS.addEventListener('click', jump);

// 5. Initial Screen Setup
showScreen(startMenu);
debugLog("Game initialized. Ready to Play!");
