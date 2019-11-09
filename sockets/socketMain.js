const io = require("../server").io;
const checkForOrbCollisions = require("./checkCollisions")
  .checkForOrbCollisions;
const checkForPlayerCollisions = require("./checkCollisions")
  .checkForPlayerCollisions;
const Orb = require("./classes/Orb");
// ========== CLASSES ======================
const Player = require("./classes/Player");
const PlayerData = require("./classes/PlayerData");
const PlayerConfig = require("./classes/PlayerConfig");

let orbs = [];
let players = [];
let settings = {
  defaultOrbs: 5000,
  defaultSpeed: 6,
  defaultSize: 6,
  defaultZoom: 1.5,
  worldWidth: 5000,
  worldHeight: 5000
};

initGame();

setInterval(() => {
  if (players.length > 0) {
    io.to("game").emit("tock", {
      players
    });
  }
}, 33);

io.sockets.on("connect", socket => {
  let player = {};

  socket.on("init", data => {
    socket.join("game");

    let playerConfig = new PlayerConfig(settings);
    let playerData = new PlayerData(data.playerName, settings);
    player = new Player(socket.id, playerConfig, playerData);

    setInterval(() => {
      socket.emit("tickTock", {
        playerX: player.playerData.locX,
        playerY: player.playerData.locY
      });
    }, 33);

    socket.emit("initReturn", {
      orbs
    });
    players.push(playerData);
  });
  socket.on("tick", data => {
    if (data.xVector && data.yVector) {
      speed = player.playerConfig.speed;
      let xV = (player.playerConfig.xVector = data.xVector);
      let yV = (player.playerConfig.yVector = data.yVector);

      if (
        (player.playerData.locX < 5 && player.playerData.xVector < 0) ||
        (player.playerData.locX > settings.worldWidth && xV > 0)
      ) {
        player.playerData.locY -= speed * yV;
      } else if (
        (player.playerData.locY < 5 && yV > 0) ||
        (player.playerData.locY > settings.worldHeight && yV < 0)
      ) {
        player.playerData.locX += speed * xV;
      } else {
        player.playerData.locX += speed * xV;
        player.playerData.locY -= speed * yV;
      }
    }
    // ==================== Capture Orb ============
    let capturedOrb = checkForOrbCollisions(
      player.playerData,
      player.playerConfig,
      orbs,
      settings
    );
    capturedOrb
      .then(data => {
        const orbData = {
          orbIndex: data,
          newOrb: orbs[data]
        };
        // console.log(orbData);
        io.sockets.emit("updateLeaderBoard", getLeaderBoard());
        io.sockets.emit("orbSwitch", orbData);
      })
      .catch(() => {
        // console.log("no collison");
      });
    // ===================== Player Collision =============
    let playerDeath = checkForPlayerCollisions(
      player.playerData,
      player.playerConfig,
      players,
      player.socketId
    );
    playerDeath
      .then(data => {
        console.log("Player collison");
        io.sockets.emit("updateLeaderBoard", getLeaderBoard());
        io.sockets.emit("playerDeath", data);
      })
      .catch(() => {});
  });
  socket.on("disconnect", data => {
    if (player.playerData) {
      players.forEach((item, i) => {
        if (item.uid === player.playerData.id) {
          players.splice(i, 1);
        }
      });
    }
  });
});

function getLeaderBoard() {
  players.sort((a, b) => {
    return b.score - a.score;
  });
  let leaderBoard = players.map(item => {
    return { name: item.name, score: item.score };
  });
  return leaderBoard;
}

function initGame() {
  for (let i = 0; i < settings.defaultOrbs; i++) {
    orbs.push(new Orb(settings));
  }
}

module.exports = io;
