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
        NPC: '?',
        CHILD: 'c'
    },

    // Starting values
    STARTING_HEALTH: 100,
    STARTING_MONEY: 50, // Start with a little something
    STARTING_ATTACK: 10,
    STARTING_DEFENSE: 5,

    // Alimony settings
    STARTING_ALIMONY: 500,
    ALIMONY_INCREASE_PER_YEAR: 100,
    DAYS_PER_MONTH: 30,
    MONTHS_PER_YEAR: 12,
    CHILD_STARTING_AGE: 5,
    CHILD_ADULT_AGE: 18,

    // Living expenses (monthly)
    RENT: 200,
    FOOD_COST: 50,

    // Dungeon settings
    MIN_ROOM_SIZE: 4,
    MAX_ROOM_SIZE: 10,
    MAX_ROOMS: 15,

    // Spawn rates per floor
    ENEMIES_PER_FLOOR: 5,
    ITEMS_PER_FLOOR: 6,
    MONEY_PER_FLOOR: 12
};

// Job definitions - each floor is a different "shift"
const JOBS = {
    fastFood: {
        name: 'Fast Food Joint',
        description: 'The grease never washes off.',
        enemies: ['customer', 'manager', 'healthInspector'],
        items: ['coldFries', 'energyDrink', 'slipResistantShoes', 'nameBadge'],
        moneyMultiplier: 1.0,
        dangerLevel: 1,
        flavorText: [
            'The fryer spits at you.',
            '"ORDER UP!" screams the machine.',
            'Another customer complains.',
            'The floor is sticky with regret.'
        ]
    },
    warehouse: {
        name: 'Warehouse Night Shift',
        description: 'Your back will never be the same.',
        enemies: ['forklift', 'supervisor', 'fallingBoxes', 'rat'],
        items: ['backBrace', 'steelToes', 'energyDrink', 'painkillers'],
        moneyMultiplier: 1.3,
        dangerLevel: 2,
        flavorText: [
            'The fluorescent lights buzz endlessly.',
            'Package count: 847. 846 to go.',
            'Someone wrote "HELP" on a box.',
            'The night stretches forever.'
        ]
    },
    rideshare: {
        name: 'Rideshare Driving',
        description: 'Your car. Your gas. Their vomit.',
        enemies: ['drunkPassenger', 'lowRater', 'carjacker', 'traffic'],
        items: ['airFreshener', 'dashCam', 'phoneCharger', 'energyDrink'],
        moneyMultiplier: 1.1,
        dangerLevel: 2,
        flavorText: [
            '4.3 stars. Could be worse.',
            'Surge pricing: Your only friend.',
            '"Can you take a different route?"',
            'The app pings. Always the app.'
        ]
    },
    construction: {
        name: 'Construction Site',
        description: 'Built on broken bodies.',
        enemies: ['fallingDebris', 'angryForeman', 'unsafeScaffolding', 'heatstroke'],
        items: ['hardHat', 'workGloves', 'thermos', 'steelToes'],
        moneyMultiplier: 1.5,
        dangerLevel: 3,
        flavorText: [
            'The sun is merciless.',
            'Your hands are more callus than skin.',
            'Someone didn\'t tie off their ladder.',
            'Coffee break: 3 minutes.'
        ]
    },
    office: {
        name: 'Office Temp Work',
        description: 'Death by a thousand spreadsheets.',
        enemies: ['micromanager', 'ITGuy', 'passiveAggressive', 'layoffRumors'],
        items: ['coffeeStale', 'ergonomicMouse', 'antiAnxiety', 'businessCasual'],
        moneyMultiplier: 1.2,
        dangerLevel: 1,
        flavorText: [
            'Reply all was a mistake.',
            'The printer jams. Again.',
            '"Per my last email..."',
            'Fluorescent lights. Beige walls. Silence.'
        ]
    },
    hospital: {
        name: 'Hospital Orderly',
        description: 'Other people\'s pain pays your bills.',
        enemies: ['biohazard', 'grievingFamily', 'overworkedNurse', 'bureaucracy'],
        items: ['scrubs', 'handSanitizer', 'comfortableShoes', 'energyDrink'],
        moneyMultiplier: 1.4,
        dangerLevel: 2,
        flavorText: [
            'Room 404 needs cleaning. Again.',
            'The smell never leaves you.',
            'Someone\'s last day. Not yours.',
            '12 hours. No breaks.'
        ]
    },
    security: {
        name: 'Security Guard',
        description: 'Watching nothing. Waiting for something.',
        enemies: ['trespasser', 'vandal', 'falseAlarm', 'boredom'],
        items: ['flashlight', 'energyDrink', 'comfortableShoes', 'radioHandheld'],
        moneyMultiplier: 1.1,
        dangerLevel: 2,
        flavorText: [
            'Hour 6. Nothing has happened.',
            'The cameras show empty hallways.',
            'Was that a noise? Probably nothing.',
            'Your flashlight flickers.',
            'The night is long and cold.'
        ]
    },
    delivery: {
        name: 'Delivery Driver',
        description: 'Every minute costs you money.',
        enemies: ['angryCustomer', 'dogAttack', 'traffic', 'wrongAddress'],
        items: ['gpsDevice', 'energyDrink', 'comfortableShoes', 'thermalBag'],
        moneyMultiplier: 1.2,
        dangerLevel: 2,
        flavorText: [
            '"Leave at door" but they\'re watching.',
            'Apartment 4B. No apartment 4B exists.',
            'The app says 3 minutes. It\'s been 10.',
            'Another flight of stairs.',
            'No tip. Of course.'
        ]
    },
    callCenter: {
        name: 'Call Center',
        description: 'Your soul dies one call at a time.',
        enemies: ['angryCallerC', 'holdMusic', 'scriptDeviation', 'supervisorCall'],
        items: ['headset', 'coffeeStale', 'antiAnxiety', 'stressBall'],
        moneyMultiplier: 1.0,
        dangerLevel: 1,
        flavorText: [
            '"Your call is important to us."',
            'The queue never ends.',
            '"Let me transfer you." Click.',
            'Reading the same script. Again.',
            'Average handle time: Too long.'
        ]
    }
};

// Enemy definitions - themed by job
const ENEMIES = {
    // Fast Food
    customer: {
        name: 'Angry Customer',
        char: 'C',
        health: 15,
        attack: 5,
        defense: 1,
        expValue: 8,
        moneyDrop: [2, 8],
        description: '"I WANT TO SPEAK TO YOUR MANAGER!"'
    },
    manager: {
        name: 'Shift Manager',
        char: 'M',
        health: 25,
        attack: 8,
        defense: 3,
        expValue: 15,
        moneyDrop: [10, 20],
        description: '"You\'re not working hard enough."'
    },
    healthInspector: {
        name: 'Health Inspector',
        char: 'H',
        health: 20,
        attack: 12,
        defense: 2,
        expValue: 20,
        moneyDrop: [15, 30],
        description: 'Clipboard of doom.'
    },

    // Warehouse
    forklift: {
        name: 'Rogue Forklift',
        char: 'F',
        health: 40,
        attack: 15,
        defense: 8,
        expValue: 30,
        moneyDrop: [20, 40],
        description: 'OSHA violation incoming.'
    },
    supervisor: {
        name: 'Warehouse Supervisor',
        char: 'S',
        health: 30,
        attack: 10,
        defense: 5,
        expValue: 25,
        moneyDrop: [15, 35],
        description: '"Bathroom breaks are timed."'
    },
    fallingBoxes: {
        name: 'Falling Boxes',
        char: 'B',
        health: 10,
        attack: 20,
        defense: 0,
        expValue: 10,
        moneyDrop: [5, 15],
        description: 'Gravity is not your friend.'
    },
    rat: {
        name: 'Warehouse Rat',
        char: 'r',
        health: 8,
        attack: 3,
        defense: 1,
        expValue: 5,
        moneyDrop: [1, 5],
        description: 'A fellow survivor.'
    },

    // Rideshare
    drunkPassenger: {
        name: 'Drunk Passenger',
        char: 'D',
        health: 20,
        attack: 8,
        defense: 0,
        expValue: 15,
        moneyDrop: [5, 25],
        description: '"Bro, I\'m gonna be sick."'
    },
    lowRater: {
        name: '1-Star Reviewer',
        char: '1',
        health: 15,
        attack: 15,
        defense: 2,
        expValue: 20,
        moneyDrop: [0, 10],
        description: 'Your rating can\'t take much more.'
    },
    carjacker: {
        name: 'Carjacker',
        char: 'J',
        health: 35,
        attack: 18,
        defense: 5,
        expValue: 40,
        moneyDrop: [30, 60],
        description: '"Get out of the car."'
    },
    traffic: {
        name: 'Traffic Jam',
        char: 'T',
        health: 50,
        attack: 5,
        defense: 10,
        expValue: 15,
        moneyDrop: [0, 5],
        description: 'Time is money. You have neither.'
    },

    // Construction
    fallingDebris: {
        name: 'Falling Debris',
        char: 'd',
        health: 5,
        attack: 25,
        defense: 0,
        expValue: 10,
        moneyDrop: [5, 15],
        description: 'Look up. Look out.'
    },
    angryForeman: {
        name: 'Angry Foreman',
        char: 'F',
        health: 45,
        attack: 14,
        defense: 8,
        expValue: 35,
        moneyDrop: [25, 50],
        description: '"THIS AIN\'T A VACATION!"'
    },
    unsafeScaffolding: {
        name: 'Unsafe Scaffolding',
        char: '=',
        health: 15,
        attack: 30,
        defense: 0,
        expValue: 20,
        moneyDrop: [10, 25],
        description: 'It wobbles. You wobble.'
    },
    heatstroke: {
        name: 'Heatstroke',
        char: '*',
        health: 30,
        attack: 10,
        defense: 5,
        expValue: 25,
        moneyDrop: [15, 30],
        description: 'The sun doesn\'t care about you.'
    },

    // Office
    micromanager: {
        name: 'Micromanager',
        char: 'M',
        health: 20,
        attack: 12,
        defense: 3,
        expValue: 18,
        moneyDrop: [10, 25],
        description: '"I\'m going to need you to come in on Saturday."'
    },
    ITGuy: {
        name: 'Hostile IT',
        char: 'I',
        health: 15,
        attack: 8,
        defense: 2,
        expValue: 12,
        moneyDrop: [8, 18],
        description: '"Did you try turning it off and on?"'
    },
    passiveAggressive: {
        name: 'Passive-Aggressive Coworker',
        char: 'P',
        health: 18,
        attack: 10,
        defense: 4,
        expValue: 15,
        moneyDrop: [5, 15],
        description: '"I just think it\'s funny how..."'
    },
    layoffRumors: {
        name: 'Layoff Rumors',
        char: 'L',
        health: 25,
        attack: 15,
        defense: 0,
        expValue: 20,
        moneyDrop: [0, 10],
        description: 'The fear is worse than the reality.'
    },

    // Hospital
    biohazard: {
        name: 'Biohazard Spill',
        char: '~',
        health: 20,
        attack: 18,
        defense: 0,
        expValue: 15,
        moneyDrop: [10, 20],
        description: 'Hazmat suit not included.'
    },
    grievingFamily: {
        name: 'Grieving Family',
        char: 'G',
        health: 10,
        attack: 5,
        defense: 0,
        expValue: 5,
        moneyDrop: [0, 5],
        description: 'Their pain is not your enemy. But it finds you anyway.'
    },
    overworkedNurse: {
        name: 'Overworked Nurse',
        char: 'N',
        health: 22,
        attack: 8,
        defense: 4,
        expValue: 12,
        moneyDrop: [8, 18],
        description: 'Three patients need her. You\'re fourth.'
    },
    bureaucracy: {
        name: 'Hospital Bureaucracy',
        char: 'B',
        health: 40,
        attack: 8,
        defense: 8,
        expValue: 25,
        moneyDrop: [15, 30],
        description: 'Form 27-B/6 is missing.'
    },

    // Security
    trespasser: {
        name: 'Trespasser',
        char: 't',
        health: 20,
        attack: 10,
        defense: 2,
        expValue: 15,
        moneyDrop: [5, 15],
        description: 'They shouldn\'t be here. Neither should you.'
    },
    vandal: {
        name: 'Vandal',
        char: 'V',
        health: 18,
        attack: 12,
        defense: 1,
        expValue: 12,
        moneyDrop: [8, 20],
        description: 'Spray paint and bad intentions.'
    },
    falseAlarm: {
        name: 'False Alarm',
        char: '!',
        health: 5,
        attack: 0,
        defense: 0,
        expValue: 2,
        moneyDrop: [0, 5],
        description: 'Your heart races for nothing.'
    },
    boredom: {
        name: 'Crushing Boredom',
        char: 'z',
        health: 30,
        attack: 5,
        defense: 5,
        expValue: 10,
        moneyDrop: [5, 10],
        description: 'The real enemy is time itself.'
    },

    // Delivery
    angryCustomer: {
        name: 'Angry Customer',
        char: 'A',
        health: 15,
        attack: 8,
        defense: 1,
        expValue: 10,
        moneyDrop: [0, 10],
        description: '"WHERE\'S MY ORDER?!"'
    },
    dogAttack: {
        name: 'Aggressive Dog',
        char: 'D',
        health: 25,
        attack: 15,
        defense: 2,
        expValue: 18,
        moneyDrop: [0, 5],
        description: 'Good boy? Bad boy.'
    },
    wrongAddress: {
        name: 'Wrong Address',
        char: '?',
        health: 10,
        attack: 5,
        defense: 0,
        expValue: 5,
        moneyDrop: [2, 8],
        description: 'This building doesn\'t exist.'
    },

    // Call Center
    angryCallerC: {
        name: 'Angry Caller',
        char: 'A',
        health: 15,
        attack: 10,
        defense: 0,
        expValue: 8,
        moneyDrop: [3, 10],
        description: '"I\'VE BEEN ON HOLD FOR AN HOUR!"'
    },
    holdMusic: {
        name: 'Hold Music',
        char: '~',
        health: 20,
        attack: 3,
        defense: 3,
        expValue: 5,
        moneyDrop: [0, 5],
        description: 'The same 30 seconds. Forever.'
    },
    scriptDeviation: {
        name: 'Script Deviation',
        char: 'S',
        health: 12,
        attack: 8,
        defense: 2,
        expValue: 8,
        moneyDrop: [5, 12],
        description: 'You went off-script. That\'s a warning.'
    },
    supervisorCall: {
        name: 'Supervisor Escalation',
        char: 'E',
        health: 30,
        attack: 15,
        defense: 5,
        expValue: 20,
        moneyDrop: [10, 25],
        description: '"Let me get my supervisor." You ARE the supervisor.'
    },

    // Universal enemies (can appear anywhere)
    debtCollector: {
        name: 'Debt Collector',
        char: '$',
        health: 35,
        attack: 12,
        defense: 6,
        expValue: 30,
        moneyDrop: [20, 45],
        description: 'They always find you.'
    },
    lawyer: {
        name: 'Lawyer',
        char: 'L',
        health: 30,
        attack: 18,
        defense: 4,
        expValue: 35,
        moneyDrop: [25, 55],
        description: 'Their words cut deeper than swords.'
    },
    exWife: {
        name: 'Your Ex-Wife',
        char: 'X',
        health: 100,
        attack: 25,
        defense: 10,
        expValue: 100,
        moneyDrop: [0, 0],
        description: 'She wants what you can\'t give.',
        isBoss: true
    }
};

// Item definitions - themed and meaningful
const ITEMS = {
    // Money types
    cash: {
        name: 'Cash',
        char: '$',
        type: 'money',
        value: [5, 25],
        description: 'Cold, hard cash.'
    },
    tip: {
        name: 'Tip',
        char: '$',
        type: 'money',
        value: [1, 15],
        description: 'Someone appreciated your work.'
    },
    bonus: {
        name: 'Bonus',
        char: '$',
        type: 'money',
        value: [30, 75],
        description: 'A rare good day.'
    },

    // Healing items
    energyDrink: {
        name: 'Energy Drink',
        char: '!',
        type: 'consumable',
        effect: 'heal',
        value: 20,
        description: 'Heart palpitations not included.'
    },
    coldFries: {
        name: 'Cold Fries',
        char: '!',
        type: 'consumable',
        effect: 'heal',
        value: 10,
        description: 'Better than nothing.'
    },
    painkillers: {
        name: 'Painkillers',
        char: '!',
        type: 'consumable',
        effect: 'heal',
        value: 30,
        description: 'For the pain you can measure.'
    },
    coffeeStale: {
        name: 'Stale Coffee',
        char: '!',
        type: 'consumable',
        effect: 'heal',
        value: 15,
        description: 'From this morning. Or yesterday.'
    },
    thermos: {
        name: 'Thermos of Soup',
        char: '!',
        type: 'consumable',
        effect: 'heal',
        value: 25,
        description: 'Packed it yourself. Small victory.'
    },
    handSanitizer: {
        name: 'Hand Sanitizer',
        char: '!',
        type: 'consumable',
        effect: 'heal',
        value: 12,
        description: 'Kills 99.9% of germs. 0% of despair.'
    },
    antiAnxiety: {
        name: 'Anti-Anxiety Meds',
        char: '!',
        type: 'consumable',
        effect: 'heal',
        value: 35,
        description: 'Prescribed. Probably.'
    },

    // Weapons
    slipResistantShoes: {
        name: 'Slip-Resistant Shoes',
        char: ')',
        type: 'weapon',
        value: [3, 6],
        description: 'Good for kicking. And not falling.'
    },
    steelToes: {
        name: 'Steel-Toe Boots',
        char: ')',
        type: 'weapon',
        value: [5, 10],
        description: 'Protection and offense in one.'
    },
    dashCam: {
        name: 'Dash Cam',
        char: ')',
        type: 'weapon',
        value: [4, 8],
        description: 'Evidence is power.'
    },
    workGloves: {
        name: 'Heavy Work Gloves',
        char: ')',
        type: 'weapon',
        value: [4, 7],
        description: 'Knuckle protection.'
    },
    ergonomicMouse: {
        name: 'Ergonomic Mouse',
        char: ')',
        type: 'weapon',
        value: [2, 5],
        description: 'Surprisingly effective when thrown.'
    },

    // Armor
    nameBadge: {
        name: 'Name Badge',
        char: '[',
        type: 'armor',
        value: [1, 3],
        description: 'You are not a person. You are "EMPLOYEE".'
    },
    backBrace: {
        name: 'Back Brace',
        char: '[',
        type: 'armor',
        value: [3, 6],
        description: 'Holds you together.'
    },
    airFreshener: {
        name: 'Air Freshener Shield',
        char: '[',
        type: 'armor',
        value: [2, 4],
        description: 'Masks more than smells.'
    },
    hardHat: {
        name: 'Hard Hat',
        char: '[',
        type: 'armor',
        value: [4, 8],
        description: 'OSHA approved.'
    },
    phoneCharger: {
        name: 'Phone Charger',
        char: '[',
        type: 'armor',
        value: [2, 4],
        description: 'Stay connected. Stay alive.'
    },
    businessCasual: {
        name: 'Business Casual',
        char: '[',
        type: 'armor',
        value: [3, 5],
        description: 'Armor of conformity.'
    },
    scrubs: {
        name: 'Hospital Scrubs',
        char: '[',
        type: 'armor',
        value: [3, 6],
        description: 'Stain-resistant. Soul not included.'
    },
    comfortableShoes: {
        name: 'Comfortable Shoes',
        char: '[',
        type: 'armor',
        value: [2, 5],
        description: 'Your feet thank you.'
    },

    // Security items
    flashlight: {
        name: 'Heavy Flashlight',
        char: ')',
        type: 'weapon',
        value: [3, 7],
        description: 'For seeing. And hitting.'
    },
    radioHandheld: {
        name: 'Radio',
        char: '[',
        type: 'armor',
        value: [2, 4],
        description: 'Backup is just a call away. Usually.'
    },

    // Delivery items
    gpsDevice: {
        name: 'GPS Device',
        char: '[',
        type: 'armor',
        value: [2, 5],
        description: 'Recalculating... recalculating...'
    },
    thermalBag: {
        name: 'Thermal Bag',
        char: '[',
        type: 'armor',
        value: [3, 6],
        description: 'Keeps food warm. Keeps you sane.'
    },

    // Call center items
    headset: {
        name: 'Quality Headset',
        char: '[',
        type: 'armor',
        value: [2, 5],
        description: 'Noise-canceling. If only it canceled everything.'
    },
    stressBall: {
        name: 'Stress Ball',
        char: '!',
        type: 'consumable',
        effect: 'heal',
        value: 15,
        description: 'Squeeze. Squeeze. Keep squeezing.'
    }
};

// NPC types you can meet
const NPCS = {
    divorcedDad: {
        name: 'Fellow Divorced Dad',
        char: '?',
        dialogues: [
            '"Hey man, I\'ve been there. Here\'s a few bucks."',
            '"My kid turned 16 last week. I wasn\'t there."',
            '"It gets easier. That\'s a lie, but it\'s what we say."',
            '"Keep your head down. Keep working. That\'s all we can do."',
            '"I found $20 on the ground. Take it. You need it more than me."'
        ],
        givesMoney: [10, 30],
        givesItem: null
    },
    kindStranger: {
        name: 'Kind Stranger',
        char: '?',
        dialogues: [
            '"You look exhausted. Here, take this."',
            '"I remember when times were hard. Don\'t give up."',
            '"Someone helped me once. Paying it forward."'
        ],
        givesMoney: [5, 20],
        givesItem: 'energyDrink'
    },
    oldTimer: {
        name: 'Old Timer',
        char: '?',
        dialogues: [
            '"Thirty years I did this. My kids don\'t call anymore."',
            '"You young guys don\'t know how good you got it."',
            '"Want some advice? Don\'t get married again."',
            '"I paid my last check five years ago. Still here though."'
        ],
        givesMoney: [0, 15],
        givesItem: null
    },
    yourMom: {
        name: 'Your Mother',
        char: '?',
        dialogues: [
            '"I brought you some food. You\'re too thin."',
            '"She wasn\'t right for you anyway."',
            '"When can I see my grandchild?"',
            '"I\'m proud of you for trying."',
            '"Here\'s a little something. Don\'t tell your father."'
        ],
        givesMoney: [20, 50],
        givesItem: 'thermos'
    },
    loanShark: {
        name: 'Shady Character',
        char: '?',
        dialogues: [
            '"Need cash fast? I can help... for a price."',
            '"No credit check. Just a handshake."',
            '"You look desperate. I like desperate."'
        ],
        givesMoney: [50, 100],
        givesItem: null,
        isLoanShark: true
    },
    lawyer: {
        name: 'Public Defender',
        char: '?',
        dialogues: [
            '"I\'ve seen your case. Keep making those payments."',
            '"The system isn\'t fair, but we work with what we have."',
            '"Document everything. Trust me."',
            '"You\'re doing better than most. Keep it up."'
        ],
        givesMoney: [0, 10],
        givesItem: null
    },
    coworker: {
        name: 'Friendly Coworker',
        char: '?',
        dialogues: [
            '"Hey, I can cover part of your shift if you need."',
            '"Heard about your situation. Here, grab lunch on me."',
            '"We\'re all just trying to survive, right?"',
            '"Don\'t let the boss see you talking to me."'
        ],
        givesMoney: [5, 25],
        givesItem: 'energyDrink'
    }
};

// Life events - the narrative moments
const LIFE_EVENTS = {
    // Child events
    childEvents: [
        { text: "Your child drew you a picture. It's you and them holding hands.", effect: 'heal', value: 10 },
        { text: "Your child's school called. They got in trouble for fighting.", effect: 'none' },
        { text: "Your child asked their mom when you're coming home.", effect: 'none' },
        { text: "Your child made the honor roll. You heard from your ex's Facebook.", effect: 'none' },
        { text: "Your child's birthday is coming up. You can't afford a present.", effect: 'stress', value: 5 },
        { text: "Your child said 'I miss you, dad' on the phone. 30 seconds wasn't enough.", effect: 'heal', value: 15 },
        { text: "Your child is in the school play. It's during your shift.", effect: 'stress', value: 8 },
        { text: "Your ex sent a photo. Your child lost their first tooth.", effect: 'none' },
        { text: "Your child asked for a video game for Christmas. It costs more than your rent.", effect: 'none' },
        { text: "Your child called you their hero in a school essay. You weren't there to hear it.", effect: 'heal', value: 20 }
    ],
    // Emergency expenses
    emergencies: [
        { text: "Your car broke down. The repairs cost you $", effect: 'expense', value: [50, 150] },
        { text: "Medical bill arrived. You owe $", effect: 'expense', value: [75, 200] },
        { text: "Your phone broke. Replacement cost: $", effect: 'expense', value: [40, 100] },
        { text: "Parking ticket. $", effect: 'expense', value: [25, 75] },
        { text: "Your work uniform was damaged. New one costs $", effect: 'expense', value: [30, 60] },
        { text: "Rent increase. Extra $", effect: 'expense', value: [25, 50] }
    ],
    // Positive moments
    positiveEvents: [
        { text: "Found $20 in your old jacket.", effect: 'money', value: 20 },
        { text: "A customer tipped extra. They said you looked like you needed it.", effect: 'money', value: [10, 30] },
        { text: "Your coworker covered your shift once. You owe them.", effect: 'heal', value: 10 },
        { text: "The vending machine gave you two snacks.", effect: 'heal', value: 5 },
        { text: "You got employee of the month. It came with a $25 bonus.", effect: 'money', value: 25 },
        { text: "Someone bought your coffee in the drive-through.", effect: 'heal', value: 8 }
    ],
    // Reflective moments
    reflectiveEvents: [
        { text: "You see a father playing with his kid at the park during your break.", effect: 'none' },
        { text: "You remember your wedding day. It's just a memory now.", effect: 'none' },
        { text: "Another year. You're still here. That's something.", effect: 'none' },
        { text: "You wonder what your kid will remember about these years.", effect: 'none' },
        { text: "The sun is setting. You'll miss it. You're clocking in.", effect: 'none' }
    ],
    // Child age milestones
    milestones: {
        6: "Your child started first grade today. You saw the photo.",
        7: "Your child learned to ride a bike. Your ex taught them.",
        8: "Your child joined little league. You've never seen them play.",
        9: "Your child is growing up so fast. You're missing it.",
        10: "Double digits. A decade of life. You've been there for half of it.",
        11: "Your child asked for a phone. They want to text you more.",
        12: "Middle school. The hard years are coming.",
        13: "Teenager now. They have their own life.",
        14: "Your child has a crush. They didn't tell you about it.",
        15: "Your child is talking about getting a permit. Time flies.",
        16: "Your child can drive now. They drove to see you once.",
        17: "Senior year. Almost done. You almost made it.",
        18: "Your child is an adult now. You did it. Was it worth it?"
    },
    // Lucky breaks - rare events that can change everything
    luckyBreaks: [
        {
            text: "Your ex got remarried. Alimony payments are terminated!",
            effect: 'exRemarried',
            rarity: 0.001 // Very rare
        },
        {
            text: "You won $500 on a scratch-off ticket.",
            effect: 'money',
            value: 500,
            rarity: 0.005
        },
        {
            text: "Your ex agreed to reduce the alimony amount.",
            effect: 'reduceAlimony',
            value: 100,
            rarity: 0.003
        },
        {
            text: "Tax refund arrived! Extra cash this month.",
            effect: 'money',
            value: [200, 400],
            rarity: 0.01
        },
        {
            text: "Your child chose to live with you. Child support reversed!",
            effect: 'custodyChange',
            rarity: 0.0005 // Extremely rare
        },
        {
            text: "An old debt was forgiven. One less worry.",
            effect: 'heal',
            value: 30,
            rarity: 0.008
        },
        {
            text: "Your boss gave you a surprise raise!",
            effect: 'permanentBonus',
            rarity: 0.005
        }
    ]
};

// Messages
const MESSAGES = {
    PAYMENT_SUCCESS: 'Alimony paid. You can breathe for another month.',
    PAYMENT_FAILED: "Couldn't make the payment. The court doesn't care why.",
    CHILD_BIRTHDAY: 'Your child turned {age}. You sent a card.',
    CHILD_ADULT: "Your child is 18. You're free. They're an adult now. Was it worth it?",
    GAME_OVER_HEALTH: 'You collapsed. The grind took everything.',
    GAME_OVER_JAIL: 'Arrested for non-payment. Who takes care of them now?',
    LEVEL_UP: 'Experience gained. Level {level}. The grind continues.',
    FLOOR_DESCEND: 'Another shift. {jobName}. Floor {floor}.',
    ENEMY_KILLED: 'Dealt with {enemy}. Found ${money}.',
    PLAYER_HIT: '{enemy} hits you for {damage}!',
    ENEMY_HIT: 'You hit {enemy} for {damage}!',
    RENT_DUE: 'Rent is due. ${amount} deducted.',
    EXPENSE_HIT: '{reason}${amount}',
    NPC_MET: '{npcName}: {dialogue}',
    VISITATION: 'Visitation day. You have 10 turns with your child.',
    VISITATION_END: "Time's up. They have to go back to their mom.",
    DAILY_GRIND: [
        'Another day. Another dollar.',
        'The alarm goes off. Time to work.',
        'Your body aches. You keep moving.',
        'This is what it takes.',
        'For them. Always for them.'
    ]
};
