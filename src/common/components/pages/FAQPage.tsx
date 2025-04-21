import { Link } from 'react-router';

import { ContentBox } from '@layout';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const FAQPage = () =>
{
	return (
		<div className='FAQPage'>
			<ContentBox>
				<h1>FAQ</h1>
				<ul>
					<li><a href='#acc-time'>What is ACC Time?</a></li>
					<li><a href='#acc-staff'>Why do some users have special characters, backgrounds, or names on their avatars?</a></li>
					<li><a href='#user-tickets'>What are the red alert markers for?</a></li>
					<li><a href='#banned-word'>Why is [INSERT WORD] a banned word?</a></li>
					<li><a href='#banned-account'>My account has been banned; what can I do?</a></li>
					<li><a href='#guessed-password'>I suspect someone may have guessed my password; what should I do?</a></li>
					<li><a href='#terminate-account'>How do I terminate my account?</a></li>
					<li><a href='#profile-removed'>Why was part of my profile removed?</a></li>
					<li><a href='#icons-def'>What do the various icons next to a thread title mean (sticky, locked thread, favorite)?</a></li>
					<li><a href='#new-member-restrictions'>Why can't I post on the boards (New Member Restrictions)?</a></li>
					<li><a href='#adoption'>Where is the adoption page?</a></li>
					<li><a href='#guideline'>What if I don't agree with a certain guideline?</a></li>
					<li><a href='#account-email'>Can my family member create an account on ACC using the same email used on my account?</a></li>
					<li><a href='#bad-trade'>What do I do if someone rips me off in a trade?</a></li>
					<li><a href='#rate-wifi'>How do I rate someone after WiFi-ing with them?</a></li>
					<li><a href='#bad-wifi'>Someone treated me badly during a WiFi session; what can I/the ACC Staff do about it?</a></li>
					<li><a href='#bad-rating'>Someone left a negative rating or harsh comment even though I haven't done anything wrong!</a></li>
					<li><a href='#become-staff'>How do I become an ACC staff member (Admin/Mod/Dev/Res/Scout)?</a></li>
					<li><a href='#nominate-staff'>How do I nominate someone for a staff position?</a></li>
					<li><a href='#time-tickets'>Why does it take so long for some UTs to be put through?</a></li>
					<li><a href='#mod-decision'>I don't agree with a Moderator's decision; what can I do?</a></li>
					<li><a href='#mod-pts'>I'm afraid that the Moderators are going through my PTs!</a></li>
					<li><a href='#ex-staff'>Why do the staff pick scouts/mods that have already been in the staff before?</a></li>
					<li><a href='#treasure'>What is ACC treasure?</a></li>
					<li><a href='#treasure-locs'>Where do treasures appear?</a></li>
					<li><a href='#missed-bells'>I've missed Bells! How can I get them back?</a></li>
					<li><a href='#jackpot'>Why can't I find the Jackpot?</a></li>
				</ul>

				<div id='acc-time'>
					<h3>What is ACC time?</h3>
					<p>At the top of all pages of ACC, there is a clock along with the current date. You are not able to change the time on this, as it goes along with the timezone of the site, Eastern Time (ET), which is the time of the East Coast of the United States. The most basic reason for this is so that when WiFi-ing with someone not in your timezone, you can easily set a time by saying "Meet at 3PM ACC Time", for example, and not get messed up.</p>
				</div>
				<div id='acc-staff'>
					<h3>Why do some users have special characters, backgrounds, or names on their avatars?</h3>
					<p>The users that you see with special characters, backgrounds, or their names on their avatars are members of the ACC staff. Staff members get special avatars as a thank-you for the extra responsibility they take on around the site. The Scouts have a special set of backgrounds and characters available to them that non-staff cannot use. The Mods and Admins each have their own custom-made avatar with their username.</p>
				</div>
				<div id='user-tickets'>
					<h3>What are the red alert markers for?</h3>
					<p>Click on one of the pitfall seed icons around the site to send in a guideline violation report (User Ticket) regarding content produced by any user. An ACC Moderator will then review and process the User Ticket. ACC Moderators make sure that the <Link to='/guidelines'>Community Guidelines</Link> are obeyed, so if you think there's a post, pattern, profile, town tune, etc. that steps over the guidelines, you can send in a report.</p>
				</div>
				<div id='banned-word'>
					<h3>Why is [INSERT WORD] a banned word?</h3>
					<p>Words are added to the language filter on an as-needed basis. All words that have been added to the filter have been added for a reason; bypassing the filter is against our guidelines. If you don't understand why something is in the filter, you may PT a Moderator and ask. The only exception to the guideline against bypassing the language filter is for cases in which a banned word has an acceptable, family-friendly use or is part of a larger word that is not a filtered word. Please note that not all words or phrases that are inappropriate are in the language filter. It would be impossible for us to add every single word that can be used in an offensive context. We therefore ask that you use common sense when posting on our boards.</p>
				</div>
				<div id='banned-account'>
					<h3>My account has been banned; what can I do?</h3>
					<p>You should have received an email explaining why you were banned from our site. If the notification email was not detailed enough or you didn't receive it (often due to spam settings on your email account), you may email site support at <a href={'mailto:support@animalcrossingcommunity.com'}>support@animalcrossingcommunity.com</a> to inquire further. Do not create another account to ask on the boards or in PTs. A person's account status is not open for public discussion or debate.</p>
				</div>
				<div id='guessed-password'>
					<h3>I suspect someone may have guessed my password; what should I do?</h3>
					<p>The first thing you need to do is change your password. Then you may report your profile and let the Moderators know, and they will then work with you to help. Keep in mind that, as per our guidelines, you are responsible for what happens on your account. If you live in a household with others who might try to access your account, make sure that you always log out of the site when you leave.</p>
				</div>
				<div id='terminate-account'>
					<h3>How do I terminate my account?</h3>
					<p>We do not "delete" or "terminate" accounts on ACC. If you no longer wish to use the site, you may delete all personal information from your profile and then stop logging in. That way, should you wish to return in the future, your account will still be available. Please keep in mind that creating more than one account is not permitted.</p>
				</div>
				<div id='profile-removed'>
					<h3>Why was part of my profile removed?</h3>
					<p>Each person's profile is still a part of ACC and must follow ACC's <Link to='/guidelines'>Community Guidelines</Link>. Members are permitted to express their political and religious views in their "Other Stuff About Me" section, provided any religious or political statements are respectful and do not demean the beliefs or views of others. This privilege is meant to be used only to express your beliefs and not to attack other religions. If you use your profile to troll, flame, demean or attack someone's beliefs (religious, political, etc.) then you will receive a notification and the offending content will be removed. Members of the LGBT community are permitted to make discreet mention of their sexual orientation in their profile, provided any statements are non-explicit. Something along the lines of "I am LGBT, and would like to wifi with other LGBT members" would be permitted. </p>
				</div>
				<div id='icons-def'>
					<h3>What do the various icons next to a thread title mean (sticky, locked thread, favorite)?</h3>
					<p>Moderators will sometimes create sticky threads for commonly discussed topics. These threads will be listed above non-sticky threads on the boards. Only Moderators (and Administrators) can sticky threads. A padlock icon identifies a thread as a locked sticky, which is a sticky to which only Administrators can reply. These threads often contain board Guidelines and other board-specific information, so be sure to read them before posting. Clicking the flag icon to the left of a thread adds that thread to your "Followed Threads" category, which can be easily accessed via the drop-down menu at the upper left of each page. You will also receive a notification when a new reply has been made to one or more of your followed threads. Any thread with a solid line through it is locked, which prevents any further replies to it. A thread can be locked only by its creator or by a Moderator or Administrator (Moderators and Administrators will typically only lock a thread due to a guideline violation). To lock a thread you have created, create a new post (or edit a post you've already made) and click the "Lock Thread" slider above the thread title before submitting the post.</p>
				</div>
				<div id='new-member-restrictions'>
					<h3>Why can't I post on the boards (New Member Restrictions)?</h3>
					<p>New Member restrictions were put into place to prevent spam accounts from spamming the boards. Restrictions last for 5 days and are as follows:</p>
					<ul>
						<li>25 public posts per day</li>
						<li>10 public threads per day</li>
						<li>1 minute between posts, public and private</li>
						<li>5 minutes between threads, public and private</li>
					</ul>
				</div>
				<div id='adoption'>
					<h3>Where is the adoption page?</h3>
					<p>The adoption page can be found <Link to='/new-member'>here</Link>. Only new members (those who have joined within the past two weeks) can see what is on this page; other members don't have access to this. The page allows new members looking for help to get adopted by a Scout. Only new members are eligible for adoption.</p>
				</div>
				<div id='guideline'>
					<h3>What if I don't agree with a certain guideline?</h3>
					<p>The Community Guidelines are continuously under review and get updated on a regular basis so that they stay relevant. There may be guidelines that you do not agree with, but there are good reasons for each and every guideline. If you would like an explanation of any guideline, you are welcome to send a PT to one of the Moderators to ask for clarification.</p>
				</div>
				<div id='account-email'>
					<h3>Can my family member create an account on ACC using the same email used on my account?</h3>
					<p>No, they may not. For security reasons, each account on ACC must use a different email address, Otherwise, matters communicated by ACC via email regarding one account could get mixed up with those regarding another account. If you try to create an account with an email address already associated with an existing account, it will be denied.</p>
				</div>
				<div id='bad-trade'>
					<h3>What do I do if someone rips me off in a trade?</h3>
					<p>The trade rating for each ACC member lets other members know whether or not someone is an honest and reliable trader. To keep from being ripped off in the first place, try to trade with members who have a high positive trade rating. If you do get ripped off in a trade, the best thing you can do is to give that person a negative feedback rating. This will encourage other users to avoid trading with that person. You can also contact a Moderator and explain your situation, but remember that Moderators only intervene in extreme situations; the negative user feedback rating is the main deterrent for users who seek to cheat people in their trades.</p>
				</div>
				<div id='rate-wifi'>
					<h3>How do I rate someone after WiFi-ing with them?</h3>
					<p>To rate a member of ACC, go to their profile and select "Friend Codes". If you have shared friend codes with them, you'll have the ability to rate them here. Along with the positive, neutral, or negative rating, you have the option to type a short message explaining why you gave them that rating.</p>
				</div>
				<div id='bad-wifi'>
					<h3>Someone treated me badly during a WiFi session; what can I/the ACC Staff do about it?</h3>
					<p>The first thing you should do is leave that person a negative WiFi rating and constructive comment (remember that all guidelines regarding flaming apply to WiFi comments as well, so avoid name-calling and other insults). Do not post about it on the boards or in PTs, and do NOT send harassing PTs to the person; this is against our guidelines. If the problems caused were severe, you can submit a complaint against that person, but please keep in mind that ACC is not responsible for what happens off-site. You are responsible for getting to know the people that you allow in your town before you meet them in a WiFi session.</p>
				</div>
				<div id='bad-rating'>
					<h3>Someone left a negative rating or harsh comment even though I haven't done anything wrong!</h3>
					<p>You can report the comment, and a Moderator will look into the situation. Remember that moderators cannot investigate what happened while you were visiting another player's town. Because of this, you'll need to provide as many details as you can to allow the moderator to understand the situation and take appropriate action.</p>
				</div>
				<div id='become-staff'>
					<h3>How do I become an ACC staff member (Admin/Mod/Dev/Res/Scout)?</h3>
					<p>ACC Staff members are chosen by the Admins when there is a need for more help to maintain the site. There is not a set step-by-step process to become a staff member, but there are certain qualities that the Admins look for. People who are asked to become staff members are members of the site in good standing who act in ways that demonstrate the true spirit of Animal Crossing Community. Asking to become a staff member will not help your chances of becoming one; show your ACC spirit in your behavior on the site, and if the Admins think you have earned a staff position, they will contact you. You can find out more about each position <Link to='/staff-roles'>here</Link>.</p>
				</div>
				<div id='nominate-staff'>
					<h3>How do I nominate someone for a staff position?</h3>
					<p>You may nominate someone to be a staff member by going to the appropriate <Link to='/staff-roles'>Staff Roles</Link> section.</p>
				</div>
				<div id='time-tickets'>
					<h3>Why does it take so long for some UTs to be put through?</h3>
					<p>The UTs, for Moderators, come up in a big list on a separate page viewable only to them. They can see all UTs that are currently being sorted (usually in discussion or pending decision), as well as UTs not claimed. Remember, Moderators are only human! Sometimes they all take a vacation or a break from modding at nearly the same time, and the UT count can go into the high hundreds. Give them time to take care of everything.</p>
				</div>
				<div id='mod-decision'>
					<h3>I don't agree with a Moderator's decision; what can I do?</h3>
					<p>Your first step should be to discuss the decision with the Moderators. You can ask within the specific Notification that was sent to you. If you are still unhappy, you may discuss the matter with the Administrators. Please remember that they can be very busy and may not get to your issue immediately but that they will get to it. Please remember that it is never acceptable to post your disagreements publicly. Discussing specific guideline violations on the message boards is not permitted.</p>
				</div>
				<div id='mod-pts'>
					<h3>I'm afraid that the Moderators are going through my PTs!</h3>
					<p>Moderators only go through PTs if: 1) They are searching for multiple accounts or 2) Someone reported a post in that PT. Otherwise, they do not go into a PT. The Administrators are very strict about this, and it always results in a destaffing if someone is found doing this.</p>
				</div>
				<div id='ex-staff'>
					<h3>Why do the staff pick Scouts/Mods that have already been in the staff before?</h3>
					<p>Most of the time, it's for convenience. While a lot of people would love to become a staff member, the staff feel that only some people actually have the qualities needed, and the list of those being considered for staff positions is short. Therefore, when an ex-staff member contacts the Admins wishing to become a staff member again, they usually become one the next time new staff members are needed. The staff know already that they can handle the position.</p>
				</div>
				<div id='treasure'>
					<h3>What is ACC treasure?</h3>
					<p>ACC's treasure feature allows users to collect a currency called Bells. There are different prizes: 100 Bells, featuring Timmy and Tommy; 1,000 Bells, featuring Blathers; 5,000 Bells, featuring Mable and Sable; and 10,000 Bells, featuring Totakeke (K.K. Slider). There is also a jackpot prize, featuring Pavé, and a Wisp prize, which allows you to recover some of your missed Bells.</p>
				</div>
				<div id='treasure-locs'>
					<h3>Where do treasures appear?</h3>
					<p>Treasures can be found at the bottom of any page on the site. You may need to scroll down to see them!</p>
				</div>
				<div id='missed-bells'>
					<h3>I've missed Bells! How can I get them back?</h3>
					<p>The only way to reclaim lost Bells is to find a Wisp treasure. Finding Wisp will return ONE of your missed bell treasures. However, if you don't find Wisp before someone wins the jackpot, your missed Bells will automatically reset to zero.</p>
				</div>
				<div id='jackpot'>
					<h3>Why can't I find the jackpot?</h3>
					<p>The jackpot appears in the same locations as every other treasure. However, the jackpot is much harder to find, so it may take a while before you come across it. Just keep browsing ACC like you normally would, and maybe someday you'll get lucky! Also note that the jackpot will not appear before it reaches 20,000 Bells.</p>
				</div>
			</ContentBox>
		</div>
	);
};

export default FAQPage;
