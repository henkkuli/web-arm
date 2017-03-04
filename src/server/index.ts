import path = require('path');
import url = require('url');
import express = require('express');
import http = require('http');

const port = process.env.PORT | 8000;
const app = express();
const server = http.createServer(app);

// Serve static content
app.use(express.static(path.join(__dirname, './static')));

server.listen(port);
