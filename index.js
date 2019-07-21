

const http = require("http");
const path = require("path");
const express = require('express');

const port = (process.env.PORT || 8080);
const endpoint = "localhost";

var STATIC_DIR;

const app = express();
const server = http.createServer(app);

STATIC_DIR = path.resolve(__dirname, "dist");

//Static file declaration
app.use(express.static(STATIC_DIR));

//production mode
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "dist")));
  //
  app.get('*', (req, res) => {
    res.sendfile(path.join(__dirname = `dist/index.html`));
  })
}
//build mode
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/dist/index.html'));
})



server.listen(port);
console.log(`Listening on http://${endpoint}:${port}`);
