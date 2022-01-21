/* eslint-disable no-console */
const colors = require('colors/safe');
const StaticServer = require('static-server');

const port = process.argv[2] ? parseInt(process.argv[2]) : 8080;

function startServer() {

  const server = new StaticServer({ rootPath: __dirname, port, followSymlink: true });
  server.start(() => {
    console.log(colors.yellow('Listening on ' + server.port));
  });
}

startServer();

// npm run build && afplay /System/Library/Sounds/Funk.aiff && npm run start_no_build 8081