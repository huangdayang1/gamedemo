// 输入控制系统
class InputManager {
    constructor() {
        this.keys = {};
        this.setupEventListeners();

        // 玩家1控制配置
        this.player1Keys = {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            attack: 'j',
            block: 'k',
            special: 'u'
        };

        // 玩家2控制配置
        this.player2Keys = {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            attack: '1',
            block: '2',
            special: '3'
        };
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.key] = true; // 保留原始大小写，用于方向键
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.key] = false;
        });
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }

    // 获取玩家1输入
    getPlayer1Input() {
        return {
            up: this.isKeyPressed(this.player1Keys.up),
            down: this.isKeyPressed(this.player1Keys.down),
            left: this.isKeyPressed(this.player1Keys.left),
            right: this.isKeyPressed(this.player1Keys.right),
            attack: this.isKeyPressed(this.player1Keys.attack),
            block: this.isKeyPressed(this.player1Keys.block),
            special: this.isKeyPressed(this.player1Keys.special)
        };
    }

    // 获取玩家2输入
    getPlayer2Input() {
        return {
            up: this.isKeyPressed(this.player2Keys.up),
            down: this.isKeyPressed(this.player2Keys.down),
            left: this.isKeyPressed(this.player2Keys.left),
            right: this.isKeyPressed(this.player2Keys.right),
            attack: this.isKeyPressed(this.player2Keys.attack),
            block: this.isKeyPressed(this.player2Keys.block),
            special: this.isKeyPressed(this.player2Keys.special)
        };
    }

    // 清空所有按键状态
    reset() {
        this.keys = {};
    }
}
