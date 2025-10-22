// --- Game Assets and Configuration ---
const ASSET_PATHS = {
    // Player Avatars
    'player1': 'player.gif',
    'player2': 'player2.gif',
    'player3': 'player3.webp',
    'player4': 'player4.webp',
    'player5': 'player5.webp',
    'player6': 'player6.webp',
    'player7': 'player7.webp',
    'player8': 'player8.webp',
    'player9': 'player9.webp',
    'player10': 'player10.webp',
    'player11': 'player11.webp',
    // Pipes
    'pipe': 'pipe.png',
    'rarepipe': 'rarepipe.png',
    // Audio
    'music': 'music.mp3',
    'sfx_flap': 'sfx_flap.mp3', // Assume you have a flap sound
    'sfx_hit': 'sfx_hit.mp3',   // Assume you have a hit sound
};

// --- Game State Variables ---
let GAME_STATE = 'MENU'; // States: 'MENU', 'CUSTOMIZE', 'PLAYING', 'GAMEOVER'
let bestScore = localStorage.getItem('flappyBestScore') ? parseInt(localStorage.getItem('flappyBestScore')) : 0;
let currentScore = 0;
let selectedAvatar = ASSET_PATHS['player1'];
let gameLoopId;
let pipeSpeed = 2; // Initial pipe speed

// --- Canvas and Context ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// --- Player Object ---
const player = {
    x: 50,
    y: CANVAS_HEIGHT / 2,
    width: 40,
    height: 40,
    velocity: 0,
    gravity: 0.25,
    jumpStrength: -6,
    img: new Image()
};

// --- Pipe Array ---
let pipes = [];
const PIPE_WIDTH = 52;
const PIPE_GAP = 150;
let pipeSpawnTimer = 0;
const PIPE_SPAWN_INTERVAL = 90; // Frames

// --- Assets Loading ---
const assets = {};
let assetsLoaded = 0;
const totalAssets = Object.keys(ASSET_PATHS).length;

function loadAssets() {
    for (const key in ASSET_PATHS) {
        assets[key] = new Image();
        assets[key].onload = () => {
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                console.log('All assets loaded.');
                // Initialize the player image once assets are ready
                player.img.src = selectedAvatar;
                // Start the game loop for the menu background animation (optional)
                // draw();
            }
        };
        assets[key].onerror = () => {
            console.error(`Failed to load asset: ${ASSET_PATHS[key]}`);
        };
        // Load the asset. Note: Music needs special handling.
        if (!key.startsWith('sfx_')) {
            assets[key].src = ASSET_PATHS[key];
        }
    }
}

// --- Audio Handling ---
const music = new Audio(ASSET_PATHS['music']);
music.loop = true;
let isMusicOn = true;

function toggleMusic() {
    if (isMusicOn) {
        music.pause();
        document.getElementById('music-toggle-button').textContent = 'Music: Off';
    } else {
        music.play().catch(e => console.log("Music play blocked by browser."));
        document.getElementById('music-toggle-button').textContent = 'Music: On';
    }
    isMusicOn = !isMusicOn;
}

function playSound(key) {
    if (isMusicOn) { // Re-using isMusicOn for all sound toggle
        const sound = new Audio(ASSET_PATHS[key]);
        sound.play().catch(e => console.log(`Sound ${key} play failed.`));
    }
}

// --- Core Game Functions ---

function initGame() {
    player.y = CANVAS_HEIGHT / 2;
    player.velocity = 0;
    pipes = [];
    currentScore = 0;
    pipeSpeed = 2;
    document.getElementById('score-display').textContent = currentScore;

    // Start a new game loop
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(gameLoop);
}

function flap() {
    if (GAME_STATE !== 'PLAYING') return;
    player.velocity = player.jumpStrength;
    playSound('sfx_flap');
}

function update() {
    if (GAME_STATE !== 'PLAYING') return;

    // 1. Player Physics
    player.velocity += player.gravity;
    player.y += player.velocity;

    // 2. Boundary Collision (Top)
    if (player.y < 0) {
        player.y = 0;
        player.velocity = 0;
    }
    
    // 3. Ground Collision (Game Over)
    if (player.y + player.height > CANVAS_HEIGHT) {
        gameOver();
        return;
    }

    // 4. Pipe Management
    pipeSpawnTimer++;
    if (pipeSpawnTimer >= PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        pipeSpawnTimer = 0;
    }

    // 5. Pipe Movement and Collision Check
    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= pipeSpeed;

        // Collision Check (AABB)
        const isColliding = checkCollision(player, p);
        
        if (isColliding) {
            gameOver();
            return;
        }

        // Score Check
        if (!p.scored && p.x + PIPE_WIDTH < player.x) {
            currentScore++;
            p.scored = true;
            document.getElementById('score-display').textContent = currentScore;

            // Optional: Increase difficulty
            if (currentScore % 10 === 0) {
                pipeSpeed += 0.5;
            }
        }

        // Remove off-screen pipes
        if (p.x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }
}

function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw background (or rely on CSS background-image)
    // ctx.drawImage(assets['background'], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw pipes
    pipes.forEach(p => {
        const pipeImage = p.isRare ? assets['rarepipe'] : assets['pipe'];
        
        // Draw top pipe
        ctx.save();
        ctx.translate(p.x, p.y_top + p.height);
        ctx.rotate(Math.PI); // Rotate 180 degrees
        ctx.drawImage(pipeImage, -PIPE_WIDTH, 0, PIPE_WIDTH, p.height);
        ctx.restore();

        // Draw bottom pipe
        ctx.drawImage(pipeImage, p.x, p.y_bottom, PIPE_WIDTH, CANVAS_HEIGHT - p.y_bottom);
    });

    // Draw player
    ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
}

function gameLoop() {
    if (GAME_STATE === 'PLAYING') {
        update();
    }
    draw();

    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- Pipe Spawning and Collision ---

function spawnPipe() {
    // Random height for the gap center
    const minY = 100 + PIPE_GAP / 2;
    const maxY = CANVAS_HEIGHT - 100 - PIPE_GAP / 2;
    const center = Math.random() * (maxY - minY) + minY;
    
    const topHeight = center - PIPE_GAP / 2;
    const bottomY = center + PIPE_GAP / 2;

    const isRare = Math.random() < 0.1; // 10% chance for a rare pipe

    pipes.push({
        x: CANVAS_WIDTH,
        y_top: 0,
        y_bottom: bottomY,
        height: topHeight,
        gap: PIPE_GAP,
        scored: false,
        isRare: isRare
    });
}

function checkCollision(bird, pipe) {
    const pipeTop = { x: pipe.x, y: pipe.y_top, width: PIPE_WIDTH, height: pipe.height };
    const pipeBottom = { x: pipe.x, y: pipe.y_bottom, width: PIPE_WIDTH, height: CANVAS_HEIGHT - pipe.y_bottom };

    // Check collision with top pipe
    if (bird.x < pipeTop.x + pipeTop.width &&
        bird.x + bird.width > pipeTop.x &&
        bird.y < pipeTop.y + pipeTop.height &&
        bird.y + bird.height > pipeTop.y) {
        return true;
    }

    // Check collision with bottom pipe
    if (bird.x < pipeBottom.x + pipeBottom.width &&
        bird.x + bird.width > pipeBottom.x &&
        bird.y < pipeBottom.y + pipeBottom.height &&
        bird.y + bird.height > pipeBottom.y) {
        return true;
    }

    return false;
}

function gameOver() {
    GAME_STATE = 'GAMEOVER';
    playSound('sfx_hit');
    cancelAnimationFrame(gameLoopId);

    // Update Best Score
    if (currentScore > bestScore) {
        bestScore = currentScore;
        localStorage.setItem('flappyBestScore', bestScore);
    }
    
    // Show Game Over Screen
    document.getElementById('final-score').textContent = currentScore;
    document.getElementById('best-score-gameover').textContent = bestScore;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// --- Menu & Customization Handling ---

function showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    // The canvas is never truly hidden, but the menu layers cover it.
    document.getElementById(screenId).classList.remove('hidden');
}

function populateAvatarSelection() {
    const avatarSelectionDiv = document.getElementById('avatar-selection');
    avatarSelectionDiv.innerHTML = '';
    
    // List of avatar keys to display
    const avatarKeys = Object.keys(ASSET_PATHS).filter(key => key.startsWith('player'));
    
    avatarKeys.forEach(key => {
        const path = ASSET_PATHS[key];
        const img = document.createElement('img');
        img.src = path;
        img.classList.add('avatar-option');
        img.dataset.path = path;
        img.alt = key;
        
        if (path === selectedAvatar) {
            img.classList.add('selected');
        }

        img.addEventListener('click', () => {
            // Update selected avatar
            selectedAvatar = path;
            player.img.src = path;
            
            // Update UI selection
            document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
            img.classList.add('selected');
            
            // Store selection (optional)
            localStorage.setItem('flappyAvatar', path);
        });

        avatarSelectionDiv.appendChild(img);
    });
}

// --- Event Listeners ---

// Flap on Spacebar or Click
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        flap();
    }
});
canvas.addEventListener('click', flap);

// Start Menu Buttons
document.getElementById('play-button').addEventListener('click', () => {
    GAME_STATE = 'PLAYING';
    showScreen('gameCanvas'); // This essentially just hides the menu
    document.getElementById('score-board').classList.remove('hidden');
    initGame();
    if(isMusicOn) music.play().catch(e => console.log("Music play blocked by browser."));
});

document.getElementById('customize-button').addEventListener('click', () => {
    GAME_STATE = 'CUSTOMIZE';
    populateAvatarSelection();
    showScreen('customize-menu');
});

document.getElementById('back-to-menu-button').addEventListener('click', () => {
    GAME_STATE = 'MENU';
    // Update best score on menu screen
    document.getElementById('best-score-menu').textContent = bestScore;
    showScreen('start-menu');
});

document.getElementById('music-toggle-button').addEventListener('click', toggleMusic);

// Game Over Buttons
document.getElementById('restart-button').addEventListener('click', () => {
    GAME_STATE = 'PLAYING';
    showScreen('gameCanvas');
    initGame();
    if(isMusicOn) music.play().catch(e => console.log("Music play blocked by browser."));
});

document.getElementById('back-to-start-button').addEventListener('click', () => {
    GAME_STATE = 'MENU';
    document.getElementById('best-score-menu').textContent = bestScore;
    showScreen('start-menu');
    music.pause();
});

// --- Initialization ---

function main() {
    // 1. Load best score from local storage
    document.getElementById('best-score-menu').textContent = bestScore;
    
    // 2. Add score display element
    const scoreBoard = document.createElement('div');
    scoreBoard.id = 'score-board';
    scoreBoard.innerHTML = 'Score: <span id="score-display">0</span> | Best: <span id="best-score-live">0</span>';
    document.getElementById('game-container').appendChild(scoreBoard);

    // 3. Load user's last selected avatar
    const savedAvatar = localStorage.getItem('flappyAvatar');
    if (savedAvatar) {
        selectedAvatar = savedAvatar;
    }
    
    // 4. Start loading all image and sound assets
    loadAssets();
    
    // 5. Initial screen setup
    showScreen('start-menu');
    
    // 6. Start the non-game loop for menu screen rendering/animations
    // We run the gameLoop only to keep the canvas visible, it won't call 'update'
    gameLoopId = requestAnimationFrame(gameLoop);
}

main();