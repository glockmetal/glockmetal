// Sound System using Web Audio API
// Retro-style bleeps and bloops

class SoundSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.audioContext = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    // Ensure audio context is running (needed after user interaction)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    // Play a tone with given frequency, duration, and type
    playTone(frequency, duration, type = 'square', volumeMod = 1) {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        const now = this.audioContext.currentTime;
        const vol = this.volume * volumeMod;

        gainNode.gain.setValueAtTime(vol, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Play a sequence of tones
    playSequence(notes, baseTime = 0.1) {
        if (!this.enabled || !this.audioContext) return;

        let delay = 0;
        notes.forEach(note => {
            setTimeout(() => {
                this.playTone(note.freq, note.dur || baseTime, note.type || 'square');
            }, delay * 1000);
            delay += note.delay || baseTime;
        });
    }

    // --- Sound Effects ---

    // Movement sound - soft blip
    move() {
        this.playTone(200, 0.05, 'sine', 0.3);
    }

    // Pick up money - happy cha-ching
    money() {
        this.playSequence([
            { freq: 800, dur: 0.08 },
            { freq: 1000, dur: 0.08, delay: 0.08 },
            { freq: 1200, dur: 0.15, delay: 0.08 }
        ]);
    }

    // Pick up item
    itemPickup() {
        this.playSequence([
            { freq: 400, dur: 0.1 },
            { freq: 600, dur: 0.15, delay: 0.1 }
        ]);
    }

    // Equip weapon/armor
    equip() {
        this.playSequence([
            { freq: 300, dur: 0.1 },
            { freq: 450, dur: 0.1, delay: 0.1 },
            { freq: 600, dur: 0.2, delay: 0.1 }
        ]);
    }

    // Heal
    heal() {
        this.playSequence([
            { freq: 523, dur: 0.1, type: 'sine' },
            { freq: 659, dur: 0.1, delay: 0.1, type: 'sine' },
            { freq: 784, dur: 0.2, delay: 0.1, type: 'sine' }
        ]);
    }

    // Player hit - ouch
    playerHit() {
        this.playTone(150, 0.15, 'sawtooth', 0.5);
        setTimeout(() => this.playTone(100, 0.1, 'sawtooth', 0.4), 50);
    }

    // Enemy hit
    enemyHit() {
        this.playTone(300, 0.1, 'square', 0.4);
    }

    // Enemy killed
    enemyKilled() {
        this.playSequence([
            { freq: 200, dur: 0.1, type: 'sawtooth' },
            { freq: 150, dur: 0.1, delay: 0.05, type: 'sawtooth' },
            { freq: 100, dur: 0.2, delay: 0.05, type: 'sawtooth' }
        ]);
    }

    // Level up - triumphant
    levelUp() {
        this.playSequence([
            { freq: 523, dur: 0.15, type: 'square' },
            { freq: 659, dur: 0.15, delay: 0.15, type: 'square' },
            { freq: 784, dur: 0.15, delay: 0.15, type: 'square' },
            { freq: 1047, dur: 0.3, delay: 0.15, type: 'square' }
        ]);
    }

    // New floor/shift
    newFloor() {
        this.playSequence([
            { freq: 220, dur: 0.2, type: 'triangle' },
            { freq: 330, dur: 0.2, delay: 0.2, type: 'triangle' },
            { freq: 440, dur: 0.3, delay: 0.2, type: 'triangle' }
        ]);
    }

    // Warning - payment due soon
    warning() {
        this.playSequence([
            { freq: 440, dur: 0.15, type: 'square' },
            { freq: 220, dur: 0.15, delay: 0.2, type: 'square' },
            { freq: 440, dur: 0.15, delay: 0.2, type: 'square' }
        ]);
    }

    // Payment successful
    paymentSuccess() {
        this.playSequence([
            { freq: 392, dur: 0.15, type: 'sine' },
            { freq: 523, dur: 0.15, delay: 0.15, type: 'sine' },
            { freq: 659, dur: 0.15, delay: 0.15, type: 'sine' },
            { freq: 784, dur: 0.4, delay: 0.15, type: 'sine' }
        ]);
    }

    // Payment failed - dread
    paymentFailed() {
        this.playSequence([
            { freq: 200, dur: 0.3, type: 'sawtooth' },
            { freq: 150, dur: 0.3, delay: 0.3, type: 'sawtooth' },
            { freq: 100, dur: 0.5, delay: 0.3, type: 'sawtooth' }
        ]);
    }

    // NPC interaction
    npcTalk() {
        this.playSequence([
            { freq: 400, dur: 0.08, type: 'triangle' },
            { freq: 500, dur: 0.08, delay: 0.1, type: 'triangle' },
            { freq: 450, dur: 0.08, delay: 0.1, type: 'triangle' }
        ]);
    }

    // Child event - emotional
    childEvent() {
        this.playSequence([
            { freq: 523, dur: 0.2, type: 'sine' },
            { freq: 494, dur: 0.2, delay: 0.25, type: 'sine' },
            { freq: 523, dur: 0.4, delay: 0.25, type: 'sine' }
        ]);
    }

    // Visitation day - happy
    visitation() {
        this.playSequence([
            { freq: 523, dur: 0.15, type: 'sine' },
            { freq: 659, dur: 0.15, delay: 0.15, type: 'sine' },
            { freq: 784, dur: 0.15, delay: 0.15, type: 'sine' },
            { freq: 659, dur: 0.15, delay: 0.15, type: 'sine' },
            { freq: 784, dur: 0.15, delay: 0.15, type: 'sine' },
            { freq: 1047, dur: 0.3, delay: 0.15, type: 'sine' }
        ]);
    }

    // Emergency expense
    emergency() {
        this.playSequence([
            { freq: 880, dur: 0.1, type: 'square' },
            { freq: 440, dur: 0.1, delay: 0.15, type: 'square' },
            { freq: 880, dur: 0.1, delay: 0.15, type: 'square' },
            { freq: 440, dur: 0.1, delay: 0.15, type: 'square' }
        ]);
    }

    // Game over
    gameOver() {
        this.playSequence([
            { freq: 392, dur: 0.3, type: 'sawtooth' },
            { freq: 349, dur: 0.3, delay: 0.35, type: 'sawtooth' },
            { freq: 330, dur: 0.3, delay: 0.35, type: 'sawtooth' },
            { freq: 262, dur: 0.6, delay: 0.35, type: 'sawtooth' }
        ]);
    }

    // Victory
    victory() {
        this.playSequence([
            { freq: 523, dur: 0.2, type: 'sine' },
            { freq: 659, dur: 0.2, delay: 0.2, type: 'sine' },
            { freq: 784, dur: 0.2, delay: 0.2, type: 'sine' },
            { freq: 1047, dur: 0.2, delay: 0.2, type: 'sine' },
            { freq: 784, dur: 0.2, delay: 0.2, type: 'sine' },
            { freq: 1047, dur: 0.2, delay: 0.2, type: 'sine' },
            { freq: 1319, dur: 0.5, delay: 0.2, type: 'sine' }
        ]);
    }

    // Menu select
    menuSelect() {
        this.playTone(600, 0.1, 'square', 0.4);
    }

    // Menu move
    menuMove() {
        this.playTone(400, 0.05, 'square', 0.2);
    }

    // Start game
    startGame() {
        this.playSequence([
            { freq: 262, dur: 0.1, type: 'square' },
            { freq: 330, dur: 0.1, delay: 0.1, type: 'square' },
            { freq: 392, dur: 0.1, delay: 0.1, type: 'square' },
            { freq: 523, dur: 0.2, delay: 0.1, type: 'square' }
        ]);
    }
}

// Global sound instance
const sound = new SoundSystem();
