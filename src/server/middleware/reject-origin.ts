import { Request, Response, NextFunction } from 'express';

import { constants, utils } from '@utils';

function rejectOrigin(request: Request, response: Response, next: NextFunction): void
{
	// redirect if trying to access site directly
	if (constants.LIVE_SITE && request.headers['x-host'] !== 'CloudFront')
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
