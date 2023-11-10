require('dotenv').config();
const express = require('express');

const vercel = require('./vercel.js');

const app = express();

const PORT = process.env.PORT || 4000;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use('/webhooks/vercel', vercel);

app.post('/webhooks/trello', async (req, res) => {

})

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
