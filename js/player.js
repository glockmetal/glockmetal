// =============================================================================
// PLAYER.JS - Player Character Class
// =============================================================================
// This file defines the Player class which represents the player character.
// The player has stats (health, attack, defense), equipment (weapon, armor),
// an inventory system, and methods for movement, combat, and leveling up.
// =============================================================================

class Player {
    // =========================================================================
    // CONSTRUCTOR
    // Initialize player with default stats from GAME_CONFIG
    // =========================================================================
    constructor() {
        // ----- Position on the map -----
        this.x = 0;  // X coordinate (column)
        this.y = 0;  // Y coordinate (row)

        // ----- Health system -----
        this.maxHealth = GAME_CONFIG.STARTING_HEALTH;  // Maximum HP
        this.health = GAME_CONFIG.STARTING_HEALTH;     // Current HP

        // ----- Combat stats -----
        this.baseAttack = GAME_CONFIG.STARTING_ATTACK; // Base attack power
        this.attack = GAME_CONFIG.STARTING_ATTACK;     // Current attack (for compatibility)
        this.defense = GAME_CONFIG.STARTING_DEFENSE;   // Damage reduction

        // ----- Money -----
        this.money = GAME_CONFIG.STARTING_MONEY;  // Current cash on hand

        // ----- Experience/Leveling system -----
        this.level = 1;           // Current level (starts at 1)
        this.exp = 0;             // Current experience points
        this.expToLevel = 50;     // XP needed for next level (increases per level)

        // ----- Equipment slots -----
        // Equipment provides stat bonuses when equipped
        this.weapon = null;  // Equipped weapon (adds to attack)
        this.armor = null;   // Equipped armor (adds to defense)

        // ----- Inventory -----
        // Player can carry items for later use
        this.inventory = [];       // Array of held items
        this.maxInventory = 10;    // Maximum items that can be held

        // ----- Lifetime statistics -----
        // Tracked for end-game summary and high scores
        this.totalMoneyEarned = 0;   // All money ever picked up
        this.totalAlimonyPaid = 0;   // Total alimony payments made
        this.enemiesKilled = 0;      // Number of enemies defeated
        this.floorsExplored = 0;     // Highest floor reached

        // ----- Character name (set by character creation) -----
        this.name = 'Dad';
    }

    // =========================================================================
    // POSITION METHODS
    // =========================================================================

    /**
     * Set the player's position on the map
     * Used when changing floors or initializing the game
     * @param {number} x - X coordinate (column)
     * @param {number} y - Y coordinate (row)
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    // =========================================================================
    // HEALTH METHODS
    // =========================================================================

    /**
     * Check if the player is still alive
     * @returns {boolean} True if health > 0
     */
    isAlive() {
        return this.health > 0;
    }

    /**
     * Apply damage to the player
     * Damage is reduced by defense (from base stat + armor)
     * @param {number} amount - Raw damage amount
     * @returns {number} Actual damage dealt after defense reduction
     */
    takeDamage(amount) {
        // Calculate total defense (base + armor bonus)
        const totalDefense = this.defense + (this.armor ? this.armor.value : 0);

        // Damage is reduced by defense, but minimum 1 damage
        const actualDamage = Math.max(1, amount - totalDefense);

        // Apply damage
        this.health -= actualDamage;

        // Return actual damage dealt (for display purposes)
        return actualDamage;
    }

    /**
     * Heal the player
     * Cannot exceed maximum health
     * @param {number} amount - Amount of HP to restore
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    // =========================================================================
    // COMBAT METHODS
    // =========================================================================

    /**
     * Calculate total attack power
     * Base attack + weapon bonus
     * @returns {number} Total attack power
     */
    getAttackPower() {
        return this.baseAttack + (this.weapon ? this.weapon.value : 0);
    }

    /**
     * Attack a target (enemy)
     * @param {Entity} target - The enemy being attacked
     * @returns {number} Damage dealt to the target
     */
    attack(target) {
        const damage = target.takeDamage(this.getAttackPower());
        return damage;
    }

    // =========================================================================
    // MONEY METHODS
    // =========================================================================

    /**
     * Add money to the player's wallet
     * Also tracks total earnings for statistics
     * @param {number} amount - Amount of money to add
     */
    addMoney(amount) {
        this.money += amount;
        this.totalMoneyEarned += amount;  // Track lifetime earnings
    }

    /**
     * Spend money (for purchases, payments, etc.)
     * Only succeeds if player has enough money
     * @param {number} amount - Amount to spend
     * @returns {boolean} True if purchase succeeded, false if not enough money
     */
    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            return true;
        }
        return false;  // Not enough money
    }

    // =========================================================================
    // EXPERIENCE & LEVELING
    // =========================================================================

    /**
     * Add experience points and check for level up
     * @param {number} amount - Experience points to add
     * @returns {boolean} True if a level up occurred
     */
    addExp(amount) {
        this.exp += amount;
        let leveledUp = false;

        // Check for level up (can level up multiple times if lots of XP)
        while (this.exp >= this.expToLevel) {
            // Subtract required XP
            this.exp -= this.expToLevel;

            // Increase level
            this.level++;

            // Increase XP requirement for next level (1.5x each level)
            this.expToLevel = Math.floor(this.expToLevel * 1.5);

            // ----- LEVEL UP BONUSES -----
            // Each level up grants stat increases
            this.maxHealth += 10;                              // +10 max HP
            this.health = Math.min(this.health + 10, this.maxHealth);  // Heal 10 HP
            this.baseAttack += 2;                              // +2 attack
            this.defense += 1;                                 // +1 defense

            leveledUp = true;
        }

        return leveledUp;
    }

    // =========================================================================
    // EQUIPMENT METHODS
    // =========================================================================

    /**
     * Equip a weapon
     * If a weapon is already equipped, it goes to inventory
     * @param {Object} item - The weapon item to equip
     */
    equipWeapon(item) {
        // Move old weapon to inventory if one is equipped
        if (this.weapon) {
            this.inventory.push(this.weapon);
        }
        this.weapon = item;
    }

    /**
     * Equip armor
     * If armor is already equipped, it goes to inventory
     * @param {Object} item - The armor item to equip
     */
    equipArmor(item) {
        // Move old armor to inventory if one is equipped
        if (this.armor) {
            this.inventory.push(this.armor);
        }
        this.armor = item;
    }

    // =========================================================================
    // INVENTORY METHODS
    // =========================================================================

    /**
     * Add an item to inventory
     * @param {Object} item - Item to add
     * @returns {boolean} True if added, false if inventory full
     */
    addToInventory(item) {
        if (this.inventory.length < this.maxInventory) {
            this.inventory.push(item);
            return true;
        }
        return false;  // Inventory full
    }

    /**
     * Use an item from inventory
     * @param {number} index - Index of item in inventory array
     * @returns {string|null} Result message, or null if failed
     */
    useItem(index) {
        // Validate index
        if (index < 0 || index >= this.inventory.length) {
            return null;
        }

        const item = this.inventory[index];

        // Handle different item types
        if (item.type === 'consumable') {
            // Consumables are removed after use
            this.inventory.splice(index, 1);

            if (item.effect === 'heal') {
                this.heal(item.value);
                return `Used ${item.name}. Healed ${item.value} HP.`;
            }
        }
        else if (item.type === 'weapon') {
            // Weapons are equipped
            this.inventory.splice(index, 1);
            this.equipWeapon(item);
            return `Equipped ${item.name}. Attack +${item.value}.`;
        }
        else if (item.type === 'armor') {
            // Armor is equipped
            this.inventory.splice(index, 1);
            this.equipArmor(item);
            return `Equipped ${item.name}. Defense +${item.value}.`;
        }

        return null;
    }

    // =========================================================================
    // MOVEMENT
    // =========================================================================

    /**
     * Attempt to move the player in a direction
     * Handles collision detection, combat initiation, and item pickup
     * @param {number} dx - X direction (-1, 0, or 1)
     * @param {number} dy - Y direction (-1, 0, or 1)
     * @param {GameMap} map - The current game map
     * @returns {Object} Result object with type and optional data
     */
    move(dx, dy, map) {
        // Calculate target position
        const newX = this.x + dx;
        const newY = this.y + dy;

        // ----- Check for entity (enemy) at target position -----
        // Bumping into an enemy initiates combat
        const entity = map.getEntityAt(newX, newY);
        if (entity) {
            return { type: 'combat', target: entity };
        }

        // ----- Check if target tile is walkable -----
        if (map.isWalkable(newX, newY)) {
            // Move the player
            this.x = newX;
            this.y = newY;

            // ----- Check for item at new position -----
            // Standing on an item picks it up
            const item = map.getItemAt(newX, newY);
            if (item) {
                return { type: 'item', item: item };
            }

            // ----- Check for stairs -----
            // Standing on stairs prompts to use them
            const tile = map.getTile(newX, newY);
            if (tile === GAME_CONFIG.TILES.STAIRS_DOWN) {
                return { type: 'stairs_down' };
            } else if (tile === GAME_CONFIG.TILES.STAIRS_UP) {
                return { type: 'stairs_up' };
            }

            // Normal movement
            return { type: 'move' };
        }

        // Target tile is not walkable (wall, etc.)
        return { type: 'blocked' };
    }
}
