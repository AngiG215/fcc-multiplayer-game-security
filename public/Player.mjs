class Player {
  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score || 0;
    this.id = id;
  }

  movePlayer(dir, speed) {
    if (dir === 'up') this.y -= speed;
    if (dir === 'down') this.y += speed;
    if (dir === 'left') this.x -= speed;
    if (dir === 'right') this.x += speed;
  }

  collision(item) {
    // Detecta si el cuadrado del jugador (30x30) toca al item
    return (
    this.x < item.x + 10 &&
    this.x + 10 > item.x &&
    this.y < item.y + 10 &&
    this.y + 10 > item.y
    );
  }

  calculateRank(arr) {
    // Ordenar de mayor a menor puntuación
    const sorted = [...arr].sort((a, b) => b.score - a.score);
    const currentRank = sorted.findIndex(p => p.id === this.id) + 1;
    
    return `Rank: ${currentRank}/${arr.length}`;
  }

  // ¡ESTE MÉTODO DEBÍA IR AQUÍ ADENTRO!
  draw(context, isCurrentPlayer) {
    // Diferenciamos al jugador actual con un color distinto (ej. Dorado)
    context.fillStyle = isCurrentPlayer ? '#FFD700' : '#FFFFFF';
    context.fillRect(this.x, this.y, 30, 30);
    
    // Opcional: dibujar el ID o nombre sobre el jugador
    context.fillStyle = 'white';
    context.font = '10px "Press Start 2P"';
    context.fillText(this.id.substring(0, 5), this.x, this.y - 5);
  }
}

export default Player;