import React from 'react';
import { Link } from 'react-router-dom';

import { ContentBox } from '@layout';

const COPPAPage = () =>
{
	return (
		<ContentBox>
			<p><strong>Q: What is COPPA?</strong></p>
			<p>A: COPPA stands for Children's Online Privacy Protection Act, a law that was made effective April 21, 2000, in order to protect the privacy of children under 13 on websites. The law itself is quite complex, and you can read more about it at <a href={'https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions'}>FTC.gov</a>.</p>
			<p><strong>Q: How does COPPA affect Animal Crossing Community?</strong></p>
			<p>A: ACC, like many other online sites, requires an email address to join and also allows interaction with other members of the site through public and private discussions. Additionally, ACC allows members to post various pieces of personal information, such as their name and location, into a personal profile viewable only by other ACC members. COPPA requires sites, like ACC, that allow such interaction and info sharing to obtain parental consent before collecting any personal information from children under 13. This means that children under 13 need parental consent to participate on the site. For members 13 and older, parental consent is not needed.</p>
			<p><strong>Q: What happens when a child under 13 signs up?</strong></p>
			<p>A: If a member indicates that they are under 13 years of age when signing up, they are given the option to enter their parent's (or guardian's) email address. An email is sent to the parent/guardian with an explanation of the site and why we require permission for the child to participate on ACC. Instructions for denying or providing consent are included in the e-mail. If the parent gives consent, the child is allowed to participate on ACC just like all other ACC members.</p>
			<p><strong>Q: Will everyone be able to see my birthday?</strong></p>
			<p>A: All members have the option to show or hide their birthday from their profile and from the homepage birthday list. You can choose to show your birth day/month in your profile and on the homepage birthday list, or just show your age, or both. All members' birthdays are hidden by default.</p>
			<p><strong>Q: What happens if the parent/guardian denies consent?</strong></p>
			<p>A: Parents/guardians can deny consent to allow their children to participate on ACC. When this happens, the child's account is deleted.</p>
			<p><strong>Q: What happens if the parent/guardian fails to provide or deny consent?</strong></p>
			<p>A: If the parent/guardian does not provide consent within 30 days, the child's account will be deleted</p>
			<p><strong>Q: What do parents /guardians have to do to give consent?</strong></p>
			<p>A: If a parent/guardian chooses to give consent to ACC for allowing their child to participate, they must donate $0.30 to PayPal through the Consent Form. The donation is used because a credit card transaction is an acceptable form of parental consent. The $0.30 is used to cover the <a href={'https://www.paypal.com/cgi-bin/webscr?cmd=_display-receiving-fees-outside'}>fee that PayPal charges</a> for the transaction. ACC receives no part of the donation.</p>
			<p><strong>Q: Is sending money through PayPal safe?</strong></p>
			<p>A: We feel that PayPal is perfectly safe and secure. We have been accepting donations through PayPal for several years and have a <Link to='honorary'>long list</Link> of members that have previously donated, and have never heard anyone complain about the safety of their transactions. If you are concerned about the safety and security of the online payment, you can purchase a Visa or Mastercard gift card, and use that for your donation.</p>
			<p><strong>Q: Are there no other options for parental consent? What about a letter or phone call?</strong></p>
			<p>A: While COPPA does accept letters and phone calls as methods for parental consent, ACC cannot accept these methods of consent because we are a privately operated site and do not have the resources or time to handle the receiving and processing of letters and phone calls. Besides credit card transactions, these are the only other two acceptable methods of parental consent.</p>
			<p><strong>Q: What about having the parent/guardian send an email?</strong></p>
			<p>A: COPPA will not accept email as a method of parental consent for ACC, as this can easily be falsified.</p>
		</ContentBox>
	);
};

export default COPPAPage;
