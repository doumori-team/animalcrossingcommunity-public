import { Link } from 'react-router';

import { ContentBox } from '@layout';
import { constants, routerUtils } from '@utils';

export const action = routerUtils.formAction;

const PoliciesPage = () =>
{
	return (
		<div className='PoliciesPage'>
			<ContentBox>
				<p>The following policies provide guidelines for members' continued use of the website and some of the expected responsibilities for the Staff maintaining it. If you have any questions regarding our policies or would like more information, please post on the <Link to={`/forums/${encodeURIComponent(constants.boardIds.siteSupport)}`}>Site Support board</Link>, and the appropriate Staff member will respond as soon as possible. </p>
				<p>NOTE: Updated or added policies are noted with <span className='PoliciesPage_updated'>Blue headings</span>. Dates next to headings indicate date added or last updated.</p>
				<p className='PoliciesPage_lastUpdated'>Last updated 1/28/2023.</p>
				<ul>
					<li>
						<span className='PoliciesPage_updated'>Archival of Large Threads - 2/29/2020</span>
						<p>In order to preserve space and speed on ACC, as well as to keep the public and private boards tidy, threads that have reached a large number of posts will be reviewed by the staff to determine if the thread should be locked and archived. If the thread in question is still on topic and/or serving a useful purpose, the thread creator will be contacted by the staff via private thread to give them the option of starting a new thread for that topic where the discussion can continue. We have tools in place that assist us in identifying the threads that are in need of review; therefore, it is not necessary for members to report threads that we may want to assess.</p>
					</li>
					<li>
						<span className='PoliciesPage_updated'>Compromised User Accounts - 2/29/2020</span>
						<p>Even with the constantly changing nature of online security, ACC has always strived to provide a secure environment for its members. If you suspect that your account has been accessed by another member, it is usually because of one of the following: a) you have given your password out to someone, b) you have left your account logged in at a shared computer (one that is used by other people besides yourself), or c) someone has gained access to your email address.</p>
						<p>In order to avoid this problem, you should carefully choose a password that is unique and that only you will know and not share it with anyone. If you do use a shared computer, you should be sure to always log off by clicking the "Log Out" button at the top right corner of the page you are on before leaving the site. It is also suggested that users change their password occasionally to lessen the risk of a compromised account.</p>
						<p>If you are concerned your password has been compromised, you can securely request a new password by contacting ACC Modmins via these steps:</p>
						<ol>
							<li>
								Email our Modmins directly <a href={'mailto:support@animalcrossingcommunity.com'}>support@animalcrossingcommunity.com</a>.
							</li>
							<li>
								In your email, state who you are, what your username is, and the email address associated with the account. Be sure to mention that you believe your account has been compromised. We will begin working as soon as we see your request.
							</li>
							<li>
								Wait for a response. Some follow up questions may be needed before we reset your password.
							</li>
							<li>
								Once we've verified your account, your password will be reset and you will be emailed a new password link by our Modmins.
							</li>
						</ol>
						<p>After taking these steps, if you believe that you are still having problems or are concerned that another user accessing your account, do not discuss it on the public boards or in private threads. Rather, please go to the Tickets page and create a support ticket so that the Modmins can research the issue further.</p>
					</li>
					<li>
						<span className='PoliciesPage_updated'>e-Reader Card and amiibo Card Trading - 2/29/2020</span>
						<p>While we generally do not permit users to buy, sell, or exchange items of real-world value (see <Link to='/guidelines'>Keep it Safe</Link>), the exception is the exchange of e-Reader cards and amiibo cards. Both e-Reader cards and amiibo cards can be exchanged for other e-Reader cards or amiibo cards. Users are not permitted to sell e-Reader cards or amiibo cards for real world money. We strongly discourage any users under the age of 16 years old from taking part in these types of trades.</p>
						<p>Once you have decided to partake in an e-Reader/amiibo card trade with another user, please discuss further details of the trade in a private thread. We strongly recommend you keep all communication relating to the trade on ACC. Do not disclose personal information or addresses in public posts. Please exchange these details via private threads. You may wish to send a photo of the cards to be traded in your private threads. This can be done by uploading a photo to an image hosting site, obtaining a link, and pasting the link into your private threads. The preferred postage method is to be decided by traders. Proof of postage is not required, although we strongly advise both traders to obtain one. Traders should preferably use the same or (in the case of international trades) very similar postage methods. Please ensure cards are protected when posting, supported by cardboard for example. You may also wish to write "Please do not bend" on the front and back of the envelope in English and in the other country's official language if applicable. Consider writing the address on the envelope you are sending before placing the card inside, in order to avoid damaging the card(s).</p>
						<p>In the event of a dispute, please raise a user ticket providing as many details as possible regarding the trade. If there is evidence that you are failing to fulfill the terms of a trade, whether you acquire proof of postage or not, the Modmins may take action against your account. Members failing to fulfill the terms of a trade in which both members have agreed to obtain a proof of postage will receive a permanent ban from the site. Any member that is blatantly scamming or stealing from other members will be permanently banned.</p>
					</li>
					<li>
						<span className='PoliciesPage_updated'>Site Bans - 1/28/2023</span>
						<p>The ACC Modmins work hard to enforce the guidelines and policies of the site fairly and consistently. Some of our guidelines enable the site to function smoothly and remain family-friendly, while other guidelines are to ensure the safety and comfort of all ACC members.</p>
						<p>Some violations of community guidelines and policies may result in a short-term temporary ban on a member's account to prevent them from using the site. In more severe cases, a long-term temporary ban may be placed on a member's account. In extreme cases, when it is deemed necessary to protect other members of the community, the Modmins may permanently ban a member from the site. Most users on the verge of receiving a permanent ban will receive a written final warning from the Modmins as a last chance to rectify their behavior. Any member who has been banned will receive notification of the ban via email with an explanation of why the ban occurred. In very particular cases, the Modmins may issue a permanent ban without any warnings and without sending a ban notification email.</p>
						<p>The Modmins will not discuss the circumstances or terms of a ban with anyone except the banned member. This is to protect the privacy of the member involved. For the same reason, no one should discuss the circumstances of a ban anywhere on the site. Please see <Link to='/guidelines'>the Accounts section of the Community Guidelines</Link> for more details regarding this. If a banned member has questions about the circumstances of a ban, they should contact the Modmins by sending an email to <a href={'mailto:support@animalcrossingcommunity.com'}>support@animalcrossingcommunity.com</a> or reply to a ban notification email.</p>
						<p>The Modmins recognize that permanently banned members can mature or take responsibility for the behavior that resulted in their ban. In these cases, permanent bans may be reviewed by the Modmin team. To request a review, an email should be sent to <a href={'mailto:support@animalcrossingcommunity.com'}>support@animalcrossingcommunity.com</a> explaining why the ban should be lifted. Please note that while there is no strict time limit, bans less than a year old are highly unlikely to be lifted. All requests are thoroughly discussed by multiple members of the Modmin team. If the Modmin team agrees to lift a permanent ban on an account, the account in question will be reinstated and monitored closely. In the event that the Modmin team decides to deny a permaban reversal request, any further permaban reversal requests sent in by the member will be ignored for one year after the denial was issued.</p>
					</li>
					<li>
						<span className='PoliciesPage_updated'>Site Images and Content - 2/29/2020</span>
						<p>We do not allow use of any images found on the site, including but not limited to character images, emotes, avatar backgrounds, and banners. We also do not allow direct linking to images on our servers.</p>
					</li>
					<li>
						<span className='PoliciesPage_updated'>Trade Feedback &#38; WiFi Rating Changes - 2/29/2020</span>
						<p>In the event that you feel you have received unfair trade feedback or an unfair WiFi rating, please use the "Report a Problem" button in the trade or on the WiFi ratings page to send in a user ticket on the trade feedback or WiFi rating in question for the Modmins to review. If it is determined that the trade feedback or WiFi rating in question is in violation of our <Link to='/guidelines'>Community Guidelines</Link>, it will be edited or deleted as warranted. Keep in mind that Modmins may only make a change to trade feedback or WiFi ratings with sufficient proof located on ACC (trade messages, message board posts, private threads, etc.) to document your case.</p>
						<p>While you may edit any WiFi ratings that you give to other users, we do not permit you to edit trade feedback after it has been submitted. If you feel specific trade feedback that you have issued needs to be updated or edited, please use the "Report a Problem" button on the trade in question to send in a user ticket on the trade feedback in question. In your user ticket, please detail why you feel the trade feedback you issued needs to be changed.</p>
					</li>
					<li>
						<span className='PoliciesPage_updated'>Usage of the Terms "Official" and "ACC" - 2/29/2020</span>
						<p>In order to avoid confusion, members should not use the terms "Official" or "ACC" in the titles or descriptions of contests, competitions, fanfics, giveaways, etc. These terms are only used for threads that are sponsored or run by ACC Staff or their representatives. </p>
					</li>
					<li>
						<span className='PoliciesPage_updated'>User Privacy - 2/29/2020</span>
						<p>ACC respects the privacy of its members. For more information, please see our <Link to='/legal/privacy'>Privacy Policy</Link> and <Link to='/legal/coppa'>About COPPA</Link> pages.</p>
					</li>
				</ul>
				<p>While these policies cover most (but not necessarily all) of the policies that govern the daily operations of ACC, they may be changed or expanded as needed. The Staff reserve the right to change these policies at any time and will post an Announcement to inform the community when such changes come into effect. Your continued use of the site after such an announcement indicates your agreement to follow the updated policies.</p>
			</ContentBox>
		</div>
	);
};

export default PoliciesPage;
