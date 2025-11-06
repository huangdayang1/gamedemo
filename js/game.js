// 游戏主引擎类
class DragonBallFighter {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 游戏状态
        this.state = 'menu'; // menu, playing, paused, gameOver
        this.groundY = this.canvas.height - 100;

        // 初始化系统
        this.inputManager = new InputManager();
        this.particleManager = new ParticleManager();

        // 创建玩家
        this.player1 = new Fighter('悟空', 100, this.groundY - 90, '#ff6600', 1);
        this.player2 = new Fighter('贝吉塔', this.canvas.width - 160, this.groundY - 90, '#0066ff', -1);

        // 游戏计时
        this.timer = 99;
        this.timerInterval = null;
        this.round = 1;

        // UI元素
        this.player1HealthBar = document.getElementById('player1Health');
        this.player2HealthBar = document.getElementById('player2Health');
        this.player1EnergyBar = document.getElementById('player1Energy');
        this.player2EnergyBar = document.getElementById('player2Energy');
        this.timerElement = document.getElementById('timer');
        this.gameMessage = document.getElementById('gameMessage');

        // 游戏循环
        this.lastTime = 0;
        this.animationId = null;
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 600;
        this.groundY = this.canvas.height - 100;
    }

    // 开始游戏
    start() {
        this.state = 'playing';
        this.timer = 99;
        this.round = 1;

        // 重置玩家
        this.player1 = new Fighter('悟空', 100, this.groundY - 90, '#ff6600', 1);
        this.player2 = new Fighter('贝吉塔', this.canvas.width - 160, this.groundY - 90, '#0066ff', -1);

        this.particleManager.clear();

        // 显示开始消息
        this.showMessage('FIGHT!', 2000);

        // 启动计时器
        this.startTimer();

        // 启动游戏循环
        if (!this.animationId) {
            this.gameLoop();
        }
    }

    // 游戏计时器
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.state === 'playing') {
                this.timer--;
                this.timerElement.textContent = this.timer;

                if (this.timer <= 0) {
                    this.endRound();
                }
            }
        }, 1000);
    }

    // 处理输入
    handleInput() {
        if (this.state !== 'playing') return;

        // 玩家1输入
        const p1Input = this.inputManager.getPlayer1Input();
        if (p1Input.left) this.player1.moveLeft();
        if (p1Input.right) this.player1.moveRight();
        if (p1Input.up) this.player1.jump();
        if (p1Input.attack) {
            if (this.player1.attack()) {
                this.particleManager.addParticles(
                    this.player1.x + this.player1.width / 2,
                    this.player1.y + 40,
                    5,
                    '#ff6600'
                );
            }
        }
        this.player1.block(p1Input.block);
        if (p1Input.special) {
            if (this.player1.special()) {
                // 发射龟派气功
                this.particleManager.addEnergyBlast(
                    this.player1.x + this.player1.width / 2,
                    this.player1.y + 40,
                    this.player1.facing,
                    20,
                    '#00aaff',
                    this.player1
                );
                this.particleManager.addParticles(
                    this.player1.x + this.player1.width / 2,
                    this.player1.y + 40,
                    20,
                    '#00aaff'
                );
            }
        }

        // 玩家2输入
        const p2Input = this.inputManager.getPlayer2Input();
        if (p2Input.left) this.player2.moveLeft();
        if (p2Input.right) this.player2.moveRight();
        if (p2Input.up) this.player2.jump();
        if (p2Input.attack) {
            if (this.player2.attack()) {
                this.particleManager.addParticles(
                    this.player2.x + this.player2.width / 2,
                    this.player2.y + 40,
                    5,
                    '#0066ff'
                );
            }
        }
        this.player2.block(p2Input.block);
        if (p2Input.special) {
            if (this.player2.special()) {
                // 发射终极闪光
                this.particleManager.addEnergyBlast(
                    this.player2.x + this.player2.width / 2,
                    this.player2.y + 40,
                    this.player2.facing,
                    20,
                    '#ffdd00',
                    this.player2
                );
                this.particleManager.addParticles(
                    this.player2.x + this.player2.width / 2,
                    this.player2.y + 40,
                    20,
                    '#ffdd00'
                );
            }
        }
    }

    // 更新游戏状态
    update() {
        if (this.state !== 'playing') return;

        // 更新玩家
        this.player1.update(this.groundY, this.canvas);
        this.player2.update(this.groundY, this.canvas);

        // 确保玩家朝向对方
        if (this.player1.x < this.player2.x) {
            this.player1.facing = 1;
            this.player2.facing = -1;
        } else {
            this.player1.facing = -1;
            this.player2.facing = 1;
        }

        // 碰撞检测 - 普通攻击
        const p1AttackBox = this.player1.getAttackBox();
        const p2AttackBox = this.player2.getAttackBox();

        if (p1AttackBox && this.player2.checkHit(p1AttackBox)) {
            if (this.player2.takeDamage(8)) {
                this.particleManager.addParticles(
                    this.player2.x + this.player2.width / 2,
                    this.player2.y + 30,
                    15,
                    '#ff0000'
                );
            }
        }

        if (p2AttackBox && this.player1.checkHit(p2AttackBox)) {
            if (this.player1.takeDamage(8)) {
                this.particleManager.addParticles(
                    this.player1.x + this.player1.width / 2,
                    this.player1.y + 30,
                    15,
                    '#ff0000'
                );
            }
        }

        // 碰撞检测 - 必杀技
        const p1Hits = this.particleManager.checkCollisions(this.player2);
        p1Hits.forEach(blast => {
            if (blast.owner === this.player1) {
                this.player2.takeDamage(20, true);
            }
        });

        const p2Hits = this.particleManager.checkCollisions(this.player1);
        p2Hits.forEach(blast => {
            if (blast.owner === this.player2) {
                this.player1.takeDamage(20, true);
            }
        });

        // 更新粒子系统
        this.particleManager.update(this.canvas);

        // 更新UI
        this.updateUI();

        // 检查胜负
        if (this.player1.health <= 0 || this.player2.health <= 0) {
            this.endRound();
        }
    }

    // 更新UI
    updateUI() {
        this.player1HealthBar.style.width = `${this.player1.health}%`;
        this.player2HealthBar.style.width = `${this.player2.health}%`;
        this.player1EnergyBar.style.width = `${this.player1.energy}%`;
        this.player2EnergyBar.style.width = `${this.player2.energy}%`;
    }

    // 渲染
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景
        this.drawBackground();

        // 绘制地面
        this.drawGround();

        // 绘制粒子效果（背景层）
        this.particleManager.draw(this.ctx);

        // 绘制玩家
        this.player1.draw(this.ctx);
        this.player2.draw(this.ctx);
    }

    // 绘制背景
    drawBackground() {
        // 天空渐变
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87ceeb');
        skyGradient.addColorStop(0.5, '#e0f6ff');
        skyGradient.addColorStop(1, '#90ee90');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);

        // 云朵
        this.drawClouds();

        // 远山
        this.ctx.fillStyle = '#6b8e23';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY - 50);
        this.ctx.lineTo(200, this.groundY - 150);
        this.ctx.lineTo(400, this.groundY - 80);
        this.ctx.lineTo(600, this.groundY - 120);
        this.ctx.lineTo(this.canvas.width, this.groundY - 50);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.lineTo(0, this.groundY);
        this.ctx.closePath();
        this.ctx.fill();
    }

    // 绘制云朵
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const clouds = [
            { x: 100, y: 80, size: 1 },
            { x: 400, y: 120, size: 1.2 },
            { x: 700, y: 60, size: 0.9 },
        ];

        clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, 30 * cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 25 * cloud.size, cloud.y, 35 * cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 50 * cloud.size, cloud.y, 30 * cloud.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // 绘制地面
    drawGround() {
        // 草地
        this.ctx.fillStyle = '#228b22';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        // 地面线条
        this.ctx.strokeStyle = '#1a6b1a';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.groundY);
            this.ctx.lineTo(i + 25, this.groundY + 20);
            this.ctx.stroke();
        }
    }

    // 显示消息
    showMessage(text, duration = 2000) {
        this.gameMessage.textContent = text;
        this.gameMessage.style.display = 'block';

        setTimeout(() => {
            this.gameMessage.style.display = 'none';
        }, duration);
    }

    // 结束回合
    endRound() {
        this.state = 'gameOver';
        clearInterval(this.timerInterval);

        let winner = '';
        if (this.player1.health > this.player2.health) {
            winner = '悟空 WINS!';
        } else if (this.player2.health > this.player1.health) {
            winner = '贝吉塔 WINS!';
        } else {
            winner = 'DRAW!';
        }

        this.showMessage(winner, 5000);

        // 5秒后可以重新开始
        setTimeout(() => {
            const startButton = document.getElementById('startButton');
            startButton.disabled = false;
            startButton.textContent = '再来一局 RESTART';
        }, 3000);
    }

    // 游戏主循环
    gameLoop(timestamp = 0) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // 处理输入
        this.handleInput();

        // 更新
        this.update();

        // 渲染
        this.render();

        // 继续循环
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    // 停止游戏
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
}
