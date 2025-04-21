import { Link } from 'react-router';

import { ContentBox } from '@layout';
import { constants, routerUtils } from '@utils';
import DonateButton from '@/components/layout/DonateButton.tsx';
import { RequireUser } from '@behavior';

export const action = routerUtils.formAction;

const DonatePage = () =>
{
	return (
		<div className='DonatePage'>
			<ContentBox>
				<p>
					If you enjoy ACC and feel that we are providing a safe and fun service to you, you can help support <a href='http://financial.animalcrossingcommunity.com'>our costs</a> and express your appreciation by donating.
				</p>
				<RequireUser silent>
					<p>
						For those who do donate $5 or more, we offer a few perks to express appreciation for your support. All doners receive a spot on our <Link to='/honorary-citizens'>ACC Honorary Citizens page</Link>.
					</p>
					<p>
						Note: All non-monthly-perks listed below last for one year after the donation was submitted. You can find your total donations, and those counting toward perks, on your profile. Monthly donations only count if you choose 'monthly' option at checkout on PayPal.
					</p>
					<strong>All members donating $5 or more receive:</strong>
					<ul>
						<li>
							A badge with their posts, indicating that they're an Honorary Citizen.
						</li>
						<li>
							The ability to add markup to their signatures.
						</li>
					</ul>
					<strong>Members donating $10 or more receive:</strong>
					<ul>
						<li>
							Signature cap raised to 600 characters.
						</li>
						<li>
							Buddy cap raised to 200.
						</li>
					</ul>
					<strong>Members donating $20 or more receive:</strong>
					<ul>
						<li>
							Signature cap raised to 800 characters.
						</li>
						<li>
							Other Stuff About Me cap raised to 16,000 characters.
						</li>
						<li>
							No Buddy cap (unlimited).
						</li>
					</ul>
					<strong>Members donating $5 or more per month receive:</strong>
					<ul>
						<li>
							Post cap raised to 16,000 characters.
						</li>
						<li>
							Other Stuff About Me cap raised to 24,000 characters.
						</li>
						<li>
							5% Bell Shop Discount.
						</li>
					</ul>
					<strong>Members donating $10 or more per month receive:</strong>
					<ul>
						<li>
							Post cap raised to 32,000 characters.
						</li>
						<li>
							Other Stuff About Me cap raised to 32,000 characters.
						</li>
						<li>
							10% Bell Shop Discount.
						</li>
					</ul>
				</RequireUser>
				<p>
					If you feel you would like to support ACC, please follow these important instructions:
				</p>
				<ol>
					<li>
						You must be 18 years of age or older. If you are not 18 years of age or older, and would like to help us out, please ask your parent or guardian to read this. If they feel they want to help, have them follow these instructions.
					</li>
					<li>
						Use the options below to select whether you'd like to do a one time payment or a monthly subscription, and then the amount you'd like to give. You also have the option of adding on an additional fee amount to offset what PayPal charges us.  You can then use the PayPal button(s) to donate. A PayPal account is not required — you can donate using any major credit card.
					</li>
					<li>
						Note that all purchases will be in USD.
					</li>
					<RequireUser silent>
						<li>
							We accept and appreciate donations of any amount, but only donations of $5 or more will receive the perks listed above.
						</li>
						<li>
							Once you have completed your donation, the <Link to='/honorary-citizens'>ACC Honorary Citizens</Link> page should automatically update to indicate that you have donated, and any perks should take effect.
						</li>
					</RequireUser>
				</ol>
				<RequireUser silent>
					<p>
						You may also choose to donate for another user. Simply choose their name in the list below and all perks will apply to them.
					</p>
					<p>
						If you have further questions about donations, feel free to post them on the <Link to={`/forums/${constants.boardIds.siteSupport}`}>Site Support board</Link>.
					</p>
				</RequireUser>
				<p>
					Thank you so much for your support!
				</p>
				<DonateButton
					donate
				/>
			</ContentBox>
		</div>
	);
};

export default DonatePage;
