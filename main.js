"use strict";

/* COSTANTI DI GIOCO */
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const PLAYER_SPEED = 5;             // Velocità di movimento orizzontale
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 50;
const OBSTACLE_SPEED = 3;           // Velocità di caduta
const OBSTACLE_INTERVAL = 1500;     // Tempo (ms) fra spawn di ostacoli

/* VARIABILI GLOBALI */
let canvas, ctx;
let player;
let obstacles = [];
let score = 0;
let gameRunning = false;
let gameInterval, obstacleInterval;
let playerName = "";
let lastTime = 0;

/* INIZIALIZZAZIONE DEL GIOCO */
window.onload = function() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  
  // Pulsanti
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("recordBtn").addEventListener("click", showRecords);
  
  // Inizializza i record (puoi usare localStorage o una chiamata AJAX come negli esempi precedenti)
  loadRecords();
  
  // Integrazione con Controller.js: registriamo gli eventi per smartphone, tablet e PC!
  // – Tastiera: freccia sinistra e destra
  Controller.on("keydown", function(e) {
    if (!gameRunning) return;
    if (e.key === "ArrowLeft") {
      player.dx = -PLAYER_SPEED;
    } else if (e.key === "ArrowRight") {
      player.dx = PLAYER_SPEED;
    }
  });
  
  Controller.on("keyup", function(e) {
    if (!gameRunning) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      player.dx = 0;
    }
  });
  
  // – Mouse e touch: quando muovi il cursore/tocco sul canvas sposta il giocatore verso quella x
  Controller.on("mousemove", function(pos) {
    if (!gameRunning) return;
    updatePlayerTarget(pos.x);
  });
  Controller.on("touchmove", function(pos) {
    if (!gameRunning) return;
    updatePlayerTarget(pos.x);
  });
  
  // – Gamepad: usiamo l'asse x (campo "gamepad:axis") per il movimento orizzontale
  Controller.on("gamepad:axis", function(data) {
    if (!gameRunning) return;
    // Se l'asse supera la soglia, sposta il giocatore
    if (Math.abs(data.x) > 0.3) {
      player.dx = data.x * PLAYER_SPEED * 2;
    } else {
      player.dx = 0;
    }
  });
};

//
// FUNZIONE PER AGGIORNARE LA POSIZIONE TARGET DEL GIOCATORE
// (Quando si muove il mouse o il touch, impostiamo il centro target del player)
function updatePlayerTarget(targetX) {
  // Il player si muove gradualmente
  let center = player.x + player.width / 2;
  let diff = targetX - center;
  // Impostiamo la velocità in base alla differenza
  player.dx = diff * 0.1;
}

//
// FUNZIONE DI SETUP DEL GIOCO
//
function startGame() {
  playerName = document.getElementById("playerName").value.trim();
  if (playerName === "") {
    alert("Inserisci il tuo nome per iniziare la partita.");
    return;
  }
  
  // Nascondi la schermata iniziale ed attiva il canvas e le info
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("gameInfo").classList.remove("hidden");
  canvas.classList.remove("hidden");
  
  // Inizializza lo score, il giocatore e gli ostacoli
  score = 0;
  obstacles = [];
  player = {
    x: (CANVAS_WIDTH - PLAYER_WIDTH) / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    dx: 0
  };
  
  gameRunning = true;
  lastTime = performance.now();
  
  // Avvia il ciclo di aggiornamento (game loop)
  requestAnimationFrame(gameLoop);
  
  // Avvia il timer per generare ostacoli
  obstacleInterval = setInterval(spawnObstacle, OBSTACLE_INTERVAL);
}

//
// GAME LOOP: aggiorna la posizione del giocatore, degli ostacoli, controlla collisioni e disegna il tutto
//
function gameLoop(timestamp) {
  if (!gameRunning) return;
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  
  update(deltaTime);
  draw();
  
  // Aggiorna lo score in base al tempo (ad esempio, 1 punto ogni 100 ms)
  score += deltaTime * 0.01;
  document.getElementById("scoreDisplay").innerText = "Score: " + Math.floor(score);
  
  requestAnimationFrame(gameLoop);
}

//
// FUNZIONE DI AGGIORNAMENTO DELLE POSIZIONI
//
function update(deltaTime) {
  // Aggiorna il giocatore
  player.x += player.dx;
  // Limita il movimento all’interno del canvas
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > CANVAS_WIDTH)
    player.x = CANVAS_WIDTH - player.width;
  
  // Aggiorna gli ostacoli: muovili in giù
  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].y += obstacles[i].speed;
  }
  
  // Rimuovi ostacoli fuori dal canvas
  obstacles = obstacles.filter(obst => obst.y < CANVAS_HEIGHT + obst.height);
  
  // Controllo collisioni: se un ostacolo colpisce il giocatore, game over
  obstacles.forEach(obst => {
    if (collides(player, obst)) {
      gameOver();
    }
  });
}

//
// FUNZIONE DI DISEGNO
//
function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Disegna sfondo
  ctx.fillStyle = "#333";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Disegna il giocatore (quadrato bianco con bordo verde)
  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.strokeRect(player.x, player.y, player.width, player.height);
  
  // Disegna gli ostacoli (rettangoli rossi)
  obstacles.forEach(obst => {
    ctx.fillStyle = "red";
    ctx.fillRect(obst.x, obst.y, obst.width, obst.height);
  });
}

//
// FUNZIONE PER TESTARE LA COLLISIONE TRA DUE RETTANGOLI
//
function collides(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect1.x > rect2.x + rect2.width ||
    rect1.y + rect1.height < rect2.y ||
    rect1.y > rect2.y + rect2.height
  );
}

//
// SPAWN DI UN OSTACOLO: genera un rettangolo in cima al canvas con posizione e velocità casuali
//
function spawnObstacle() {
  let obs = {
    x: Math.random() * (CANVAS_WIDTH - OBSTACLE_WIDTH),
    y: -OBSTACLE_HEIGHT,
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_HEIGHT,
    speed: OBSTACLE_SPEED + Math.random() * 2
  };
  obstacles.push(obs);
}

//
// GAME OVER: ferma il gioco, pulisce gli intervalli e mostra un alert; inoltre salva il record (qui uso localStorage per semplicità)
//
function gameOver() {
  gameRunning = false;
  clearInterval(obstacleInterval);
  
  // Salva il record in localStorage (puoi sostituire con una chiamata AJAX a PHP se desideri persistenza lato server)
  let records = JSON.parse(localStorage.getItem("records")) || [];
  let newRecord = {
    name: playerName,
    score: Math.floor(score),
    date: new Date().toLocaleString()
  };
  records.push(newRecord);
  localStorage.setItem("records", JSON.stringify(records));
  
  alert("Game Over! Score: " + Math.floor(score));
  resetGame();
}

//
// RESET DEL GIOCO: torna alla schermata iniziale
//
function resetGame() {
  document.getElementById("homeScreen").style.display = "block";
  document.getElementById("gameInfo").classList.add("hidden");
  canvas.classList.add("hidden");
}

//
// CARICA I RECORD E LI MOSTRA NEL MODAL (usando localStorage per questo esempio)
//
function loadRecords() {
  let records = JSON.parse(localStorage.getItem("records")) || [];
  let recordList = $("#recordList");
  recordList.empty();
  // Ordina per punteggio decrescente
  records.sort((a, b) => b.score - a.score);
  records.forEach(record => {
    let li = $("<li>")
      .addClass("list-group-item bg-dark text-white")
      .text(record.name + " - Score: " + record.score + " - " + record.date);
    recordList.append(li);
  });
}

//
// MOSTRA IL MODAL DEI RECORD (già richiamato dal pulsante Record)
//
function showRecords() {
  loadRecords();
  $("#recordModal").modal("show");
}
