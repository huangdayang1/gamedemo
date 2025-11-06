// 游戏主入口
let game = null;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    console.log('🐉 龙珠格斗游戏加载中...');

    // 创建游戏实例
    game = new DragonBallFighter('gameCanvas');

    // 开始按钮事件
    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        startButton.disabled = true;
        startButton.textContent = '游戏进行中...';
        game.start();
    });

    // 空格键也可以开始游戏
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && game.state === 'menu') {
            e.preventDefault();
            startButton.click();
        }
    });

    console.log('✅ 游戏初始化完成！');
    console.log('按下 "开始游戏" 按钮或空格键开始战斗！');
});

// 页面关闭前清理
window.addEventListener('beforeunload', () => {
    if (game) {
        game.stop();
    }
});
