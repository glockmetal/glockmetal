// =============================================================================
// GAME.JS - Main Game Engine
// =============================================================================
// This file contains the core Game class that manages:
// - Game state (running, paused, game over, victory)
// - Time/calendar system (days, months, years)
// - Alimony payment mechanics
// - Turn processing and event triggers
// - Combat resolution
// - Item collection
// - Life events (child milestones, emergencies, visitation)
// =============================================================================

class Game {
    // =========================================================================
    // CONSTRUCTOR
    // Initializes all game state variables to their default values
    // =========================================================================
    constructor() {
        // -------------------------
        // Core game objects
        // -------------------------
        this.player = null;      // Player instance (created in init())
        this.map = null;         // GameMap instance (created in init())
        this.currentFloor = 1;   // Current dungeon floor (1 = first job)

        // -------------------------
        // Message log system
        // -------------------------
        this.gameLog = [];       // Array of log messages shown to player
        this.maxLogSize = 50;    // Maximum messages to keep in memory

        // -------------------------
        // Time/Payment system
        // The game's core mechanic: earn money to pay monthly alimony
        // -------------------------
        this.currentDay = 1;                           // Day of the month (1-30)
        this.currentMonth = 1;                         // Month of the year (1-12)
        this.currentYear = 1;                          // Year since game start
        this.daysUntilPayment = GAME_CONFIG.DAYS_PER_MONTH;  // Days until alimony is due
        this.childAge = GAME_CONFIG.CHILD_STARTING_AGE;      // Child's current age (starts at 5)
        this.alimonyAmount = GAME_CONFIG.STARTING_ALIMONY;   // Monthly payment amount
        this.missedPayments = 0;                       // Counter for consecutive missed payments
        this.maxMissedPayments = 3;                    // Miss 3 in a row = jail = game over

        // -------------------------
        // Living expenses
        // -------------------------
        this.rentPaid = false;   // Track if rent was paid this month

        // -------------------------
        // Game state flags
        // -------------------------
        this.isRunning = false;  // True when actively playing
        this.isPaused = false;   // (unused - game cannot be paused per design)
        this.gameOver = false;   // True when game has ended (loss or win)
        this.victory = false;    // True if game ended in victory
        this.gameOverReason = '';// Message explaining why game ended

        // -------------------------
        // Turn counter
        // Turns progress time: X turns = 1 day
        // -------------------------
        this.turnCount = 0;           // Turns taken today
        this.turnsPerDay = 50;        // How many turns make up one day

        // -------------------------
        // Event cooldowns
        // Prevent events from triggering too frequently
        // -------------------------
        this.lastChildEvent = 0;      // Day when last child event occurred
        this.lastEmergency = 0;       // Day when last emergency occurred
        this.visitationActive = false;// True during visitation time
        this.visitationTurns = 0;     // Turns remaining in current visitation

        // -------------------------
        // Statistics tracking
        // Used for end-game summary and high scores
        // -------------------------
        this.totalExpenses = 0;       // Money spent on non-alimony expenses
        this.eventsExperienced = [];  // Log of life events for narrative

        // -------------------------
        // Special modifiers
        // -------------------------
        this.hasPermanentBonus = false;// From lucky break events
        this.moneyMultiplier = 1.0;    // Multiplier for money drops

        // -------------------------
        // Character creation data
        // Set by main.js before init() is called
        // -------------------------
        this.playerName = 'Dad';       // Player's name (from intro)
        this.childName = 'Kid';        // Child's name (from intro)
        this.startingJobKey = 'fastFood';// Starting job key
        this.startingBonuses = null;   // Bonus stats from job selection
        this.startingJobSpecial = '';  // Special ability text
    }

    // =========================================================================
    // INIT - Initialize a new game
    // Called when starting a new game or restarting after game over
    // =========================================================================
    init() {
        // Create player with starting bonuses from job selection
        this.player = new Player();

        // Apply job bonuses if set (from character creation)
        if (this.startingBonuses) {
            // Health bonus/penalty
            if (this.startingBonuses.health) {
                this.player.maxHealth += this.startingBonuses.health;
                this.player.health = this.player.maxHealth;
            }
            // Starting money bonus
            if (this.startingBonuses.money) {
                this.player.money += this.startingBonuses.money;
            }
            // Attack bonus
            if (this.startingBonuses.attack) {
                this.player.baseAttack += this.startingBonuses.attack;
            }
            // Defense bonus
            if (this.startingBonuses.defense) {
                this.player.defense += this.startingBonuses.defense;
            }
        }

        // Set player name
        this.player.name = this.playerName;

        // Apply job-specific special abilities
        if (this.startingJobKey === 'fastFood') {
            // Fast food workers get 10% more money from enemies
            this.moneyMultiplier = 1.1;
        }

        // Create map and generate first floor
        this.map = new GameMap(GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);
        this.generateFloor();

        // Place player at starting position
        const startPos = this.map.getPlayerStartPosition();
        this.player.setPosition(startPos.x, startPos.y);

        // Start the game
        this.isRunning = true;

        // Initial log messages
        this.log(`${this.playerName} clocks in at the ${this.map.currentJob.name}.`);
        this.log(this.map.currentJob.description);
        this.log(`Alimony for ${this.childName} due in ${this.daysUntilPayment} days: ${formatMoney(this.alimonyAmount)}`);
    }

    // =========================================================================
    // FLOOR GENERATION
    // Creates a new dungeon floor with rooms, enemies, and items
    // =========================================================================
    generateFloor() {
        // Generate new map layout (rooms, corridors, stairs)
        this.map.generate(this.currentFloor);

        // Track highest floor reached (for stats)
        this.player.floorsExplored = Math.max(this.player.floorsExplored, this.currentFloor);
    }

    // =========================================================================
    // LOGGING SYSTEM
    // Displays messages to the player in the game log area
    // =========================================================================

    /**
     * Add a message to the game log
     * @param {string} message - The message to display
     */
    log(message) {
        this.gameLog.push(message);

        // Keep log from growing too large
        if (this.gameLog.length > this.maxLogSize) {
            this.gameLog.shift(); // Remove oldest message
        }

        this.updateLogDisplay();
    }

    /**
     * Update the DOM element showing the game log
     * Shows the 5 most recent messages
     */
    updateLogDisplay() {
        const logElement = document.getElementById('game-log');
        if (logElement) {
            // Get last 5 messages and format as HTML paragraphs
            logElement.innerHTML = this.gameLog
                .slice(-5)
                .map(msg => `<p>${msg}</p>`)
                .join('');

            // Auto-scroll to bottom
            logElement.scrollTop = logElement.scrollHeight;
        }
    }

    // =========================================================================
    // UI UPDATE
    // Refreshes all UI elements to reflect current game state
    // =========================================================================
    updateUI() {
        // ----- Player Health Display -----
        // Shows current/max HP with color coding based on percentage
        const healthEl = document.getElementById('health');
        const healthPercent = this.player.health / this.player.maxHealth;
        healthEl.textContent = `HP: ${this.player.health}/${this.player.maxHealth}`;

        // Color code: red when low, orange when medium, green when healthy
        if (healthPercent < 0.3) {
            healthEl.style.color = '#ff0000';  // Critical
        } else if (healthPercent < 0.6) {
            healthEl.style.color = '#ffaa00';  // Warning
        } else {
            healthEl.style.color = '#00ff00';  // Healthy
        }

        // ----- Money Display -----
        document.getElementById('money').textContent = `$: ${this.player.money}`;

        // ----- Alimony Due Display -----
        // Shows amount due, green if affordable, magenta if not
        const alimonyEl = document.getElementById('alimony-due');
        alimonyEl.textContent = `ALIMONY: ${formatMoney(this.alimonyAmount)}`;
        alimonyEl.style.color = this.player.money >= this.alimonyAmount ? '#00ff00' : '#ff00ff';

        // ----- Child Age Display -----
        document.getElementById('child-age').textContent = `${this.childName}: ${this.childAge}`;

        // ----- Days Until Payment Display -----
        // Color coded urgency: red when critical, orange when close, cyan otherwise
        const daysEl = document.getElementById('days-until-payment');
        daysEl.textContent = `Due in: ${this.daysUntilPayment}d`;

        if (this.daysUntilPayment <= 5) {
            daysEl.style.color = '#ff0000';  // Critical
        } else if (this.daysUntilPayment <= 10) {
            daysEl.style.color = '#ff8800';  // Warning
        } else {
            daysEl.style.color = '#00ffff';  // Normal
        }

        // ----- Map Render -----
        // Render the ASCII map centered on the player
        const mapElement = document.getElementById('game-map');
        if (mapElement) {
            mapElement.innerHTML = `<pre>${this.map.render(this.player.x, this.player.y)}</pre>`;
        }
    }

    // =========================================================================
    // PLAYER ACTION PROCESSING
    // Handles player movement and interaction attempts
    // =========================================================================

    /**
     * Process a player movement action
     * @param {number} dx - X direction (-1 left, 0 none, 1 right)
     * @param {number} dy - Y direction (-1 up, 0 none, 1 down)
     */
    processPlayerAction(dx, dy) {
        // Don't process actions if game is over
        if (!this.isRunning || this.gameOver) return;

        // Calculate target position
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // ----- Check for NPC at target position -----
        const npc = this.map.getNPCAt(newX, newY);
        if (npc) {
            this.handleNPCInteraction(npc);
            this.processTurn();
            return;
        }

        // ----- Attempt to move player -----
        // Player.move() handles collision detection and returns result
        const result = this.player.move(dx, dy, this.map);

        // Handle the result of the movement attempt
        switch (result.type) {
            case 'combat':
                // Player bumped into an enemy - initiate combat
                this.handleCombat(result.target);
                break;

            case 'item':
                // Player stepped on an item - pick it up
                this.handleItem(result.item);
                break;

            case 'stairs_down':
                // Player is on stairs down - prompt to use
                this.log('Press SPACE to go to next shift.');
                break;

            case 'stairs_up':
                // Player is on stairs up - prompt to use
                this.log('Press SPACE to go back.');
                break;

            case 'move':
                // Successful movement - occasionally show flavor text
                if (Math.random() < 0.05) {
                    this.log(this.map.getJobFlavorText());
                }
                break;

            case 'blocked':
                // Movement blocked by wall - don't process turn
                return;
        }

        // Movement was successful or action was taken - process turn
        this.processTurn();
    }

    // =========================================================================
    // NPC INTERACTION
    // Handles talking to friendly NPCs (fellow workers, etc.)
    // =========================================================================

    /**
     * Handle interaction with an NPC
     * @param {Object} npc - The NPC being interacted with
     */
    handleNPCInteraction(npc) {
        // NPCs can only be talked to once
        if (npc.spoken) {
            this.log(`${npc.name} nods at you silently.`);
            return;
        }

        // Play NPC interaction sound
        if (sound) sound.npcTalk();

        // Get a random dialogue line from the NPC
        const dialogue = randomChoice(npc.dialogues);
        this.log(`${npc.name}: ${dialogue}`);

        // ----- Money gift -----
        // Some NPCs give money (e.g., kind strangers, tips)
        if (npc.givesMoney && npc.givesMoney[1] > 0) {
            const amount = randomInt(npc.givesMoney[0], npc.givesMoney[1]);
            if (amount > 0) {
                this.player.addMoney(amount);
                this.log(`They gave you ${formatMoney(amount)}.`);
            }
        }

        // ----- Item gift -----
        // Some NPCs give items (e.g., snacks, tools)
        if (npc.givesItem) {
            const itemData = ITEMS[npc.givesItem];
            if (itemData) {
                this.log(`They gave you a ${itemData.name}.`);
                // Apply consumable effects immediately
                if (itemData.type === 'consumable' && itemData.effect === 'heal') {
                    this.player.heal(itemData.value);
                    this.log(`You feel a bit better. (+${itemData.value} HP)`);
                }
            }
        }

        // Mark NPC as spoken to
        npc.spoken = true;
    }

    // =========================================================================
    // COMBAT SYSTEM
    // Handles attacking enemies when player bumps into them
    // =========================================================================

    /**
     * Handle combat with an enemy
     * @param {Enemy} enemy - The enemy being attacked
     */
    handleCombat(enemy) {
        // ----- Player attacks enemy -----
        const playerDamage = this.player.attack(enemy);
        this.log(formatMessage(MESSAGES.ENEMY_HIT, { enemy: enemy.name, damage: playerDamage }));

        // Sound and visual feedback
        if (sound) sound.enemyHit();
        if (effects) effects.shakeLight();

        // ----- Check if enemy died -----
        if (!enemy.isAlive()) {
            // Calculate money drop (with multiplier from job bonuses)
            const baseDrop = enemy.getMoneyDrop();
            const moneyDrop = Math.floor(baseDrop * this.moneyMultiplier);

            // Give rewards
            this.player.addMoney(moneyDrop);
            this.player.enemiesKilled++;

            // Grant experience and check for level up
            const leveledUp = this.player.addExp(enemy.expValue);

            // Log the kill
            this.log(formatMessage(MESSAGES.ENEMY_KILLED, { enemy: enemy.name, money: moneyDrop }));

            // Sound and effects for kill
            if (sound) sound.enemyKilled();
            if (effects) effects.flashMoney();

            // Level up notification
            if (leveledUp) {
                this.log(formatMessage(MESSAGES.LEVEL_UP, { level: this.player.level }));
                if (sound) sound.levelUp();
            }

            // Remove dead enemy from map
            this.map.removeEntity(enemy);
        }
    }

    // =========================================================================
    // ITEM SYSTEM
    // Handles picking up items from the map
    // =========================================================================

    /**
     * Handle picking up an item
     * @param {Object} item - The item being picked up
     */
    handleItem(item) {
        // Remove item from map first
        this.map.removeItem(item);

        // Handle different item types
        if (item.type === 'money') {
            // ----- Money items -----
            this.player.addMoney(item.value);
            this.log(`${item.name}: +${formatMoney(item.value)}`);
            if (sound) sound.money();
            if (effects) effects.flashMoney();
        }
        else if (item.type === 'consumable') {
            // ----- Consumable items -----
            if (item.effect === 'heal') {
                this.player.heal(item.value);
                this.log(`${item.name}: +${item.value} HP`);
                if (sound) sound.heal();
                if (effects) effects.flashHeal();
            }
        }
        else if (item.type === 'weapon') {
            // ----- Weapon items -----
            const oldAttack = this.player.getAttackPower();
            this.player.equipWeapon(item);
            const newAttack = this.player.getAttackPower();
            this.log(`Equipped ${item.name}! ATK: ${oldAttack} -> ${newAttack}`);
            if (sound) sound.equip();
        }
        else if (item.type === 'armor') {
            // ----- Armor items -----
            const oldDef = this.player.defense + (this.player.armor ? this.player.armor.value : 0);
            this.player.equipArmor(item);
            const newDef = this.player.defense + item.value;
            this.log(`Equipped ${item.name}! DEF: ${oldDef} -> ${newDef}`);
            if (sound) sound.equip();
        }
    }

    // =========================================================================
    // STAIRS / FLOOR TRANSITION
    // Handles moving between dungeon floors (job shifts)
    // =========================================================================

    /**
     * Use stairs to move to a different floor
     * @param {string} direction - 'up' or 'down'
     */
    useStairs(direction) {
        const currentTile = this.map.getTile(this.player.x, this.player.y);

        if (direction === 'down' && currentTile === GAME_CONFIG.TILES.STAIRS_DOWN) {
            // ----- Go down to next floor -----
            this.currentFloor++;
            this.generateFloor();

            // Place player at the up stairs (came from above)
            const startPos = this.map.stairsUpPos || this.map.getPlayerStartPosition();
            this.player.setPosition(startPos.x, startPos.y);

            // Announce new job/floor
            this.log(`--- ${this.map.currentJob.name} ---`);
            this.log(this.map.currentJob.description);

            if (sound) sound.newFloor();
        }
        else if (direction === 'up' && currentTile === GAME_CONFIG.TILES.STAIRS_UP && this.currentFloor > 1) {
            // ----- Go up to previous floor -----
            this.currentFloor--;
            this.generateFloor();

            // Place player at the down stairs (came from below)
            const startPos = this.map.stairsDownPos || this.map.getPlayerStartPosition();
            this.player.setPosition(startPos.x, startPos.y);

            this.log(`Back to floor ${this.currentFloor}.`);

            if (sound) sound.newFloor();
        }

        // Changing floors counts as a turn
        this.processTurn();
    }

    // =========================================================================
    // TURN PROCESSING
    // Called after every player action to advance game state
    // =========================================================================
    processTurn() {
        // ----- Process active visitation -----
        if (this.visitationActive) {
            this.visitationTurns--;
            if (this.visitationTurns <= 0) {
                this.endVisitation();
            }
        }

        // ----- Process enemy turns -----
        // Each enemy gets to act after the player
        for (const entity of this.map.entities) {
            const action = entity.act(this.map, this.player.x, this.player.y);

            // If enemy attacked the player
            if (action && action.type === 'attack') {
                const damage = this.player.takeDamage(entity.attack);
                this.log(formatMessage(MESSAGES.PLAYER_HIT, { enemy: entity.name, damage: damage }));

                // Sound and visual feedback for taking damage
                if (sound) sound.playerHit();
                if (effects) {
                    effects.shakeMedium();
                    effects.flashDamage();
                }

                // Check for player death
                if (!this.player.isAlive()) {
                    this.endGame('health');
                    return;
                }
            }
        }

        // ----- Progress time -----
        this.turnCount++;
        if (this.turnCount >= this.turnsPerDay) {
            this.turnCount = 0;
            this.advanceDay();
        }

        // ----- Check for random events -----
        this.checkRandomEvents();

        // ----- Update display -----
        this.updateUI();
    }

    // =========================================================================
    // RANDOM EVENTS
    // Triggers various life events that add narrative depth
    // =========================================================================
    checkRandomEvents() {
        // ----- Child event (every ~100 turns, with cooldown) -----
        if (this.turnCount % 100 === 0 && this.currentDay - this.lastChildEvent > 3) {
            if (Math.random() < 0.4) {
                this.triggerChildEvent();
            }
        }

        // ----- Emergency expense (rare) -----
        if (Math.random() < 0.005 && this.currentDay - this.lastEmergency > 10) {
            this.triggerEmergency();
        }

        // ----- Positive event (uncommon) -----
        if (Math.random() < 0.01) {
            this.triggerPositiveEvent();
        }

        // ----- Lucky break (very rare) -----
        if (Math.random() < 0.002) {
            this.checkLuckyBreak();
        }

        // ----- Visitation (once per week, on weekends) -----
        if (this.currentDay % 7 === 0 && !this.visitationActive && Math.random() < 0.3) {
            this.startVisitation();
        }
    }

    // =========================================================================
    // LUCKY BREAK EVENTS
    // Extremely rare events that can change the game dramatically
    // =========================================================================

    /**
     * Check if a lucky break event triggers
     * Lucky breaks are rare but can include things like:
     * - Ex getting remarried (instant win!)
     * - Winning the lottery
     * - Getting a raise
     */
    checkLuckyBreak() {
        if (!LIFE_EVENTS.luckyBreaks) return;

        // Each lucky break has its own rarity
        for (const luckyBreak of LIFE_EVENTS.luckyBreaks) {
            if (Math.random() < luckyBreak.rarity) {
                this.triggerLuckyBreak(luckyBreak);
                break; // Only one lucky break at a time
            }
        }
    }

    /**
     * Trigger a lucky break event
     * @param {Object} event - The lucky break event data
     */
    triggerLuckyBreak(event) {
        this.log(`=== LUCKY BREAK! ===`);
        this.log(event.text);
        this.eventsExperienced.push(event.text);

        // Big celebration feedback
        if (sound) sound.victory();
        if (effects) effects.shakeHeavy();

        // Apply the effect based on type
        switch (event.effect) {
            case 'exRemarried':
                // Ex remarried = alimony terminated = instant victory!
                this.log('You are free!');
                this.endGame('victory');
                break;

            case 'custodyChange':
                // Child chose to live with you = victory
                this.log(`${this.childName} chose you!`);
                this.endGame('victory');
                break;

            case 'money':
                // Windfall money
                const amount = Array.isArray(event.value)
                    ? randomInt(event.value[0], event.value[1])
                    : event.value;
                this.player.addMoney(amount);
                this.log(`+${formatMoney(amount)}`);
                break;

            case 'reduceAlimony':
                // Alimony amount reduced
                this.alimonyAmount = Math.max(100, this.alimonyAmount - event.value);
                this.log(`Alimony reduced to ${formatMoney(this.alimonyAmount)}`);
                break;

            case 'heal':
                // Full or partial heal
                this.player.heal(event.value);
                break;

            case 'permanentBonus':
                // Permanent money multiplier increase
                this.hasPermanentBonus = true;
                this.moneyMultiplier += 0.1;
                this.log('Money earned increased permanently!');
                break;
        }
    }

    // =========================================================================
    // CHILD EVENTS
    // Moments that remind you why you're doing this
    // =========================================================================

    /**
     * Trigger a child-related event
     * These are emotional moments: milestones, conversations, etc.
     */
    triggerChildEvent() {
        const events = LIFE_EVENTS.childEvents;
        const event = randomChoice(events);

        // Replace placeholder with actual child name
        let text = event.text.replace('{childName}', this.childName);
        this.log(`--- ${text} ---`);

        this.lastChildEvent = this.currentDay;
        this.eventsExperienced.push(text);

        if (sound) sound.childEvent();

        // Apply the event's effect
        if (event.effect === 'heal') {
            // Positive emotional effect = healing
            this.player.heal(event.value);
            if (effects) effects.flashHeal();
        } else if (event.effect === 'stress') {
            // Stressful event = damage
            this.player.takeDamage(event.value);
            if (effects) effects.flashDamage();
        }
    }

    // =========================================================================
    // EMERGENCY EVENTS
    // Unexpected expenses that drain your money
    // =========================================================================

    /**
     * Trigger an emergency expense event
     * Car trouble, medical bills, etc.
     */
    triggerEmergency() {
        const emergencies = LIFE_EVENTS.emergencies;
        const event = randomChoice(emergencies);

        // Calculate the cost (random within range if array)
        const amount = Array.isArray(event.value)
            ? randomInt(event.value[0], event.value[1])
            : event.value;

        this.log(`!!! ${event.text}${amount} !!!`);
        this.lastEmergency = this.currentDay;
        this.eventsExperienced.push(`${event.text}${amount}`);

        // Sound and visual alarm
        if (sound) sound.emergency();
        if (effects) {
            effects.shakeMedium();
            effects.flashWarning();
        }

        // Try to pay the emergency
        if (this.player.money >= amount) {
            this.player.spendMoney(amount);
            this.totalExpenses += amount;
            this.log(`You paid it. ${formatMoney(this.player.money)} remaining.`);
        } else {
            // Can't pay = stress damage
            const stressDamage = Math.floor(amount / 10);
            this.player.takeDamage(stressDamage);
            this.log(`Can't pay. The stress hurts. (-${stressDamage} HP)`);
            if (effects) effects.flashDamage();
        }
    }

    // =========================================================================
    // POSITIVE EVENTS
    // Good things that happen occasionally
    // =========================================================================

    /**
     * Trigger a positive event
     * Found money, got a tip, etc.
     */
    triggerPositiveEvent() {
        const events = LIFE_EVENTS.positiveEvents;
        const event = randomChoice(events);

        this.log(`+ ${event.text} +`);
        this.eventsExperienced.push(event.text);

        // Apply the positive effect
        if (event.effect === 'money') {
            const amount = Array.isArray(event.value)
                ? randomInt(event.value[0], event.value[1])
                : event.value;
            this.player.addMoney(amount);
            if (sound) sound.money();
            if (effects) effects.flashMoney();
        } else if (event.effect === 'heal') {
            this.player.heal(event.value);
            if (sound) sound.heal();
            if (effects) effects.flashHeal();
        }
    }

    // =========================================================================
    // VISITATION SYSTEM
    // Precious time with your child
    // =========================================================================

    /**
     * Start a visitation period
     * The most important moments in the game
     */
    startVisitation() {
        this.visitationActive = true;
        this.visitationTurns = 10;  // Short but meaningful

        this.log('=== VISITATION DAY ===');
        this.log(`${this.childName} runs to hug you. You have 10 turns together.`);

        // Seeing your child heals you emotionally
        this.player.heal(20);

        if (sound) sound.visitation();
        if (effects) effects.flashHeal();
    }

    /**
     * End a visitation period
     * Bittersweet moment
     */
    endVisitation() {
        this.visitationActive = false;

        this.log("=== Time's up. They have to go back. ===");
        this.log(`"Bye daddy. I love you." - ${this.childName}`);

        // Motivation from the goodbye
        this.player.heal(10);

        if (sound) sound.childEvent();
    }

    // =========================================================================
    // DAY ADVANCEMENT
    // Progress to the next day
    // =========================================================================
    advanceDay() {
        this.currentDay++;
        this.daysUntilPayment--;

        // Occasional flavor text about the grind
        if (Math.random() < 0.2) {
            this.log(randomChoice(MESSAGES.DAILY_GRIND));
        }

        // Check if payment is due
        if (this.daysUntilPayment <= 0) {
            this.processMonthEnd();
        }

        // Low payment warnings
        if (this.daysUntilPayment === 7 && this.player.money < this.alimonyAmount) {
            this.log('!!! One week until payment. You\'re short. !!!');
            if (sound) sound.warning();
        } else if (this.daysUntilPayment === 3 && this.player.money < this.alimonyAmount) {
            this.log('!!! THREE DAYS. You need money. NOW. !!!');
            if (sound) sound.warning();
            if (effects) effects.flashWarning();
        }
    }

    // =========================================================================
    // MONTH END PROCESSING
    // Pay rent and alimony, or suffer consequences
    // =========================================================================
    processMonthEnd() {
        this.log('=== END OF MONTH ===');

        // ----- Pay rent first -----
        const rentAmount = GAME_CONFIG.RENT;
        if (this.player.money >= rentAmount) {
            this.player.spendMoney(rentAmount);
            this.totalExpenses += rentAmount;
            this.log(`Rent paid: ${formatMoney(rentAmount)}`);
        } else {
            this.log("Couldn't pay rent. Sleeping in your car.");
            this.player.takeDamage(10);  // Stress/health impact
        }

        // ----- Then alimony (the critical payment) -----
        if (this.player.money >= this.alimonyAmount) {
            // Success! Payment made.
            this.player.spendMoney(this.alimonyAmount);
            this.player.totalAlimonyPaid += this.alimonyAmount;
            this.log(MESSAGES.PAYMENT_SUCCESS);
            this.missedPayments = 0;  // Reset missed payment counter

            if (sound) sound.paymentSuccess();
            if (effects) effects.flashHeal();
        } else {
            // Failed to pay - serious consequences
            this.missedPayments++;
            this.log(MESSAGES.PAYMENT_FAILED);
            this.log(`WARNING: ${this.missedPayments}/${this.maxMissedPayments} missed payments!`);

            if (sound) sound.paymentFailed();
            if (effects) {
                effects.shakeHeavy();
                effects.setDangerGlow();
            }

            // Three strikes and you're out
            if (this.missedPayments >= this.maxMissedPayments) {
                this.endGame('jail');
                return;
            }
        }

        // ----- Advance to next month -----
        this.currentMonth++;
        this.daysUntilPayment = GAME_CONFIG.DAYS_PER_MONTH;

        // Check for year rollover
        if (this.currentMonth > GAME_CONFIG.MONTHS_PER_YEAR) {
            this.currentMonth = 1;
            this.advanceYear();
        }

        this.log(`${formatMoney(this.player.money)} remaining.`);
    }

    // =========================================================================
    // YEAR ADVANCEMENT
    // Child ages, alimony increases, check for milestones and victory
    // =========================================================================
    advanceYear() {
        this.currentYear++;
        this.childAge++;

        // Alimony increases each year (cost of living, etc.)
        this.alimonyAmount += GAME_CONFIG.ALIMONY_INCREASE_PER_YEAR;

        // Check for milestone events (first day of school, graduation, etc.)
        const milestone = LIFE_EVENTS.milestones[this.childAge];
        if (milestone) {
            // Replace placeholder with child name
            const text = milestone.replace('{childName}', this.childName);
            this.log(`=== YEAR ${this.currentYear} ===`);
            this.log(text);
            this.eventsExperienced.push(text);
        } else {
            // Generic birthday message
            this.log(formatMessage(MESSAGES.CHILD_BIRTHDAY, { age: this.childAge, name: this.childName }));
        }

        // ----- VICTORY CHECK -----
        // If child is now 18, they're an adult - YOU WIN!
        if (this.childAge >= GAME_CONFIG.CHILD_ADULT_AGE) {
            this.endGame('victory');
        }
    }

    // =========================================================================
    // GAME END
    // Handle victory, defeat, and high score saving
    // =========================================================================

    /**
     * End the game
     * @param {string} reason - 'health' (died), 'jail' (missed payments), or 'victory'
     */
    endGame(reason) {
        this.gameOver = true;
        this.isRunning = false;

        // Set the appropriate message based on reason
        switch (reason) {
            case 'health':
                this.gameOverReason = MESSAGES.GAME_OVER_HEALTH;
                if (sound) sound.gameOver();
                break;

            case 'jail':
                this.gameOverReason = MESSAGES.GAME_OVER_JAIL;
                if (sound) sound.gameOver();
                break;

            case 'victory':
                this.victory = true;
                this.gameOverReason = MESSAGES.CHILD_ADULT.replace('{childName}', this.childName);
                if (sound) sound.victory();
                if (effects) effects.setVictoryGlow();
                break;
        }

        // ----- Save high score -----
        if (typeof highScores !== 'undefined') {
            highScores.addScore({
                playerName: this.playerName,
                childName: this.childName,
                yearsWorked: this.currentYear - 1,
                childAge: this.childAge,
                totalEarned: this.player.totalMoneyEarned,
                alimonyPaid: this.player.totalAlimonyPaid,
                enemiesKilled: this.player.enemiesKilled,
                floorsExplored: this.player.floorsExplored,
                level: this.player.level,
                victory: this.victory
            });

            // Update lifetime stats
            highScores.updateStats({
                yearsWorked: this.currentYear - 1,
                totalEarned: this.player.totalMoneyEarned,
                alimonyPaid: this.player.totalAlimonyPaid,
                enemiesKilled: this.player.enemiesKilled,
                victory: this.victory
            });
        }

        this.showEndScreen();
    }

    // =========================================================================
    // END SCREEN
    // Display game over or victory screen with stats
    // =========================================================================
    showEndScreen() {
        const yearsWorked = this.currentYear - 1;

        // Build stats HTML
        const stats = `
            <div class="stat-line">Player: <span class="stat-value">${this.playerName}</span></div>
            <div class="stat-line">Years Survived: <span class="stat-value">${yearsWorked}</span></div>
            <div class="stat-line">${this.childName}'s Final Age: <span class="stat-value">${this.childAge}</span></div>
            <div class="stat-line">Total Earned: <span class="stat-value">${formatMoney(this.player.totalMoneyEarned)}</span></div>
            <div class="stat-line">Total Alimony Paid: <span class="stat-value">${formatMoney(this.player.totalAlimonyPaid)}</span></div>
            <div class="stat-line">Other Expenses: <span class="stat-value">${formatMoney(this.totalExpenses)}</span></div>
            <div class="stat-line">Obstacles Overcome: <span class="stat-value">${this.player.enemiesKilled}</span></div>
            <div class="stat-line">Shifts Worked: <span class="stat-value">${this.player.floorsExplored}</span></div>
            <div class="stat-line">Final Level: <span class="stat-value">${this.player.level}</span></div>
        `;

        // Show appropriate screen
        if (this.victory) {
            document.getElementById('victory-stats').innerHTML = stats;
            showScreen('victory-screen');
        } else {
            document.getElementById('gameover-reason').innerHTML = this.gameOverReason;
            document.getElementById('final-stats').innerHTML = stats;
            showScreen('gameover-screen');
        }
    }

    // =========================================================================
    // RESTART
    // Reset all state and start a new game
    // =========================================================================
    restart() {
        // Reset all state variables to defaults
        this.currentFloor = 1;
        this.gameLog = [];
        this.currentDay = 1;
        this.currentMonth = 1;
        this.currentYear = 1;
        this.daysUntilPayment = GAME_CONFIG.DAYS_PER_MONTH;
        this.childAge = GAME_CONFIG.CHILD_STARTING_AGE;
        this.alimonyAmount = GAME_CONFIG.STARTING_ALIMONY;
        this.missedPayments = 0;
        this.turnCount = 0;
        this.gameOver = false;
        this.victory = false;
        this.gameOverReason = '';
        this.lastChildEvent = 0;
        this.lastEmergency = 0;
        this.visitationActive = false;
        this.visitationTurns = 0;
        this.totalExpenses = 0;
        this.eventsExperienced = [];
        this.rentPaid = false;
        this.moneyMultiplier = 1.0;
        this.hasPermanentBonus = false;

        // Re-initialize the game
        this.init();
        showScreen('game-screen');
        this.updateUI();
    }
}
