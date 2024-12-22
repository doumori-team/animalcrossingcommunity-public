import React from 'react';
import { Link } from 'react-router-dom';

import { ContentBox } from '@layout';
import { constants } from '@utils';
import DonateButton from '@/components/layout/DonateButton.tsx';
import { RequireUser } from '@behavior';

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
					<p>
						<strong>All members donating $5 or more receive:</strong>
						<ul>
							<li>
								A badge with their posts, indicating that they're an Honorary Citizen.
							</li>
							<li>
								The ability to add markup to their signatures.
							</li>
						</ul>
					</p>
					<p>
						<strong>Members donating $10 or more receive:</strong>
						<ul>
							<li>
								Signature cap raised to 600 characters.
							</li>
							<li>
								Buddy cap raised to 200.
							</li>
						</ul>
					</p>
					<p>
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
					</p>
					<p>
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
					</p>
					<p>
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
					</p>
				</RequireUser>
				<p>
					If you feel you would like to support ACC, please follow these important instructions:
				</p>
				<p>
					<ol>
						<li>
							You must be 18 years of age or older. If you are not 18 years of age or older, and would like to help us out, please ask your parent or guardian to read this. If they feel they want to help, have them follow these instructions.
						</li>
						<li>
							Use the button below to enter PayPal's secure donation page. All you need to do is enter the amount you wish to donate and either enter your credit card info or use your PayPal account. A PayPal account is not required — you can donate using any major credit card.
						</li>
						<li>
							Since PayPal charges us a fee for each transaction we receive, please make your donations for a minimum of $5.
						</li>
						<RequireUser silent>
							<li>
								We accept and appreciate donations of any amount, but only donations of $5 or more will receive the perks listed above.
							</li>
							<li>
								Once you have completed your donation, the <Link to='/honorary-citizens'>ACC Honorary Citizens</Link> page should automatically update to indicate that you have donated, and any perks should take effect.
							</li>
							<li>
								If you chose to the monthly or yearly payment option on PayPal, please give it 24 hours for ACC to update to reflect the first payment. If you do not see it after 24 hours, reach out on the <Link to={`/forums/${constants.boardIds.siteSupport}`}>Site Support board</Link>.
							</li>
						</RequireUser>
					</ol>
				</p>
				<RequireUser silent>
					<p>
						You may also choose to donate for another user. Simply choose their name in the list below and all perks will apply to them. Note that this applies for one-time donations only; chosing a different user here then chosing on PayPal's side to make a monthly or yearly payment will only apply the payments to your own account.
					</p>
					<p>
						If you have further questions about donations, feel free to post them on the <Link to={`/forums/${constants.boardIds.siteSupport}`}>Site Support board</Link>.
					</p>
				</RequireUser>
				<p>
					Thank you so much for your support!
				</p>
				<p>
					<DonateButton
						donate
					/>
				</p>
			</ContentBox>
		</div>
	);
};

export default DonatePage;
