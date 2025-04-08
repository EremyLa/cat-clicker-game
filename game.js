const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 600,
  parent: 'game', // Указываем родительский элемент для игры
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
let clickCount = 0;
let cat;
let clickText;
let achievementsText;
let bonusActive = false;
let bonusMultiplier = 1;
let baseY = 300

function preload() {
  this.load.image('cat1', 'assets/cat1.jpg');  // Используем формат .jpg
  this.load.image('cat2', 'assets/cat2.jpg');
}

function create() {
  console.log("Game started!");

  // Устанавливаем фон игры
  this.cameras.main.setBackgroundColor('#FFFBF1');  // Светлый фон

  // Создаем спрайт кота
  cat = this.add.sprite(500, baseY, 'cat1');
  cat.setDisplaySize(220, 220); // уменьшаем размер до удобного
  cat.setInteractive();

  
  cat.on('pointerdown', () => {
    console.log("Cat clicked!");
    clickCount += bonusMultiplier;
  
    // Отменяем предыдущие анимации
    this.tweens.killTweensOf(cat);
  
    // Сброс позиции и размера
    cat.y = baseY;
    cat.setScale(1); // возвращаем обычный масштаб
  
    this.tweens.add({
      targets: cat,
      y: baseY - 50,        // подпрыгнуть вверх
      scaleX: 0.9,          // слегка сжаться по ширине
      scaleY: 1.1,          // и чуть вытянуться по высоте
      duration: 150,
      ease: 'Power1',
      yoyo: true,           // вернуться назад
      onComplete: () => {
        cat.setScale(1);    // вернуть масштаб на 100%
        console.log("Jump + squash/stretch complete");
      }
    });
  
    // Смена кота после 100 кликов
    if (clickCount >= 100) {
      clickCount = 0;
      cat.setTexture('cat2');
      console.log("Cat texture changed");
    }
  });

  // Текст с количеством кликов
  clickText = this.add.text(20, 20, 'Clicks: 0', { fontSize: '32px', fill: '#333', fontFamily: 'Arial' });

  // Текст для достижений
  achievementsText = this.add.text(20, 60, '', { fontSize: '24px', fill: '#ff6347', fontFamily: 'Arial' });

  // Кнопка для бонуса
  let bonusButton = this.add.text(750, 20, 'Bonus (x2)', {
    fontSize: '32px',
    fill: '#ff6347',
    fontFamily: 'Arial',
    backgroundColor: '#fff',
    padding: { x: 10, y: 5 }
  })
    .setInteractive()
    .on('pointerdown', activateBonus);

  // Добавление поля для ввода кликов для тестирования
  let inputBox = this.add.dom(500, 550).createFromHTML('<input type="number" id="clickInput" value="0" style="font-size:24px;width:100px;height:40px;border-radius:5px;border:2px solid #ccc;padding-left:10px;">');

  // Кнопка для установки количества кликов
  let setClicksButton = this.add.text(650, 550, 'Set Clicks', {
    fontSize: '24px',
    fill: '#32CD32',
    fontFamily: 'Arial'
  })
    .setInteractive()
    .on('pointerdown', () => {
      let inputValue = document.getElementById('clickInput').value;
      clickCount = parseInt(inputValue, 10);
    });
}

function update() {
  // Обновляем текст с количеством кликов
  clickText.setText('Clicks: ' + clickCount);

  // Обновляем текст с достижениями
  if (clickCount >= 100 && achievementsText.text === '') {
    achievementsText.setText('Achievement: 100 clicks!');
  }
  if (clickCount >= 500 && achievementsText.text !== 'Achievement: 500 clicks!') {
    achievementsText.setText('Achievement: 500 clicks!');
  }
}

// Функция для активации бонуса
function activateBonus() {
  if (!bonusActive) {
    bonusMultiplier = 2;
    bonusActive = true;
    setTimeout(() => {
      bonusMultiplier = 1;  // сбросить бонус через 10 секунд
      bonusActive = false;
    }, 10000);  // бонус активен 10 секунд
  }
}
