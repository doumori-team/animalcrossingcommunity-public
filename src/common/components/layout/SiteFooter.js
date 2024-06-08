import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser } from '@behavior';
import Clock from '@/components/layout/Clock.js';
import { dateUtils, constants } from '@utils';
import DonateButton from '@/components/layout/DonateButton.js';

// The bit of the page that comes below the content

const SiteFooter = () =>
{
	return (
		<footer className='SiteFooter'>
			<div className='SiteFooter_gridContainer'>
				<section className='SiteFooter_section'>
					<h1 className='SiteFooter_heading'>Community</h1>
					<p><Clock /></p>
					<nav>
						<Link to='/faq' className='SiteFooter_link'>FAQ</Link>
						{' • '}<Link to='/guidelines' className='SiteFooter_link'>Guidelines</Link>
						{' • '}<Link to='/staff' className='SiteFooter_link'>Staff</Link>
						<RequireUser silent>
							{' • '}<Link to='/features' className='SiteFooter_link'>Suggestions</Link>
						</RequireUser>
					</nav>
				</section>

				<section className='SiteFooter_section'>
					<h1 className='SiteFooter_heading'>Legal</h1>
					<nav>
						<Link to='/legal/policies' className='SiteFooter_link'>Policies</Link>
						{' • '}<Link to='/legal/privacy' className='SiteFooter_link'>Privacy Policy</Link>
						{' • '}<Link to='/legal/cookies' className='SiteFooter_link'>Cookie Policy</Link>
					</nav>
					<nav>
						<Link to='/legal/terms' className='SiteFooter_link'>TOS</Link>
						{' • '}<Link to='/legal/coppa' className='SiteFooter_link'>About COPPA</Link>
						{' • '}<a href='http://financial.animalcrossingcommunity.com' className='SiteFooter_link'>Financial</a>
					</nav>
				</section>

				<section className='SiteFooter_section'>
					<h1 className='SiteFooter_heading'>Etc.</h1>
					<nav>
						<Link to='/honorary-citizens' className='SiteFooter_link'>Honorary Citizens</Link>
						{' • '}<a href='http://newsletter.animalcrossingcommunity.com' className='SiteFooter_link'>Newsletter</a>
					</nav>
					<nav>
						<Link to='/credits' className='SiteFooter_link'>Acknowledgements</Link>
						<RequireUser silent>
							{' • '}<Link to='/site-statistics' className='SiteFooter_link'>Site Statistics</Link>
						</RequireUser>
					</nav>
					<nav>
						<a href='https://ACCommunity.redbubble.com' className='SiteFooter_link'>Merchandise</a>
					</nav>
					<div>
						<span>Follow ACC on: </span>
						<a href='https://www.facebook.com/animalcrossingcommunity'>
							<img className='SiteFooter_socialIcon' src='/images/layout/social_media_fb.png'
								srcSet={`${constants.AWS_URL}/images/layout/social_media_fb.png 1x, ${constants.AWS_URL}/images/layout/social_media_fb@2x.png 2x`}
								alt='Follow ACC on Facebook' />
						</a>
						<a href='https://www.twitter.com/accommunity'>
							<img className='SiteFooter_socialIcon' src='/images/layout/social_media_twt.png'
								srcSet={`${constants.AWS_URL}/images/layout/social_media_twt.png 1x, ${constants.AWS_URL}/images/layout/social_media_twt@2x.png 2x`}
								alt='Follow ACC on Twitter' />
						</a>
						<a href='https://www.instagram.com/animal.crossing.community'>
							<img className='SiteFooter_socialIcon' src='/images/layout/social_media_insta.png'
								srcSet={`${constants.AWS_URL}/images/layout/social_media_insta.png 1x, ${constants.AWS_URL}/images/layout/social_media_insta@2x.png 2x`}
								alt='Follow ACC on Instagram' />
						</a>
					</div>
				</section>
			</div>
			<div className='SiteFooter_donate'>
				<DonateButton />
			</div>
			<div className='SiteFooter_copyright'>
				<p>{`Copyright ©2002-${dateUtils.getCurrentYear()} AnimalCrossingCommunity.com. All rights reserved.
				Animal Crossing and Nintendo are registered trademarks of Nintendo of America. Version: ${constants.version}`}</p>
			</div>
		</footer>
	);
}

export default SiteFooter;
