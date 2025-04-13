// Основная конфигурация Phaser
const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 600,
  parent: 'game',
  dom: {
    createContainer: true
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

// Глобальные переменные
let clickCount = 0;
let cat;
let clickText;
let clickIcon;
let achievementsText;
let bonusActive = false;
let bonusMultiplier = 1;
let baseY = 300;
let currentCatIndex = 0;
let progressBarBg;
let progressBarFill;
let progressText;
let upgradeButtons = [];
let pointsPerClick = 1;
let autoClickerInterval = null;

// Пороговые значения смены котов и текстуры
const catChangeSteps = [10, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const catTextures = ['cat1', 'cat2'];

// Улучшения
const upgrades = [
  { name: 'Автоклик', cost: 100, effect: () => startAutoClicker(2), unlocked: false },
  { name: '+3 за клик', cost: 500, effect: () => { pointsPerClick += 3 }, unlocked: false },
  { name: '+10 за клик', cost: 2000, effect: () => { pointsPerClick += 10 }, unlocked: false },
];

function formatClicks(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function preload() {
  this.load.image('cat1', 'assets/cat1.jpg');
  this.load.image('cat2', 'assets/cat2.jpg');
  this.load.image('kisks', 'assets/kisks.png');
}

function create() {
  this.cameras.main.setBackgroundColor('#FFFBF1');

  cat = this.add.sprite(500, baseY, catTextures[currentCatIndex]);
  cat.setDisplaySize(220, 220);
  cat.setInteractive();

  let jumpTween = null;
  cat.on('pointerdown', () => {
    clickCount += pointsPerClick * bonusMultiplier;

    if (!jumpTween || !jumpTween.isPlaying()) {
      cat.y = baseY;
      jumpTween = this.tweens.add({
        targets: cat,
        y: baseY - 30,
        duration: 200,
        ease: 'Sine.easeInOut',
        yoyo: true
      });
    }

    checkCatChange();
    updateProgressBar();
    updateUpgrades();
  });

  // Счётчик кликов — размещаем на белом поле справа от упаковки
  clickIcon = this.add.image(20, 20, 'kisks').setOrigin(0).setScale(0.12);
  clickText = this.add.text(135, 85, '0', {
    fontSize: '22px',
    fill: '#5a2c81',
    fontFamily: 'Arial Black',
    align: 'center'
  }).setOrigin(0.5);

  achievementsText = this.add.text(20, 100, '', {
    fontSize: '24px',
    fill: '#ff6347',
    fontFamily: 'Arial'
  });

  this.add.text(750, 20, 'Бонус (x2)', {
    fontSize: '32px',
    fill: '#ff6347',
    fontFamily: 'Arial',
    backgroundColor: '#fff',
    padding: { x: 10, y: 5 }
  }).setInteractive().on('pointerdown', activateBonus);

  this.add.dom(500, 550).createFromHTML(`
    <input type="number" id="clickInput" value="0" style="font-size:24px;width:100px;height:40px;border-radius:5px;border:2px solid #ccc;padding-left:10px;">
  `);

  this.add.text(650, 550, 'Set Clicks', {
    fontSize: '24px',
    fill: '#32CD32',
    fontFamily: 'Arial'
  }).setInteractive().on('pointerdown', () => {
    let inputValue = document.getElementById('clickInput').value;
    clickCount = parseInt(inputValue, 10);
    checkCatChange();
    updateProgressBar();
    updateUpgrades();
  });

  progressBarBg = this.add.rectangle(150, 590, 700, 20, 0xcccccc).setOrigin(0, 0.5);
  progressBarFill = this.add.rectangle(150, 590, 0, 20, 0x800080).setOrigin(0, 0.5);
  progressText = this.add.text(150, 565, '', {
    fontSize: '20px',
    fill: '#333',
    fontFamily: 'Arial'
  });

  upgrades.forEach((upgrade, index) => {
    const btn = this.add.text(780, 100 + index * 70, `${upgrade.name}\n${upgrade.cost} кликов`, {
      fontSize: '20px',
      fill: '#000',
      backgroundColor: '#ccc',
      padding: { x: 10, y: 5 }
    }).setInteractive().on('pointerdown', () => {
      if (!upgrade.unlocked && clickCount >= upgrade.cost) {
        clickCount -= upgrade.cost;
        upgrade.unlocked = true;
        upgrade.effect();
        btn.setText(`${upgrade.name} ✓`);
        btn.setFill('#888');
      }
    });
    upgradeButtons.push(btn);
  });

  updateProgressBar();
  updateUpgrades();
}

function update() {
  clickText.setText(formatClicks(clickCount));

  if (clickCount >= 100 && achievementsText.text === '') {
    achievementsText.setText('Achievement: 100 кликов!');
  }
  if (clickCount >= 500 && achievementsText.text !== 'Achievement: 500 кликов!') {
    achievementsText.setText('Achievement: 500 кликов!');
  }
}

function activateBonus() {
  if (!bonusActive) {
    bonusMultiplier = 2;
    bonusActive = true;
    setTimeout(() => {
      bonusMultiplier = 1;
      bonusActive = false;
    }, 10000);
  }
}

function checkCatChange() {
  for (let i = catChangeSteps.length - 1; i >= 0; i--) {
    if (clickCount >= catChangeSteps[i]) {
      if (currentCatIndex !== i && catTextures[i]) {
        currentCatIndex = i;
        cat.setTexture(catTextures[i]);
      }
      break;
    }
  }
}

function updateProgressBar() {
  let level = 0;
  for (let i = 0; i < catChangeSteps.length; i++) {
    if (clickCount >= catChangeSteps[i]) {
      level = i;
    }
  }

  let min = level > 0 ? catChangeSteps[level] : 0;
  let max = catChangeSteps[level + 1] || min + 100;
  let progress = Phaser.Math.Clamp((clickCount - min) / (max - min), 0, 1);

  progressBarFill.width = 700 * progress;
  progressText.setText(`Уровень ${level + 1}: ${clickCount - min}/${max - min}`);
}

function updateUpgrades() {
  upgrades.forEach((upgrade, index) => {
    if (!upgrade.unlocked && clickCount >= upgrade.cost) {
      upgradeButtons[index].setBackgroundColor('#aaffaa');
    } else if (!upgrade.unlocked) {
      upgradeButtons[index].setBackgroundColor('#ccc');
    }
  });
}

function startAutoClicker(amount) {
  if (autoClickerInterval) clearInterval(autoClickerInterval);
  autoClickerInterval = setInterval(() => {
    clickCount += amount;
    updateProgressBar();
    updateUpgrades();
  }, 1000);
}