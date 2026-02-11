// High Score and Statistics Tracking with localStorage

class HighScores {
    constructor() {
        this.storageKey = 'alimonyAdventure_scores';
        this.statsKey = 'alimonyAdventure_stats';
        this.maxScores = 10;
    }

    // Get all high scores
    getScores() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    // Add a new score
    addScore(scoreData) {
        const scores = this.getScores();

        const entry = {
            yearsWorked: scoreData.yearsWorked || 0,
            childFinalAge: scoreData.childFinalAge || 5,
            totalEarned: scoreData.totalEarned || 0,
            totalAlimonyPaid: scoreData.totalAlimonyPaid || 0,
            victory: scoreData.victory || false,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        scores.push(entry);

        // Sort by: victory first, then years worked, then money earned
        scores.sort((a, b) => {
            if (a.victory !== b.victory) return b.victory - a.victory;
            if (a.childFinalAge !== b.childFinalAge) return b.childFinalAge - a.childFinalAge;
            return b.totalEarned - a.totalEarned;
        });

        // Keep only top scores
        const topScores = scores.slice(0, this.maxScores);

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(topScores));
        } catch (e) {
            console.warn('Could not save high scores');
        }

        // Return rank (1-indexed, or 0 if not in top scores)
        const rank = topScores.findIndex(s => s.timestamp === entry.timestamp);
        return rank >= 0 ? rank + 1 : 0;
    }

    // Check if score qualifies for high scores
    isHighScore(scoreData) {
        const scores = this.getScores();
        if (scores.length < this.maxScores) return true;

        const lowestScore = scores[scores.length - 1];

        // Victory always qualifies
        if (scoreData.victory && !lowestScore.victory) return true;

        // Compare child age
        if (scoreData.childFinalAge > lowestScore.childFinalAge) return true;

        // Compare earnings if same age
        if (scoreData.childFinalAge === lowestScore.childFinalAge) {
            return scoreData.totalEarned > lowestScore.totalEarned;
        }

        return false;
    }

    // Clear all scores
    clearScores() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.warn('Could not clear high scores');
        }
    }

    // --- Lifetime Statistics ---

    getStats() {
        try {
            const data = localStorage.getItem(this.statsKey);
            return data ? JSON.parse(data) : this.getDefaultStats();
        } catch (e) {
            return this.getDefaultStats();
        }
    }

    getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            totalMoneyEarned: 0,
            totalAlimonyPaid: 0,
            totalExpenses: 0,
            totalEnemiesDefeated: 0,
            totalShiftsWorked: 0,
            longestRun: 0,
            fastestVictory: null,
            firstPlayed: null,
            lastPlayed: null
        };
    }

    updateStats(gameData) {
        const stats = this.getStats();

        stats.gamesPlayed++;
        if (gameData.victory) stats.gamesWon++;

        stats.totalMoneyEarned += gameData.totalEarned || 0;
        stats.totalAlimonyPaid += gameData.totalAlimonyPaid || 0;
        stats.totalExpenses += gameData.totalExpenses || 0;
        stats.totalEnemiesDefeated += gameData.enemiesKilled || 0;
        stats.totalShiftsWorked += gameData.floorsExplored || 0;

        const yearsWorked = gameData.yearsWorked || 0;
        if (yearsWorked > stats.longestRun) {
            stats.longestRun = yearsWorked;
        }

        if (gameData.victory) {
            if (stats.fastestVictory === null || yearsWorked < stats.fastestVictory) {
                stats.fastestVictory = yearsWorked;
            }
        }

        if (!stats.firstPlayed) {
            stats.firstPlayed = new Date().toISOString();
        }
        stats.lastPlayed = new Date().toISOString();

        try {
            localStorage.setItem(this.statsKey, JSON.stringify(stats));
        } catch (e) {
            console.warn('Could not save stats');
        }

        return stats;
    }

    clearStats() {
        try {
            localStorage.removeItem(this.statsKey);
        } catch (e) {
            console.warn('Could not clear stats');
        }
    }

    // Format for display
    formatScoreEntry(entry, rank) {
        const victoryMark = entry.victory ? '[WIN]' : '[---]';
        const date = new Date(entry.date).toLocaleDateString();
        return `${rank}. ${victoryMark} Age ${entry.childFinalAge} | ${formatMoney(entry.totalEarned)} | ${date}`;
    }

    getScoresHTML() {
        const scores = this.getScores();

        if (scores.length === 0) {
            return '<p class="no-scores">No high scores yet. Get to work!</p>';
        }

        let html = '<div class="high-scores-list">';
        scores.forEach((entry, index) => {
            const victoryClass = entry.victory ? 'victory-score' : '';
            html += `<div class="score-entry ${victoryClass}">
                <span class="score-rank">${index + 1}.</span>
                <span class="score-status">${entry.victory ? 'WIN' : '...'}</span>
                <span class="score-age">Age ${entry.childFinalAge}</span>
                <span class="score-money">${formatMoney(entry.totalEarned)}</span>
            </div>`;
        });
        html += '</div>';

        return html;
    }

    getStatsHTML() {
        const stats = this.getStats();

        const winRate = stats.gamesPlayed > 0
            ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
            : 0;

        return `
            <div class="lifetime-stats">
                <div class="stat-row">
                    <span>Games Played:</span>
                    <span class="stat-value">${stats.gamesPlayed}</span>
                </div>
                <div class="stat-row">
                    <span>Victories:</span>
                    <span class="stat-value">${stats.gamesWon} (${winRate}%)</span>
                </div>
                <div class="stat-row">
                    <span>Total Earned:</span>
                    <span class="stat-value">${formatMoney(stats.totalMoneyEarned)}</span>
                </div>
                <div class="stat-row">
                    <span>Total Alimony Paid:</span>
                    <span class="stat-value">${formatMoney(stats.totalAlimonyPaid)}</span>
                </div>
                <div class="stat-row">
                    <span>Enemies Defeated:</span>
                    <span class="stat-value">${stats.totalEnemiesDefeated}</span>
                </div>
                <div class="stat-row">
                    <span>Shifts Worked:</span>
                    <span class="stat-value">${stats.totalShiftsWorked}</span>
                </div>
                <div class="stat-row">
                    <span>Longest Run:</span>
                    <span class="stat-value">${stats.longestRun} years</span>
                </div>
                ${stats.fastestVictory !== null ? `
                <div class="stat-row">
                    <span>Fastest Victory:</span>
                    <span class="stat-value">${stats.fastestVictory} years</span>
                </div>
                ` : ''}
            </div>
        `;
    }
}

// Global instance
const highScores = new HighScores();
