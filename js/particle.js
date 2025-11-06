// 粒子类 - 用于特效
class Particle {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity || {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
        };
        this.size = Math.random() * 5 + 2;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.2; // 重力
        this.life -= this.decay;
        this.size *= 0.97;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0 || this.size < 0.5;
    }
}

// 能量波类 - 必杀技弹道
class EnergyBlast {
    constructor(x, y, direction, power, color, owner) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 1 右, -1 左
        this.speed = 12;
        this.power = power;
        this.color = color;
        this.owner = owner;
        this.radius = 20;
        this.active = true;
        this.particles = [];
        this.trail = [];
    }

    update(canvas) {
        if (!this.active) return;

        // 移动
        this.x += this.speed * this.direction;

        // 边界检测
        if (this.x < -50 || this.x > canvas.width + 50) {
            this.active = false;
        }

        // 添加拖尾粒子
        if (Math.random() < 0.5) {
            this.particles.push(new Particle(
                this.x,
                this.y,
                this.color,
                {
                    x: (Math.random() - 0.5) * 3 - this.speed * this.direction * 0.3,
                    y: (Math.random() - 0.5) * 3
                }
            ));
        }

        // 更新粒子
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });

        // 拖尾效果
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) {
            this.trail.shift();
        }
    }

    draw(ctx) {
        if (!this.active) return;

        // 绘制拖尾
        ctx.save();
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = (i / this.trail.length) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 绘制能量球核心
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 外圈光晕
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 绘制粒子
        this.particles.forEach(p => p.draw(ctx));
    }

    // 碰撞检测
    checkCollision(fighter) {
        if (!this.active || fighter === this.owner) return false;

        const dx = this.x - (fighter.x + fighter.width / 2);
        const dy = this.y - (fighter.y + fighter.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < this.radius + fighter.width / 3;
    }
}

// 粒子管理器
class ParticleManager {
    constructor() {
        this.particles = [];
        this.energyBlasts = [];
    }

    addParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    addEnergyBlast(x, y, direction, power, color, owner) {
        this.energyBlasts.push(new EnergyBlast(x, y, direction, power, color, owner));
    }

    update(canvas) {
        // 更新粒子
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });

        // 更新能量波
        this.energyBlasts.forEach(blast => blast.update(canvas));
        this.energyBlasts = this.energyBlasts.filter(blast => blast.active);
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
        this.energyBlasts.forEach(blast => blast.draw(ctx));
    }

    checkCollisions(fighter) {
        const hits = [];
        this.energyBlasts.forEach(blast => {
            if (blast.checkCollision(fighter)) {
                hits.push(blast);
                blast.active = false;
                // 添加爆炸粒子
                this.addParticles(blast.x, blast.y, 30, blast.color);
            }
        });
        return hits;
    }

    clear() {
        this.particles = [];
        this.energyBlasts = [];
    }
}
