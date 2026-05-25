let state = "START"; // START, PLAY, GAMEOVER, WIN
let papers = [];
let goldenPaper = null;
let startTime;
let lastPaperTime = 0;
let lastGoldenTime = 0;
let playerX = 400; // 基於虛擬寬度 800 的中間
let subjects = ["數學", "國文", "英文", "理化"];
let grades = ["A", "B", "C", "D", "F"];
let confetti = [];

// --- 核心：定義虛擬遊戲世界的固定尺寸 ---
const GAME_W = 800;
const GAME_H = 600;
let gameScale = 1; // 縮放比例
let offsetX = 0;   // 置中時的水平偏移量
let offsetY = 0;   // 置中時的垂直偏移量

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Arial');
  calculateScale();
  resetGame();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateScale(); // 視窗改變時重新計算縮放與置中位置
}

// 計算如何將 800x600 的畫面完美縮放並置中於全螢幕
function calculateScale() {
  let scaleX = windowWidth / GAME_W;
  let scaleY = windowHeight / GAME_H;
  
  // 為了不讓畫面變形，取小的縮放比例（等比例縮放）
  gameScale = min(scaleX, scaleY);
  
  // 計算黑邊（計算置中所需的偏移量）
  offsetX = (windowWidth - GAME_W * gameScale) / 2;
  offsetY = (windowHeight - GAME_H * gameScale) / 2;
}

function draw() {
  // 填滿外圍黑邊（或你可以換成其他背景顏色）
  background(15); 

  // --- 開始進入虛擬置中畫布的精神內幕 ---
  push();
  translate(offsetX, offsetY);
  scale(gameScale);
  
  // 限制繪圖區域只在 800x600 內（選用，可防止物件超出邊界）
  clip(() => {
    rect(0, 0, GAME_W, GAME_H);
  });

  // 繪製遊戲原本的背景
  if (state === "START") {
    drawStartScreen();
  } else if (state === "PLAY") {
    updateGame();
  } else if (state === "GAMEOVER") {
    drawGameOver();
  } else if (state === "WIN") {
    drawWinScreen();
  }
  
  pop();
  // --- 虛擬畫布結束 ---
}

function resetGame() {
  papers = [];
  goldenPaper = null;
  startTime = millis();
  lastPaperTime = millis();
  lastGoldenTime = millis();
  confetti = [];
  // 預備彩帶 (改以虛擬畫布尺寸為基準)
  for (let i = 0; i < 80; i++) {
    confetti.push({
      x: random(GAME_W),
      y: random(-GAME_H, 0),
      c: color(random(255), random(255), random(255)),
      speed: random(2, 5),
      r: random(TWO_PI)
    });
  }
}

function updateGame() {
  background(250);
  let elapsed = (millis() - startTime) / 1000;

  // 1. 火柴人移動 (滑鼠座標需要轉換回虛擬世界座標)
  let virtualMouseX = (mouseX - offsetX) / gameScale;
  playerX = lerp(playerX, virtualMouseX, 0.15);
  playerX = constrain(playerX, 30, GAME_W - 30);
  drawStickman(playerX, GAME_H - 60, "NORMAL");

  // 2. 難度控制
  let spawnInterval = max(150, 1000 - elapsed * 40); 
  if (millis() - lastPaperTime > spawnInterval) {
    let sub = random(subjects);
    let grd = random(grades);
    papers.push(new Paper(random(GAME_W), -50, sub, grd, 2 + elapsed * 0.15));
    lastPaperTime = millis();
  }

  // 3. 每 20 秒掉落畢業證書
  if (millis() - lastGoldenTime > 20000) {
    goldenPaper = new Paper(random(50, GAME_W - 50), -50, "畢業證書", "★", 3);
    goldenPaper.isGolden = true;
    lastGoldenTime = millis();
  }

  // 4. 更新普通考卷
  for (let i = papers.length - 1; i >= 0; i--) {
    papers[i].update();
    papers[i].display();
    if (papers[i].checkCollision(playerX, GAME_H - 60)) {
      state = "GAMEOVER";
    }
    if (papers[i].y > GAME_H + 50) papers.splice(i, 1);
  }

  // 5. 更新金色紙張
  if (goldenPaper) {
    goldenPaper.update();
    goldenPaper.display();
    if (goldenPaper.checkCollision(playerX, GAME_H - 60)) {
      state = "WIN";
    }
    if (goldenPaper.y > GAME_H + 50) goldenPaper = null;
  }

  // UI 資訊
  fill(100);
  noStroke();
  textAlign(LEFT);
  textSize(16);
  text("生存時間: " + elapsed.toFixed(1) + "s", 20, 35);
}

// --- 物件類別 ---
class Paper {
  constructor(x, y, subject, grade, speed) {
    this.x = x;
    this.y = y;
    this.subject = subject;
    this.grade = grade;
    this.speed = speed;
    this.angle = random(TWO_PI);
    this.rotSpeed = random(-0.05, 0.05);
    this.isGolden = false;
    this.w = 45;
    this.h = 60;
  }

  update() {
    this.y += this.speed;
    this.angle += this.rotSpeed;
    this.x += sin(frameCount * 0.02) * 1.5;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    
    if (this.isGolden) {
      fill(255, 223, 0);
      stroke(218, 165, 32);
      strokeWeight(2);
    } else {
      fill(255);
      stroke(0);
      strokeWeight(1);
    }
    rectMode(CENTER);
    rect(0, 0, this.w, this.h);
    
    noStroke();
    fill(this.isGolden ? 120 : 50);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(this.subject, 0, -12);
    
    textSize(20);
    fill(this.grade === "F" ? 'red' : (this.isGolden ? 'brown' : 'blue'));
    text(this.grade, 0, 12);
    pop();
  }

  checkCollision(px, py) {
    let d = dist(this.x, this.y, px, py - 20);
    return d < 40;
  }
}

// --- 介面繪製 (全部以固定 GAME_W, GAME_H 做相對定位) ---

function drawStartScreen() {
  background(220);
  textAlign(CENTER);
  fill(50);
  noStroke();
  textSize(48);
  text("學生生存戰", GAME_W/2, GAME_H/2 - 30);
  textSize(20);
  text("躲避考卷，接住 20秒 出現一次的畢業證書！", GAME_W/2, GAME_H/2 + 20);
  drawButton("START", GAME_W/2, GAME_H/2 + 100);
}

function drawGameOver() {
  background(100);
  
  // 繪製課桌椅
  stroke(50);
  strokeWeight(4);
  fill(139, 69, 19);
  rectMode(CENTER);
  rect(GAME_W/2 + 40, GAME_H/2 + 40, 80, 10); 
  line(GAME_W/2 + 10, GAME_H/2 + 45, GAME_W/2 + 10, GAME_H/2 + 80); 
  line(GAME_W/2 + 70, GAME_H/2 + 45, GAME_W/2 + 70, GAME_H/2 + 80);
  
  drawStickman(GAME_W/2 - 30, GAME_H/2 + 50, "CRY");
  
  textAlign(CENTER);
  fill(255, 50, 50);
  noStroke();
  textSize(48);
  text("落榜了...", GAME_W/2, GAME_H/2 - 80);
  drawButton("RETRY", GAME_W/2, GAME_H - 100);
}

function drawWinScreen() {
  background(255, 215, 0); 
  
  // 彩帶
  for (let c of confetti) {
    push();
    fill(c.c);
    noStroke();
    translate(c.x, c.y);
    rotate(c.r);
    rectMode(CENTER);
    rect(0, 0, 8, 4);
    pop();
    c.y += c.speed;
    c.r += 0.1;
    if (c.y > GAME_H) c.y = -20;
  }

  let jumpY = GAME_H/2 + 50 + sin(frameCount * 0.2) * 20;
  drawStickman(GAME_W/2, jumpY, "HAPPY");
  
  textAlign(CENTER);
  fill(139, 69, 19);
  noStroke();
  textSize(55);
  text("畢業快樂！", GAME_W/2, GAME_H/2 - 80);
  drawButton("RETRY", GAME_W/2, GAME_H - 100);
}

function drawStickman(x, y, mode) {
  push();
  translate(x, y);
  stroke(0);
  strokeWeight(3);
  noFill();
  
  if (mode === "HAPPY") {
    fill(0);
    rectMode(CENTER);
    rect(0, -52, 30, 5);
    quad(-20, -55, 20, -55, 10, -68, -10, -68);
    
    noFill();
    circle(0, -35, 25); 
    line(0, -22, 0, 5);  
    line(0, -15, -20, -35); 
    line(0, -15, 20, -35);
    line(0, 5, -15, 25); 
    line(0, 5, 15, 25);
  } else if (mode === "CRY") {
    circle(0, -35, 25); 
    line(0, -22, 0, 15);  
    line(0, -15, -15, 0);  
    line(0, -15, 15, 0);
    line(0, 15, -10, 35); 
    line(0, 15, 10, 35);
    
    push();
    fill(0, 150, 255);
    noStroke();
    ellipse(-5, -32, 4, 8); 
    ellipse(5, -32, 4, 8); 
    pop();
  } else {
    circle(0, -40, 30);
    line(0, -25, 0, 10);
    line(0, -15, -25, 0);
    line(0, -15, 25, 0);
    line(0, 10, -15, 30);
    line(0, 10, 15, 30);
  }
  pop();
}

function drawButton(txt, x, y) {
  push();
  rectMode(CENTER);
  
  // 滑鼠碰撞判定也轉換為虛擬世界座標
  let virtualMouseX = (mouseX - offsetX) / gameScale;
  let virtualMouseY = (mouseY - offsetY) / gameScale;
  
  let isHover = (virtualMouseX > x - 75 && virtualMouseX < x + 75 && 
                 virtualMouseY > y - 30 && virtualMouseY < y + 30);
  
  fill(isHover ? 200 : 255);
  stroke(0);
  strokeWeight(2);
  rect(x, y, 150, 60, 10); // 按鈕隨解析度提高稍微調大一點點
  
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(24);
  text(txt, x, y + 2);
  pop();
}

function mousePressed() {
  if (state !== "PLAY") {
    // 轉換點擊座標
    let virtualMouseX = (mouseX - offsetX) / gameScale;
    let virtualMouseY = (mouseY - offsetY) / gameScale;
    
    let btnX = GAME_W / 2;
    let btnY = (state === "START") ? (GAME_H / 2 + 100) : (GAME_H - 100);
    
    if (virtualMouseX > btnX - 75 && virtualMouseX < btnX + 75 && 
        virtualMouseY > btnY - 30 && virtualMouseY < btnY + 30) {
      resetGame();
      state = "PLAY";
    }
  }
}