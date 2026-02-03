// Player class

class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.maxHealth = GAME_CONFIG.STARTING_HEALTH;
        this.health = GAME_CONFIG.STARTING_HEALTH;
        this.attack = GAME_CONFIG.STARTING_ATTACK;
        this.defense = GAME_CONFIG.STARTING_DEFENSE;
        this.money = GAME_CONFIG.STARTING_MONEY;
        this.level = 1;
        this.exp = 0;
        this.expToLevel = 50;

        // Equipment
        this.weapon = null;
        this.armor = null;

        // Inventory
        this.inventory = [];
        this.maxInventory = 10;

        // Stats tracking
        this.totalMoneyEarned = 0;
        this.totalAlimonyPaid = 0;
        this.enemiesKilled = 0;
        this.floorsExplored = 0;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    isAlive() {
        return this.health > 0;
    }

    takeDamage(amount) {
        const totalDefense = this.defense + (this.armor ? this.armor.value : 0);
        const actualDamage = Math.max(1, amount - totalDefense);
        this.health -= actualDamage;
        return actualDamage;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    getAttackPower() {
        return this.attack + (this.weapon ? this.weapon.value : 0);
    }

    addMoney(amount) {
        this.money += amount;
        this.totalMoneyEarned += amount;
    }

    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            return true;
        }
        return false;
    }

    addExp(amount) {
        this.exp += amount;
        let leveledUp = false;

        while (this.exp >= this.expToLevel) {
            this.exp -= this.expToLevel;
            this.level++;
            this.expToLevel = Math.floor(this.expToLevel * 1.5);

            // Level up bonuses
            this.maxHealth += 10;
            this.health = Math.min(this.health + 10, this.maxHealth);
            this.attack += 2;
            this.defense += 1;

            leveledUp = true;
        }

        return leveledUp;
    }

    equipWeapon(item) {
        if (this.weapon) {
            this.inventory.push(this.weapon);
        }
        this.weapon = item;
    }

    equipArmor(item) {
        if (this.armor) {
            this.inventory.push(this.armor);
        }
        this.armor = item;
    }

    addToInventory(item) {
        if (this.inventory.length < this.maxInventory) {
            this.inventory.push(item);
            return true;
        }
        return false;
    }

    useItem(index) {
        if (index < 0 || index >= this.inventory.length) {
            return null;
        }

        const item = this.inventory[index];

        if (item.type === 'consumable') {
            this.inventory.splice(index, 1);

            if (item.effect === 'heal') {
                this.heal(item.value);
                return `Used ${item.name}. Healed ${item.value} HP.`;
            }
        } else if (item.type === 'weapon') {
            this.inventory.splice(index, 1);
            this.equipWeapon(item);
            return `Equipped ${item.name}. Attack +${item.value}.`;
        } else if (item.type === 'armor') {
            this.inventory.splice(index, 1);
            this.equipArmor(item);
            return `Equipped ${item.name}. Defense +${item.value}.`;
        }

        return null;
    }

    move(dx, dy, map) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        // Check for entity (combat)
        const entity = map.getEntityAt(newX, newY);
        if (entity) {
            return { type: 'combat', target: entity };
        }

        // Check for walkable tile
        if (map.isWalkable(newX, newY)) {
            this.x = newX;
            this.y = newY;

            // Check for item
            const item = map.getItemAt(newX, newY);
            if (item) {
                return { type: 'item', item: item };
            }

            // Check for stairs
            const tile = map.getTile(newX, newY);
            if (tile === GAME_CONFIG.TILES.STAIRS_DOWN) {
                return { type: 'stairs_down' };
            } else if (tile === GAME_CONFIG.TILES.STAIRS_UP) {
                return { type: 'stairs_up' };
            }

            return { type: 'move' };
        }

        return { type: 'blocked' };
    }

    attack(target) {
        const damage = target.takeDamage(this.getAttackPower());
        return damage;
    }
}
