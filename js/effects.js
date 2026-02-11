// Visual Effects System
// Screen shake, flashing, and other juice

class EffectsSystem {
    constructor() {
        this.container = null;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeStartTime = 0;
        this.isShaking = false;
    }

    init() {
        this.container = document.getElementById('game-container');
    }

    // --- Screen Shake ---

    shake(intensity = 5, duration = 200) {
        if (!this.container) this.init();

        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeStartTime = Date.now();
        this.isShaking = true;

        this.animateShake();
    }

    animateShake() {
        if (!this.isShaking) return;

        const elapsed = Date.now() - this.shakeStartTime;
        if (elapsed >= this.shakeDuration) {
            this.container.style.transform = '';
            this.isShaking = false;
            return;
        }

        // Decay shake over time
        const progress = elapsed / this.shakeDuration;
        const currentIntensity = this.shakeIntensity * (1 - progress);

        const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
        const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;

        this.container.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

        requestAnimationFrame(() => this.animateShake());
    }

    // Light shake for hits
    shakeLight() {
        this.shake(3, 100);
    }

    // Medium shake for taking damage
    shakeMedium() {
        this.shake(6, 200);
    }

    // Heavy shake for big events
    shakeHeavy() {
        this.shake(10, 300);
    }

    // --- Flash Effects ---

    flashElement(elementId, color, duration = 200) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const originalColor = element.style.color;
        const originalBg = element.style.backgroundColor;
        const originalShadow = element.style.textShadow;

        element.style.color = color;
        element.style.textShadow = `0 0 10px ${color}`;

        setTimeout(() => {
            element.style.color = originalColor;
            element.style.textShadow = originalShadow;
        }, duration);
    }

    flashScreen(color, duration = 100) {
        if (!this.container) this.init();

        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${color};
            opacity: 0.3;
            pointer-events: none;
            z-index: 1000;
        `;

        this.container.appendChild(flash);

        setTimeout(() => {
            flash.style.transition = 'opacity 0.1s';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 100);
        }, duration);
    }

    // Flash red when taking damage
    flashDamage() {
        this.flashScreen('rgba(255, 0, 0, 0.4)', 100);
    }

    // Flash green for healing
    flashHeal() {
        this.flashScreen('rgba(0, 255, 0, 0.3)', 150);
    }

    // Flash gold for money
    flashMoney() {
        this.flashElement('money', '#ffff00', 300);
    }

    // Flash warning for low time
    flashWarning() {
        this.flashElement('days-until-payment', '#ff0000', 500);
    }

    // --- Pulse Effects ---

    pulseElement(elementId, duration = 500) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.classList.add('pulse-effect');
        setTimeout(() => {
            element.classList.remove('pulse-effect');
        }, duration);
    }

    // --- Text Pop Effects ---

    showFloatingText(text, x, y, color = '#ffff00') {
        const gameMap = document.getElementById('game-map');
        if (!gameMap) return;

        const floater = document.createElement('div');
        floater.className = 'floating-text';
        floater.textContent = text;
        floater.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-weight: bold;
            font-size: 14px;
            pointer-events: none;
            z-index: 100;
            text-shadow: 0 0 5px ${color};
            animation: floatUp 1s ease-out forwards;
        `;

        gameMap.appendChild(floater);
        setTimeout(() => floater.remove(), 1000);
    }

    // Show damage number
    showDamage(amount, isPlayer = false) {
        const color = isPlayer ? '#ff0000' : '#ffff00';
        const prefix = isPlayer ? '-' : '';
        // Position near center of map
        const gameMap = document.getElementById('game-map');
        if (gameMap) {
            const rect = gameMap.getBoundingClientRect();
            const x = rect.width / 2 + (Math.random() - 0.5) * 50;
            const y = rect.height / 2 + (Math.random() - 0.5) * 30;
            this.showFloatingText(`${prefix}${amount}`, x, y, color);
        }
    }

    // Show money gain
    showMoneyGain(amount) {
        const gameMap = document.getElementById('game-map');
        if (gameMap) {
            const rect = gameMap.getBoundingClientRect();
            const x = rect.width / 2 + (Math.random() - 0.5) * 50;
            const y = rect.height / 2;
            this.showFloatingText(`+$${amount}`, x, y, '#ffd700');
        }
    }

    // --- Border Glow Effects ---

    setBorderGlow(color, intensity = 20) {
        if (!this.container) this.init();
        this.container.style.boxShadow = `0 0 ${intensity}px ${color}, inset 0 0 ${intensity/2}px ${color}`;
    }

    resetBorderGlow() {
        if (!this.container) this.init();
        this.container.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.3)';
    }

    // Danger glow when payment is due
    setDangerGlow() {
        this.setBorderGlow('rgba(255, 0, 0, 0.5)', 30);
    }

    // Victory glow
    setVictoryGlow() {
        this.setBorderGlow('rgba(0, 255, 0, 0.8)', 40);
    }
}

// Global instance
const effects = new EffectsSystem();
