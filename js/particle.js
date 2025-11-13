// 粒子类 - 用于特效
class Particle {
    constructor(x, y, color, velocity, type = 'normal') {
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
        this.type = type; // normal, spark, glow, smoke
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.type === 'smoke') {
            this.velocity.y -= 0.1; // 烟雾上升
            this.velocity.x *= 0.98;
        } else {
            this.velocity.y += 0.2; // 重力
        }

        this.life -= this.decay;
        this.size *= 0.97;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'spark') {
            // 星火效果
            ctx.fillStyle = this.color;
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                ctx.lineTo(Math.cos(angle) * this.size, Math.sin(angle) * this.size);
            }
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'glow') {
            // 发光效果
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'smoke') {
            // 烟雾效果
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 普通粒子
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

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
        this.speed = 15;
        this.power = power;
        this.color = color;
        this.owner = owner;
        this.radius = 25;
        this.active = true;
        this.particles = [];
        this.trail = [];
        this.pulsePhase = 0;
        this.chargeTime = 0;
    }

    update(canvas) {
        if (!this.active) return;

        // 移动
        this.x += this.speed * this.direction;
        this.pulsePhase += 0.2;
        this.chargeTime++;

        // 边界检测
        if (this.x < -50 || this.x > canvas.width + 50) {
            this.active = false;
        }

        // 添加更多拖尾粒子
        for (let i = 0; i < 3; i++) {
            this.particles.push(new Particle(
                this.x + (Math.random() - 0.5) * this.radius,
                this.y + (Math.random() - 0.5) * this.radius,
                this.color,
                {
                    x: (Math.random() - 0.5) * 4 - this.speed * this.direction * 0.2,
                    y: (Math.random() - 0.5) * 4
                },
                Math.random() > 0.5 ? 'glow' : 'spark'
            ));
        }

        // 更新粒子
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });

        // 拖尾效果
        this.trail.push({ x: this.x, y: this.y, time: this.chargeTime });
        if (this.trail.length > 15) {
            this.trail.shift();
        }
    }

    draw(ctx) {
        if (!this.active) return;

        // 绘制拖尾光束
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = (i / this.trail.length) * 0.5;
            const size = this.radius * (0.5 + (i / this.trail.length) * 0.5);

            const gradient = ctx.createRadialGradient(
                this.trail[i].x, this.trail[i].y, 0,
                this.trail[i].x, this.trail[i].y, size
            );
            gradient.addColorStop(0, this.color.replace(')', ', 0.8)').replace('rgb', 'rgba'));
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.globalAlpha = alpha;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 绘制粒子
        this.particles.forEach(p => p.draw(ctx));

        // 绘制主能量球 - 多层效果
        const pulseSize = Math.sin(this.pulsePhase) * 5 + this.radius;

        // 外层光晕
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const outerGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, pulseSize * 1.5);
        outerGlow.addColorStop(0, this.color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 中层
        const midGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, pulseSize);
        midGradient.addColorStop(0, '#ffffff');
        midGradient.addColorStop(0.4, this.color);
        midGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = midGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // 核心白光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 能量环
        for (let i = 0; i < 3; i++) {
            const ringPhase = (this.pulsePhase + i * Math.PI * 2 / 3) % (Math.PI * 2);
            const ringAlpha = Math.sin(ringPhase) * 0.5 + 0.5;
            ctx.globalAlpha = ringAlpha * 0.6;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, pulseSize + i * 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
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

// 伤害数字类
class DamageNumber {
    constructor(x, y, damage, isCritical = false) {
        this.x = x;
        this.y = y;
        this.damage = Math.floor(damage);
        this.isCritical = isCritical;
        this.life = 1.0;
        this.velocityY = -3;
        this.scale = 1;
    }

    update() {
        this.y += this.velocityY;
        this.velocityY += 0.1;
        this.life -= 0.02;
        this.scale = 1 + (1 - this.life) * 0.5;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.font = `bold ${this.isCritical ? 40 : 30}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 描边
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.strokeText(this.damage, this.x, this.y);

        // 填充
        ctx.fillStyle = this.isCritical ? '#ff0000' : '#ffff00';
        ctx.fillText(this.damage, this.x, this.y);

        if (this.isCritical) {
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#ff6600';
            ctx.fillText('CRITICAL!', this.x, this.y - 30);
        }

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// 粒子管理器
class ParticleManager {
    constructor() {
        this.particles = [];
        this.energyBlasts = [];
        this.damageNumbers = [];
    }

    addParticles(x, y, count, color, type = 'normal') {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, null, type));
        }
    }

    addEnergyBlast(x, y, direction, power, color, owner) {
        this.energyBlasts.push(new EnergyBlast(x, y, direction, power, color, owner));
    }

    addDamageNumber(x, y, damage, isCritical = false) {
        this.damageNumbers.push(new DamageNumber(x, y, damage, isCritical));
    }

    // 添加爆炸特效
    addExplosion(x, y, color) {
        // 火花
        this.addParticles(x, y, 30, color, 'spark');
        // 光晕
        this.addParticles(x, y, 20, color, 'glow');
        // 烟雾
        this.addParticles(x, y, 15, 'rgba(100, 100, 100, 0.8)', 'smoke');
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

        // 更新伤害数字
        this.damageNumbers = this.damageNumbers.filter(dn => {
            dn.update();
            return !dn.isDead();
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
        this.energyBlasts.forEach(blast => blast.draw(ctx));
        this.damageNumbers.forEach(dn => dn.draw(ctx));
    }

    checkCollisions(fighter) {
        const hits = [];
        this.energyBlasts.forEach(blast => {
            if (blast.checkCollision(fighter)) {
                hits.push(blast);
                blast.active = false;
                // 添加爆炸效果
                this.addExplosion(blast.x, blast.y, blast.color);
            }
        });
        return hits;
    }

    clear() {
        this.particles = [];
        this.energyBlasts = [];
        this.damageNumbers = [];
    }
}
