class Collectible {
  constructor({x, y, value, id}) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.id = id;
  }

  draw(context, img) {
    // Si tienes una imagen en assets la usa, si no, dibuja un círculo
    if (img) {
      context.drawImage(img, this.x, this.y, 15, 15);
    } else {
      context.fillStyle = 'gold';
      context.beginPath();
      context.arc(this.x, this.y, 8, 0, Math.PI * 2);
      context.fill();
    }
  }
}

export default Collectible;