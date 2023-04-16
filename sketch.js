var xWindow = 800;
var yWindow = 800;

let player;
let game;
let items = [];

let eatSound;
let hitSound;
let endSound;
let hintOne;
let hintTwo;

// Preloads the sounds effects and images for the game.
function preload() {
  eatSound = loadSound("sounds/eat_1.mp3");
  hitSound = loadSound("sounds/hit_1.mp3");
  endSound = loadSound("sounds/end_1.mp3");
  hintOne = loadImage("assets/hint_1.png");
  hintTwo = loadImage("assets/hint_2.png");
}

// Creates the gamewindow, gameengine, player, items, and timers.
function setup() {
  createCanvas(xWindow, yWindow);
  game = new GameEngine();
  player = new Player();
  items = [];
  for (let i=0; i<10; i++) {
    items.push(new Item());
  }
  setInterval(createItem, 1000, 0);
  setInterval(createItem, 25000, 1);
  setInterval(incMultiplier, 10000);
  setInterval(itemSpeedUp, 1000);
}

// Creates items only when the game is running.
function createItem(val) {
  if (game.getScene() == 1) {
    items.push(new Item(val));
  }
}

// Increments the score multiplier only when the game is running.
function incMultiplier() {
  if (game.getScene() == 1) {
    player.addMultiplier();
  }
}

// Increments the speed of each unedible item when the game is running.
function itemSpeedUp() {
  if (game.getScene() == 1) {
    for (i=0; i<items.length; i++) {
      if (!items[i].isFood() && items[i].getSpeed() < 6) {
        items[i].speedUp();
      }
    }
  }
}

// Draws each entity.
function draw() {
  background(20, 20, 20);

  switch (game.getScene()) {
    case 0:
      game.start();
      break;
    case 1:
      game.run();
      break;
    case 2:
      game.end();
      break;
    case 3:
      game.hint();
      break;
  }
}

// Main game class. Handles collisions, movements, and screens.
class GameEngine {
  constructor() {
    this.hintIteration = 0;
    this.endSound = 0;
    this.sceneNum = 0;
    this.startButton = createButton('Start Game')
      .mousePressed(() => this.setScene(1))
      .size(200, 60).hide().style('font-size', '20px');
    this.hintButton = createButton('How To Play')
      .mousePressed(() => this.setScene(3))
      .size(200, 60).hide().style('font-size', '20px');
    this.againButton = createButton('Play Again')
      .mousePressed(() => window.location.reload(1))
      .size(200, 60).hide().style('font-size', '20px');
  }

  start() {
    textSize(42);
    textAlign(CENTER);
    fill(255);
    textStyle(BOLD);
    text("Poly-gone", xWindow/2, yWindow/4);
    textSize(30);
    fill(150);
    text("Just Survive", xWindow/2, yWindow/4 + 50);
    this.startButton.show().position(windowWidth/2 - 100, yWindow/2);
    this.hintButton.show().position(windowWidth/2 - 100, yWindow/2 + 100);
  }

  run() {
    this.startButton.hide();
    this.againButton.hide();
    this.hintButton.hide();
    player.move();
    player.update();

    for (let i=0; i<items.length; i++) {
      items[i].type();
      items[i].update();

      if (items[i].isFood() && items[i].chkRemove()) {
        items.splice(i, 1);
      }
      else if (items[i].isFood() && items[i].isPowerup() == 0 && player.chkCollide(items[i])) {
        player.eat(items[i]);
        eatSound.play();
        items.splice(i, 1);
        createItem();
      }
      else if (!items[i].isFood() && player.chkCollide(items[i])) {
        if(player.collide()) {
          this.setScene(2);
        }
        player.resetMultiplier();
        hitSound.play();
        items.splice(i, 1);
      }
      else if (items[i].isPowerup() == 1 && player.chkCollide(items[i])) {
        items.splice(0, items.length);
        eatSound.play();
        for (i=0; i<2; i++) { player.addSide(); }
        for (i=0; i<10; i++) { createItem(0); }
      }
    }
    player.printScore();
    player.printMultiplier();
  }

  end() {
    textSize(42);
    textAlign(CENTER);
    fill(255,255,255);
    textStyle(BOLD);
    text("GAME OVER", xWindow/2, yWindow/4);
    textSize(32);
    textStyle(NORMAL);
    text("Your Score: " + player.getScore(), xWindow/2, yWindow/3);
    this.againButton.show().position(windowWidth/2 - 100, yWindow/2);
    if(this.endSound == 0) {
      endSound.play();
      this.endSound = 1;
    }
  }

  hint() {

    this.startButton.hide();
    this.hintButton.hide();
    switch (this.hintIteration) {
      case 0:
        image(hintOne, xWindow/2 - hintOne.width/2, yWindow/8);
        break;
      case 1:
        background(20);
        image(hintTwo, xWindow/2 - hintOne.width/2, yWindow/4);
        break;
      case 2:
        this.hintIteration = 0;
        this.setScene(0);
        break;
    }
  }

  hintIterate() {
    if (this.sceneNum == 3) {
      this.hintIteration += 1;
    }
  }

  getScene()  {
    return this.sceneNum;
  }

  setScene(value) {

    this.sceneNum = value;
  }
}

// The player class contains all the data for the player object.
class Player {
  constructor() {
    this.score = 0;
    this.size = 25;
    this.speed = 6;
    this.numSides = 7;
    this.x = xWindow/2;
    this.y = yWindow/2;
    this.col = '#32ffff';
    this.multiplier = 1;
  }

  eat(obj) {
    this.score += obj.getNumSides() * this.multiplier;
  }

  move() {
    if ((keyIsDown(87) || keyIsDown(38)) && this.y > this.size) {
      this.y -= this.speed;
    }
    if ((keyIsDown(65) || keyIsDown(37)) && this.x > this.size) {
      this.x -= this.speed;
    }
    if ((keyIsDown(83) || keyIsDown(40)) && this.y < yWindow - this.size) {
      this.y += this.speed;
    }
    if ((keyIsDown(68) || keyIsDown(39)) && this.x < xWindow - this.size) {
      this.x += this.speed;
    }
  }

  update() {
    polygon(player.x, player.y, player.size, player.numSides, player.col);
  }

  chkCollide(obj) {
    var objPos = obj.getPos();
    let d = int(dist(this.x, this.y, objPos[0], objPos[1]));

    if (d < (this.size * 2) - 4) {
      return true;
    }
  }

  collide() {
    if (this.numSides != 3) {
      this.numSides -= 1;
      return false;
    } else if (this.numSides == 3) {
      return true;
    }
  }

  getNumSides() {
    return this.numSides;
  }

  printScore() {
    textSize(32);
    textAlign(CENTER);
    fill(255, 255, 255);
    text(this.score, xWindow/2, 50);
  }

  printMultiplier() {
    textSize(32);
    text(this.multiplier + "x", xWindow - 50, 50);
  }

  getScore() {
    return this.score;
  }

  addSide() {
    if(this.numSides < 8) {
      this.numSides += 1;
    }
  }

  addMultiplier() {
    if (this.multiplier < 10) {
      this.multiplier += 1;
    }
  }

  resetMultiplier() {
    this.multiplier = 1;
  }
}

// The item class contains all the data for the item objects.
class Item {
  constructor(val=0) {
    this.pos = getSpawnPoint();
    this.size = 25;
    this.rate = random(2, 4);
    this.numSides = random([3,4,5,6,7,8,9]);
    this.food = true;
    this.col = '#FFFFFF';
    this.powerup = val;
  }

  getPos() {
    return this.pos.slice(0, 2);
  }

  getSize() {
   return this.size;
  }

  getNumSides() {
    return this.numSides;
  }

  type() {
    this.move();

    if (player.getNumSides() >= this.numSides) {
      this.food = true;
      this.col = '#FFFFFF';
    } else if (player.getNumSides() < this.numSides) {
      this.bounce();
      this.food = false;
      this.col = '#ff4040';
    }
    if (this.powerup == 1) {
      this.food = true;
      this.numSides = 20;
      this.rate = 6;
      this.col = '#00FF00';
    }
  }

  bounce() {
    if (this.pos[0] > xWindow || this.pos[0] < 0) this.pos[2] *= -1;
    else if (this.pos[1] > yWindow || this.pos[1] < 0) this.pos[3] *= -1;
  }

  move() {
    this.pos[0] += this.rate * this.pos[2];
    this.pos[1] += this.rate * this.pos[3];
  }

  update() {

    if (this.powerup == 1) {
      polygon(this.pos[0], this.pos[1], this.size, this.numSides, this.col);
    } else {
      polygon(this.pos[0], this.pos[1], this.size, this.numSides, this.col);
    }
  }

  chkRemove() {
    //if the item object goes off screen remove it and create new item
    if (this.pos[0] > xWindow || this.pos[0] < 0 || this.pos[1] > yWindow || this.pos[1] < 0) {
      return true;
    }
  }

  isFood() {
    return this.food;
  }

  isPowerup() {
    return this.powerup;
  }

  speedUp() {
    this.rate += 0.025;
  }

  getSpeed() {
    return this.rate;
  }
}

// Checks keypress for the hint menu navigation.
function keyPressed() {
  if (keyCode == 32) {
    game.hintIterate();
  }
}

// Returns a random spawn point for the item object.
function getSpawnPoint() {
  var x = 0;
  var y = 0;
  var xD = 0;
  var yD = 0;
  var rand = random([0,1]);
  switch(random([0,1])) {
    case 0:
      y = rand * yWindow;
      if (rand == 0) {
        yD = 1;
      } else {
        yD = -1;
      }
      x = int(random(0, xWindow));
      break;
    case 1:
      x = rand * xWindow;
      if (rand == 0) {
        xD = 1;
      } else {
        xD = -1;
      }
      y = int(random(0, yWindow));
      break;
  }
  return [x, y, xD, yD];
}

// Creates a polygon for the item and player classes.
function polygon(x, y, radius, sides, col) {
  let angle = TWO_PI / sides;
  fill(col);
  textStyle(NORMAL);
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius;
    let sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);

  fill(50, 50, 50);
  textSize(20);
  if (sides==20) {
    text('UP', x, y+8);
  } else {
    text(sides, x, y+8);
  }
}
