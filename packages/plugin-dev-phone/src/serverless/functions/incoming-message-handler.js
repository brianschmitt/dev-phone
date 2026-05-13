// Incoming Message Handler

const https = require('https');

function fetchMedia(url, accountSid, authToken) {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const req = https.get(url, { headers: { 'Authorization': `Basic ${auth}` } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchMedia(res.headers.location, accountSid, authToken).then(resolve).catch(reject);
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve({
                buffer: Buffer.concat(chunks),
                contentType: res.headers['content-type']
            }));
        });
        req.on('error', reject);
    });
}

function uploadToMcs(buffer, contentType, serviceSid, accountSid, authToken) {
    return new Promise((resolve, reject) => {
        const boundary = '----FormBoundary' + Date.now();
        const header = `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="media"\r\nContent-Type: ${contentType}\r\n\r\n`;
        const footer = `\r\n--${boundary}--\r\n`;
        const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);

        const options = {
            hostname: 'mcs.us1.twilio.com',
            path: `/v1/Services/${serviceSid}/Media`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            }
        };

        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const response = JSON.parse(Buffer.concat(chunks).toString());
                resolve(response.sid);
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

exports.handler = async function(context, event, callback) {
    const client = context.getTwilioClient({
        userAgentExtension: [
            `@twilio-labs/dev-phone/${context.DEV_PHONE_VERSION}`,
            `@twilio-labs/dev-phone/serverless`,
            'serverless-functions'
        ]
    });

    const numMedia = Number(event.NumMedia) || 0;
    const accountSid = context.ACCOUNT_SID;
    const authToken = context.AUTH_TOKEN;

    const createMessage = async (body, mediaSid) => {
        const params = {
            author: event.From,
            body: body,
            attributes: JSON.stringify({
                fromCity: event.FromCity,
                fromCountry: event.FromCountry,
                messageSid: event.MessageSid,
            })
        };
        if (mediaSid) {
            params.mediaSid = mediaSid;
        }
        return client.conversations
            .services(context.CONVERSATION_SERVICE_SID)
            .conversations(context.CONVERSATION_SID)
            .messages
            .create(params);
    };

    if (numMedia === 0) {
        await createMessage(event.Body, null);
    } else {
        for (let i = 0; i < numMedia; i++) {
            const mediaUrl = event[`MediaUrl${i}`];
            const { buffer, contentType } = await fetchMedia(mediaUrl, accountSid, authToken);
            const mediaSid = await uploadToMcs(buffer, contentType, context.CONVERSATION_SERVICE_SID, accountSid, authToken);
            await createMessage(i === 0 ? event.Body : null, mediaSid);
        }
    }

    let twiml = new Twilio.twiml.MessagingResponse();
    return callback(null, twiml);
};
