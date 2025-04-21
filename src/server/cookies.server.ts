import { createCookie } from 'react-router';

export const testSitePassword = createCookie('acc-beta', {
	maxAge: 604_800,
});
