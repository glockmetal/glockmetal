// Game Constants
const GAME_CONFIG = {
    MAP_WIDTH: 50,
    MAP_HEIGHT: 25,

    // Tile types
    TILES: {
        WALL: '#',
        FLOOR: '.',
        PLAYER: '@',
        STAIRS_DOWN: '>',
        STAIRS_UP: '<',
        DOOR_CLOSED: '+',
        DOOR_OPEN: '/',
        MONEY: '$',
        HEALTH_POTION: '!',
        WEAPON: ')',
        ARMOR: '[',
        ENEMY_RAT: 'r',
        ENEMY_DEBT_COLLECTOR: 'D',
        ENEMY_LAWYER: 'L',
        ENEMY_BOSS: 'B',
        ENEMY_EX_WIFE: 'X'
    },

    // Starting values
    STARTING_HEALTH: 100,
    STARTING_MONEY: 0,
    STARTING_ATTACK: 10,
    STARTING_DEFENSE: 5,

    // Alimony settings
    STARTING_ALIMONY: 500,
    ALIMONY_INCREASE_PER_YEAR: 100,
    DAYS_PER_MONTH: 30,
    MONTHS_PER_YEAR: 12,
    CHILD_STARTING_AGE: 5,
    CHILD_ADULT_AGE: 18,

    // Dungeon settings
    MIN_ROOM_SIZE: 4,
    MAX_ROOM_SIZE: 10,
    MAX_ROOMS: 15,

    // Enemy spawn rates per floor
    ENEMIES_PER_FLOOR: 5,
    ITEMS_PER_FLOOR: 8,
    MONEY_PER_FLOOR: 10
};

// Enemy definitions
const ENEMIES = {
    'r': {
        name: 'Sewer Rat',
        char: 'r',
        health: 10,
        attack: 3,
        defense: 1,
        expValue: 5,
        moneyDrop: [1, 5],
        description: 'A desperate rat, much like yourself.'
    },
    'D': {
        name: 'Debt Collector',
        char: 'D',
        health: 30,
        attack: 8,
        defense: 5,
        expValue: 20,
        moneyDrop: [10, 30],
        description: 'They always find you.'
    },
    'L': {
        name: 'Lawyer',
        char: 'L',
        health: 25,
        attack: 15,
        defense: 3,
        expValue: 30,
        moneyDrop: [20, 50],
        description: 'Their words cut deeper than swords.'
    },
    'B': {
        name: 'Angry Boss',
        char: 'B',
        health: 50,
        attack: 12,
        defense: 8,
        expValue: 50,
        moneyDrop: [50, 100],
        description: 'WHERE HAVE YOU BEEN?!'
    },
    'X': {
        name: 'Your Ex-Wife',
        char: 'X',
        health: 100,
        attack: 20,
        defense: 10,
        expValue: 100,
        moneyDrop: [0, 0],
        description: 'She wants more than you can give.',
        isBoss: true
    }
};

// Item definitions
const ITEMS = {
    '$': {
        name: 'Money',
        char: '$',
        type: 'money',
        value: [5, 25],
        description: 'Cold, hard cash.'
    },
    '!': {
        name: 'Energy Drink',
        char: '!',
        type: 'consumable',
        effect: 'heal',
        value: 25,
        description: 'Keeps you going for another shift.'
    },
    ')': {
        name: 'Work Tool',
        char: ')',
        type: 'weapon',
        value: [3, 8],
        description: 'A tool that doubles as a weapon.'
    },
    '[': {
        name: 'Work Uniform',
        char: '[',
        type: 'armor',
        value: [2, 5],
        description: 'Offers some protection.'
    }
};

// Messages
const MESSAGES = {
    PAYMENT_SUCCESS: 'You made the alimony payment! Another month of freedom.',
    PAYMENT_FAILED: 'You couldn\'t make the payment. Your ex-wife is not happy.',
    CHILD_BIRTHDAY: 'Your child has turned {age}. Time flies when you\'re working.',
    CHILD_ADULT: 'Your child has turned 18! You\'re finally free!',
    GAME_OVER_HEALTH: 'You collapsed from exhaustion. The payments stop with you.',
    GAME_OVER_JAIL: 'You were arrested for missing too many payments.',
    LEVEL_UP: 'You feel more experienced. Level {level}!',
    FLOOR_DESCEND: 'You descend deeper into the grind. Floor {floor}.',
    ENEMY_KILLED: 'You defeated the {enemy}! Found ${money}.',
    PLAYER_HIT: 'The {enemy} hits you for {damage} damage!',
    ENEMY_HIT: 'You hit the {enemy} for {damage} damage!'
};
