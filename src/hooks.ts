import { handleSession } from 'svelte-kit-cookie-session';

/** @type {import('@sveltejs/kit').GetSession} */
export async function getSession({ locals }) {
	return locals.session.data;
}

export const handle = handleSession({
	secret: process.env['SESSION_SECRET'],
	expires: 1
});
