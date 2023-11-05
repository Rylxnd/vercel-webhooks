const crypto = require('crypto');
const fetch = require('node-fetch');
const getRawBody = require('raw-body');

/**
 * Verifies the Vercel signature on a request
 * @param req The request to verify
 * @returns Whether the signature is valid
 */
module.exports.verifySignature = async req => {
	const rawBody = await getRawBody(req);
	console.log(5)
	const bodySignature = crypto.sign('sha1', rawBody, process.env.VERCEL_SECRET);
	console.log(6)
	return bodySignature === req.headers['x-vercel-signature'];
};

/**
 * Sends a discord webhook
 * @param body The request body
 * @returns The fetch response
 */
module.exports.sendDiscordWebhook = async body => {
	return await fetch(process.env.DISCORD_WEBHOOK, {
		method: 'POST',
		body: JSON.stringify(data),
	});
};
