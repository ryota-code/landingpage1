const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(800, 800);
const ctx = canvas.getContext('2d');

const scale = 1;
const s = 200 * scale;
const cx = 400;
const cy = 380;

// Background
ctx.fillStyle = '#00ff00';
ctx.fillRect(0, 0, 800, 800);

ctx.save();
ctx.translate(cx, cy);

// --- Fallback cat (same as in index.html) ---

// Head
ctx.fillStyle = '#f4a460';
ctx.beginPath();
ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
ctx.fill();

// Ears
ctx.beginPath();
ctx.moveTo(-s * 0.35, -s * 0.35);
ctx.lineTo(-s * 0.15, -s * 0.6);
ctx.lineTo(s * 0.05, -s * 0.35);
ctx.fill();
ctx.beginPath();
ctx.moveTo(s * 0.35, -s * 0.35);
ctx.lineTo(s * 0.15, -s * 0.6);
ctx.lineTo(-s * 0.05, -s * 0.35);
ctx.fill();

// Inner ears
ctx.fillStyle = '#ffb6c1';
ctx.beginPath();
ctx.moveTo(-s * 0.28, -s * 0.35);
ctx.lineTo(-s * 0.15, -s * 0.52);
ctx.lineTo(-s * 0.02, -s * 0.35);
ctx.fill();
ctx.beginPath();
ctx.moveTo(s * 0.28, -s * 0.35);
ctx.lineTo(s * 0.15, -s * 0.52);
ctx.lineTo(s * 0.02, -s * 0.35);
ctx.fill();

// Eyes (open)
ctx.fillStyle = '#333';
ctx.beginPath();
ctx.ellipse(-s * 0.15, -s * 0.08, s * 0.06, s * 0.08, 0, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.ellipse(s * 0.15, -s * 0.08, s * 0.06, s * 0.08, 0, 0, Math.PI * 2);
ctx.fill();

// Eye highlights
ctx.fillStyle = '#fff';
ctx.beginPath();
ctx.arc(-s * 0.13, -s * 0.1, s * 0.02, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.arc(s * 0.17, -s * 0.1, s * 0.02, 0, Math.PI * 2);
ctx.fill();

// Nose
ctx.fillStyle = '#ff8888';
ctx.beginPath();
ctx.moveTo(0, s * 0.02);
ctx.lineTo(-s * 0.03, s * 0.06);
ctx.lineTo(s * 0.03, s * 0.06);
ctx.closePath();
ctx.fill();

// Whiskers
ctx.strokeStyle = '#666';
ctx.lineWidth = 1.5;
for (const side of [-1, 1]) {
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(side * s * 0.12, s * 0.08 + i * s * 0.04);
    ctx.lineTo(side * s * 0.4, s * 0.05 + i * s * 0.06);
    ctx.stroke();
  }
}

// Closed mouth (cat smile)
ctx.strokeStyle = '#333';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(-s * 0.08, s * 0.1);
ctx.quadraticCurveTo(-s * 0.02, s * 0.16, 0, s * 0.1);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(s * 0.08, s * 0.1);
ctx.quadraticCurveTo(s * 0.02, s * 0.16, 0, s * 0.1);
ctx.stroke();

// Label
ctx.fillStyle = '#fff';
ctx.font = '16px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('にゃんこ先生', 0, s * 0.65);

ctx.restore();

// --- Draw mouth open version ---
ctx.save();
ctx.translate(cx, cy);

// Annotations
ctx.restore();

// Labels on the side
ctx.fillStyle = '#fff';
ctx.font = 'bold 20px sans-serif';
ctx.textAlign = 'left';
ctx.fillText('← 口閉じ (通常)', cx + 130, cy + 20);
ctx.fillText('← 目 (まばたき付き)', cx + 130, cy - 16);
ctx.fillText('← ヒゲ', cx + 130, cy + 56);
ctx.fillText('← 鼻', cx + 130, cy - 55 + 70);

// Draw arrows
ctx.strokeStyle = '#fff';
ctx.lineWidth = 2;
// Mouth arrow
ctx.beginPath(); ctx.moveTo(cx + 125, cy + 14); ctx.lineTo(cx + 20, cy + 20); ctx.stroke();
// Eye arrow
ctx.beginPath(); ctx.moveTo(cx + 125, cy - 22); ctx.lineTo(cx + 40, cy - 16); ctx.stroke();
// Whisker arrow
ctx.beginPath(); ctx.moveTo(cx + 125, cy + 50); ctx.lineTo(cx + 82, cy + 50); ctx.stroke();
// Nose arrow
ctx.beginPath(); ctx.moveTo(cx + 125, cy + 9); ctx.lineTo(cx + 10, cy + 9); ctx.stroke();

// Title
ctx.fillStyle = '#fff';
ctx.font = 'bold 28px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('にゃんこ先生 VTuber パーツ構成', 400, 40);

ctx.font = '18px sans-serif';
ctx.fillText('フォールバック版 (画像未読み込み時)', 400, 70);

// Part list at bottom
ctx.font = '16px sans-serif';
ctx.textAlign = 'left';
const parts = [
  '1. 頭 (丸い顔) - ベースパーツ',
  '2. 耳 (三角 + ピンクの内耳)',
  '3. 目 (楕円 + ハイライト) → まばたきアニメーション',
  '4. 鼻 (ピンクの三角)',
  '5. ヒゲ (左右3本ずつ)',
  '6. 口 → マイク音声で開閉アニメーション',
  '7. 呼吸アニメーション (全体の上下の微動)',
  '8. 体の揺れ (左右の微動)',
];
parts.forEach((p, i) => {
  ctx.fillText(p, 50, 560 + i * 26);
});

// Save
const buf = canvas.toBuffer('image/png');
fs.writeFileSync('/home/user/landingpage1/vtuber/preview.png', buf);
console.log('Preview saved!');
