import type { EndpointOutput, RequestEvent } from '@sveltejs/kit';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env['AIRTABLE_API_KEY'] }).base(
	process.env['AIRTABLE_BASE_ID']
);

const webhookUrl = process.env['WEBHOOK'];

const formMap = {
	selfbotted: 'User has selfbotted',
	modded: 'User has used a custom/modded client',
	disabled: 'User has been disabled before',
	selfDisabled: 'User has disabled themselves before',
	hasAlts: 'User has alternative accounts',
	hasBeenWarned: 'User has been warned',
	hasSystemMessage: 'User has had a system message',
	markedSuspicious: 'User has been marked suspicious',
	usedZendesk: 'User has used Zendesk',
	botApplication: 'User has created a bot application',
	verifiedEmail: 'User has verified their e-mail',
	verifiedPhone: 'User has verified their phone number',
	dataTracking: 'User has data tracking enabled',
	'2fa': 'User has 2FA enabled',
	over18: 'User is over 18'
};

export async function post(e: RequestEvent): Promise<EndpointOutput> {
	if (!e.locals.session.data?.token) return { status: 400 };

	const body = await e.request.json();

	body.flags = BigInt(body.flags);

	const formData = body.form;
	console.log(formData);

	const fields = [];
	const yeahNah = {};
	for (const key of Object.keys(formMap)) {
		fields.push({
			name: formMap[key],
			value: formData[key] ? '✅' : '❌',
			inline: true
		});
		yeahNah[key] = !!formData[key];
	}

	// sanitize this
	const sanitizedPlatforms = [];
	for (let i = 0; i < formData.platformsUsed.length; i++) {
		const platform = formData.platformsUsed.shift();
		if (['Desktop', 'Web', 'iOS', 'Android'].includes(platform)) sanitizedPlatforms.push(platform);
	}

	// capture the flags uses a webhook to gather responses and to act as a form of "backup" in case airtable fails
	await fetch(webhookUrl, {
		method: 'POST',
		body: JSON.stringify({
			embeds: [
				{
					fields: [
						{
							name: 'User Information',
							value: formData.anonymity
								? 'User chose to remain anonymous\n'
								: 'User ID is `' + body.userId + '`\n',
							inline: true
						},
						{
							name: 'Flags',
							value: body.flags.toString(),
							inline: true
						},
						{
							name: 'Uses Platforms',
							value: sanitizedPlatforms.join(', ') || 'None selected',
							inline: true
						}
					]
				},
				{
					fields
				}
			]
		}),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	// then we actually submit the responses to airtable for easier processing
	await base('Responses').create({
		id: formData.anonymity ? 'anonymous' : body.userId,
		flags: body.flags.toString(),
		...yeahNah,
		platforms: sanitizedPlatforms
	});

	e.locals.session.destroy();

	return {};
}
