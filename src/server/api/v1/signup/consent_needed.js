import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { UserError } from '@errors';
import * as db from '@db';

async function consent_needed({id, email})
{
	if (this.userId)
	{
		throw new UserError('permission');
	}

	const [user] = await db.query(`
		SELECT user_id
		FROM consent_log
		WHERE guid = $1
	`, id);

	if (!user)
	{
		throw new UserError('bad-format');
	}

	const birthdate = await accounts.getBirthDate(user.user_id);

	const age = dateUtils.getAge(birthdate);

	if (age >= 16)
	{
		throw new UserError('bad-format');
	}

	await accounts.emailUser({
		email: email,
		subject: 'Request for Consent from Animal Crossing Community',
		text: getEmailText(id, age, email),
	});

	await db.query(`
		INSERT INTO consent_log (user_id, action_id, parent_email)
		VALUES ($1::int, 2, $2)
	`, user.user_id, email);

	return {
		_success: 'We have sent your parent / guardian an email. If they give us permission, we will give them instructions to help you finish signing up.',
		_useCallback: true,
	}
}

function getEmailText(id, age, orgEmail)
{
	const vbnewline = '<br/>';

	const origSendTo = constants.LIVE_SITE ? '' : `Originally sending to: ${orgEmail}${vbnewline}${vbnewline}`;

	let email = `Dear Parent / Guardian,${vbnewline}${vbnewline}`;

	email += `Recently, your child attempted to sign up for Animal Crossing Community. In order to protect the privacy of your child, your consent is required before we can let your child become a member of our site.${vbnewline}${vbnewline}`;

	email += `Animal Crossing Community (ACC) is an interactive web site for fans of the Nintendo game series, Animal Crossing. On ACC, your child will be able to interact with other members of ACC both in public and private discussions, and will be able to provide personally identifiable information about themselves, such as their email address, their name, their city/state, a picture of themselves, and other information through their account profile. However, none of this is required. They can participate on ACC without having to provide any information other than their email address.  And unless they specify otherwise, their email address will remain hidden from view from all ACC members except site staff.${vbnewline}${vbnewline}`;

	if (age < 13)
	{
		email += `If you choose to give consent, your consent must be in the form of a $0.30 donation to the site. This donation is done safely and securely through PayPal, and is simply an acceptable method of consent according to COPPA laws. The nominal fee is to cover the PayPal fees for the transaction. ACC receives no part of this donation. Upon completing the donation process through PayPal, you will be directed to a page with instructions for completing the signup process for your child. If you want more details about this, please consult our Privacy Policy and our About COPPA pages listed below. Or, if you have any other questions, feel free to respond to this email.${vbnewline}${vbnewline}`;
	}

	if (constants.LIVE_SITE)
	{
		email += `Note: if the links below do not work, please copy the full link and paste it into your browser's address bar.${vbnewline}${vbnewline}`;
	}
	else
	{
		email += `Note: if the links below do not work, please copy the full link and paste it into your browser's address bar. You will need to do this on test sites.${vbnewline}${vbnewline}`;
	}

	email += `Parental Consent Form: <a href='${constants.SITE_URL}/consent/${id}'>${constants.SITE_URL}/consent/${id}</a> ${vbnewline}${vbnewline}`;

	email += `Privacy Policy: <a href='${constants.SITE_URL}/legal/privacy'>${constants.SITE_URL}/legal/privacy</a> ${vbnewline}${vbnewline}`;

	if (age < 13)
	{
		email += `About COPPA: <a href='${constants.SITE_URL}/legal/coppa'>${constants.SITE_URL}/legal/coppa</a> ${vbnewline}${vbnewline}`;
	}

	email += `Sincerely,${vbnewline}Animal Crossing Community Staff${vbnewline}${vbnewline}`;

	email += `Note: This is a one-time email as a result of your child requesting consent with ACC. You will not receive additional emails from ACC unless your child makes additional requests for consent, or if you decide to give consent, in which we will send one additional email to complete the process.`;

	return '<span style="font-family: Verdana; font-size: 11px;">'+origSendTo+email+'</span>';
}

consent_needed.apiTypes = {
	id: {
		type: APITypes.string,
		required: true,
	},
	email: {
		type: APITypes.regex,
		regex: constants.regexes.email,
		error: 'invalid-email',
		profanity: true,
		required: true,
	},
}

export default consent_needed;