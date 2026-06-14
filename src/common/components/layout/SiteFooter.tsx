import { Link } from 'react-router';

import { RequireUser, RequirePermission } from '@behavior';
import Clock from '@/components/layout/Clock.tsx';
import { dateUtils, constants } from '@utils';
import DonateButton from '@/components/layout/DonateButton.tsx';

// The bit of the page that comes below the content

const SiteFooter = () =>
{
	return (
		<footer className='SiteFooter'>
			<div className='SiteFooter_gridContainer'>
				<section className='SiteFooter_section'>
					<h2 className='SiteFooter_heading'>Community</h2>
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
					<h2 className='SiteFooter_heading'>Legal</h2>
					<nav>
						<Link to='/legal/policies' className='SiteFooter_link'>Policies</Link>
						{' • '}<Link to='/legal/privacy' className='SiteFooter_link'>Privacy Policy</Link>
						{' • '}<Link to='/legal/cookies' className='SiteFooter_link'>Cookie Policy</Link>
					</nav>
					<nav>
						<Link to='/legal/terms' className='SiteFooter_link'>TOS</Link>
						{' • '}<Link to='/legal/coppa' className='SiteFooter_link'>About COPPA</Link>
						{' • '}<a href='https://financial.animalcrossingcommunity.com' className='SiteFooter_link'>Financial</a>
					</nav>
				</section>

				<section className='SiteFooter_section'>
					<h2 className='SiteFooter_heading'>Etc.</h2>
					<nav>
						<Link to='/honorary-citizens' className='SiteFooter_link'>Honorary Citizens</Link>
						<RequirePermission permission='view-newsletter' silent>
							{' • '}<Link to='/newsletters' className='SiteFooter_link'>Newsletter</Link>
						</RequirePermission>
					</nav>
					<nav>
						<Link to='/credits' className='SiteFooter_link'>Acknowledgements</Link>
						<RequireUser silent>
							{' • '}<Link to='/site-statistics' className='SiteFooter_link'>Site Statistics</Link>
						</RequireUser>
					</nav>
					<nav>
						<a href='https://ACCommunity.redbubble.com' className='SiteFooter_link'>Merchandise</a>
						{' • '}<a href='https://apps.apple.com/us/developer/doumori-llc/id1864603876' className='SiteFooter_link'>iOS Apps</a>
					</nav>
					<div>
						<span>Follow ACC on: </span>

						<a href='https://www.facebook.com/animalcrossingcommunity'>
							<img
								className='SiteFooter_socialIcon'
								src={constants.allImages['layout/social_media_fb.png']}
								srcSet={`
									${constants.allImages['layout/social_media_fb.png']} 1x,
									${constants.allImages['layout/social_media_fb@2x.png']} 2x
								`}
								alt='Follow ACC on Facebook'
							/>
						</a>

						<a href='https://www.instagram.com/animal.crossing.community'>
							<img
								className='SiteFooter_socialIcon'
								src={constants.allImages['layout/social_media_insta.png']}
								srcSet={`
									${constants.allImages['layout/social_media_insta.png']} 1x,
									${constants.allImages['layout/social_media_insta@2x.png']} 2x
								`}
								alt='Follow ACC on Instagram'
							/>
						</a>

						<a href='https://bsky.app/profile/accommunity.bsky.social'>
							<img
								className='SiteFooter_socialIcon'
								src={constants.allImages['layout/social_media_blsk.png']}
								srcSet={`
									${constants.allImages['layout/social_media_blsk.png']} 1x,
									${constants.allImages['layout/social_media_blsk@2x.png']} 2x
								`}
								alt='Follow ACC on Bluesky'
							/>
						</a>

						<a href='https://www.youtube.com/@animalcrossingcommunity'>
							<img
								className='SiteFooter_socialIcon'
								src={constants.allImages['layout/social_media_yt.png']}
								srcSet={`
									${constants.allImages['layout/social_media_yt.png']} 1x,
									${constants.allImages['layout/social_media_yt@2x.png']} 2x
								`}
								alt='Follow ACC on YouTube'
							/>
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
};

export default SiteFooter;
