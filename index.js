const lru = require("lru_map");
var path = require("path");
var mpd = require("mpd"),
  cmd = mpd.cmd;
var client = mpd.connect({
  port: 6600,
  host: "localhost",
});

let data = {
  num_clients: 0,
  songs: new lru.LRUMap(10),
  time: "0:1",
};

const express = require("express");
const app = express();

var SSE = require("express-sse");
var sse = new SSE();

client.on("ready", function () {
  client.sendCommand(cmd("currentsong", []), function (err, msg) {
    if (err) throw err;
    msg = mpd.parseKeyValueMessage(msg);
    client.sendCommand(cmd("status", []), function (err, msg) {
      if (err) throw err;
      msg = mpd.parseKeyValueMessage(msg);
      data.time = msg.time;
      sse.send(data.time, "time");
    });
    data.songs.set(`${msg.Title} - ${msg.Artist}`, 0);
    sse.send(data.songs, "songs");
  });
});

client.on("system-player", function () {
  client.sendCommand(cmd("currentsong", []), function (err, msg) {
    if (err) throw err;
    msg = mpd.parseKeyValueMessage(msg);
    data.songs.set(`${msg.Title} - ${msg.Artist}`, 0);
    client.sendCommand(cmd("status", []), function (err, msg) {
      if (err) throw err;
      msg = mpd.parseKeyValueMessage(msg);
      data.time = msg.time;
      sse.send(data.time, "time");
    });
    sse.send(data.songs, "songs");
  });
});

app.get("/status", function (req, res) {
  data.num_clients += 1;
  req.on("close", () => {
    data.num_clients -= 1;
    sse.send(data.num_clients, "clients");
  });
  sse.init(req, res);
  client.sendCommand(cmd("status", []), function (err, msg) {
    if (err) throw err;
    msg = mpd.parseKeyValueMessage(msg);
    data.time = msg.time;
    sse.send(data.time, "time");
  });
  sse.send(data.songs, "songs");
  sse.send(data.num_clients, "clients");
  console.log(data);
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "static/index.html"));
});

app.use(express.static(path.join(__dirname, "static")));

app.listen(8801, () => {});
