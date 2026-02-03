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
        '#': '#666666',  // Wall
        '.': '#333333',  // Floor
        '@': '#00ff00',  // Player
        '>': '#00ffff',  // Stairs down
        '<': '#00ffff',  // Stairs up
        '+': '#8b4513',  // Closed door
        '/': '#8b4513',  // Open door
        '$': '#ffd700',  // Money
        '!': '#ff00ff',  // Potion
        ')': '#ffffff',  // Weapon
        '[': '#4169e1',  // Armor
        'r': '#ff6666',  // Rat
        'D': '#ff0000',  // Debt collector
        'L': '#ff4444',  // Lawyer
        'B': '#ff0000',  // Boss
        'X': '#ff00ff'   // Ex-wife
    };
    return colorMap[char] || '#ffffff';
}

function colorize(char) {
    const color = getTileColor(char);
    return `<span style="color: ${color}">${char}</span>`;
}
