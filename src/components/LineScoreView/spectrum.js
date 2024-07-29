export default class Spectrum {
  constructor(x, y, width, lineHeight, graduation, color, canvasObj) {
    // const discuss = Math.round(y / graduation);
    this.x = x;
    let tmpY = canvasObj.height - (y - lineHeight / 2);
    if (tmpY >= canvasObj.height) {
      tmpY = canvasObj.height - lineHeight;
    }
    if (tmpY <= 0) {
      tmpY = lineHeight;
    }
    this.y = tmpY;
    this.width = width;
    this.lineHeight = lineHeight;
    this.graduation = graduation;
    this.color = color;
    this.canvasObj = canvasObj;
    this.ctx = canvasObj.getContext("2d");
  }
  draw() {
    this.ctx.beginPath();
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 1;
    const x = this.x;
    const y = this.y; // 矩形左上角的 y 坐标
    const w = this.width - 1; // 矩形的宽度
    const h = this.lineHeight; // 矩形的高度
    const r = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.arcTo(x + w, y, x + w, y + r, r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.arcTo(x, y + h, x, y + h - r, r);
    this.ctx.lineTo(x, y + r);
    this.ctx.arcTo(x, y, x + r, y, r);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }
  update(newScoreArry) {
    this.scoreArry = newScoreArry;
  }
}
