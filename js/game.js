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

        // Game state
        this.isRunning = false;
        this.isPaused = false; // Always false - game cannot be paused
        this.gameOver = false;
        this.victory = false;
        this.gameOverReason = '';

        // Turn counter (for time progression)
        this.turnCount = 0;
        this.turnsPerDay = 50;
    }

    init() {
        this.player = new Player();
        this.map = new GameMap(GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);
        this.generateFloor();

        const startPos = this.map.getPlayerStartPosition();
        this.player.setPosition(startPos.x, startPos.y);

        this.isRunning = true;
        this.log('You enter the workforce dungeon.');
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
        document.getElementById('health').textContent = `HP: ${this.player.health}/${this.player.maxHealth}`;
        document.getElementById('money').textContent = `$: ${this.player.money}`;
        document.getElementById('alimony-due').textContent = `ALIMONY DUE: ${formatMoney(this.alimonyAmount)}`;

        // Child/time status
        document.getElementById('child-age').textContent = `Child Age: ${this.childAge}`;
        document.getElementById('days-until-payment').textContent = `Days Until Payment: ${this.daysUntilPayment}`;

        // Render map
        const mapElement = document.getElementById('game-map');
        if (mapElement) {
            mapElement.innerHTML = `<pre>${this.map.render(this.player.x, this.player.y)}</pre>`;
        }
    }

    processPlayerAction(dx, dy) {
        if (!this.isRunning || this.gameOver) return;

        const result = this.player.move(dx, dy, this.map);

        switch (result.type) {
            case 'combat':
                this.handleCombat(result.target);
                break;

            case 'item':
                this.handleItem(result.item);
                break;

            case 'stairs_down':
                this.log('Press SPACE to descend the stairs.');
                break;

            case 'stairs_up':
                this.log('Press SPACE to ascend the stairs.');
                break;

            case 'move':
                // Normal movement, process turn
                break;

            case 'blocked':
                // No turn passes for blocked movement
                return;
        }

        this.processTurn();
    }

    handleCombat(enemy) {
        // Player attacks
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
            this.log(`Picked up ${formatMoney(item.value)}!`);
        } else if (item.type === 'consumable') {
            if (item.effect === 'heal') {
                this.player.heal(item.value);
                this.log(`Used ${item.name}. Healed ${item.value} HP.`);
            }
        } else if (item.type === 'weapon') {
            const oldAttack = this.player.getAttackPower();
            this.player.equipWeapon(item);
            const newAttack = this.player.getAttackPower();
            this.log(`Equipped ${item.name}! Attack: ${oldAttack} -> ${newAttack}`);
        } else if (item.type === 'armor') {
            const oldDef = this.player.defense + (this.player.armor ? this.player.armor.value : 0);
            this.player.equipArmor(item);
            const newDef = this.player.defense + item.value;
            this.log(`Equipped ${item.name}! Defense: ${oldDef} -> ${newDef}`);
        }
    }

    useStairs(direction) {
        const currentTile = this.map.getTile(this.player.x, this.player.y);

        if (direction === 'down' && currentTile === GAME_CONFIG.TILES.STAIRS_DOWN) {
            this.currentFloor++;
            this.generateFloor();
            const startPos = this.map.stairsUpPos || this.map.getPlayerStartPosition();
            this.player.setPosition(startPos.x, startPos.y);
            this.log(formatMessage(MESSAGES.FLOOR_DESCEND, { floor: this.currentFloor }));
        } else if (direction === 'up' && currentTile === GAME_CONFIG.TILES.STAIRS_UP && this.currentFloor > 1) {
            this.currentFloor--;
            this.generateFloor();
            const startPos = this.map.stairsDownPos || this.map.getPlayerStartPosition();
            this.player.setPosition(startPos.x, startPos.y);
            this.log(`You ascend to floor ${this.currentFloor}.`);
        }

        this.processTurn();
    }

    processTurn() {
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

        this.updateUI();
    }

    advanceDay() {
        this.currentDay++;
        this.daysUntilPayment--;

        // Check for payment due
        if (this.daysUntilPayment <= 0) {
            this.processAlimonyPayment();
        }

        // Random daily events
        if (Math.random() < 0.1) {
            const events = [
                'Your child sent you a drawing. It keeps you going.',
                'You remember why you\'re doing this.',
                'Another day, another dollar.',
                'The grind never stops.',
                'You think about better times.'
            ];
            this.log(randomChoice(events));
        }
    }

    processAlimonyPayment() {
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
    }

    advanceYear() {
        this.currentYear++;
        this.childAge++;

        // Increase alimony each year
        this.alimonyAmount += GAME_CONFIG.ALIMONY_INCREASE_PER_YEAR;

        this.log(formatMessage(MESSAGES.CHILD_BIRTHDAY, { age: this.childAge }));

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
        const stats = `
            Years Survived: ${this.currentYear - 1}
            Final Child Age: ${this.childAge}
            Total Money Earned: ${formatMoney(this.player.totalMoneyEarned)}
            Total Alimony Paid: ${formatMoney(this.player.totalAlimonyPaid)}
            Enemies Defeated: ${this.player.enemiesKilled}
            Floors Explored: ${this.player.floorsExplored}
            Final Level: ${this.player.level}
        `;

        if (this.victory) {
            document.getElementById('victory-stats').innerHTML = stats.replace(/\n/g, '<br>');
            this.showScreen('victory-screen');
        } else {
            document.getElementById('gameover-reason').innerHTML = this.gameOverReason;
            document.getElementById('final-stats').innerHTML = stats.replace(/\n/g, '<br>');
            this.showScreen('gameover-screen');
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
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

        this.init();
        this.showScreen('game-screen');
        this.updateUI();
    }
}
