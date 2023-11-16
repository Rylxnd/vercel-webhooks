const crypto = require('crypto');
const axios = require('axios');

module.exports.config = require('../config.json');

const getFullRequestURL = (req) => {
	const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
	return url;
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
 * @param req The request to verify
 * @returns Whether the signature is valid
 */
module.exports.verifyTrelloSignature = async (req) => {
	const sig = crypto.createHmac("sha1", process.env.TRELLO_API_SECRET).update(JSON.stringify(req.body) + getFullRequestURL(req)).digest("base64");
	return sig === req.headers['x-trello-webhook'];
}

/**
 * Sends a discord webhook
 * @param body The request body
 * @param webhook The webhook URL
 * @returns The fetch response
 */
module.exports.sendDiscordWebhook = async (body, webhook) => {
	try {
		return await axios.post(webhook, body, {
			headers: {
				"content-type": "application/json"
			}
		});	
	} catch (error) {
		console.log(error);
		console.log("error sending discord embed ^");
	}
};

/**
 * Deletes a Trello webhook
 * @param id ID of the webhook to delete
 */
const deleteTrelloWebhook = async (id) => {
	try {
		await axios.delete(`https://api.trello.com/1/webhooks/${id}`, {
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
	// check if we already have a registered webhook
	var webhooks = (await axios.get(`https://api.trello.com/1/tokens/${process.env.TRELLO_API_TOKEN}/webhooks`, {
		params: {
			key: process.env.TRELLO_API_KEY,
			token: process.env.TRELLO_API_TOKEN
		}
	})).data;

	for (let board of this.config.trello.boards) {
		let rwh;
		if ((rwh = webhooks.find((w) => board.id == w.idModel))) {
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
					callbackURL: process.env.TRELLO_CALLBACK_URL.concat(`?m=${board.id}`), // the param is trivial. but idk if their api will error if it is the exact same callbackURL
					idModel: board.id,
				}
			});
		} catch (error) {
			console.log(error)
			console.log(`Failed to create Trello webhook! Status: ${error.status}`);
		}
	}
}