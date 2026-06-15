const serverless = require('serverless-http');
const { app } = require('../../dist/server.cjs');

module.exports.handler = serverless(app, {
  basePath: '/.netlify/functions/api'
});
