// Utility functions

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

function formatMoney(amount) {
    return '$' + amount.toLocaleString();
}

function formatMessage(template, values) {
    let message = template;
    for (const [key, value] of Object.entries(values)) {
        message = message.replace(`{${key}}`, value);
    }
    return message;
}

// Simple pathfinding for enemies
function findPath(startX, startY, endX, endY, map) {
    const dx = endX - startX;
    const dy = endY - startY;

    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
        moveX = dx > 0 ? 1 : -1;
    } else if (dy !== 0) {
        moveY = dy > 0 ? 1 : -1;
    }

    const newX = startX + moveX;
    const newY = startY + moveY;

    if (map.isWalkable(newX, newY)) {
        return { x: moveX, y: moveY };
    }

    // Try alternate direction
    if (moveX !== 0 && dy !== 0) {
        moveY = dy > 0 ? 1 : -1;
        moveX = 0;
        if (map.isWalkable(startX + moveX, startY + moveY)) {
            return { x: moveX, y: moveY };
        }
    } else if (moveY !== 0 && dx !== 0) {
        moveX = dx > 0 ? 1 : -1;
        moveY = 0;
        if (map.isWalkable(startX + moveX, startY + moveY)) {
            return { x: moveX, y: moveY };
        }
    }

    return { x: 0, y: 0 };
}

// Color helpers for rendering
function getTileColor(char) {
    const colorMap = {
        // Terrain
        '#': '#444444',  // Wall
        '.': '#222222',  // Floor
        '>': '#00ffff',  // Stairs down
        '<': '#00ffff',  // Stairs up
        '+': '#8b4513',  // Closed door
        '/': '#8b4513',  // Open door

        // Player
        '@': '#00ff00',  // Player (bright green)

        // Items
        '$': '#ffd700',  // Money (gold)
        '!': '#ff00ff',  // Consumable (magenta)
        ')': '#ffffff',  // Weapon (white)
        '[': '#4169e1',  // Armor (blue)

        // NPCs
        '?': '#00ff88',  // Friendly NPC (teal)
        'c': '#ffaaff',  // Child (pink)

        // Enemies - vary by type
        'C': '#ff6666',  // Customer
        'M': '#ff4444',  // Manager
        'H': '#ff8800',  // Health Inspector
        'F': '#ff0000',  // Forklift / Foreman
        'S': '#ff5555',  // Supervisor
        'B': '#ff3333',  // Boss / Boxes / Bureaucracy
        'r': '#aa6666',  // Rat
        'D': '#ff2222',  // Drunk Passenger / Debt Collector
        '1': '#ffaa00',  // 1-Star Reviewer
        'J': '#ff0000',  // Carjacker
        'T': '#888888',  // Traffic
        'd': '#aa4444',  // Falling Debris
        '=': '#666666',  // Scaffolding
        '*': '#ffff00',  // Heatstroke
        'I': '#6666ff',  // IT Guy
        'P': '#ff88ff',  // Passive-Aggressive
        'L': '#ff4488',  // Lawyer / Layoff
        '~': '#44ff44',  // Biohazard
        'G': '#8888ff',  // Grieving Family
        'N': '#ffffff',  // Nurse
        'X': '#ff00ff'   // Ex-wife (boss)
    };
    return colorMap[char] || '#ffffff';
}

function colorize(char) {
    const color = getTileColor(char);
    return `<span style="color: ${color}">${char}</span>`;
}
