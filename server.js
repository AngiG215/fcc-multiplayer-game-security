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

// --- 1. CONFIGURACIÓN DE SEGURIDAD (Helmet 3.21.3) ---
// Esto debe ir arriba para que el test lo detecte de inmediato
const ninetyDaysInSeconds = 90 * 24 * 60 * 60;

app.use(helmet.hsts({
  maxAge: ninetyDaysInSeconds,
  force: true
}));

app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));

// --- 2. CONFIGURACIÓN DEL SERVIDOR Y ARCHIVOS ---
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Forzar el uso de CORS para que el test de FCC pueda entrar
app.use(cors({origin: '*'})); 

// --- 3. RUTAS ---
app.route('/').get(function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Rutas de prueba de freeCodeCamp
fccTestingRoutes(app);

// Manejo de 404
app.use(function(req, res, next) {
  res.status(404).type('text').send('Not Found');
});

// --- 4. INICIO DEL SERVIDOR ---
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

// --- 5. LÓGICA DEL JUEGO (SOCKET.IO) ---
// Esto DEBE ir después de definir 'server'
const io = socket(server);
let players = [];
let currentItem = { 
  x: Math.floor(Math.random() * 400), 
  y: Math.floor(Math.random() * 400), 
  value: 1, 
  id: Date.now() 
};

io.on('connection', (socket) => {
  console.log('Nuevo jugador conectado:', socket.id);

  socket.emit('init', { id: socket.id, players, item: currentItem });

  socket.on('new-player', (newPlayer) => {
    players.push(newPlayer);
    io.emit('update-players', players);
  });

  socket.on('move-player', ({ id, x, y }) => {
    const player = players.find(p => p.id === id);
    if (player) {
      player.x = x;
      player.y = y;
      io.emit('update-players', players); 
    }
  });

  socket.on('item-collected', ({ playerId, itemId, newScore }) => {
    // Lógica para regenerar item
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
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit('update-players', players);
  });
});

module.exports = app; // Para las pruebas
