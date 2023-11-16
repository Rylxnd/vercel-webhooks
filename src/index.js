require('dotenv').config();
const express = require('express');
const { registerTrelloWebhook } = require('./utils.js');

const vercel = require('./vercel.js');
const trello = require('./trello.js');

const app = express();

const PORT = process.env.PORT || 4000;

app.use('/webhooks/vercel', vercel);

app.use('/webhooks/trello', trello);

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));

registerTrelloWebhook();