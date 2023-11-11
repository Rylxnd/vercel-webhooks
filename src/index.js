require('dotenv').config();
const express = require('express');
const { registerTrelloWebhook } = require('./utils.js');

const vercel = require('./vercel.js');

const app = express();

const PORT = process.env.PORT || 4000;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use('/webhooks/vercel', vercel);


app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));

registerTrelloWebhook();