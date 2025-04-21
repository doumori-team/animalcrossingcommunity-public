import { constants, utils } from '@utils';

function rejectOrigin(request: any, response: any, next: any): void
{
	// redirect if trying to access site directly; move to middleware?
	if (constants.LIVE_SITE && request.headers['host'] !== 'www.animalcrossingcommunity.com')
	{
		let log = utils.startLog({ location: 'rejectOrigin', request });
		log += ` status=302`;
		console.info(log);

		// 259200 = 3 days
		response.set('Cache-Control', 'public, max-age=0, s-maxage=259200');

		response.redirect(
			302,
			'https://www.animalcrossingcommunity.com',
		);
	}
	else
	{
		next();
	}
}

export default rejectOrigin;
