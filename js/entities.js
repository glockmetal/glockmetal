// Entity class for enemies and NPCs

class Entity {
    constructor(x, y, name, char, maxHealth, attack, defense) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.char = char;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.attack = attack;
        this.defense = defense;
        this.expValue = 0;
        this.moneyDrop = [0, 0];
        this.isBoss = false;
        this.stunned = false;
    }

    isAlive() {
        return this.health > 0;
    }

    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.defense);
        this.health -= actualDamage;
        return actualDamage;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    getMoneyDrop() {
        return randomInt(this.moneyDrop[0], this.moneyDrop[1]);
    }

    // Simple AI behavior
    act(map, playerX, playerY) {
        if (!this.isAlive() || this.stunned) {
            this.stunned = false;
            return null;
        }

        const dist = manhattanDistance(this.x, this.y, playerX, playerY);

        // Attack if adjacent
        if (dist <= 1) {
            return { type: 'attack' };
        }

        // Chase if close enough
        if (dist <= 8) {
            const move = findPath(this.x, this.y, playerX, playerY, map);
            const newX = this.x + move.x;
            const newY = this.y + move.y;

            if (map.isWalkable(newX, newY) && !map.getEntityAt(newX, newY)) {
                this.x = newX;
                this.y = newY;
            }
        } else {
            // Random movement
            const directions = [
                { x: 0, y: -1 },
                { x: 0, y: 1 },
                { x: -1, y: 0 },
                { x: 1, y: 0 }
            ];
            const dir = randomChoice(directions);
            const newX = this.x + dir.x;
            const newY = this.y + dir.y;

            if (map.isWalkable(newX, newY) && !map.getEntityAt(newX, newY)) {
                this.x = newX;
                this.y = newY;
            }
        }

        return null;
    }
}
