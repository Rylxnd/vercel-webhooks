require('dotenv').config();
const express = require('express');
const { verifyVercelSignature, sendDiscordWebhook } = require('./utils');
const getRawBody = require('raw-body');

const router = express.Router();

router.post('/', async (req, res) => {
	if (!req.headers['x-vercel-signature']) return res.sendStatus(401);
	const rawBody = await getRawBody(req);
	if (!(await verifyVercelSignature(rawBody, req))) return res.sendStatus(403);
	const body = JSON.parse(rawBody.toString('utf-8'))
	const payload = body.payload
	const embed = {
		footer: { text: `Deployment ID: ${body.id}` },
		timestamp: new Date().toISOString(),
		url: `https://${payload.deployment.url}`,
		fields: [
			{
				name: 'Project',
				value: payload.deployment.name,
				inline: true,
			},
			{
				name: 'Target',
				value: `${payload.target || 'none'}`,
				inline: true,
			},
		],
	};

	switch (body.type) {
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

	await sendDiscordWebhook({ embeds: [embed] }, process.env.DISCORD_WEBHOOK);

	res.sendStatus(201);
});

module.exports = router;