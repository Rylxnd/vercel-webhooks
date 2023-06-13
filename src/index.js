require('dotenv').config();
const express = require('express');
const { verifySignature, sendDiscordWebhook } = require('./utils');

const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/webhooks', async (req, res) => {
	if (!req.headers['x-vercel-signature']) return res.sendStatus(401);
	if (!(await verifySignature(res))) return res.sendStatus(403);
	if (!req.body.type.startsWith('deployment.')) return res.sendStatus(418);
	const payload = req.body.payload;

	const embed = {
		title: '',
		description: '',
		footer: { text: `Deployment ID: ${payload.id}` },
		timestamp: new Date().toISOString(),
		url: payload.deployment.url,
		fields: [
			{
				name: 'Project',
				value: payload.deployment.name,
				inline: true,
			},
			{
				name: 'Target',
				value: payload.target,
				inline: true,
			},
		],
	};

	switch (req.body.type) {
		case 'deployment.created':
			embed.title = 'Deployment Created';
			embed.color = 5090295;
			break;
		case 'deployment.succeeded':
			embed.title = 'Deployment Succeeded';
			embed.color = 3725737;
			break;
		case 'deployment.error':
			embed.title = 'Deployment Error';
			embed.color = 16746375;
			break;
		case 'deployment.canceled':
			embed.title = 'Deployment Cancelled';
			embed.color = 16766011;
			break;
		default:
			return res.sendStatus(201);
	}

	await sendDiscordWebhook({ embeds: [embed] });

	res.sendStatus(201);
});

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`));
