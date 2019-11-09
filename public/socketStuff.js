let socket = io.connect("http://localhost:8080");

function init() {
  // start drawing the screen
  draw();
  // console.log(orbs)
  // call the init event when the client is ready for the data
  socket.emit("init", {
    playerName: player.name
  });
}

socket.on("initReturn", data => {
  orbs = data.orbs;
  setInterval(() => {
    if (player.xVector) {
      socket.emit("tick", {
        xVector: player.xVector,
        yVector: player.yVector
      });
    }
  }, 33);
});

socket.on("tock", data => {
  // console.log(data)
  players = data.players;
});
socket.on("orbSwitch", data => {
  orbs.splice(data.orbIndex, 1, data.newOrb);
});
socket.on("tickTock", data => {
  (player.locX = data.playerX), (player.locY = data.playerY);
});

socket.on("updateLeaderBoard", data => {
  document.querySelector(".leader-board").innerHTML = "";
  // console.log(data);

  data.forEach(item => {
    console.log(item);
    document.querySelector(".leader-board").innerHTML += `
    <li class="leaderboard-player">${item.name} - ${item.score}</li>`;
  });
});

socket.on("playerDeath", data => {
  console.log(`got killed: ${data.died.name}`);
  document.querySelector("game-message").innerHTML = `${
    data.died.name
  } absorbed by${data.killBy.name}`;
  $("#game-message").css({ "background-color": "#00e6e6", opacity: 1 });
  $("#game-message").show();
  $("#game-message").fadeOut(5000);
});
