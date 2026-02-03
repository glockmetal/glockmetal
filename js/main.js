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
    }
}

function menuDown() {
    const items = getMenuItems();
    if (items.length > 0) {
        selectedMenuIndex = (selectedMenuIndex + 1) % items.length;
        updateMenuSelection();
    }
}

function menuSelect() {
    const items = getMenuItems();
    if (items.length === 0) return;

    const selectedItem = items[selectedMenuIndex];
    const action = selectedItem.dataset.action;

    switch (action) {
        case 'start':
            showScreen('instructions-screen');
            break;

        case 'options':
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

        case 'quit':
            showScreen('title-screen');
            game = null;
            break;
    }
}

function startGame() {
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showScreen('title-screen');
    updateMenuSelection();
});
