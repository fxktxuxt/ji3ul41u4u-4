let state = "START"; // START, PLAY, GAMEOVER, WIN
let papers = [];
let goldenPaper = null;
let startTime;
let lastPaperTime = 0;
let lastGoldenTime = 0;
let playerX = 300;
let subjects = ["數學", "國文", "英文", "理化"];
let grades = ["A", "B", "C", "D", "F"];
let confetti = [];

function setup() {
  createCanvas(600, 400);
  textFont('Arial');
  resetGame();
}

function draw() {
  if (state === "START") {
    drawStartScreen();
  } else if (state === "PLAY") {
    updateGame();
  } else if (state === "GAMEOVER") {
    drawGameOver();
  } else if (state === "WIN") {
    drawWinScreen();
  }
}

function resetGame() {
  papers = [];
  goldenPaper = null;
  startTime = millis();
  lastPaperTime = millis();
  lastGoldenTime = millis();
  confetti = [];
  // 預備彩帶
  for (let i = 0; i < 80; i++) {
    confetti.push({
      x: random(width),
      y: random(-height, 0),
      c: color(random(255), random(255), random(255)),
      speed: random(2, 5),
      r: random(TWO_PI)
    });
  }
}

function updateGame() {
  background(250);
  let elapsed = (millis() - startTime) / 1000;

  // 1. 火柴人移動 (限制在畫布內)
  playerX = lerp(playerX, mouseX, 0.15);
  playerX = constrain(playerX, 30, width - 30);
  drawStickman(playerX, height - 60, "NORMAL");

  // 2. 難度控制：考卷數量與速度隨時間增加
  let spawnInterval = max(150, 1000 - elapsed * 40); 
  if (millis() - lastPaperTime > spawnInterval) {
    let sub = random(subjects);
    let grd = random(grades);
    papers.push(new Paper(random(width), -50, sub, grd, 2 + elapsed * 0.15));
    lastPaperTime = millis();
  }

  // 3. 每 20 秒掉落金色紙張 (畢業證書)
  if (millis() - lastGoldenTime > 20000) {
    goldenPaper = new Paper(random(50, width-50), -50, "畢業證書", "★", 3);
    goldenPaper.isGolden = true;
    lastGoldenTime = millis();
  }

  // 4. 更新普通考卷
  for (let i = papers.length - 1; i >= 0; i--) {
    papers[i].update();
    papers[i].display();
    if (papers[i].checkCollision(playerX, height - 60)) {
      state = "GAMEOVER";
    }
    if (papers[i].y > height + 50) papers.splice(i, 1);
  }

  // 5. 更新金色紙張
  if (goldenPaper) {
    goldenPaper.update();
    goldenPaper.display();
    if (goldenPaper.checkCollision(playerX, height - 60)) {
      state = "WIN";
    }
    if (goldenPaper.y > height + 50) goldenPaper = null;
  }

  // UI 資訊
  fill(100);
  noStroke();
  textAlign(LEFT);
  textSize(14);
  text("生存時間: " + elapsed.toFixed(1) + "s", 20, 30);
}

// --- 物件類別 ---
class Paper {
  constructor(x, y, subject, grade, speed) {
    this.x = x;
    this.y = y;
    this.subject = subject;
    this.grade = grade;
    this.speed = speed;
    this.angle = random(TWO_PI); // 隨機旋轉角度
    this.rotSpeed = random(-0.05, 0.05);
    this.isGolden = false;
    this.w = 40;
    this.h = 55;
  }

  update() {
    this.y += this.speed;
    this.angle += this.rotSpeed;
    this.x += sin(frameCount * 0.02) * 1.5; // 隨機左右飄動
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    
    // 繪製紙張
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
    
    // 內容
    noStroke();
    fill(this.isGolden ? 120 : 50);
    textAlign(CENTER, CENTER);
    textSize(8);
    text(this.subject, 0, -10);
    
    // 成績
    textSize(18);
    fill(this.grade === "F" ? 'red' : (this.isGolden ? 'brown' : 'blue'));
    text(this.grade, 0, 10);
    pop();
  }

  checkCollision(px, py) {
    let d = dist(this.x, this.y, px, py - 20); // py-20 是大約身體中心
    return d < 35;
  }
}

// --- 介面繪製 ---

function drawStartScreen() {
  background(220);
  textAlign(CENTER);
  fill(50);
  textSize(40);
  text("學生生存戰", width/2, height/2 - 20);
  textSize(16);
  text("躲避考卷，接住 20秒 出現一次的畢業證書！", width/2, height/2 + 20);
  drawButton("START", width/2, height/2 + 70);
}

function drawGameOver() {
  background(100);
  
  // 繪製課桌椅
  stroke(50);
  strokeWeight(4);
  fill(139, 69, 19);
  rect(width/2 + 20, height/2 + 40, 100, 10); // 桌面
  line(width/2 - 10, height/2 + 40, width/2 - 10, height/2 + 80); // 桌腳
  line(width/2 + 50, height/2 + 40, width/2 + 50, height/2 + 80);
  
  // 流淚火柴人
  drawStickman(width/2 - 30, height/2 + 70, "CRY");
  
  textAlign(CENTER);
  fill(255, 50, 50);
  textSize(40);
  text("落榜了...", width/2, 100);
  drawButton("RETRY", width/2, height - 60);
}

function drawWinScreen() {
  background(255, 215, 0); // 金黃色背景
  
  // 彩帶
  for (let c of confetti) {
    push();
    fill(c.c);
    noStroke();
    translate(c.x, c.y);
    rotate(c.r);
    rect(0, 0, 8, 4);
    pop();
    c.y += c.speed;
    c.r += 0.1;
    if (c.y > height) c.y = -20;
  }

  // 跳躍火柴人
  let jumpY = height/2 + 80 + sin(frameCount * 0.2) * 40;
  drawStickman(width/2, jumpY, "HAPPY");
  
  textAlign(CENTER);
  fill(139, 69, 19);
  textSize(50);
  text("畢業快樂！", width/2, 120);
  drawButton("START", width/2, height - 60);
}

function drawStickman(x, y, mode) {
  push();
  translate(x, y);
  stroke(0);
  strokeWeight(3);
  noFill();
  
  if (mode === "HAPPY") {
    // 畢業帽
    fill(0);
    rect(0, -60, 40, 8);
    quad(-20, -60, 20, -60, 10, -75, -10, -75);
    // 身體動作
    line(0, -30, 0, 0);
    line(0, -25, -25, -50); // 手向上
    line(0, -25, 25, -50);
    line(0, 0, -15, 20); // 腳張開
    line(0, 0, 15, 20);
  } else if (mode === "CRY") {
    circle(0, -40, 25);
    line(0, -28, 0, 0);
    fill(0, 150, 255);
    noStroke();
    ellipse(-5, -35, 4, 8); ellipse(5, -35, 4, 8); // 眼淚
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
  let isHover = dist(mouseX, mouseY, x, y) < 40;
  fill(isHover ? 200 : 255);
  stroke(0);
  rect(x, y, 120, 50, 10);
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(20);
  text(txt, x, y + 2);
  pop();
}

function mousePressed() {
  if (state !== "PLAY") {
    // 簡單的按鈕範圍判定
    if (mouseX > width/2 - 60 && mouseX < width/2 + 60 && 
        mouseY > (state === "START" ? height/2 + 45 : height - 85) && 
        mouseY < (state === "START" ? height/2 + 95 : height - 35)) {
      resetGame();
      state = "PLAY";
    }
  }
}