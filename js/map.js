// Map and Dungeon Generation

class Room {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get centerX() {
        return Math.floor(this.x + this.width / 2);
    }

    get centerY() {
        return Math.floor(this.y + this.height / 2);
    }

    intersects(other) {
        return (
            this.x <= other.x + other.width + 1 &&
            this.x + this.width + 1 >= other.x &&
            this.y <= other.y + other.height + 1 &&
            this.y + this.height + 1 >= other.y
        );
    }
}

class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.rooms = [];
        this.entities = [];
        this.items = [];
        this.stairsDownPos = null;
        this.stairsUpPos = null;

        this.initialize();
    }

    initialize() {
        // Fill with walls
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = GAME_CONFIG.TILES.WALL;
            }
        }
    }

    generate(floor) {
        this.initialize();
        this.rooms = [];
        this.entities = [];
        this.items = [];

        // Generate rooms
        for (let i = 0; i < GAME_CONFIG.MAX_ROOMS; i++) {
            const width = randomInt(GAME_CONFIG.MIN_ROOM_SIZE, GAME_CONFIG.MAX_ROOM_SIZE);
            const height = randomInt(GAME_CONFIG.MIN_ROOM_SIZE, GAME_CONFIG.MAX_ROOM_SIZE);
            const x = randomInt(1, this.width - width - 1);
            const y = randomInt(1, this.height - height - 1);

            const newRoom = new Room(x, y, width, height);

            // Check for intersections
            let intersects = false;
            for (const room of this.rooms) {
                if (newRoom.intersects(room)) {
                    intersects = true;
                    break;
                }
            }

            if (!intersects) {
                this.carveRoom(newRoom);

                if (this.rooms.length > 0) {
                    // Connect to previous room
                    const prevRoom = this.rooms[this.rooms.length - 1];
                    this.carveCorridor(prevRoom.centerX, prevRoom.centerY, newRoom.centerX, newRoom.centerY);
                }

                this.rooms.push(newRoom);
            }
        }

        // Place stairs
        if (this.rooms.length >= 2) {
            const firstRoom = this.rooms[0];
            const lastRoom = this.rooms[this.rooms.length - 1];

            // Stairs up in first room (except on floor 1)
            if (floor > 1) {
                this.stairsUpPos = { x: firstRoom.centerX, y: firstRoom.centerY };
                this.tiles[this.stairsUpPos.y][this.stairsUpPos.x] = GAME_CONFIG.TILES.STAIRS_UP;
            }

            // Stairs down in last room
            this.stairsDownPos = { x: lastRoom.centerX, y: lastRoom.centerY };
            this.tiles[this.stairsDownPos.y][this.stairsDownPos.x] = GAME_CONFIG.TILES.STAIRS_DOWN;
        }

        // Spawn entities and items
        this.spawnEntities(floor);
        this.spawnItems(floor);
    }

    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                this.tiles[y][x] = GAME_CONFIG.TILES.FLOOR;
            }
        }
    }

    carveCorridor(x1, y1, x2, y2) {
        // L-shaped corridor
        if (Math.random() < 0.5) {
            this.carveHorizontalTunnel(x1, x2, y1);
            this.carveVerticalTunnel(y1, y2, x2);
        } else {
            this.carveVerticalTunnel(y1, y2, x1);
            this.carveHorizontalTunnel(x1, x2, y2);
        }
    }

    carveHorizontalTunnel(x1, x2, y) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        for (let x = minX; x <= maxX; x++) {
            if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                this.tiles[y][x] = GAME_CONFIG.TILES.FLOOR;
            }
        }
    }

    carveVerticalTunnel(y1, y2, x) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        for (let y = minY; y <= maxY; y++) {
            if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                this.tiles[y][x] = GAME_CONFIG.TILES.FLOOR;
            }
        }
    }

    spawnEntities(floor) {
        const enemyTypes = ['r', 'r', 'r', 'D', 'L'];
        if (floor >= 3) enemyTypes.push('B');
        if (floor >= 5 && floor % 5 === 0) enemyTypes.push('X');

        const numEnemies = GAME_CONFIG.ENEMIES_PER_FLOOR + Math.floor(floor / 2);

        for (let i = 0; i < numEnemies; i++) {
            const room = randomChoice(this.rooms.slice(1)); // Skip first room (player spawn)
            const x = randomInt(room.x + 1, room.x + room.width - 2);
            const y = randomInt(room.y + 1, room.y + room.height - 2);

            if (this.isWalkable(x, y) && !this.getEntityAt(x, y)) {
                const enemyType = randomChoice(enemyTypes);
                const enemyData = ENEMIES[enemyType];

                const enemy = new Entity(
                    x, y,
                    enemyData.name,
                    enemyData.char,
                    enemyData.health,
                    enemyData.attack,
                    enemyData.defense
                );
                enemy.expValue = enemyData.expValue;
                enemy.moneyDrop = enemyData.moneyDrop;
                enemy.isBoss = enemyData.isBoss || false;

                this.entities.push(enemy);
            }
        }
    }

    spawnItems(floor) {
        // Spawn money
        const numMoney = GAME_CONFIG.MONEY_PER_FLOOR + floor;
        for (let i = 0; i < numMoney; i++) {
            this.spawnItem('$', floor);
        }

        // Spawn other items
        const numItems = GAME_CONFIG.ITEMS_PER_FLOOR;
        const itemTypes = ['!', ')', '['];

        for (let i = 0; i < numItems; i++) {
            const itemType = randomChoice(itemTypes);
            this.spawnItem(itemType, floor);
        }
    }

    spawnItem(itemChar, floor) {
        const room = randomChoice(this.rooms);
        const x = randomInt(room.x + 1, room.x + room.width - 2);
        const y = randomInt(room.y + 1, room.y + room.height - 2);

        if (this.isWalkable(x, y) && !this.getItemAt(x, y)) {
            const itemData = ITEMS[itemChar];
            const item = {
                x,
                y,
                char: itemChar,
                name: itemData.name,
                type: itemData.type,
                description: itemData.description
            };

            if (itemData.type === 'money') {
                item.value = randomInt(itemData.value[0], itemData.value[1]) * (1 + Math.floor(floor / 3));
            } else if (itemData.type === 'weapon' || itemData.type === 'armor') {
                item.value = randomInt(itemData.value[0], itemData.value[1]) + Math.floor(floor / 2);
            } else {
                item.value = itemData.value;
            }

            this.items.push(item);
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return GAME_CONFIG.TILES.WALL;
        }
        return this.tiles[y][x];
    }

    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile !== GAME_CONFIG.TILES.WALL;
    }

    getEntityAt(x, y) {
        return this.entities.find(e => e.x === x && e.y === y && e.isAlive());
    }

    getItemAt(x, y) {
        return this.items.find(i => i.x === x && i.y === y);
    }

    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    getPlayerStartPosition() {
        if (this.rooms.length > 0) {
            const room = this.rooms[0];
            return { x: room.centerX, y: room.centerY };
        }
        return { x: 1, y: 1 };
    }

    render(playerX, playerY) {
        let output = '';

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Check for player
                if (x === playerX && y === playerY) {
                    output += colorize(GAME_CONFIG.TILES.PLAYER);
                    continue;
                }

                // Check for entities
                const entity = this.getEntityAt(x, y);
                if (entity) {
                    output += colorize(entity.char);
                    continue;
                }

                // Check for items
                const item = this.getItemAt(x, y);
                if (item) {
                    output += colorize(item.char);
                    continue;
                }

                // Render tile
                output += colorize(this.tiles[y][x]);
            }
            output += '\n';
        }

        return output;
    }
}
