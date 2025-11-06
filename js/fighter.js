// 格斗角色类
class Fighter {
    constructor(name, x, y, color, facing = 1) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 90;
        this.color = color;
        this.facing = facing; // 1 朝右, -1 朝左

        // 运动属性
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpPower = 15;
        this.gravity = 0.6;
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

        // 动画状态
        this.state = 'idle'; // idle, walk, jump, attack, block, hurt, special
        this.animationFrame = 0;
        this.animationTimer = 0;

        // 战斗效果
        this.hitStun = 0;
        this.invincible = 0;
    }

    // 更新角色状态
    update(groundY, canvas) {
        // 更新冷却时间
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.hitStun > 0) this.hitStun--;
        if (this.invincible > 0) this.invincible--;

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
            this.energy += 0.1;
        }

        // 更新动画
        this.updateAnimation();

        // 攻击状态自动结束
        if (this.isAttacking && this.attackCooldown === 0) {
            this.isAttacking = false;
        }
    }

    // 更新动画帧
    updateAnimation() {
        this.animationTimer++;
        if (this.animationTimer > 5) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }

    // 移动
    moveLeft() {
        if (this.hitStun > 0) return;
        this.velocityX = -this.speed;
        this.facing = -1;
        if (!this.isJumping && !this.isAttacking) this.state = 'walk';
    }

    moveRight() {
        if (this.hitStun > 0) return;
        this.velocityX = this.speed;
        this.facing = 1;
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
            this.attackCooldown = 30;
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
            this.specialCooldown = 60;
            this.state = 'special';
            return true;
        }
        return false;
    }

    // 受到伤害
    takeDamage(damage, isSpecial = false) {
        if (this.invincible > 0) return false;

        if (this.isBlocking && !isSpecial) {
            // 防御减伤
            damage *= 0.3;
            this.hitStun = 5;
        } else {
            this.hitStun = isSpecial ? 30 : 15;
            this.invincible = 10;
            // 击退效果
            this.velocityX = -this.facing * (isSpecial ? 8 : 4);
            this.velocityY = isSpecial ? -5 : -3;
        }

        this.health -= damage;
        if (this.health < 0) this.health = 0;
        this.state = 'hurt';

        return true;
    }

    // 获取攻击框
    getAttackBox() {
        if (!this.isAttacking) return null;

        return {
            x: this.x + (this.facing > 0 ? this.width : -40),
            y: this.y + 20,
            width: 40,
            height: 40
        };
    }

    // 获取碰撞框
    getHitBox() {
        return {
            x: this.x + 10,
            y: this.y + 10,
            width: this.width - 20,
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

        // 受伤闪烁效果
        if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // 绘制阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制身体
        const bodyColor = this.color;
        const skinColor = '#ffdbac';

        // 身体主体
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x + 15, this.y + 25, 30, 40);

        // 头部
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();

        // 头发（龙珠风格）
        ctx.fillStyle = this.name === '悟空' ? '#000' : '#2c1810';
        ctx.beginPath();
        if (this.name === '悟空') {
            // 悟空的刺猬头
            for (let i = 0; i < 5; i++) {
                const angle = -Math.PI / 2 + (i - 2) * 0.4;
                const x = this.x + 30 + Math.cos(angle) * 15;
                const y = this.y + 15 + Math.sin(angle) * 15;
                ctx.moveTo(this.x + 30, this.y + 15);
                ctx.lineTo(x - Math.sin(angle) * 8, y + Math.cos(angle) * 8);
            }
        } else {
            // 贝吉塔的火焰头
            ctx.moveTo(this.x + 30, this.y);
            ctx.lineTo(this.x + 35, this.y - 5);
            ctx.lineTo(this.x + 30, this.y + 5);
            ctx.lineTo(this.x + 25, this.y - 5);
        }
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 12, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 35, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();

        // 腿
        ctx.fillStyle = this.name === '悟空' ? '#1a3a8f' : '#fff';
        ctx.fillRect(this.x + 18, this.y + 65, 10, 25);
        ctx.fillRect(this.x + 32, this.y + 65, 10, 25);

        // 手臂
        ctx.fillStyle = skinColor;
        const armOffset = this.isAttacking ? 15 : 0;
        if (this.facing > 0) {
            ctx.fillRect(this.x + 10, this.y + 30, 10, 25);
            ctx.fillRect(this.x + 40 + armOffset, this.y + 30, 10, 25);
        } else {
            ctx.fillRect(this.x + 40, this.y + 30, 10, 25);
            ctx.fillRect(this.x + 10 - armOffset, this.y + 30, 10, 25);
        }

        // 防御姿态指示
        if (this.isBlocking) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 45, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 攻击框可视化（调试用）
        if (this.isAttacking) {
            const attackBox = this.getAttackBox();
            ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.fillRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);

            // 攻击特效
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(attackBox.x + attackBox.width / 2, attackBox.y + attackBox.height / 2, 20, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 必杀技蓄力特效
        if (this.state === 'special') {
            const gradient = ctx.createRadialGradient(
                this.x + this.width / 2,
                this.y + this.height / 2,
                0,
                this.x + this.width / 2,
                this.y + this.height / 2,
                60
            );
            gradient.addColorStop(0, this.name === '悟空' ? 'rgba(0, 150, 255, 0.5)' : 'rgba(255, 215, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x - 30, this.y - 30, this.width + 60, this.height + 60);
        }

        ctx.restore();

        // 绘制名字标签
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(this.name, this.x + this.width / 2, this.y - 10);
        ctx.fillText(this.name, this.x + this.width / 2, this.y - 10);
    }
}
