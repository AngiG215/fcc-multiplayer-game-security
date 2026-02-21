require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// 1. Definir el tiempo
const ninetyDaysInSeconds = 90 * 24 * 60 * 60;

// 2. Configurar HSTS
app.use(helmet.hsts({
  maxAge: ninetyDaysInSeconds,
  force: true
}));
// --- SEGURIDAD (Historias de usuario) ---
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));
app.use(helmet.noCache());

fccTestingRoutes(app);
app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- CONFIGURACIÓN ---
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

// --- RUTAS ---
app.route('/').get(function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});



// --- INICIO DEL SERVIDOR ---
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  }
});

// --- LÓGICA DEL JUEGO (SOCKET.IO) ---
const io = socket(server);
let players = [];
let item = { 
  x: Math.floor(Math.random() * 400), 
  y: Math.floor(Math.random() * 400), 
  value: 1, 
  id: Date.now() 
};

io.on('connection', (socket) => {
  console.log('Nuevo jugador conectado:', socket.id);

  socket.emit('init', { id: socket.id, players, item });

  socket.on('new-player', (newPlayer) => {
    players.push(newPlayer);
    io.emit('update-players', players);
  });

  socket.on('item-collected', ({ playerId, itemId, newScore }) => {
    if (itemId === currentItem) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        player.score = newScore;
        currentItem = {
          x: Math.floor(Math.random() * 540) + 50,
          y: Math.floor(Math.random() * 380) + 50,
          value: 1,
          id: Date.now()
        };
        io.emit('update-item', currentItem);
        io.emit('update-players', players);
      }
    }
  });

  socket.on('move-player', ({ id, x, y }) => {
    const player = players.find(p => p.id === id);
    if (player) {
      player.x = x;
      player.y = y;
      io.emit('update-players', players); 
  }
});

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit('update-players', players);
  });
});

// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404).type('text').send('Not Found');
});

module.exports = app; // Para pruebas
