const crypto = require('crypto');
const fetch = require('node-fetch');


/**
 * Verifies the Vercel signature on a request
 * @param req The request to verify
 * @returns Whether the signature is valid
 */
module.exports.verifySignature = async (rawBody, req) => {

	const bodySignature = crypto.createHmac('sha1', process.env.VERCEL_SECRET).update(rawBody).digest('hex');
	return bodySignature === req.headers['x-vercel-signature'];
}
/**
 * Sends a discord webhook
 * @param body The request body
 * @returns The fetch response
 */
module.exports.sendDiscordWebhook = async body => {
	return await fetch(process.env.DISCORD_WEBHOOK, {
		method: 'POST',
		body: JSON.stringify(body),
	});
};
