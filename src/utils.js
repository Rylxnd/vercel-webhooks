const crypto = require('crypto');
const axios = require('axios');


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
	console.log(body)
	console.log(process.env.DISCORD_WEBHOOK)
	return await axios.post(process.env.DISCORD_WEBHOOK, body);
};
