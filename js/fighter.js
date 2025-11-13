// 格斗角色类 - 增强版
class Fighter {
    constructor(name, x, y, color, facing = 1) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = 70;
        this.height = 100;
        this.color = color;
        this.facing = facing; // 1 朝右, -1 朝左

        // 运动属性
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 6;
        this.jumpPower = 16;
        this.gravity = 0.7;
        this.isJumping = false;

        // 战斗属性
        this.health = 100;
        this.maxHealth = 100;
        this.energy = 0;
        this.maxEnergy = 100;
        this.isBlocking = false;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.specialCooldown = 0;
        this.combo = 0;
        this.comboTimer = 0;

        // 动画状态
        this.state = 'idle'; // idle, walk, jump, attack, block, hurt, special
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 5;

        // 战斗效果
        this.hitStun = 0;
        this.invincible = 0;
        this.chargeEffect = 0;

        // 视觉特效
        this.aura = [];
        this.afterImages = [];
    }

    // 更新角色状态
    update(groundY, canvas) {
        // 更新冷却时间
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.hitStun > 0) this.hitStun--;
        if (this.invincible > 0) this.invincible--;
        if (this.chargeEffect > 0) this.chargeEffect--;
        if (this.comboTimer > 0) this.comboTimer--;
        else this.combo = 0;

        // 如果被击中硬直，不能移动
        if (this.hitStun > 0) {
            this.velocityX *= 0.8;
        }

        // 应用重力
        this.velocityY += this.gravity;

        // 更新位置
        this.x += this.velocityX;
        this.y += this.velocityY;

        // 边界检测
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        // 地面检测
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        } else {
            this.isJumping = true;
        }

        // 应用摩擦力
        this.velocityX *= 0.85;

        // 能量恢复
        if (this.energy < this.maxEnergy) {
            this.energy += 0.15;
        }

        // 更新动画
        this.updateAnimation();

        // 攻击状态自动结束
        if (this.isAttacking && this.attackCooldown === 0) {
            this.isAttacking = false;
        }

        // 更新气场特效
        if (this.energy > 80 || this.chargeEffect > 0) {
            this.updateAura();
        }

        // 更新残影
        this.updateAfterImages();
    }

    // 更新动画帧
    updateAnimation() {
        this.animationTimer++;
        if (this.animationTimer > this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 8;
            this.animationTimer = 0;
        }
    }

    // 更新气场
    updateAura() {
        if (Math.random() < 0.3) {
            this.aura.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                size: Math.random() * 10 + 5,
                life: 1.0,
                velocityY: -1 - Math.random() * 2
            });
        }

        this.aura = this.aura.filter(a => {
            a.y += a.velocityY;
            a.life -= 0.05;
            a.size *= 0.95;
            return a.life > 0;
        });
    }

    // 更新残影
    updateAfterImages() {
        if (Math.abs(this.velocityX) > 4 || this.isAttacking) {
            this.afterImages.push({
                x: this.x,
                y: this.y,
                facing: this.facing,
                life: 0.5,
                state: this.state
            });
        }

        if (this.afterImages.length > 3) {
            this.afterImages.shift();
        }

        this.afterImages = this.afterImages.filter(img => {
            img.life -= 0.05;
            return img.life > 0;
        });
    }

    // 移动
    moveLeft() {
        if (this.hitStun > 0) return;
        this.velocityX = -this.speed;
        if (!this.isJumping && !this.isAttacking) this.state = 'walk';
    }

    moveRight() {
        if (this.hitStun > 0) return;
        this.velocityX = this.speed;
        if (!this.isJumping && !this.isAttacking) this.state = 'walk';
    }

    // 跳跃
    jump() {
        if (!this.isJumping && this.hitStun === 0) {
            this.velocityY = -this.jumpPower;
            this.isJumping = true;
            this.state = 'jump';
        }
    }

    // 攻击
    attack() {
        if (this.attackCooldown === 0 && !this.isBlocking && this.hitStun === 0) {
            this.isAttacking = true;
            this.attackCooldown = 25;
            this.state = 'attack';
            this.energy = Math.min(this.energy + 5, this.maxEnergy);
            return true;
        }
        return false;
    }

    // 防御
    block(isBlocking) {
        if (this.hitStun === 0) {
            this.isBlocking = isBlocking;
            if (isBlocking && !this.isJumping) {
                this.state = 'block';
            }
        }
    }

    // 必杀技
    special() {
        if (this.energy >= 50 && this.specialCooldown === 0 && this.hitStun === 0) {
            this.energy -= 50;
            this.specialCooldown = 90;
            this.state = 'special';
            this.chargeEffect = 30;
            return true;
        }
        return false;
    }

    // 受到伤害
    takeDamage(damage, isSpecial = false) {
        if (this.invincible > 0) return false;

        let actualDamage = damage;
        const isCritical = Math.random() < 0.15; // 15%暴击率

        if (isCritical) {
            actualDamage *= 1.5;
        }

        if (this.isBlocking && !isSpecial) {
            // 防御减伤
            actualDamage *= 0.25;
            this.hitStun = 5;
        } else {
            this.hitStun = isSpecial ? 40 : 20;
            this.invincible = 15;
            // 击退效果
            this.velocityX = -this.facing * (isSpecial ? 10 : 5);
            this.velocityY = isSpecial ? -6 : -4;
            this.combo = 0; // 被击中时重置连击
        }

        this.health -= actualDamage;
        if (this.health < 0) this.health = 0;
        this.state = 'hurt';

        return {hit: true, damage: actualDamage, isCritical: isCritical};
    }

    // 增加连击
    addCombo() {
        this.combo++;
        this.comboTimer = 120; // 2秒内不连击则重置
    }

    // 获取攻击框
    getAttackBox() {
        if (!this.isAttacking) return null;

        const reach = 50;
        return {
            x: this.x + (this.facing > 0 ? this.width : -reach),
            y: this.y + 25,
            width: reach,
            height: 50
        };
    }

    // 获取碰撞框
    getHitBox() {
        return {
            x: this.x + 15,
            y: this.y + 10,
            width: this.width - 30,
            height: this.height - 10
        };
    }

    // 检测碰撞
    checkHit(otherBox) {
        const box = this.getHitBox();
        return (
            box.x < otherBox.x + otherBox.width &&
            box.x + box.width > otherBox.x &&
            box.y < otherBox.y + otherBox.height &&
            box.y + box.height > otherBox.y
        );
    }

    // 绘制角色
    draw(ctx) {
        ctx.save();

        // 绘制残影
        this.afterImages.forEach(img => {
            ctx.save();
            ctx.globalAlpha = img.life * 0.3;
            this.drawCharacter(ctx, img.x, img.y, img.facing);
            ctx.restore();
        });

        // 受伤闪烁效果
        if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // 绘制气场
        if (this.energy > 80 || this.chargeEffect > 0) {
            this.drawAura(ctx);
        }

        // 绘制角色本体
        this.drawCharacter(ctx, this.x, this.y, this.facing);

        ctx.restore();

        // 绘制防御指示
        if (this.isBlocking) {
            this.drawBlockEffect(ctx);
        }

        // 绘制连击数
        if (this.combo > 1) {
            this.drawCombo(ctx);
        }

        // 绘制必杀技蓄力特效
        if (this.state === 'special' && this.chargeEffect > 20) {
            this.drawChargeEffect(ctx);
        }
    }

    // 绘制气场
    drawAura(ctx) {
        ctx.save();
        this.aura.forEach(a => {
            const gradient = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size);
            const auraColor = this.name === '悟空' ? 'rgba(0, 150, 255' : 'rgba(255, 215, 0';
            gradient.addColorStop(0, auraColor + ', ' + a.life + ')');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // 绘制角色主体
    drawCharacter(ctx, x, y, facing) {
        // 绘制阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height, 35, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        const bodyColor = this.color;
        const skinColor = '#ffdbac';
        const animOffset = Math.sin(this.animationFrame * 0.5) * 2;

        // 身体主体
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(x + 20, y + 30, 30, 45, 5);
        ctx.fill();

        // 头部
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(x + 35, y + 18, 18, 0, Math.PI * 2);
        ctx.fill();

        // 头发（更精细）
        ctx.fillStyle = this.name === '悟空' ? '#000' : '#2c1810';
        ctx.beginPath();
        if (this.name === '悟空') {
            // 悟空的超级赛亚人预备头发
            const spikes = [
                {angle: -1.5, length: 18, width: 10},
                {angle: -1.2, length: 20, width: 12},
                {angle: -0.9, length: 18, width: 10},
                {angle: -0.6, length: 16, width: 8},
                {angle: -0.3, length: 14, width: 8}
            ];
            spikes.forEach(spike => {
                const baseX = x + 35;
                const baseY = y + 18;
                const tipX = baseX + Math.cos(spike.angle) * spike.length;
                const tipY = baseY + Math.sin(spike.angle) * spike.length;

                ctx.beginPath();
                ctx.moveTo(baseX - spike.width/2, baseY);
                ctx.lineTo(tipX, tipY);
                ctx.lineTo(baseX + spike.width/2, baseY);
                ctx.closePath();
                ctx.fill();
            });
        } else {
            // 贝吉塔的火焰头发
            ctx.moveTo(x + 35, y);
            ctx.lineTo(x + 42, y - 8);
            ctx.lineTo(x + 38, y + 5);
            ctx.lineTo(x + 45, y - 5);
            ctx.lineTo(x + 40, y + 8);
            ctx.lineTo(x + 35, y);
            ctx.moveTo(x + 35, y);
            ctx.lineTo(x + 28, y - 8);
            ctx.lineTo(x + 32, y + 5);
            ctx.lineTo(x + 25, y - 5);
            ctx.lineTo(x + 30, y + 8);
            ctx.closePath();
            ctx.fill();
        }

        // 眼睛（更有神）
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x + 30, y + 16, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 40, y + 16, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        const eyeX = facing > 0 ? 1 : -1;
        ctx.beginPath();
        ctx.arc(x + 30 + eyeX, y + 17, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 40 + eyeX, y + 17, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴
        if (this.state === 'attack' || this.state === 'special') {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + 35, y + 23, 5, 0, Math.PI);
            ctx.stroke();
        }

        // 腿部
        const legColor = this.name === '悟空' ? '#1a3a8f' : '#fff';
        ctx.fillStyle = legColor;
        const legOffset = this.state === 'walk' ? animOffset : 0;
        ctx.fillRect(x + 22, y + 75 + legOffset, 12, 25);
        ctx.fillRect(x + 36, y + 75 - legOffset, 12, 25);

        // 鞋子
        ctx.fillStyle = this.name === '悟空' ? '#ff6600' : '#1a3a8f';
        ctx.fillRect(x + 20, y + 95, 14, 5);
        ctx.fillRect(x + 36, y + 95, 14, 5);

        // 手臂
        ctx.fillStyle = skinColor;
        const armOffset = this.isAttacking ? 20 : (this.state === 'walk' ? animOffset * 2 : 0);

        // 后手臂
        ctx.fillRect(x + (facing > 0 ? 12 : 46), y + 35 - animOffset, 12, 30);

        // 前手臂（攻击时伸出）
        const frontArmX = facing > 0 ? 46 + armOffset : 12 - armOffset;
        ctx.fillRect(x + frontArmX, y + 35 + animOffset, 12, 30);

        // 手套
        ctx.fillStyle = this.name === '悟空' ? '#ff6600' : '#fff';
        if (this.isAttacking) {
            ctx.fillRect(x + (facing > 0 ? 58 + armOffset : 0 - armOffset), y + 60, 10, 8);
        }

        // 腰带
        ctx.fillStyle = this.name === '悟空' ? '#1a3a8f' : '#ffd700';
        ctx.fillRect(x + 20, y + 72, 30, 5);
    }

    // 绘制防御特效
    drawBlockEffect(ctx) {
        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.7;

        // 六边形护盾
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = 50;
        const sides = 6;

        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
            const px = centerX + Math.cos(angle) * radius;
            const py = centerY + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // 光晕
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#00ffff';
        ctx.fill();

        ctx.restore();
    }

    // 绘制连击数
    drawCombo(ctx) {
        ctx.save();
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#ff6600';

        const comboX = this.x + this.width / 2;
        const comboY = this.y - 20;

        ctx.strokeText(`${this.combo} COMBO!`, comboX, comboY);
        ctx.fillText(`${this.combo} COMBO!`, comboX, comboY);
        ctx.restore();
    }

    // 绘制必杀技蓄力特效
    drawChargeEffect(ctx) {
        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const time = Date.now() * 0.01;

        // 旋转能量环
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(time + i * Math.PI * 2 / 3);
            ctx.strokeStyle = this.name === '悟空' ? '#00aaff' : '#ffdd00';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, 60 + i * 15, 0, Math.PI);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}

// 辅助函数：绘制圆角矩形
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0);
        this.lineTo(x + width, y + height - radius);
        this.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
        this.lineTo(x + radius, y + height);
        this.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
        this.lineTo(x, y + radius);
        this.arc(x + radius, y + radius, radius, Math.PI, -Math.PI / 2);
        return this;
    };
}
