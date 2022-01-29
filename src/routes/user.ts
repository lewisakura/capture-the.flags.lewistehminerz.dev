import type { RequestEvent } from '@sveltejs/kit';

export async function get(e: RequestEvent) {
	if (!e.locals.session.data?.token) return { status: 400 };

	const userInfo = await fetch('https://discord.com/api/v9/users/@me', {
		headers: {
			Authorization: 'Bearer ' + e.locals.session.data.token
		}
	});

	if (!userInfo.ok) return { status: 400 };

	const user = await userInfo.json();

	if (user.error) return { status: 400 };

	return {
		body: {
			id: user.id,
			username: user.username,
			avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${
				user.avatar.startsWith('a_') ? 'gif' : 'png'
			}`
		}
	};
}
