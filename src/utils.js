const crypto = require('crypto');
const axios = require('axios');

module.exports.trelloConfig = {};

const initTrelloConfig = async () => {
	var boards = process.env.TRELLO_BOARD_MODEL.split(',');
	var webhooks = prcoess.env.TRELLO_DISCORD_WEBHOOK.split(',');

	for (var i = 0; i < boards.length; i++) {
		this.trelloConfig[boards[i]] = webhooks[i];
	}
}

/**
 * Verifies the Vercel signature on a request
 * @param rawBody The request body to sign
 * @param req The request to verify
 * @returns Whether the signature is valid
 */
module.exports.verifyVercelSignature = async (rawBody, req) => {

	const bodySignature = crypto.createHmac('sha1', process.env.VERCEL_SECRET).update(rawBody).digest('hex');
	return bodySignature === req.headers['x-vercel-signature'];
}

/**
 * Verifies the Trello signature on a request
 * @param jsonBody The request body to sign
 * @param req The request to verify
 * @returns Whether the signature is valid
 */
module.exports.verifyTrelloSignature = async (jsonBody, req) => {
	const sig = crypto.createHmac("sha1", process.env.TRELLO_API_SECRET).update(JSON.stringify(jsonBody) + process.env.TRELLO_CALLBACK_URL).digest("base64");
	return sig === req.headers['x-trello-webhook'];
}

/**
 * Sends a discord webhook
 * @param body The request body
 * @param webhook The webhook URL
 * @returns The fetch response
 */
module.exports.sendDiscordWebhook = async (body, webhook) => {
	return await axios.post(webhook, body, {
		headers: {
			"content-type": "application/json"
		}
	});
};

/**
 * Deletes a Trello webhook
 * @param id ID of the webhook to delete
 */
const deleteTrelloWebhook = async (id) => {
	try {
		await axios.delete(`https://api.trello.com/1/webhooks/${id}?key=APIKey&token=APIToken`, {
			params: {
				key: process.env.TRELLO_API_KEY,
				token: process.env.TRELLO_API_TOKEN
			}
		});
	}
	catch (error) {
		console.log(`Failed to delete Trello webhook (${id})! Status = ${error.status}`);
	}
}

/**
 * Registers the trello webhooks to the callbackURL and board ID
 * 
 * If a webhook is found that already matches callbackURL and board model
 * then we do nothing.
 * 
 * NOTE: Make sure the server is running before calling. 
 * Since the Trello API does a HEAD request to verify the callbackURL 
 */
module.exports.registerTrelloWebhooks = async () => {
	initTrelloConfig();

	// check if we already have a registered webhook
	var webhooks = (await axios.get(`https://api.trello.com/1/tokens/${process.env.TRELLO_API_TOKEN}/webhooks`, {
		params: {
			key: process.env.TRELLO_API_KEY,
			token: process.env.TRELLO_API_TOKEN
		}
	})).data;

	for (var board of Object.keys(this.trelloConfig)) {
		let rwh;
		if ((rwh = webhooks.find((w) => board == w.idModel))) {
			if (!rwh.callbackURL.includes(process.env.TRELLO_CALLBACK_URL)) {
				await deleteTrelloWebhook(rwh.id);
			} else {
				continue;
			}
		}

		// create a new webhook
		try {
			await axios.post('https://api.trello.com/1/webhooks/', null, {
				params: {
					key: process.env.TRELLO_API_KEY,
					token: process.env.TRELLO_API_TOKEN,
					callbackURL: process.env.TRELLO_CALLBACK_URL.concat(`?m=${board}`),
					idModel: board,
				}
			});
		} catch (error) {
			console.log(error)
			console.log(`Failed to create Trello webhook! Status: ${error.status}`);
		}
	}
}