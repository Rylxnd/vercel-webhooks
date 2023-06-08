const crypto = require('crypto');
const fetch = require('node-fetch');

/**
 * Verifies the Vercel signature on a request
 * @param req The request to verify
 * @returns Whether the signature is valid
 */
module.exports.verifySignature = req => {
	const payload = req.body.payload;
	const signature = crypto
		.createHmac('sha1', process.env.VERCEL_SECRET)
		.update(payload)
		.digest('hex');
	return signature === req.headers['x-vercel-signature'];
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
