// Grid Agent Game - Pac-Man Style Game

class GridAgent {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game settings
        this.cellSize = 24;
        this.cols = 27;
        this.rows = 27;
        
        // Set canvas size
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.anomaliesCollected = 0;
        this.gameRunning = false;
        this.gameOver = false;
        
        // Player
        this.player = {
            x: 13,
            y: 19,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            color: '#00ff00',
            mouthAngle: 0,
            mouthOpen: true
        };
        
        // Anomalies (enemies that can be collected)
        this.anomalies = [];
        this.anomalyCount = 6;
        
        // Points
        this.points = [];
        this.totalPoints = 0;
        
        // Grid map (0 = path, 1 = wall)
        this.grid = [];
        
        // Timing
        this.lastTime = 0;
        this.moveTimer = 0;
        this.moveInterval = 100; // Player move speed (ms) - faster
        this.anomalyMoveTimer = 0;
        this.anomalyMoveInterval = 180; // Anomaly move speed (ms)
        
        // UI Elements
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.anomaliesElement = document.getElementById('anomalies');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        
        // Initialize
        this.generateMaze();
        this.spawnPoints();
        this.spawnAnomalies();
        this.setupControls();
        this.draw();
    }
    
    // Generate a maze-like grid
    generateMaze() {
        // Start with all walls
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(1));
        
        // Create a larger pac-man style maze layout (27x27)
        const mazeTemplate = [
            "111111111111111111111111111",
            "100000000001010000000000001",
            "101111011101010111011111101",
            "101000010000000000010000101",
            "101011010111111110101101101",
            "100010010100000010101001001",
            "111110110101111010101011011",
            "000000000101000010100000000",
            "111110110101011010101110111",
            "100010010100010010101000001",
            "101010010111010111101011101",
            "101010000000010000000010101",
            "101011111101010111111010101",
            "000000000000000000000000000",
            "101011111101010111111010101",
            "101010000000010000000010101",
            "101010010111010111101011101",
            "100010010100010010101000001",
            "111110110101011010101110111",
            "000000000101000010100000000",
            "111110110101111010101011011",
            "100010010100000010101001001",
            "101011010111111110101101101",
            "101000010000000000010000101",
            "101111011101010111011111101",
            "100000000001010000000000001",
            "111111111111111111111111111"
        ];
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = mazeTemplate[y][x] === '1' ? 1 : 0;
            }
        }
    }
    
    // Spawn collectible points on all walkable tiles
    spawnPoints() {
        this.points = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === 0) {
                    // Don't spawn on player start position
                    if (!(x === this.player.x && y === this.player.y)) {
                        this.points.push({ x, y, collected: false });
                    }
                }
            }
        }
        this.totalPoints = this.points.length;
    }
    
    // Spawn anomalies (collectible moving targets)
    spawnAnomalies() {
        this.anomalies = [];
        const colors = ['#ff00ff', '#ff6600', '#00ffff', '#ffff00', '#ff3366', '#66ff33'];
        const spawnPositions = [
            { x: 1, y: 1 },
            { x: this.cols - 2, y: 1 },
            { x: 1, y: this.rows - 2 },
            { x: this.cols - 2, y: this.rows - 2 },
            { x: Math.floor(this.cols / 2), y: 1 },
            { x: Math.floor(this.cols / 2), y: this.rows - 2 },
            { x: 1, y: Math.floor(this.rows / 2) },
            { x: this.cols - 2, y: Math.floor(this.rows / 2) }
        ];
        
        for (let i = 0; i < this.anomalyCount + Math.floor(this.level / 2); i++) {
            const pos = spawnPositions[i % spawnPositions.length];
            this.anomalies.push({
                x: pos.x,
                y: pos.y,
                direction: { x: 0, y: 0 },
                color: colors[i % colors.length],
                moveCounter: 0
            });
        }
    }
    
    // Setup keyboard controls
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
                
                if (!this.gameRunning && !this.gameOver) {
                    this.startGame();
                    if (e.code !== 'Space') {
                        this.setDirection(e.code);
                    }
                    return;
                }
                
                if (this.gameOver && e.code === 'Space') {
                    this.resetGame();
                    return;
                }
                
                this.setDirection(e.code);
            }
        });
    }
    
    setDirection(keyCode) {
        switch (keyCode) {
            case 'ArrowUp':
            case 'KeyW':
                this.player.nextDirection = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.player.nextDirection = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.player.nextDirection = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.player.nextDirection = { x: 1, y: 0 };
                break;
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.overlay.classList.add('hidden');
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.anomaliesCollected = 0;
        this.gameOver = false;
        this.gameRunning = false;
        
        this.player.x = 13;
        this.player.y = 19;
        this.player.direction = { x: 0, y: 0 };
        this.player.nextDirection = { x: 0, y: 0 };
        
        this.anomalyCount = 6;
        this.generateMaze();
        this.spawnPoints();
        this.spawnAnomalies();
        
        this.updateUI();
        
        this.overlayTitle.textContent = 'GRID AGENT';
        this.overlayMessage.textContent = 'Press SPACE or any Arrow Key to Start';
        this.overlay.classList.remove('hidden');
        
        this.draw();
    }
    
    nextLevel() {
        this.level++;
        this.player.x = 13;
        this.player.y = 19;
        this.player.direction = { x: 0, y: 0 };
        this.player.nextDirection = { x: 0, y: 0 };
        
        this.moveInterval = Math.max(60, 100 - (this.level - 1) * 8);
        this.anomalyMoveInterval = Math.max(80, 180 - (this.level - 1) * 15);
        
        this.generateMaze();
        this.spawnPoints();
        this.spawnAnomalies();
        
        this.updateUI();
        
        // Brief pause for level transition
        this.gameRunning = false;
        this.overlayTitle.textContent = `LEVEL ${this.level}`;
        this.overlayMessage.textContent = 'Get Ready!';
        this.overlay.classList.remove('hidden');
        
        setTimeout(() => {
            this.overlay.classList.add('hidden');
            this.gameRunning = true;
        }, 1500);
    }
    
    gameLoop(currentTime) {
        if (!this.gameRunning) {
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update player movement
        this.moveTimer += deltaTime;
        if (this.moveTimer >= this.moveInterval) {
            this.movePlayer();
            this.moveTimer = 0;
        }
        
        // Update anomaly movement
        this.anomalyMoveTimer += deltaTime;
        if (this.anomalyMoveTimer >= this.anomalyMoveInterval) {
            this.moveAnomalies();
            this.anomalyMoveTimer = 0;
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Animate player mouth
        this.player.mouthAngle += 0.3;
        
        // Draw everything
        this.draw();
        
        // Check win condition - progress when all anomalies are caught
        if (this.anomalies.length === 0) {
            this.nextLevel();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    movePlayer() {
        // Try to change to next direction if possible
        const nextX = this.player.x + this.player.nextDirection.x;
        const nextY = this.player.y + this.player.nextDirection.y;
        
        if (this.canMoveTo(nextX, nextY)) {
            this.player.direction = { ...this.player.nextDirection };
        }
        
        // Move in current direction
        const newX = this.player.x + this.player.direction.x;
        const newY = this.player.y + this.player.direction.y;
        
        if (this.canMoveTo(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            
            // Handle wrapping (tunnel effect)
            if (this.player.x < 0) this.player.x = this.cols - 1;
            if (this.player.x >= this.cols) this.player.x = 0;
            if (this.player.y < 0) this.player.y = this.rows - 1;
            if (this.player.y >= this.rows) this.player.y = 0;
        }
    }
    
    moveAnomalies() {
        for (const anomaly of this.anomalies) {
            anomaly.moveCounter++;
            
            // Change direction periodically or when hitting a wall
            const possibleDirections = this.getValidDirections(anomaly.x, anomaly.y);
            
            if (possibleDirections.length > 0) {
                // Occasionally chase the player
                if (Math.random() < 0.3) {
                    // Move towards player
                    const dx = this.player.x - anomaly.x;
                    const dy = this.player.y - anomaly.y;
                    
                    const preferred = [];
                    if (dx > 0 && possibleDirections.some(d => d.x === 1)) preferred.push({ x: 1, y: 0 });
                    if (dx < 0 && possibleDirections.some(d => d.x === -1)) preferred.push({ x: -1, y: 0 });
                    if (dy > 0 && possibleDirections.some(d => d.y === 1)) preferred.push({ x: 0, y: 1 });
                    if (dy < 0 && possibleDirections.some(d => d.y === -1)) preferred.push({ x: 0, y: -1 });
                    
                    if (preferred.length > 0) {
                        anomaly.direction = preferred[Math.floor(Math.random() * preferred.length)];
                    }
                } else if (anomaly.moveCounter % 5 === 0 || !this.canMoveTo(anomaly.x + anomaly.direction.x, anomaly.y + anomaly.direction.y)) {
                    // Random direction change
                    anomaly.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                }
                
                const newX = anomaly.x + anomaly.direction.x;
                const newY = anomaly.y + anomaly.direction.y;
                
                if (this.canMoveTo(newX, newY)) {
                    anomaly.x = newX;
                    anomaly.y = newY;
                }
            }
        }
    }
    
    getValidDirections(x, y) {
        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];
        
        return directions.filter(d => this.canMoveTo(x + d.x, y + d.y));
    }
    
    canMoveTo(x, y) {
        // Handle wrapping
        if (x < 0 || x >= this.cols) return true; // Allow tunnel
        if (y < 0 || y >= this.rows) return false;
        
        return this.grid[y][x] === 0;
    }
    
    checkCollisions() {
        // Check point collection
        for (const point of this.points) {
            if (!point.collected && point.x === this.player.x && point.y === this.player.y) {
                point.collected = true;
                this.score += 10;
                this.updateUI();
            }
        }
        
        // Check anomaly collection
        for (let i = this.anomalies.length - 1; i >= 0; i--) {
            const anomaly = this.anomalies[i];
            if (anomaly.x === this.player.x && anomaly.y === this.player.y) {
                this.anomalies.splice(i, 1);
                this.score += 100;
                this.anomaliesCollected++;
                this.updateUI();
                this.pulseUI('anomalies');
            }
        }
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.anomaliesElement.textContent = this.anomaliesCollected;
    }
    
    pulseUI(elementId) {
        const element = document.getElementById(elementId);
        element.classList.remove('pulse');
        void element.offsetWidth; // Trigger reflow
        element.classList.add('pulse');
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw points
        this.drawPoints();
        
        // Draw anomalies
        this.drawAnomalies();
        
        // Draw player
        this.drawPlayer();
    }
    
    drawGrid() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === 1) {
                    // Draw wall
                    const px = x * this.cellSize;
                    const py = y * this.cellSize;
                    
                    // Glowing cyan wall fill
                    const gradient = this.ctx.createLinearGradient(px, py, px + this.cellSize, py + this.cellSize);
                    gradient.addColorStop(0, '#004466');
                    gradient.addColorStop(0.5, '#006688');
                    gradient.addColorStop(1, '#004466');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
                    
                    // Glowing cyan border
                    this.ctx.strokeStyle = '#00ffff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(px + 0.5, py + 0.5, this.cellSize - 1, this.cellSize - 1);
                    
                    // Inner glow effect
                    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
                }
            }
        }
    }
    
    drawPoints() {
        for (const point of this.points) {
            if (!point.collected) {
                const px = point.x * this.cellSize + this.cellSize / 2;
                const py = point.y * this.cellSize + this.cellSize / 2;
                
                // Glowing dot
                this.ctx.beginPath();
                this.ctx.arc(px, py, 3, 0, Math.PI * 2);
                this.ctx.fillStyle = '#ffffffff';
                this.ctx.fill();
                
                // Glow effect
                this.ctx.beginPath();
                this.ctx.arc(px, py, 5, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
                this.ctx.fill();
            }
        }
    }
    
    drawAnomalies() {
        const time = performance.now() / 200;
        
        for (const anomaly of this.anomalies) {
            const px = anomaly.x * this.cellSize + this.cellSize / 2;
            const py = anomaly.y * this.cellSize + this.cellSize / 2;
            const size = this.cellSize / 2 - 2;
            
            // Pulsing effect
            const pulseSize = size + Math.sin(time) * 2;
            
            // Glow
            this.ctx.beginPath();
            this.ctx.arc(px, py, pulseSize + 4, 0, Math.PI * 2);
            this.ctx.fillStyle = anomaly.color.replace(')', ', 0.3)').replace('rgb', 'rgba').replace('#', 'rgba(');
            this.ctx.fillStyle = `rgba(${this.hexToRgb(anomaly.color)}, 0.3)`;
            this.ctx.fill();
            
            // Main body (diamond shape)
            this.ctx.save();
            this.ctx.translate(px, py);
            this.ctx.rotate(time * 0.5);
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, -pulseSize);
            this.ctx.lineTo(pulseSize, 0);
            this.ctx.lineTo(0, pulseSize);
            this.ctx.lineTo(-pulseSize, 0);
            this.ctx.closePath();
            
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, anomaly.color);
            gradient.addColorStop(1, anomaly.color);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result 
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '255, 255, 255';
    }
    
    drawPlayer() {
        const px = this.player.x * this.cellSize + this.cellSize / 2;
        const py = this.player.y * this.cellSize + this.cellSize / 2;
        const baseSize = this.cellSize / 2 - 2;
        
        // Slow pulsing animation
        const time = performance.now() / 1000; // Convert to seconds for slower pulse
        const pulseAmount = Math.sin(time * 2) * 2; // Slow pulse (2 cycles per second)
        const size = baseSize + pulseAmount;
        
        // Outer glow (pulsing)
        const glowSize = size + 6 + Math.sin(time * 2) * 2;
        this.ctx.beginPath();
        this.ctx.arc(px, py, glowSize, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(0, 255, 0, ${0.15 + Math.sin(time * 2) * 0.1})`;
        this.ctx.fill();
        
        // Middle glow
        this.ctx.beginPath();
        this.ctx.arc(px, py, size + 3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.fill();
        
        // Main circle body
        this.ctx.beginPath();
        this.ctx.arc(px, py, size, 0, Math.PI * 2);
        
        const gradient = this.ctx.createRadialGradient(px - 2, py - 2, 0, px, py, size);
        gradient.addColorStop(0, '#aaffaa');
        gradient.addColorStop(0.4, '#44ff44');
        gradient.addColorStop(0.8, '#00dd00');
        gradient.addColorStop(1, '#00aa00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = `rgba(0, 255, 0, ${0.8 + Math.sin(time * 2) * 0.2})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Inner highlight (gives depth)
        this.ctx.beginPath();
        this.ctx.arc(px - size * 0.3, py - size * 0.3, size * 0.25, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fill();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GridAgent();
});
