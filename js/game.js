// 游戏主引擎类 - 增强版
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
        this.player1 = new Fighter('悟空', 100, this.groundY - 100, '#ff6600', 1);
        this.player2 = new Fighter('贝吉塔', this.canvas.width - 170, this.groundY - 100, '#0066ff', -1);

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

        // 特效系统
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.slowMotion = { active: false, duration: 0, factor: 1.0 };
        this.flash = { active: false, alpha: 0 };

        // 游戏循环
        this.lastTime = 0;
        this.animationId = null;
        this.frameCount = 0;
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
        this.player1 = new Fighter('悟空', 100, this.groundY - 100, '#ff6600', 1);
        this.player2 = new Fighter('贝吉塔', this.canvas.width - 170, this.groundY - 100, '#0066ff', -1);

        this.particleManager.clear();

        // 显示开始消息
        this.showMessage('FIGHT!', 2000);
        this.addScreenShake(10, 20);

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

                if (this.timer <= 10) {
                    this.timerElement.style.color = '#ff0000';
                }

                if (this.timer <= 0) {
                    this.endRound();
                }
            }
        }, 1000);
    }

    // 添加屏幕震动
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }

    // 更新屏幕震动
    updateScreenShake() {
        if (this.screenShake.duration > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.duration--;
            this.screenShake.intensity *= 0.9;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }
    }

    // 触发慢动作
    triggerSlowMotion(duration = 30, factor = 0.3) {
        this.slowMotion.active = true;
        this.slowMotion.duration = duration;
        this.slowMotion.factor = factor;
    }

    // 更新慢动作
    updateSlowMotion() {
        if (this.slowMotion.active) {
            this.slowMotion.duration--;
            if (this.slowMotion.duration <= 0) {
                this.slowMotion.active = false;
                this.slowMotion.factor = 1.0;
            }
        } else {
            this.slowMotion.factor = 1.0;
        }
    }

    // 触发闪白效果
    triggerFlash(intensity = 0.8) {
        this.flash.active = true;
        this.flash.alpha = intensity;
    }

    // 更新闪白效果
    updateFlash() {
        if (this.flash.active) {
            this.flash.alpha -= 0.05;
            if (this.flash.alpha <= 0) {
                this.flash.active = false;
            }
        }
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
                    8,
                    '#ff6600',
                    'spark'
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
                    25,
                    '#00aaff',
                    this.player1
                );
                this.addScreenShake(15, 25);
                this.triggerSlowMotion(20, 0.5);
                this.particleManager.addExplosion(
                    this.player1.x + this.player1.width / 2,
                    this.player1.y + 40,
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
                    8,
                    '#0066ff',
                    'spark'
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
                    25,
                    '#ffdd00',
                    this.player2
                );
                this.addScreenShake(15, 25);
                this.triggerSlowMotion(20, 0.5);
                this.particleManager.addExplosion(
                    this.player2.x + this.player2.width / 2,
                    this.player2.y + 40,
                    '#ffdd00'
                );
            }
        }
    }

    // 更新游戏状态
    update() {
        if (this.state !== 'playing') return;

        // 应用慢动作（更新次数减少）
        const updateCount = this.slowMotion.active ?
            (Math.random() < this.slowMotion.factor ? 1 : 0) : 1;

        for (let i = 0; i < updateCount; i++) {
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
                const result = this.player2.takeDamage(10);
                if (result && result.hit) {
                    this.player1.addCombo();
                    this.particleManager.addExplosion(
                        this.player2.x + this.player2.width / 2,
                        this.player2.y + 40,
                        result.isCritical ? '#ff0000' : '#ffaa00'
                    );
                    this.particleManager.addDamageNumber(
                        this.player2.x + this.player2.width / 2,
                        this.player2.y + 20,
                        result.damage,
                        result.isCritical
                    );
                    this.addScreenShake(result.isCritical ? 8 : 4, result.isCritical ? 15 : 8);
                    if (result.isCritical) {
                        this.triggerSlowMotion(15, 0.4);
                        this.triggerFlash(0.6);
                    }
                }
            }

            if (p2AttackBox && this.player1.checkHit(p2AttackBox)) {
                const result = this.player1.takeDamage(10);
                if (result && result.hit) {
                    this.player2.addCombo();
                    this.particleManager.addExplosion(
                        this.player1.x + this.player1.width / 2,
                        this.player1.y + 40,
                        result.isCritical ? '#ff0000' : '#ffaa00'
                    );
                    this.particleManager.addDamageNumber(
                        this.player1.x + this.player1.width / 2,
                        this.player1.y + 20,
                        result.damage,
                        result.isCritical
                    );
                    this.addScreenShake(result.isCritical ? 8 : 4, result.isCritical ? 15 : 8);
                    if (result.isCritical) {
                        this.triggerSlowMotion(15, 0.4);
                        this.triggerFlash(0.6);
                    }
                }
            }

            // 碰撞检测 - 必杀技
            const p1Hits = this.particleManager.checkCollisions(this.player2);
            p1Hits.forEach(blast => {
                if (blast.owner === this.player1) {
                    const result = this.player2.takeDamage(25, true);
                    if (result && result.hit) {
                        this.particleManager.addDamageNumber(
                            this.player2.x + this.player2.width / 2,
                            this.player2.y + 20,
                            result.damage,
                            true
                        );
                        this.addScreenShake(20, 30);
                        this.triggerSlowMotion(25, 0.2);
                        this.triggerFlash(0.9);
                    }
                }
            });

            const p2Hits = this.particleManager.checkCollisions(this.player1);
            p2Hits.forEach(blast => {
                if (blast.owner === this.player2) {
                    const result = this.player1.takeDamage(25, true);
                    if (result && result.hit) {
                        this.particleManager.addDamageNumber(
                            this.player1.x + this.player1.width / 2,
                            this.player1.y + 20,
                            result.damage,
                            true
                        );
                        this.addScreenShake(20, 30);
                        this.triggerSlowMotion(25, 0.2);
                        this.triggerFlash(0.9);
                    }
                }
            });
        }

        // 更新特效系统（不受慢动作影响）
        this.particleManager.update(this.canvas);
        this.updateScreenShake();
        this.updateSlowMotion();
        this.updateFlash();

        // 更新UI
        this.updateUI();

        // 检查胜负
        if (this.player1.health <= 0 || this.player2.health <= 0) {
            this.endRound();
        }
    }

    // 更新UI
    updateUI() {
        // 血条颜色渐变
        const p1HealthPercent = this.player1.health / this.player1.maxHealth;
        const p2HealthPercent = this.player2.health / this.player2.maxHealth;

        this.player1HealthBar.style.width = `${this.player1.health}%`;
        this.player2HealthBar.style.width = `${this.player2.health}%`;

        // 血量低于30%时血条变红
        if (p1HealthPercent < 0.3) {
            this.player1HealthBar.style.background = 'linear-gradient(to right, #ff0000, #ff3333)';
        } else {
            this.player1HealthBar.style.background = 'linear-gradient(to right, #ff0000, #ff6b00, #ffd700)';
        }

        if (p2HealthPercent < 0.3) {
            this.player2HealthBar.style.background = 'linear-gradient(to right, #ff0000, #ff3333)';
        } else {
            this.player2HealthBar.style.background = 'linear-gradient(to right, #ff0000, #ff6b00, #ffd700)';
        }

        this.player1EnergyBar.style.width = `${this.player1.energy}%`;
        this.player2EnergyBar.style.width = `${this.player2.energy}%`;
    }

    // 渲染
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 应用屏幕震动
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);

        // 绘制背景
        this.drawBackground();

        // 绘制地面
        this.drawGround();

        // 绘制粒子效果（背景层）
        this.particleManager.draw(this.ctx);

        // 绘制玩家
        this.player1.draw(this.ctx);
        this.player2.draw(this.ctx);

        this.ctx.restore();

        // 绘制闪白效果（不受震动影响）
        if (this.flash.active) {
            this.ctx.save();
            this.ctx.globalAlpha = this.flash.alpha;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        // 绘制慢动作指示
        if (this.slowMotion.active) {
            this.drawSlowMotionIndicator();
        }

        this.frameCount++;
    }

    // 绘制背景
    drawBackground() {
        // 天空渐变
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#1a5fb4');
        skyGradient.addColorStop(0.5, '#62a0ea');
        skyGradient.addColorStop(0.8, '#f6d32d');
        skyGradient.addColorStop(1, '#ff7800');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);

        // 太阳
        const time = this.frameCount * 0.01;
        const sunGradient = this.ctx.createRadialGradient(
            this.canvas.width - 100, 80, 20,
            this.canvas.width - 100, 80, 60
        );
        sunGradient.addColorStop(0, '#ffffff');
        sunGradient.addColorStop(0.5, '#ffff00');
        sunGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
        this.ctx.fillStyle = sunGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 100, 80, 60, 0, Math.PI * 2);
        this.ctx.fill();

        // 动态云朵
        this.drawClouds();

        // 远山
        this.ctx.fillStyle = '#2e7d32';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY - 50);
        for (let i = 0; i < this.canvas.width; i += 50) {
            const height = Math.sin(i * 0.01 + time) * 30 + 100;
            this.ctx.lineTo(i, this.groundY - height);
        }
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.lineTo(0, this.groundY);
        this.ctx.closePath();
        this.ctx.fill();
    }

    // 绘制云朵
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const clouds = [
            { x: (this.frameCount * 0.2) % (this.canvas.width + 200) - 100, y: 80, size: 1 },
            { x: (this.frameCount * 0.15) % (this.canvas.width + 250) - 150, y: 120, size: 1.3 },
            { x: (this.frameCount * 0.1) % (this.canvas.width + 300) - 200, y: 60, size: 0.9 },
        ];

        clouds.forEach(cloud => {
            this.ctx.save();
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, 30 * cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 25 * cloud.size, cloud.y, 35 * cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + 50 * cloud.size, cloud.y, 30 * cloud.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    // 绘制地面
    drawGround() {
        // 草地渐变
        const groundGradient = this.ctx.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#4caf50');
        groundGradient.addColorStop(1, '#2e7d32');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        // 地面纹理
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.groundY);
            this.ctx.lineTo(i + 20, this.groundY + 15);
            this.ctx.stroke();
        }

        // 地面阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, 10);
    }

    // 绘制慢动作指示
    drawSlowMotionIndicator() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SLOW MOTION', this.canvas.width / 2, 50);

        // 进度条
        const barWidth = 200;
        const barHeight = 10;
        const progress = this.slowMotion.duration / 30;
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.fillRect(this.canvas.width / 2 - barWidth / 2, 60, barWidth, barHeight);
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(this.canvas.width / 2 - barWidth / 2, 60, barWidth * progress, barHeight);

        this.ctx.restore();
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
            winner = '🏆 悟空 WINS! 🏆';
        } else if (this.player2.health > this.player1.health) {
            winner = '🏆 贝吉塔 WINS! 🏆';
        } else {
            winner = 'DRAW!';
        }

        this.showMessage(winner, 5000);
        this.addScreenShake(15, 40);
        this.triggerFlash(1.0);

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
