import type { RequestEvent } from '@sveltejs/kit';

export async function get(e: RequestEvent) {
	const code = e.url.searchParams.get('code');

	if (!code) return { status: 400 };

	const data = {
		client_id: process.env['CLIENT_ID'],
		client_secret: process.env['CLIENT_SECRET'],
		grant_type: 'authorization_code',
		redirect_uri: process.env['REDIRECT_URI'],
		code,
		scope: 'identify'
	};

	const token = await fetch('https://discord.com/api/oauth2/token', {
		method: 'POST',
		body: new URLSearchParams(data),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	});

	if (!token.ok) return { status: 500 };

	const response = await token.json();

	if (response.error) return { status: 400 };

	e.locals.session.data = { token: response.access_token };

	return {
		status: 301,
		headers: {
			Location: '/'
		}
	};
}
