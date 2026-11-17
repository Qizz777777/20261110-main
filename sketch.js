let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖

// 背景圖片陣列與相關變數
let bgImages = []; // 儲存 background/1.png 到 4.png
let totalBgs = 4; // 總共有四張背景圖片
let bgX = 0; // 記錄背景目前的總位移量

let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

function preload() { // 在畫布建立前載入角色與四張背景圖片
  characterSprite = loadImage("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadImage("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadImage("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖

  // 依序載入四張背景圖片（1.png, 2.png, 3.png, 4.png）
  bgImages[0] = loadImage("background/1.png");
  bgImages[1] = loadImage("background/2.png");
  bgImages[2] = loadImage("background/3.png");
  bgImages[3] = loadImage("background/4.png");
} // 結束圖片載入函式

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓角色座標代表影格的中心點
  characterX = width / 2; // 將角色初始位置設在畫面正中央
  frameRate(60); // 將動畫更新速率設定為每秒六十格
} // 結束初始化函式

function draw() { // 每個畫面更新一次背景與角色
  // 1. 計算背景高度貼齊視窗，並以第一張圖的比例計算標準背景寬度
  const bgHeight = height;
  const bgWidth = bgImages[0].width * (height / bgImages[0].height);
  
  // 總共有 4 張圖，總寬度為 bgWidth * 4
  const totalBgWidth = bgWidth * totalBgs;
  
  // 移動速度
  const movementStep = constrain(width * 0.004, 2, 8); 

  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵
  isWalking = movingRight || movingLeft; 

  // 2. 邊緣捲動與邊界限制邏輯
  if (movingRight) {
    isWalking = true;
    facingDirection = 1;
    
    // 背景向左捲動的極限範圍：從 0 捲到 -(總寬度 - 畫面寬度)
    let minBgX = -(totalBgWidth - width); 
    
    // 如果背景還沒到最右邊界，背景往左跑，角色留在原地
    if (bgX > minBgX) {
      bgX -= movementStep;
      // 修正精靈特效的位置同步
      for (let effect of activeEffects) {
        effect.x -= movementStep;
      }
    } else {
      // 背景已經到底（第 4 張圖的最右側），角色開始往右走
      characterX += movementStep;
    }
  } else if (movingLeft) {
    isWalking = true;
    facingDirection = -1;
    
    let maxBgX = 0; // 最左邊界
    
    // 如果背景還沒到最左邊，背景往右跑，角色留在原地
    if (bgX < maxBgX) {
      bgX += movementStep;
      for (let effect of activeEffects) {
        effect.x += movementStep;
      }
    } else {
      // 背景已經到底（第 1 張圖的最左側），角色開始往左走
      characterX -= movementStep;
    }
  }

  // 確保 bgX 不會超出合法範圍
  bgX = constrain(bgX, -(totalBgWidth - width), 0);

  // 限制角色在畫布範圍內
  const characterScale = (height / 3) / frameHeight; // 角色高度為畫布高度 1/3
  const characterWidth = frameWidth * characterScale;
  const characterHeight = frameHeight * characterScale;
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 3. 依序繪製四張不同的背景圖片
  background(200); // 預設底色
  imageMode(CORNER); // 畫背景時改用左上角對齊
  for (let i = 0; i < totalBgs; i++) {
    // 每一張圖的 X 座標 = 背景總位移量 + (索引 * 單張背景寬度)
    image(bgImages[i], bgX + (i * bgWidth), 0, bgWidth, bgHeight);
  }
  imageMode(CENTER); // 恢復角色繪製用的中心對齊

  // 4. 處理施法結束後發射魔法特效
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({ 
      x: characterX + magicDirection * characterWidth / 2, 
      y: height - characterHeight * 0.58, 
      direction: magicDirection 
    });
  }

  // 5. 繪製角色
  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;
  const elapsedMagicFrames = frameCount - magicStartFrame;
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount;
  const sourceX = frameIndex * activeFrameWidth;
  const activeWidth = activeFrameWidth * characterScale;
  const activeHeight = activeFrameHeight * characterScale;
  const characterY = height - activeHeight / 2;

  push();
  translate(characterX, characterY);
  scale(isCasting ? magicDirection : facingDirection, 1);
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight);
  pop();

  // 6. 更新與繪製魔法特效
  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);

  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) {
    const effect = activeEffects[effectIndex];
    effect.x += effect.direction * effectSpeed;
    if (effect.x > width || effect.x < 0) {
      activeEffects.splice(effectIndex, 1);
      continue;
    }
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
    push();
    translate(effect.x, effect.y);
    scale(effect.direction, 1);
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight);
    pop();
  }
} // 結束繪圖函式

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) { // 空白鍵施法
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
}