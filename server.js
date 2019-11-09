const express = require("express");
const socketio = require("socket.io");
const app = express();

app.use(express.static(__dirname + "/public"));

const expressServer = app.listen(process.env.PORT || 8080, () => {
  console.log("Listen on 8080 fool!!! ");
});
const io = socketio(expressServer);

const helmet = require("helmet");
app.use(helmet());

module.exports = {
  app,
  io
};
