// =============================================================================
// MAIN.JS - Entry Point & Input Handling
// =============================================================================
// This file is the main entry point for Alimony Adventure. It handles:
// - Screen transitions and navigation
// - Menu systems (keyboard, mouse, and touch)
// - The intro/character creation sequence
// - Input routing to the game engine
// - Mobile touch controls (swipe gestures and D-pad)
// =============================================================================

// =============================================================================
// GLOBAL STATE
// =============================================================================

// Reference to the current game instance (null when not playing)
let game = null;

// Currently active screen ID (used for input routing)
let currentScreen = 'title-screen';

// Currently selected menu item index (0-based)
let selectedMenuIndex = 0;

// =============================================================================
// CHARACTER CREATION DATA
// Stores player choices during the intro sequence
// =============================================================================

const characterData = {
    playerName: 'Dad',           // Default name if none entered
    childName: 'Kid',            // Default child name if none entered
    startingJob: 'fastFood',     // Key from JOBS constant
    introScene: 1                // Current scene in intro sequence (1-6)
};

// =============================================================================
// STARTING JOB DEFINITIONS
// Each job acts like an RPG class with different starting bonuses
// =============================================================================

const STARTING_JOBS = {
    fastFood: {
        name: 'Fast Food Worker',
        class: 'The Grinder',
        description: 'Flip burgers, mop floors, deal with Karens. Low pay but steady work.',
        flavor: '"Would you like fries with that?" you say, dead inside.',
        bonuses: {
            health: 0,
            money: 30,
            attack: 0,
            defense: 0
        },
        special: 'Enemies drop 10% more money'
    },
    warehouse: {
        name: 'Warehouse Worker',
        class: 'The Lifter',
        description: 'Move boxes until your back gives out. Hard labor, decent pay.',
        flavor: 'Your knees crack with every step. You\'re only 32.',
        bonuses: {
            health: 20,
            money: 0,
            attack: 1,
            defense: 0
        },
        special: '+20 max HP from manual labor'
    },
    rideshare: {
        name: 'Rideshare Driver',
        class: 'The Drifter',
        description: 'Your car is your office. Meet interesting strangers. Flexible hours.',
        flavor: 'The passenger rating system haunts your dreams.',
        bonuses: {
            health: 0,
            money: 50,
            attack: 0,
            defense: 0
        },
        special: 'Start with extra cash from tips'
    },
    construction: {
        name: 'Construction Worker',
        class: 'The Builder',
        description: 'Dangerous work, good pay. One wrong step and you\'re done.',
        flavor: 'The foreman doesn\'t care about your custody schedule.',
        bonuses: {
            health: 10,
            money: 20,
            attack: 2,
            defense: 1
        },
        special: '+2 ATK, +1 DEF from tough work'
    },
    security: {
        name: 'Security Guard',
        class: 'The Watcher',
        description: 'Night shifts watching nothing happen. Peaceful but lonely.',
        flavor: 'The silence gives you too much time to think.',
        bonuses: {
            health: 10,
            money: 10,
            attack: 0,
            defense: 2
        },
        special: '+2 DEF from staying alert'
    },
    callCenter: {
        name: 'Call Center Rep',
        class: 'The Voice',
        description: 'Get yelled at by strangers for things you didn\'t do.',
        flavor: '"Your call is important to us" - it isn\'t.',
        bonuses: {
            health: -10,
            money: 40,
            attack: 0,
            defense: 0
        },
        special: 'Higher starting cash, less HP from stress'
    }
};

// =============================================================================
// SCREEN MANAGEMENT
// Functions for transitioning between game screens
// =============================================================================

/**
 * Shows a specific screen and hides all others
 * @param {string} screenId - The ID of the screen element to show
 */
function showScreen(screenId) {
    // Remove 'active' class from all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Add 'active' class to target screen
    document.getElementById(screenId).classList.add('active');

    // Update current screen tracker
    currentScreen = screenId;

    // Reset menu selection to first item
    selectedMenuIndex = 0;
    updateMenuSelection();
}

/**
 * Updates the visual state of menu items to show which is selected
 * Adds '>' prefix to selected item, spaces to others
 */
function updateMenuSelection() {
    const screen = document.getElementById(currentScreen);
    if (!screen) return;

    const menuItems = screen.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        if (index === selectedMenuIndex) {
            // Selected item: add '>' prefix and highlight class
            item.classList.add('selected');
            item.textContent = '> ' + item.textContent.replace(/^>\s*/, '').replace(/^\s+/, '');
        } else {
            // Unselected: add space prefix, remove highlight
            item.classList.remove('selected');
            item.textContent = '  ' + item.textContent.replace(/^>\s*/, '').replace(/^\s+/, '');
        }
    });
}

/**
 * Gets all menu items in the current screen
 * @returns {NodeList} Collection of menu item elements
 */
function getMenuItems() {
    const screen = document.getElementById(currentScreen);
    if (!screen) return [];
    return screen.querySelectorAll('.menu-item');
}

// =============================================================================
// MENU NAVIGATION
// Functions for moving through menu options
// =============================================================================

/**
 * Move selection up in the menu (with wrap-around)
 */
function menuUp() {
    const items = getMenuItems();
    if (items.length > 0) {
        // Wrap around: if at top, go to bottom
        selectedMenuIndex = (selectedMenuIndex - 1 + items.length) % items.length;
        updateMenuSelection();
        if (sound) sound.menuMove();
    }
}

/**
 * Move selection down in the menu (with wrap-around)
 */
function menuDown() {
    const items = getMenuItems();
    if (items.length > 0) {
        // Wrap around: if at bottom, go to top
        selectedMenuIndex = (selectedMenuIndex + 1) % items.length;
        updateMenuSelection();
        if (sound) sound.menuMove();
    }
}

/**
 * Activate the currently selected menu item
 * Routes to appropriate handler based on data-action attribute
 */
function menuSelect() {
    const items = getMenuItems();
    if (items.length === 0) return;

    const selectedItem = items[selectedMenuIndex];
    const action = selectedItem.dataset.action;

    if (sound) sound.menuSelect();

    // Route to appropriate handler based on action
    switch (action) {
        case 'start':
            // Start game -> show instructions first
            showScreen('instructions-screen');
            break;

        case 'scores':
            // Show high scores screen
            updateHighScoresScreen();
            showScreen('scores-screen');
            break;

        case 'options':
            // Show options screen
            updateSoundStatus();
            showScreen('options-screen');
            break;

        case 'credits':
            // Show credits screen
            showScreen('credits-screen');
            break;

        case 'back':
            // Return to title screen
            showScreen('title-screen');
            break;

        case 'continue':
            // After instructions -> start intro sequence
            startIntroSequence();
            break;

        case 'restart':
            // Restart game (from game over/victory screen)
            if (game) {
                game.restart();
            } else {
                startIntroSequence();
            }
            break;

        case 'toggleSound':
            // Toggle sound on/off
            toggleSound();
            break;

        case 'quit':
            // Quit to title screen
            showScreen('title-screen');
            game = null;
            break;
    }
}

// =============================================================================
// SOUND CONTROLS
// =============================================================================

/**
 * Toggle sound on/off
 */
function toggleSound() {
    if (sound) {
        const enabled = sound.toggle();
        updateSoundStatus();
        // Play a sound to confirm it's on (if we just enabled it)
        if (enabled) sound.menuSelect();
    }
}

/**
 * Update the sound status display in options menu
 */
function updateSoundStatus() {
    const statusEl = document.getElementById('sound-status');
    if (statusEl && sound) {
        statusEl.textContent = sound.enabled ? 'ON' : 'OFF';
        statusEl.style.color = sound.enabled ? '#00ff00' : '#ff0000';
    }
}

// =============================================================================
// HIGH SCORES DISPLAY
// =============================================================================

/**
 * Update the high scores screen with current data from localStorage
 */
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

// =============================================================================
// INTRO SEQUENCE SYSTEM
// Handles the multi-scene character creation flow
// =============================================================================

/**
 * Start the intro/character creation sequence
 * Resets to scene 1 and initializes the job selection UI
 */
function startIntroSequence() {
    // Initialize sound on first interaction
    if (sound && !sound.initialized) {
        sound.init();
    }

    // Reset character data to defaults
    characterData.introScene = 1;
    characterData.playerName = 'Dad';
    characterData.childName = 'Kid';
    characterData.startingJob = 'fastFood';

    // Clear any previous input values
    const playerNameInput = document.getElementById('player-name');
    const childNameInput = document.getElementById('child-name');
    if (playerNameInput) playerNameInput.value = '';
    if (childNameInput) childNameInput.value = '';

    // Initialize job selection UI
    initializeJobSelection();

    // Show intro screen and first scene
    showScreen('intro-screen');
    showIntroScene(1);
}

/**
 * Show a specific intro scene, hiding all others
 * @param {number} sceneNum - Scene number (1-6)
 */
function showIntroScene(sceneNum) {
    // Hide all scenes
    document.querySelectorAll('.intro-scene').forEach(scene => {
        scene.classList.remove('active');
    });

    // Show target scene
    const targetScene = document.getElementById(`intro-scene-${sceneNum}`);
    if (targetScene) {
        targetScene.classList.add('active');
        characterData.introScene = sceneNum;

        // Focus input fields when their scene becomes active
        if (sceneNum === 3) {
            setTimeout(() => {
                const input = document.getElementById('player-name');
                if (input) input.focus();
            }, 100);
        } else if (sceneNum === 4) {
            setTimeout(() => {
                const input = document.getElementById('child-name');
                if (input) input.focus();
            }, 100);
        } else if (sceneNum === 5) {
            // Select first job by default
            selectJob('fastFood');
        } else if (sceneNum === 6) {
            // Update final scene with chosen names
            updateFinalScene();
        }
    }

    // Play sound for scene transition
    if (sound) sound.menuMove();
}

/**
 * Advance to the next intro scene
 * Handles validation for input scenes
 */
function advanceIntroScene() {
    const currentScene = characterData.introScene;

    // Scene 3: Validate player name
    if (currentScene === 3) {
        const input = document.getElementById('player-name');
        const name = input ? input.value.trim() : '';
        characterData.playerName = name || 'Dad';
    }

    // Scene 4: Validate child name
    if (currentScene === 4) {
        const input = document.getElementById('child-name');
        const name = input ? input.value.trim() : '';
        characterData.childName = name || 'Kid';
    }

    // Scene 6: Start the actual game
    if (currentScene === 6) {
        startGame();
        return;
    }

    // Move to next scene
    showIntroScene(currentScene + 1);
}

/**
 * Update the final intro scene with chosen character names
 */
function updateFinalScene() {
    // Update player name display
    const playerNameDisplays = document.querySelectorAll('.player-name-display');
    playerNameDisplays.forEach(el => {
        el.textContent = characterData.playerName;
    });

    // Update child name display
    const childNameDisplays = document.querySelectorAll('.child-name-display');
    childNameDisplays.forEach(el => {
        el.textContent = characterData.childName;
    });
}

// =============================================================================
// JOB SELECTION SYSTEM
// Handles the RPG-style class/job selection during character creation
// =============================================================================

/**
 * Initialize the job selection UI
 * Populates the job list with all available starting jobs
 */
function initializeJobSelection() {
    const jobList = document.getElementById('job-list');
    if (!jobList) return;

    // Clear existing content
    jobList.innerHTML = '';

    // Create an option for each job
    Object.entries(STARTING_JOBS).forEach(([key, job]) => {
        const option = document.createElement('div');
        option.className = 'job-option';
        option.dataset.job = key;
        option.innerHTML = `
            <span class="job-name">${job.name}</span>
            <span class="job-class">[${job.class}]</span>
        `;

        // Click handler for selection
        option.addEventListener('click', () => selectJob(key));

        jobList.appendChild(option);
    });
}

/**
 * Select a job and update the description panel
 * @param {string} jobKey - Key from STARTING_JOBS object
 */
function selectJob(jobKey) {
    const job = STARTING_JOBS[jobKey];
    if (!job) return;

    // Update selection state
    characterData.startingJob = jobKey;

    // Update visual selection
    document.querySelectorAll('.job-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.job === jobKey) {
            opt.classList.add('selected');
        }
    });

    // Update description panel
    const descPanel = document.getElementById('job-description');
    if (descPanel) {
        // Build bonus text
        const bonuses = job.bonuses;
        let bonusHTML = '';

        if (bonuses.health > 0) bonusHTML += `<span class="job-stat bonus">+${bonuses.health} HP</span>`;
        if (bonuses.health < 0) bonusHTML += `<span class="job-stat penalty">${bonuses.health} HP</span>`;
        if (bonuses.money > 0) bonusHTML += `<span class="job-stat bonus">+$${bonuses.money}</span>`;
        if (bonuses.attack > 0) bonusHTML += `<span class="job-stat bonus">+${bonuses.attack} ATK</span>`;
        if (bonuses.defense > 0) bonusHTML += `<span class="job-stat bonus">+${bonuses.defense} DEF</span>`;

        descPanel.innerHTML = `
            <p class="job-desc-title">${job.name}</p>
            <p class="job-desc-flavor">${job.flavor}</p>
            <p>${job.description}</p>
            <div class="job-stats">${bonusHTML}</div>
            <p class="job-stat bonus" style="margin-top: 10px;">* ${job.special}</p>
        `;
    }

    if (sound) sound.menuMove();
}

/**
 * Navigate job selection up
 */
function jobSelectionUp() {
    const jobs = Object.keys(STARTING_JOBS);
    const currentIndex = jobs.indexOf(characterData.startingJob);
    const newIndex = (currentIndex - 1 + jobs.length) % jobs.length;
    selectJob(jobs[newIndex]);
}

/**
 * Navigate job selection down
 */
function jobSelectionDown() {
    const jobs = Object.keys(STARTING_JOBS);
    const currentIndex = jobs.indexOf(characterData.startingJob);
    const newIndex = (currentIndex + 1) % jobs.length;
    selectJob(jobs[newIndex]);
}

// =============================================================================
// GAME INITIALIZATION
// =============================================================================

/**
 * Start the actual game with the created character
 * Applies job bonuses and initializes the game engine
 */
function startGame() {
    // Initialize sound system if not already done
    if (sound && !sound.initialized) {
        sound.init();
    }
    if (sound) sound.startGame();

    // Initialize visual effects system
    if (effects) effects.init();

    // Create new game instance
    game = new Game();

    // Apply character data to game
    game.playerName = characterData.playerName;
    game.childName = characterData.childName;
    game.startingJobKey = characterData.startingJob;

    // Get job bonuses
    const job = STARTING_JOBS[characterData.startingJob];
    if (job) {
        game.startingBonuses = job.bonuses;
        game.startingJobSpecial = job.special;
    }

    // Initialize game with character data
    game.init();

    // Show game screen
    showScreen('game-screen');
    game.updateUI();
}

// =============================================================================
// KEYBOARD INPUT HANDLING
// Main keyboard event listener for all game states
// =============================================================================

document.addEventListener('keydown', (e) => {
    // Check if user is typing in an input field
    // If so, allow normal typing behavior (don't intercept keys)
    const activeElement = document.activeElement;
    const isTypingInInput = activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

    // If typing in input, only intercept Enter (to submit) and Escape
    if (isTypingInInput) {
        if (e.key === 'Enter') {
            e.preventDefault();
            advanceIntroScene();
        }
        // Allow all other keys to pass through for normal typing
        return;
    }

    // Prevent default browser behavior for game keys
    // This stops arrow keys from scrolling, space from activating buttons, etc.
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
         'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
    }

    // Global sound toggle (works on any screen)
    if (e.key === 'm' || e.key === 'M') {
        toggleSound();
        return;
    }

    // ===================
    // INTRO SCREEN INPUT
    // ===================
    if (currentScreen === 'intro-screen') {
        handleIntroInput(e);
        return;
    }

    // ===================
    // GAME SCREEN INPUT
    // ===================
    if (currentScreen === 'game-screen' && game && game.isRunning) {
        switch (e.key) {
            // Movement: WASD or Arrow Keys
            case 'ArrowUp':
            case 'w':
            case 'W':
                game.processPlayerAction(0, -1);  // Move up
                break;

            case 'ArrowDown':
            case 's':
            case 'S':
                game.processPlayerAction(0, 1);   // Move down
                break;

            case 'ArrowLeft':
            case 'a':
            case 'A':
                game.processPlayerAction(-1, 0);  // Move left
                break;

            case 'ArrowRight':
            case 'd':
            case 'D':
                game.processPlayerAction(1, 0);   // Move right
                break;

            // Interact/Use Stairs
            case ' ':
                const tile = game.map.getTile(game.player.x, game.player.y);
                if (tile === GAME_CONFIG.TILES.STAIRS_DOWN) {
                    game.useStairs('down');
                } else if (tile === GAME_CONFIG.TILES.STAIRS_UP) {
                    game.useStairs('up');
                }
                break;

            // Quit game (with confirmation)
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

    // ===================
    // MENU SCREEN INPUT
    // ===================
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
            // Go back to title from sub-menus
            if (currentScreen !== 'title-screen' && currentScreen !== 'game-screen') {
                showScreen('title-screen');
            }
            break;
    }
});

/**
 * Handle keyboard input specifically for the intro sequence
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleIntroInput(e) {
    const scene = characterData.introScene;

    // Scenes 1, 2: Just advance on space/enter
    if (scene === 1 || scene === 2) {
        if (e.key === ' ' || e.key === 'Enter') {
            advanceIntroScene();
        }
        return;
    }

    // Scene 3, 4: Name input - enter to confirm
    if (scene === 3 || scene === 4) {
        if (e.key === 'Enter') {
            advanceIntroScene();
        }
        return;
    }

    // Scene 5: Job selection
    if (scene === 5) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            jobSelectionUp();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            jobSelectionDown();
        } else if (e.key === 'Enter' || e.key === ' ') {
            advanceIntroScene();
        }
        return;
    }

    // Scene 6: Final scene - start game
    if (scene === 6) {
        if (e.key === ' ' || e.key === 'Enter') {
            advanceIntroScene();
        }
        return;
    }
}

// =============================================================================
// TOUCH/SWIPE CONTROLS
// For mobile device support
// =============================================================================

// Track touch start and end positions for swipe detection
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Minimum distance (in pixels) to register as a swipe
const SWIPE_THRESHOLD = 30;

/**
 * Process a completed touch gesture and determine swipe direction
 */
function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Ignore if swipe is too short
    if (Math.max(absDeltaX, absDeltaY) < SWIPE_THRESHOLD) {
        return;
    }

    // Game screen: swipes control player movement
    if (currentScreen === 'game-screen' && game && game.isRunning) {
        if (absDeltaX > absDeltaY) {
            // Horizontal swipe dominant
            if (deltaX > 0) {
                game.processPlayerAction(1, 0);   // Swipe right = move right
            } else {
                game.processPlayerAction(-1, 0);  // Swipe left = move left
            }
        } else {
            // Vertical swipe dominant
            if (deltaY > 0) {
                game.processPlayerAction(0, 1);   // Swipe down = move down
            } else {
                game.processPlayerAction(0, -1);  // Swipe up = move up
            }
        }
    }
    // Intro screen: swipes navigate job selection
    else if (currentScreen === 'intro-screen' && characterData.introScene === 5) {
        if (absDeltaY > absDeltaX) {
            if (deltaY > 0) {
                jobSelectionDown();
            } else {
                jobSelectionUp();
            }
        }
    }
    // Menu screens: vertical swipes navigate options
    else {
        if (absDeltaY > absDeltaX) {
            if (deltaY > 0) {
                menuDown();
            } else {
                menuUp();
            }
        }
    }
}

// Touch start: record starting position
document.addEventListener('touchstart', (e) => {
    // Don't handle swipes on interactive elements
    if (e.target.closest('#mobile-controls') ||
        e.target.closest('.menu-item') ||
        e.target.closest('input') ||
        e.target.closest('.job-option')) {
        return;
    }
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

// Touch end: record end position and process swipe
document.addEventListener('touchend', (e) => {
    // Don't handle swipes on interactive elements
    if (e.target.closest('#mobile-controls') ||
        e.target.closest('.menu-item') ||
        e.target.closest('input') ||
        e.target.closest('.job-option')) {
        return;
    }
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

// =============================================================================
// D-PAD BUTTON CONTROLS
// Virtual gamepad for mobile devices
// =============================================================================

/**
 * Set up touch handlers for the mobile D-pad and action buttons
 */
function setupDPadControls() {
    const dpadUp = document.getElementById('dpad-up');
    const dpadDown = document.getElementById('dpad-down');
    const dpadLeft = document.getElementById('dpad-left');
    const dpadRight = document.getElementById('dpad-right');
    const btnStairs = document.getElementById('btn-stairs');
    const btnQuit = document.getElementById('btn-quit');

    // D-pad Up button
    if (dpadUp) {
        dpadUp.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.isRunning) game.processPlayerAction(0, -1);
        }, { passive: false });
    }

    // D-pad Down button
    if (dpadDown) {
        dpadDown.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.isRunning) game.processPlayerAction(0, 1);
        }, { passive: false });
    }

    // D-pad Left button
    if (dpadLeft) {
        dpadLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.isRunning) game.processPlayerAction(-1, 0);
        }, { passive: false });
    }

    // D-pad Right button
    if (dpadRight) {
        dpadRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.isRunning) game.processPlayerAction(1, 0);
        }, { passive: false });
    }

    // Stairs button - use stairs when standing on them
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

    // Quit button - return to title with confirmation
    if (btnQuit) {
        btnQuit.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (confirm('Give up and return to title? Your progress will be lost.')) {
                game = null;
                showScreen('title-screen');
            }
        }, { passive: false });
    }

    // Prevent accidental double-taps on all buttons
    [dpadUp, dpadDown, dpadLeft, dpadRight, btnStairs, btnQuit].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
            });
        }
    });
}

// =============================================================================
// MENU TAP HANDLERS
// Allow clicking/tapping on menu items directly
// =============================================================================

/**
 * Set up click/tap handlers for all menu items
 */
function setupMenuTapHandlers() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Find which screen we're on and the index of the clicked item
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

/**
 * Set up tap handlers for intro screen interactions
 */
function setupIntroTapHandlers() {
    // Tap on intro scenes 1, 2, 6 to advance
    document.querySelectorAll('.intro-prompt').forEach(prompt => {
        prompt.addEventListener('click', () => {
            const scene = characterData.introScene;
            if (scene === 1 || scene === 2 || scene === 6) {
                advanceIntroScene();
            } else if (scene === 5) {
                // Job selection - confirm selection
                advanceIntroScene();
            }
        });
    });
}

// =============================================================================
// INITIALIZATION
// Run when the DOM is fully loaded
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Show the title screen
    showScreen('title-screen');
    updateMenuSelection();

    // Set up all input handlers
    setupDPadControls();
    setupMenuTapHandlers();
    setupIntroTapHandlers();

    // Log initialization (can be removed in production)
    console.log('Alimony Adventure initialized');
});
