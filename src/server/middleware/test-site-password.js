import { LIVE_SITE } from 'common/utils/constants.js';

const acc_beta = process.env.TEST_SITE_PASSWORD;

function testSitePassword (request, response, next)
{
	if (LIVE_SITE || request.cookies.acc_beta === acc_beta)
	{
		next();
	}
	else
	{
		if (request.body.acc_beta === acc_beta)
		{
			response.cookie('acc_beta', acc_beta);
			response.redirect(303, request.url);
		}
		else
		{
			response.status(401); // Not Authorized
			if (request.body.acc_beta)
			{
				response.render('test-site-password', {incorrect: true});
			}
			else
			{
				response.render('test-site-password', {incorrect: false});
			}
		}
	}
}

export default testSitePassword;
