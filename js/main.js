// Main entry point and input handling

let game = null;
let currentScreen = 'title-screen';
let selectedMenuIndex = 0;

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    selectedMenuIndex = 0;
    updateMenuSelection();
}

function updateMenuSelection() {
    const screen = document.getElementById(currentScreen);
    if (!screen) return;

    const menuItems = screen.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        if (index === selectedMenuIndex) {
            item.classList.add('selected');
            item.textContent = '> ' + item.textContent.replace(/^>\s*/, '').replace(/^\s+/, '');
        } else {
            item.classList.remove('selected');
            item.textContent = '  ' + item.textContent.replace(/^>\s*/, '').replace(/^\s+/, '');
        }
    });
}

function getMenuItems() {
    const screen = document.getElementById(currentScreen);
    if (!screen) return [];
    return screen.querySelectorAll('.menu-item');
}

function menuUp() {
    const items = getMenuItems();
    if (items.length > 0) {
        selectedMenuIndex = (selectedMenuIndex - 1 + items.length) % items.length;
        updateMenuSelection();
        if (sound) sound.menuMove();
    }
}

function menuDown() {
    const items = getMenuItems();
    if (items.length > 0) {
        selectedMenuIndex = (selectedMenuIndex + 1) % items.length;
        updateMenuSelection();
        if (sound) sound.menuMove();
    }
}

function menuSelect() {
    const items = getMenuItems();
    if (items.length === 0) return;

    const selectedItem = items[selectedMenuIndex];
    const action = selectedItem.dataset.action;

    if (sound) sound.menuSelect();

    switch (action) {
        case 'start':
            showScreen('instructions-screen');
            break;

        case 'scores':
            updateHighScoresScreen();
            showScreen('scores-screen');
            break;

        case 'options':
            updateSoundStatus();
            showScreen('options-screen');
            break;

        case 'credits':
            showScreen('credits-screen');
            break;

        case 'back':
            showScreen('title-screen');
            break;

        case 'continue':
            startGame();
            break;

        case 'restart':
            if (game) {
                game.restart();
            } else {
                startGame();
            }
            break;

        case 'toggleSound':
            toggleSound();
            break;

        case 'quit':
            showScreen('title-screen');
            game = null;
            break;
    }
}

function toggleSound() {
    if (sound) {
        const enabled = sound.toggle();
        updateSoundStatus();
        if (enabled) sound.menuSelect();
    }
}

function updateSoundStatus() {
    const statusEl = document.getElementById('sound-status');
    if (statusEl && sound) {
        statusEl.textContent = sound.enabled ? 'ON' : 'OFF';
        statusEl.style.color = sound.enabled ? '#00ff00' : '#ff0000';
    }
}

function updateHighScoresScreen() {
    const scoresContent = document.getElementById('high-scores-content');
    const statsContent = document.getElementById('lifetime-stats-content');

    if (scoresContent && highScores) {
        scoresContent.innerHTML = highScores.getScoresHTML();
    }
    if (statsContent && highScores) {
        statsContent.innerHTML = highScores.getStatsHTML();
    }
}

function startGame() {
    // Initialize sound system on first interaction
    if (sound && !sound.initialized) {
        sound.init();
    }
    if (sound) sound.startGame();

    // Initialize effects
    if (effects) effects.init();

    game = new Game();
    game.init();
    showScreen('game-screen');
    game.updateUI();
}

// Input handling
document.addEventListener('keydown', (e) => {
    // Prevent default for game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
    }

    // Global sound toggle
    if (e.key === 'm' || e.key === 'M') {
        toggleSound();
        return;
    }

    // Game screen controls
    if (currentScreen === 'game-screen' && game && game.isRunning) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                game.processPlayerAction(0, -1);
                break;

            case 'ArrowDown':
            case 's':
            case 'S':
                game.processPlayerAction(0, 1);
                break;

            case 'ArrowLeft':
            case 'a':
            case 'A':
                game.processPlayerAction(-1, 0);
                break;

            case 'ArrowRight':
            case 'd':
            case 'D':
                game.processPlayerAction(1, 0);
                break;

            case ' ':
                // Interact/use stairs
                const tile = game.map.getTile(game.player.x, game.player.y);
                if (tile === GAME_CONFIG.TILES.STAIRS_DOWN) {
                    game.useStairs('down');
                } else if (tile === GAME_CONFIG.TILES.STAIRS_UP) {
                    game.useStairs('up');
                }
                break;

            case 'Escape':
                // Cannot pause, but can quit
                if (confirm('Give up and return to title? Your progress will be lost.')) {
                    game = null;
                    showScreen('title-screen');
                }
                break;
        }
        return;
    }

    // Menu controls
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            menuUp();
            break;

        case 'ArrowDown':
        case 's':
        case 'S':
            menuDown();
            break;

        case ' ':
        case 'Enter':
            menuSelect();
            break;

        case 'Escape':
            if (currentScreen !== 'title-screen' && currentScreen !== 'game-screen') {
                showScreen('title-screen');
            }
            break;
    }
});

// Touch/Swipe Controls
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const SWIPE_THRESHOLD = 30;

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Only register if swipe is significant enough
    if (Math.max(absDeltaX, absDeltaY) < SWIPE_THRESHOLD) {
        return;
    }

    if (currentScreen === 'game-screen' && game && game.isRunning) {
        // Game movement
        if (absDeltaX > absDeltaY) {
            // Horizontal swipe
            if (deltaX > 0) {
                game.processPlayerAction(1, 0); // Right
            } else {
                game.processPlayerAction(-1, 0); // Left
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                game.processPlayerAction(0, 1); // Down
            } else {
                game.processPlayerAction(0, -1); // Up
            }
        }
    } else {
        // Menu navigation
        if (absDeltaY > absDeltaX) {
            if (deltaY > 0) {
                menuDown();
            } else {
                menuUp();
            }
        }
    }
}

// Touch event listeners for swipe
document.addEventListener('touchstart', (e) => {
    // Don't handle swipes on buttons/controls
    if (e.target.closest('#mobile-controls') || e.target.closest('.menu-item')) {
        return;
    }
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    // Don't handle swipes on buttons/controls
    if (e.target.closest('#mobile-controls') || e.target.closest('.menu-item')) {
        return;
    }
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

// D-Pad button handlers
function setupDPadControls() {
    const dpadUp = document.getElementById('dpad-up');
    const dpadDown = document.getElementById('dpad-down');
    const dpadLeft = document.getElementById('dpad-left');
    const dpadRight = document.getElementById('dpad-right');
    const btnStairs = document.getElementById('btn-stairs');
    const btnQuit = document.getElementById('btn-quit');

    if (dpadUp) {
        dpadUp.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.isRunning) game.processPlayerAction(0, -1);
        }, { passive: false });
    }

    if (dpadDown) {
        dpadDown.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.isRunning) game.processPlayerAction(0, 1);
        }, { passive: false });
    }

    if (dpadLeft) {
        dpadLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.isRunning) game.processPlayerAction(-1, 0);
        }, { passive: false });
    }

    if (dpadRight) {
        dpadRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.isRunning) game.processPlayerAction(1, 0);
        }, { passive: false });
    }

    if (btnStairs) {
        btnStairs.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.isRunning) {
                const tile = game.map.getTile(game.player.x, game.player.y);
                if (tile === GAME_CONFIG.TILES.STAIRS_DOWN) {
                    game.useStairs('down');
                } else if (tile === GAME_CONFIG.TILES.STAIRS_UP) {
                    game.useStairs('up');
                }
            }
        }, { passive: false });
    }

    if (btnQuit) {
        btnQuit.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (confirm('Give up and return to title? Your progress will be lost.')) {
                game = null;
                showScreen('title-screen');
            }
        }, { passive: false });
    }

    // Also add click handlers for mouse/desktop testing
    [dpadUp, dpadDown, dpadLeft, dpadRight, btnStairs, btnQuit].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
            });
        }
    });
}

// Menu item tap handlers
function setupMenuTapHandlers() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // Find the index of this item
            const screen = document.getElementById(currentScreen);
            const menuItems = screen.querySelectorAll('.menu-item');
            menuItems.forEach((mi, index) => {
                if (mi === item) {
                    selectedMenuIndex = index;
                    updateMenuSelection();
                    menuSelect();
                }
            });
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showScreen('title-screen');
    updateMenuSelection();
    setupDPadControls();
    setupMenuTapHandlers();
});
