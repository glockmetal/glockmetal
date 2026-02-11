// Main Game class

class Game {
    constructor() {
        this.player = null;
        this.map = null;
        this.currentFloor = 1;
        this.gameLog = [];
        this.maxLogSize = 50;

        // Time/payment system
        this.currentDay = 1;
        this.currentMonth = 1;
        this.currentYear = 1;
        this.daysUntilPayment = GAME_CONFIG.DAYS_PER_MONTH;
        this.childAge = GAME_CONFIG.CHILD_STARTING_AGE;
        this.alimonyAmount = GAME_CONFIG.STARTING_ALIMONY;
        this.missedPayments = 0;
        this.maxMissedPayments = 3;

        // Living expenses tracking
        this.rentPaid = false;

        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.victory = false;
        this.gameOverReason = '';

        // Turn counter
        this.turnCount = 0;
        this.turnsPerDay = 50;

        // Events tracking
        this.lastChildEvent = 0;
        this.lastEmergency = 0;
        this.visitationActive = false;
        this.visitationTurns = 0;

        // Stats
        this.totalExpenses = 0;
        this.eventsExperienced = [];
    }

    init() {
        this.player = new Player();
        this.map = new GameMap(GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);
        this.generateFloor();

        const startPos = this.map.getPlayerStartPosition();
        this.player.setPosition(startPos.x, startPos.y);

        this.isRunning = true;
        this.log(`You clock in at the ${this.map.currentJob.name}.`);
        this.log(this.map.currentJob.description);
        this.log(`Alimony due in ${this.daysUntilPayment} days: ${formatMoney(this.alimonyAmount)}`);
    }

    generateFloor() {
        this.map.generate(this.currentFloor);
        this.player.floorsExplored = Math.max(this.player.floorsExplored, this.currentFloor);
    }

    log(message) {
        this.gameLog.push(message);
        if (this.gameLog.length > this.maxLogSize) {
            this.gameLog.shift();
        }
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        const logElement = document.getElementById('game-log');
        if (logElement) {
            logElement.innerHTML = this.gameLog
                .slice(-5)
                .map(msg => `<p>${msg}</p>`)
                .join('');
            logElement.scrollTop = logElement.scrollHeight;
        }
    }

    updateUI() {
        // Player stats
        const healthEl = document.getElementById('health');
        const healthPercent = this.player.health / this.player.maxHealth;
        healthEl.textContent = `HP: ${this.player.health}/${this.player.maxHealth}`;
        healthEl.style.color = healthPercent < 0.3 ? '#ff0000' : healthPercent < 0.6 ? '#ffaa00' : '#00ff00';

        document.getElementById('money').textContent = `$: ${this.player.money}`;

        const alimonyEl = document.getElementById('alimony-due');
        alimonyEl.textContent = `ALIMONY: ${formatMoney(this.alimonyAmount)}`;
        alimonyEl.style.color = this.player.money >= this.alimonyAmount ? '#00ff00' : '#ff00ff';

        // Child/time status
        document.getElementById('child-age').textContent = `Child: ${this.childAge}`;

        const daysEl = document.getElementById('days-until-payment');
        daysEl.textContent = `Due in: ${this.daysUntilPayment}d`;
        daysEl.style.color = this.daysUntilPayment <= 5 ? '#ff0000' : this.daysUntilPayment <= 10 ? '#ff8800' : '#00ffff';

        // Render map
        const mapElement = document.getElementById('game-map');
        if (mapElement) {
            mapElement.innerHTML = `<pre>${this.map.render(this.player.x, this.player.y)}</pre>`;
        }
    }

    processPlayerAction(dx, dy) {
        if (!this.isRunning || this.gameOver) return;

        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // Check for NPC interaction
        const npc = this.map.getNPCAt(newX, newY);
        if (npc) {
            this.handleNPCInteraction(npc);
            this.processTurn();
            return;
        }

        const result = this.player.move(dx, dy, this.map);

        switch (result.type) {
            case 'combat':
                this.handleCombat(result.target);
                break;

            case 'item':
                this.handleItem(result.item);
                break;

            case 'stairs_down':
                this.log('Press SPACE to go to next shift.');
                break;

            case 'stairs_up':
                this.log('Press SPACE to go back.');
                break;

            case 'move':
                // Random flavor text
                if (Math.random() < 0.05) {
                    this.log(this.map.getJobFlavorText());
                }
                break;

            case 'blocked':
                return;
        }

        this.processTurn();
    }

    handleNPCInteraction(npc) {
        if (npc.spoken) {
            this.log(`${npc.name} nods at you silently.`);
            return;
        }

        // Get a random dialogue
        const dialogue = randomChoice(npc.dialogues);
        this.log(`${npc.name}: ${dialogue}`);

        // Give money if applicable
        if (npc.givesMoney && npc.givesMoney[1] > 0) {
            const amount = randomInt(npc.givesMoney[0], npc.givesMoney[1]);
            if (amount > 0) {
                this.player.addMoney(amount);
                this.log(`They gave you ${formatMoney(amount)}.`);
            }
        }

        // Give item if applicable
        if (npc.givesItem) {
            const itemData = ITEMS[npc.givesItem];
            if (itemData) {
                this.log(`They gave you a ${itemData.name}.`);
                // Apply item effect immediately
                if (itemData.type === 'consumable' && itemData.effect === 'heal') {
                    this.player.heal(itemData.value);
                    this.log(`You feel a bit better. (+${itemData.value} HP)`);
                }
            }
        }

        npc.spoken = true;
    }

    handleCombat(enemy) {
        const playerDamage = this.player.attack(enemy);
        this.log(formatMessage(MESSAGES.ENEMY_HIT, { enemy: enemy.name, damage: playerDamage }));

        if (!enemy.isAlive()) {
            const moneyDrop = enemy.getMoneyDrop();
            this.player.addMoney(moneyDrop);
            this.player.enemiesKilled++;

            const leveledUp = this.player.addExp(enemy.expValue);

            this.log(formatMessage(MESSAGES.ENEMY_KILLED, { enemy: enemy.name, money: moneyDrop }));

            if (leveledUp) {
                this.log(formatMessage(MESSAGES.LEVEL_UP, { level: this.player.level }));
            }

            this.map.removeEntity(enemy);
        }
    }

    handleItem(item) {
        this.map.removeItem(item);

        if (item.type === 'money') {
            this.player.addMoney(item.value);
            this.log(`${item.name}: +${formatMoney(item.value)}`);
        } else if (item.type === 'consumable') {
            if (item.effect === 'heal') {
                this.player.heal(item.value);
                this.log(`${item.name}: +${item.value} HP`);
            }
        } else if (item.type === 'weapon') {
            const oldAttack = this.player.getAttackPower();
            this.player.equipWeapon(item);
            const newAttack = this.player.getAttackPower();
            this.log(`Equipped ${item.name}! ATK: ${oldAttack} -> ${newAttack}`);
        } else if (item.type === 'armor') {
            const oldDef = this.player.defense + (this.player.armor ? this.player.armor.value : 0);
            this.player.equipArmor(item);
            const newDef = this.player.defense + item.value;
            this.log(`Equipped ${item.name}! DEF: ${oldDef} -> ${newDef}`);
        }
    }

    useStairs(direction) {
        const currentTile = this.map.getTile(this.player.x, this.player.y);

        if (direction === 'down' && currentTile === GAME_CONFIG.TILES.STAIRS_DOWN) {
            this.currentFloor++;
            this.generateFloor();
            const startPos = this.map.stairsUpPos || this.map.getPlayerStartPosition();
            this.player.setPosition(startPos.x, startPos.y);
            this.log(`--- ${this.map.currentJob.name} ---`);
            this.log(this.map.currentJob.description);
        } else if (direction === 'up' && currentTile === GAME_CONFIG.TILES.STAIRS_UP && this.currentFloor > 1) {
            this.currentFloor--;
            this.generateFloor();
            const startPos = this.map.stairsDownPos || this.map.getPlayerStartPosition();
            this.player.setPosition(startPos.x, startPos.y);
            this.log(`Back to floor ${this.currentFloor}.`);
        }

        this.processTurn();
    }

    processTurn() {
        // Process visitation
        if (this.visitationActive) {
            this.visitationTurns--;
            if (this.visitationTurns <= 0) {
                this.endVisitation();
            }
        }

        // Process enemy turns
        for (const entity of this.map.entities) {
            const action = entity.act(this.map, this.player.x, this.player.y);

            if (action && action.type === 'attack') {
                const damage = this.player.takeDamage(entity.attack);
                this.log(formatMessage(MESSAGES.PLAYER_HIT, { enemy: entity.name, damage: damage }));

                if (!this.player.isAlive()) {
                    this.endGame('health');
                    return;
                }
            }
        }

        // Progress time
        this.turnCount++;
        if (this.turnCount >= this.turnsPerDay) {
            this.turnCount = 0;
            this.advanceDay();
        }

        // Random events
        this.checkRandomEvents();

        this.updateUI();
    }

    checkRandomEvents() {
        // Child event (every ~100 turns, if not too recent)
        if (this.turnCount % 100 === 0 && this.currentDay - this.lastChildEvent > 3) {
            if (Math.random() < 0.4) {
                this.triggerChildEvent();
            }
        }

        // Emergency expense (rare)
        if (Math.random() < 0.005 && this.currentDay - this.lastEmergency > 10) {
            this.triggerEmergency();
        }

        // Positive event (rare)
        if (Math.random() < 0.01) {
            this.triggerPositiveEvent();
        }

        // Visitation chance (once per month, on weekends)
        if (this.currentDay % 7 === 0 && !this.visitationActive && Math.random() < 0.3) {
            this.startVisitation();
        }
    }

    triggerChildEvent() {
        const events = LIFE_EVENTS.childEvents;
        const event = randomChoice(events);

        this.log(`--- ${event.text} ---`);
        this.lastChildEvent = this.currentDay;
        this.eventsExperienced.push(event.text);

        if (event.effect === 'heal') {
            this.player.heal(event.value);
        } else if (event.effect === 'stress') {
            this.player.takeDamage(event.value);
        }
    }

    triggerEmergency() {
        const emergencies = LIFE_EVENTS.emergencies;
        const event = randomChoice(emergencies);
        const amount = Array.isArray(event.value)
            ? randomInt(event.value[0], event.value[1])
            : event.value;

        this.log(`!!! ${event.text}${amount} !!!`);
        this.lastEmergency = this.currentDay;
        this.eventsExperienced.push(`${event.text}${amount}`);

        if (this.player.money >= amount) {
            this.player.spendMoney(amount);
            this.totalExpenses += amount;
            this.log(`You paid it. ${formatMoney(this.player.money)} remaining.`);
        } else {
            // Can't pay - take stress damage
            const stressDamage = Math.floor(amount / 10);
            this.player.takeDamage(stressDamage);
            this.log(`Can't pay. The stress hurts. (-${stressDamage} HP)`);
        }
    }

    triggerPositiveEvent() {
        const events = LIFE_EVENTS.positiveEvents;
        const event = randomChoice(events);

        this.log(`+ ${event.text} +`);
        this.eventsExperienced.push(event.text);

        if (event.effect === 'money') {
            const amount = Array.isArray(event.value)
                ? randomInt(event.value[0], event.value[1])
                : event.value;
            this.player.addMoney(amount);
        } else if (event.effect === 'heal') {
            this.player.heal(event.value);
        }
    }

    startVisitation() {
        this.visitationActive = true;
        this.visitationTurns = 10;
        this.log('=== VISITATION DAY ===');
        this.log("Your child runs to hug you. You have 10 turns together.");
        this.player.heal(20);
    }

    endVisitation() {
        this.visitationActive = false;
        this.log("=== Time's up. They have to go back. ===");
        this.log('"Bye daddy. I love you."');
        // Small emotional damage, but also motivation
        this.player.heal(10);
    }

    advanceDay() {
        this.currentDay++;
        this.daysUntilPayment--;

        // Daily grind message (occasionally)
        if (Math.random() < 0.2) {
            this.log(randomChoice(MESSAGES.DAILY_GRIND));
        }

        // Check for payment due
        if (this.daysUntilPayment <= 0) {
            this.processMonthEnd();
        }

        // Low payment warning
        if (this.daysUntilPayment === 7 && this.player.money < this.alimonyAmount) {
            this.log('!!! One week until payment. You\'re short. !!!');
        } else if (this.daysUntilPayment === 3 && this.player.money < this.alimonyAmount) {
            this.log('!!! THREE DAYS. You need money. NOW. !!!');
        }
    }

    processMonthEnd() {
        this.log('=== END OF MONTH ===');

        // Pay rent first
        const rentAmount = GAME_CONFIG.RENT;
        if (this.player.money >= rentAmount) {
            this.player.spendMoney(rentAmount);
            this.totalExpenses += rentAmount;
            this.log(`Rent paid: ${formatMoney(rentAmount)}`);
        } else {
            this.log("Couldn't pay rent. Sleeping in your car.");
            this.player.takeDamage(10);
        }

        // Then alimony
        if (this.player.money >= this.alimonyAmount) {
            this.player.spendMoney(this.alimonyAmount);
            this.player.totalAlimonyPaid += this.alimonyAmount;
            this.log(MESSAGES.PAYMENT_SUCCESS);
            this.missedPayments = 0;
        } else {
            this.missedPayments++;
            this.log(MESSAGES.PAYMENT_FAILED);
            this.log(`WARNING: ${this.missedPayments}/${this.maxMissedPayments} missed payments!`);

            if (this.missedPayments >= this.maxMissedPayments) {
                this.endGame('jail');
                return;
            }
        }

        // Advance month
        this.currentMonth++;
        this.daysUntilPayment = GAME_CONFIG.DAYS_PER_MONTH;

        if (this.currentMonth > GAME_CONFIG.MONTHS_PER_YEAR) {
            this.currentMonth = 1;
            this.advanceYear();
        }

        this.log(`${formatMoney(this.player.money)} remaining.`);
    }

    advanceYear() {
        this.currentYear++;
        this.childAge++;

        // Increase alimony each year
        this.alimonyAmount += GAME_CONFIG.ALIMONY_INCREASE_PER_YEAR;

        // Check for milestone
        const milestone = LIFE_EVENTS.milestones[this.childAge];
        if (milestone) {
            this.log(`=== YEAR ${this.currentYear} ===`);
            this.log(milestone);
            this.eventsExperienced.push(milestone);
        } else {
            this.log(formatMessage(MESSAGES.CHILD_BIRTHDAY, { age: this.childAge }));
        }

        // Check for victory
        if (this.childAge >= GAME_CONFIG.CHILD_ADULT_AGE) {
            this.endGame('victory');
        }
    }

    endGame(reason) {
        this.gameOver = true;
        this.isRunning = false;

        switch (reason) {
            case 'health':
                this.gameOverReason = MESSAGES.GAME_OVER_HEALTH;
                break;
            case 'jail':
                this.gameOverReason = MESSAGES.GAME_OVER_JAIL;
                break;
            case 'victory':
                this.victory = true;
                this.gameOverReason = MESSAGES.CHILD_ADULT;
                break;
        }

        this.showEndScreen();
    }

    showEndScreen() {
        const yearsWorked = this.currentYear - 1;
        const stats = `
            <div class="stat-line">Years Survived: <span class="stat-value">${yearsWorked}</span></div>
            <div class="stat-line">Child's Final Age: <span class="stat-value">${this.childAge}</span></div>
            <div class="stat-line">Total Earned: <span class="stat-value">${formatMoney(this.player.totalMoneyEarned)}</span></div>
            <div class="stat-line">Total Alimony Paid: <span class="stat-value">${formatMoney(this.player.totalAlimonyPaid)}</span></div>
            <div class="stat-line">Other Expenses: <span class="stat-value">${formatMoney(this.totalExpenses)}</span></div>
            <div class="stat-line">Obstacles Overcome: <span class="stat-value">${this.player.enemiesKilled}</span></div>
            <div class="stat-line">Shifts Worked: <span class="stat-value">${this.player.floorsExplored}</span></div>
            <div class="stat-line">Final Level: <span class="stat-value">${this.player.level}</span></div>
        `;

        if (this.victory) {
            document.getElementById('victory-stats').innerHTML = stats;
            showScreen('victory-screen');
        } else {
            document.getElementById('gameover-reason').innerHTML = this.gameOverReason;
            document.getElementById('final-stats').innerHTML = stats;
            showScreen('gameover-screen');
        }
    }

    restart() {
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

        this.init();
        showScreen('game-screen');
        this.updateUI();
    }
}
