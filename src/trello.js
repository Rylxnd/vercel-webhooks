require('dotenv').config();
const express = require('express');
const { verifyTrelloSignature, sendDiscordWebhook } = require('./utils');
const axios = require('axios');

const router = express.Router();

const imageRegex = /^.*\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/;

router.post('/', async (req, res) => {
    if (!req.headers['x-trello-webhook']) return res.sendStatus(401);
    if (!(await verifyTrelloSignature(req.body, req))) return res.sendStatus(403);

    const action = req.body.action;
    const model = req.body.model;

    const embed = {
		footer: { text: `Action ID: ${action.id}` },
		timestamp: action.date,
		url: model.url,
		fields: [
            {
                name: "Card",
                value: action.data.old?.name || action.data.card?.name,
                inline: false,
            },
		],
        author: {
            name: action.memberCreator.fullName,
            icon_url: `${action.memberCreator.avatarUrl}/50.png`,
        }
	};

    switch (action.type) {
        case 'updateCard':
            embed.color = 16753152;

            switch (action.display.translationKey) {
                case 'action_renamed_card':
                    embed.title = "Card Renamed";
                    embed.fields.push({
                        name: "Name",
                        value: action.data.card.name,
                        inline: false,
                    });
                    break;
                case 'action_changed_description_of_card':
                    embed.title = "Card Description Changed";
                    embed.fields.push({
                        name: "Description",
                        value: action.data.card.desc,
                        inline: false,
                    });
                    break;
                case 'action_move_card_from_list_to_list':
                    embed.title = "Card Moved";
                    embed.fields.push({
                        name: "New List",
                        value: action.data.listAfter.name,
                        inline: true,
                    },
                    {
                        name: "Old List",
                        value: action.data.listBefore.name,
                        inline: true,
                    });
                    break;
                default:
                    return res.sendStatus(202);
            }

            break;
        case 'copyCard':
        case 'createCard':
            embed.color = 2810778;
            embed.title = "Card Created";

            embed.fields[0].name = "Name";
            embed.fields.push({
                name: 'List',
                value: action.data.list.name,
                inline: false,
            });

            break;
        case 'addLabelToCard':
            embed.color = 2143468;
            embed.title = "Add Label To Card";

            embed.fields.push({
                name: 'Labels',
                value: action.data.label.name || action.data.label.color,
                inline: true,
            });
            break;
        case 'removeLabelFromCard':
            embed.color = 2143468;
            embed.title = "Remove Label From Card";

            embed.fields.push({
                name: 'Labels',
                value: action.data.label.name || action.data.label.color,
                inline: true,
            });
            break;
        case 'addAttachmentToCard':
            embed.color = 16753152;
            embed.title = "Add Attachment To Card";

            embed.fields.push({
                name: 'Name',
                value: action.data.attachment.name,
                inline: false,
            });

            if (imageRegex.test(action.data.attachment.name)) {
                embed.image = {
                    url: `${process.env.TRELLO_CALLBACK_URL}/attachmentProxy?source=${encodeURIComponent(action.data.attachment.url)}`,
                };
            }

            break;
        case 'commentCard':
            embed.color = 4877025;
            embed.title = "Comment";

            embed.fields.push({
                name: 'Comment',
                value: action.data.text,
                inline: false,
            });
            break;
        default:
            return res.sendStatus(202);
    }

    embed.title = embed.title.concat(` - ${model.name}`);

    await sendDiscordWebhook({embeds: [embed]}, process.env.TRELLO_DISCORD_WEBHOOK);

    return res.sendStatus(201);
});

router.get('/attachmentProxy', async (req, res) => {
    if (!req.query.source) return res.sendStatus(400);

    const trelloUrlRegex = /^(https?:\/\/)?(?:www\.)?trello\.com\/.*$/;
    const sourceUrl = decodeURIComponent(req.query.source);

    if (!trelloUrlRegex.test(sourceUrl)) return res.sendStatus(422);

    axios.get(sourceUrl, {
        responseType: 'arraybuffer',
        headers: {
            'Authorization': `OAuth oauth_consumer_key="${process.env.TRELLO_API_KEY}", oauth_token="${process.env.TRELLO_API_TOKEN}"`
        }
    }).then((response) => {
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Content-Length', response.headers['content-length']);

        res.end(response.data, 'binary');
    }).catch((error) => {
        console.log(error);
        if (error.response) {
            return res.sendStatus(error.response.status);
        } else if (error.request) {
            return res.sendStatus(504);
        }
        res.sendStatus(500);
    });
})

module.exports = router;