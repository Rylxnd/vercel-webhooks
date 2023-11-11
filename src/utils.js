const crypto = require('crypto');
const axios = require('axios');
const { urlencoded } = require('express');
const { URLSearchParams } = require('url');

var trelloWebhookId = "";

/**
 * Verifies the Vercel signature on a request
 * @param req The request to verify
 * @returns Whether the signature is valid
 */
module.exports.verifyVercelSignature = async (rawBody, req) => {

	const bodySignature = crypto.createHmac('sha1', process.env.VERCEL_SECRET).update(rawBody).digest('hex');
	return bodySignature === req.headers['x-vercel-signature'];
}

/**
 * Sends a discord webhook
 * @param body The request body
 * @returns The fetch response
 */
module.exports.sendDiscordWebhook = async (body) => {
	console.log(body)
	console.log( JSON.stringify(body))
	return await axios.post(process.env.DISCORD_WEBHOOK, body, {
		headers: {
			"content-type": "application/json"
		}
	});
};

const deleteTrelloWebhook = async (id) => {
	try {
		await axios.delete(`https://api.trello.com/1/webhooks/${id}?key=APIKey&token=APIToken`, {
			params: {
				key: process.env.TRELLO_API_KEY,
				token: process.env.TRELLO_API_SECRET
			}
		});
	}
	catch (error) {
		console.log(`Failed to delete Trello webhook (${id})! Status = ${error.status}`);
	}
}

/**
 * Registers the trello webhook to the callbackURL and board ID
 * 
 * If a webhook is found that already matches callbackURL and board id
 * then we do nothing.
 * 
 * NOTE: Make sure the server is running before calling. 
 * Since the Trello API does a HEAD request to verify the callbackURL 
 */
module.exports.registerTrelloWebhook = async () => {
	// check if we already have a registered webhook
	var webhooks = await axios.get(`https://api.trello.com/1/tokens/${process.env.TRELLO_API_SECRET}/webhooks`, {
		params: {
			key: process.env.TRELLO_API_KEY,
			token: process.env.TRELLO_API_SECRET
		}
	}).data;

	for (var webhook of webhooks) {
		if (webhook.active != true) {
			await deleteTrelloWebhook(webhook.id);
			continue;
		}

		if (webhook.idModel == process.env.TRELLO_BOARD_MODEL && webhook.callbackURL == process.env.TRELLO_CALLBACK_URL) {
			// we already have a webhook for the board model registered to the callback
			trelloWebhookId = webhook.id;
			return;
		}
	}

	// create a new webhook
	try {
		var res = await axios.post('https://api.trello.com/1/webhooks/', null, {
			params: {
				key: process.env.TRELLO_API_KEY,
				token: process.env.TRELLO_API_SECRET,
				callbackURL: process.env.TRELLO_CALLBACK_URL,
				idModel: process.env.TRELLO_BOARD_MODEL,
			}
		});

		trelloWebhookId = res.data.id;
	} catch (error) {
		console.log(`Failed to create Trello webhook! Status: ${error.status}`);
	}
}