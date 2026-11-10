
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== TẢI HÌNH ẢNH =====
const catImg = new Image();
const pipeImg = new Image();
const bgImg = new Image();
const groundImg = new Image();

catImg.src = "images/cat.png";
pipeImg.src = "images/pipe.png";
bgImg.src = "images/background.png";
groundImg.src = "images/ground.png";

// ===== THÔNG SỐ GAME =====
const GROUND_Y = 545;

let bird = {
    x: 75,
    y: 250,
    width: 52,
    height: 46,
    velocity: 0,
    gravity: 0.22,
    jump: -6.5
};

let pipes = [];

let pipeWidth = 65;
let pipeGap = 170;
let pipeSpeed = 2;
let pipeDistance = 300;

let started = false;
let gameOver = false;
let score = 0;
let scoreEffects = [];

let bestScore = Number(localStorage.getItem("flappyCatBest")) || 0;
let groundOffset = 0;

// ===== VẼ NỀN =====
function drawBackground() {
    if (bgImg.complete && bgImg.naturalWidth > 0) {
        let sourceWidth = bgImg.height * canvas.width / GROUND_Y;
        let sourceX = (bgImg.width - sourceWidth) / 2;

        ctx.drawImage(
            bgImg,
            sourceX, 0,
            sourceWidth, bgImg.height,
            0, 0,
            canvas.width, GROUND_Y
        );
    } else {
        ctx.fillStyle = "#65d5ff";
        ctx.fillRect(0, 0, 400, 600);
    }
}

// ===== VẼ MẶT ĐẤT =====
function drawGround() {
    if (groundImg.complete && groundImg.naturalWidth > 0) {
        let groundWidth = canvas.width;
        let groundHeight = 55;

        groundOffset = (groundOffset + pipeSpeed) % groundWidth;

        ctx.drawImage(
            groundImg,
            -groundOffset,
            GROUND_Y,
            groundWidth,
            groundHeight
        );

        ctx.drawImage(
            groundImg,
            groundWidth - groundOffset,
            GROUND_Y,
            groundWidth,
            groundHeight
        );
    }
}

// ===== VẼ MÈO =====

function drawCat() {
    if (!catImg.complete || catImg.naturalWidth === 0) return;

    ctx.save();

    // Thời gian tạo hoạt ảnh
    let time = Date.now() / 150;

    // Mèo nhún nhẹ khi bay
    let bob = Math.sin(time) * 3;

    // Mèo nghiêng theo hướng chuyển động
    let angle = Math.max(
        -0.35,
        Math.min(0.5, bird.velocity * 0.045)
    );

    let centerX = bird.x + bird.width / 2;
    let centerY = bird.y + bird.height / 2 + bob;

    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Vẽ vệt sáng phía sau mèo
    ctx.fillStyle = "rgba(255,255,255,0.8)";

    let trail = Math.sin(time * 2) * 3;

    ctx.fillRect(-35, -5 + trail, 12, 3);
    ctx.fillRect(-29, 4 - trail, 8, 3);
    ctx.fillRect(-40, 7 + trail, 6, 2);

    // Vẽ mèo
    ctx.drawImage(
        catImg,
        -bird.width / 2,
        -bird.height / 2,
        bird.width,
        bird.height
    );

    ctx.restore();
}



// ===== TẠO ỐNG =====
function updatePipes() {
    if (
        pipes.length === 0 ||
        pipes[pipes.length - 1].x <
        canvas.width - pipeDistance
    ) {
        let topHeight = Math.floor(
            Math.random() * 170 + 90
        );

        pipes.push({
            x: canvas.width,
            topHeight: topHeight,
            passed: false
        });
    }

    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;

        if (
            !pipe.passed &&
            pipe.x + pipeWidth < bird.x
        ) {
            score++;
            pipe.passed = true;
            playSound("score");

            scoreEffects.push({
                x: bird.x + 20,
                y: bird.y,
                life: 40
});

            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem(
                    "flappyCatBest",
                    bestScore
                );
            }
        }
    });

    pipes = pipes.filter(pipe =>
        pipe.x + pipeWidth > 0
    );
}

// ===== VẼ ỐNG =====
function drawPipes() {
    if (!pipeImg.complete || pipeImg.naturalWidth === 0) return;

    pipes.forEach(pipe => {
        let bottomY = pipe.topHeight + pipeGap;
        let bottomHeight = GROUND_Y - bottomY;

        // Ống phía trên: nắp ở dưới
        ctx.drawImage(
            pipeImg,
            pipe.x,
            0,
            pipeWidth,
            pipe.topHeight
        );

        // Ống phía dưới: lật ảnh để nắp ở trên
        ctx.save();

        ctx.translate(pipe.x, bottomY);
        ctx.scale(1, -1);

        ctx.drawImage(
            pipeImg,
            0,
            -bottomHeight,
            pipeWidth,
            bottomHeight
        );

        ctx.restore();
    });
}

// ===== CHUYỂN ĐỘNG MÈO =====
function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (
        bird.y <= 0 ||
        bird.y + bird.height >= GROUND_Y
    ) {
        gameOver = true;
    }
}

// ===== KIỂM TRA VA CHẠM =====

function checkCollision() {
    pipes.forEach(pipe => {

        let hitPipe =
            bird.x + bird.width - 8 > pipe.x + 5 &&
            bird.x + 8 < pipe.x + pipeWidth - 5;

        let hitTop =
            bird.y + 7 < pipe.topHeight;

        let hitBottom =
            bird.y + bird.height - 7 >
            pipe.topHeight + pipeGap;

        if (hitPipe && (hitTop || hitBottom)) {
            if (!gameOver) {
                gameOver = true;
                playSound("hit");
            }
        }

    });
}


// ===== HIỂN THỊ ĐIỂM =====
function drawScore() {
    ctx.textAlign = "center";
    ctx.font = "bold 32px Arial";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#69452d";
    ctx.fillStyle = "#fff7d6";

    ctx.strokeText(score, 200, 55);
    ctx.fillText(score, 200, 55);

    // Kỷ lục
    ctx.textAlign = "left";
    ctx.font = "bold 15px Arial";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(12, 12, 105, 35);

    ctx.fillStyle = "#23617d";
    ctx.fillRect(15, 15, 99, 29);

    ctx.fillStyle = "#ffe28a";
    ctx.fillText("★ Best: " + bestScore, 21, 35);
}

// ===== MÀN HÌNH BẮT ĐẦU =====
function drawStartScreen() {
    ctx.fillStyle = "rgba(20,40,60,0.25)";
    ctx.fillRect(20, 240, 360, 65);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "bold 19px Arial";

    ctx.fillText(
        "🐾 NHẤN SPACE ĐỂ BẮT ĐẦU",
        200,
        280
    );
}

// ===== MÀN HÌNH GAME OVER =====
function drawGameOver() {
    ctx.fillStyle = "rgba(20,30,50,0.55)";
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = "#fff2d9";
    ctx.fillRect(45, 205, 310, 180);

    ctx.strokeStyle = "#e69b75";
    ctx.lineWidth = 5;
    ctx.strokeRect(45, 205, 310, 180);

    ctx.textAlign = "center";

    ctx.fillStyle = "#e65d73";
    ctx.font = "bold 34px Arial";
    ctx.fillText("GAME OVER", 200, 255);

    ctx.fillStyle = "#69452d";
    ctx.font = "bold 21px Arial";
    ctx.fillText("Điểm: " + score, 200, 300);

    ctx.fillText("🏆 Kỷ lục: " + bestScore, 200, 330);

    // Nút chơi lại
    ctx.fillStyle = "#ed6478";
    ctx.beginPath();
    ctx.roundRect(110, 345, 180, 35, 18);
    ctx.fill();

    ctx.strokeStyle = "#b94058";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.fillText("CHƠI LẠI", 200, 369);
}

// ===== CHƠI LẠI =====
function restartGame() {
    bird.y = 250;
    bird.velocity = 0;

    pipes = [];
    score = 0;

    groundOffset = 0;
    gameOver = false;
    started = false;
}

// ===== ĐIỀU KHIỂN =====
function jumpBird() {
    playBackgroundMusic();
    if (gameOver) {
        restartGame();
        started = true;
        bird.velocity = bird.jump;
        return;
    }

    started = true;
    bird.velocity = bird.jump;
    playMeow();
}

document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        event.preventDefault();
        jumpBird();
    }
});

canvas.addEventListener("click", function() {
    jumpBird();
});

// ===== VÒNG LẶP GAME =====
function gameLoop() {
    drawBackground();

    if (started && !gameOver) {
        updateBird();
        updatePipes();
        checkCollision();
    }

    drawPipes();
    drawGround();
    drawCat();

    updateScoreEffects();
    drawScoreEffects();

    drawScore();

    if (!started && !gameOver) {
        drawStartScreen();
    }

    if (gameOver) {
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

function updateScoreEffects() {
    scoreEffects.forEach(effect => {
        effect.y -= 1;
        effect.life -= 1;
    });

    scoreEffects = scoreEffects.filter(
        effect => effect.life > 0
    );
}

function drawScoreEffects() {
    scoreEffects.forEach(effect => {
        ctx.save();

        ctx.globalAlpha = effect.life / 40;
        ctx.fillStyle = "#ffe45c";
        ctx.font = "bold 25px Arial";
        ctx.textAlign = "center";

        ctx.fillText("+1", effect.x, effect.y);

        ctx.restore();
    });
}


let audioContext;

function playSound(type) {
    try {
        if (!audioContext) {
            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const now = audioContext.currentTime;

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        if (type === "jump") {
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(500, now);
            oscillator.frequency.exponentialRampToValueAtTime(850, now + 0.12);
        }

        else if (type === "score") {
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(700, now);
            oscillator.frequency.exponentialRampToValueAtTime(1100, now + 0.1);
        }

        else if (type === "hit") {
            oscillator.type = "triangle";
            oscillator.frequency.setValueAtTime(250, now);
            oscillator.frequency.exponentialRampToValueAtTime(70, now + 0.25);
        }

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        oscillator.start(now);
        oscillator.stop(now + 0.25);

    } catch (error) {
        console.error("Audio error:", error);
    }
}

const meowSound = new Audio("sounds/meow.mp3");
meowSound.volume = 0.3;
const bgMusic = new Audio("sounds/bg-music.wav");
bgMusic.loop = true;
bgMusic.volume = 0.3;

function playBackgroundMusic() {
    if (bgMusic.paused) {
        bgMusic.play().catch(error => {
            console.log("Không phát được nhạc nền:", error);
        });
    }
}

let lastMeowTime = 0;

function playMeow() {
    const now = Date.now();

    if (now - lastMeowTime < 3000) {
        return;
    }

    lastMeowTime = now;

    meowSound.currentTime = 0;
    meowSound.play().catch(error => {
        console.log("Không phát được tiếng mèo:", error);
    });
}


// BẮT ĐẦU SAU KHI TẢI ẢNH
gameLoop();
