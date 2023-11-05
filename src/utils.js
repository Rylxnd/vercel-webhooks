const crypto = require('crypto');
const fetch = require('node-fetch');
const getRawBody = require('raw-body');

/**
 * Verifies the Vercel signature on a request
 * @param req The request to verify
 * @returns Whether the signature is valid
 */
module.exports.verifySignature = async req => {
	console.log('2.2')
	const rawBody = await getRawBody(req).catch(console.log)
	console.log('2.3')
	const bodySignature = crypto.createHmac('sha1', process.env.VERCEL_SECRET).update(rawBody).digest('hex')
	console.log('2.4')
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
