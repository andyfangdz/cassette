#!/usr/bin/env node

const express = require('express');
const Bundler = require('parcel-bundler');
const redis = require('redis');
const proxy = require('http-proxy-middleware');
const bluebird = require('bluebird');
const bodyParser = require('body-parser');
const msgpackParser = require('body-parser-with-msgpack');

bluebird.promisifyAll(redis);

const client = redis.createClient();

const RECORDINGS_LIST = 'cassette::recordings';
const RECORDINGS_NAMESPACE = 'cassette::recordings';

const app = express();
app.use(bodyParser.json());
app.use(msgpackParser.msgpack({ type: 'application/msgpack' }));

app.get('/__api/recordings_all', async (req, res) => {
  res.json({ paths: await client.smembersAsync(RECORDINGS_LIST) });
});

app.get('/__api/recordings_path*', async (req, res) => {
  const dumpPath = req.originalUrl.slice('/__api/recordings_path'.length);
  const recordings = await client.keysAsync(
    `${RECORDINGS_NAMESPACE}::${dumpPath}::*`
  );
  res.json({ recordings });
});

app.get('/__api/recordings/*', async (req, res) => {
  const recodingKey = req.originalUrl.slice('/__api/recordings/'.length);
  const recording = JSON.parse(await client.getAsync(recodingKey));
  res.json(recording);
});

app.use('*', (req, res) => {
  const requestObject = {
    headers: req.headers,
    body: req.body,
    method: req.method,
    path: req.originalUrl,
    params: req.params,
  };
  const recordingName = `${RECORDINGS_NAMESPACE}::${
    req.originalUrl
  }::${Date.now()}`;
  console.log(`http://cassette.localhost:3001/recordings/${recordingName}`);
  client.sadd(RECORDINGS_LIST, req.originalUrl);
  client.set(recordingName, JSON.stringify(requestObject));
  res.json({ success: true, ...requestObject });
});

app.listen(3000);

const bundler = new Bundler('src/index.html', {
  hmrPort: 3002,
});
const bundlerApp = express();

const appPort = 3001;

console.log(`Dev Server Starting at http://localhost:${appPort}`);

bundlerApp.use(
  '/__api',
  proxy({
    target: 'http://localhost:3000',
  })
);

bundlerApp.use(bundler.middleware());

bundlerApp.listen(appPort);
