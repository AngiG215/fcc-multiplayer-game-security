import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let currPlayer;
let allPlayers = [];
let targetItem;

socket.on('init', ({ id, players, item }) => {
  // Inicializamos si no existe
  if (!currPlayer) {
    currPlayer = new Player({ x: 320, y: 240, score: 0, id });
    socket.emit('new-player', currPlayer);
  }
  
  targetItem = new Collectible(item);
  allPlayers = players;

  // El bucle de dibujo debe ejecutarse continuamente
  const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (targetItem) targetItem.draw(context);

    allPlayers.forEach(p => {
      const playerObj = new Player(p);
      playerObj.draw(context, p.id === socket.id);
    });

    requestAnimationFrame(draw);
  };
  
  draw();
}); // <--- ASEGÚRATE DE QUE ESTA LLAVE CIERRE EL INIT

// --- EVENTOS DE ACTUALIZACIÓN ---
socket.on('update-players', (players) => { allPlayers = players; });
socket.on('update-item', (item) => { targetItem = new Collectible(item); });

// --- MOVIMIENTO ---
document.onkeydown = (e) => {
  let dir;
  if (e.key === 'w' || e.key === 'ArrowUp') dir = 'up';
  if (e.key === 's' || e.key === 'ArrowDown') dir = 'down';
  if (e.key === 'a' || e.key === 'ArrowLeft') dir = 'left';
  if (e.key === 'd' || e.key === 'ArrowRight') dir = 'right';

  if (dir && currPlayer) {
    currPlayer.movePlayer(dir, 10);
    socket.emit('move-player', currPlayer);
  }
};