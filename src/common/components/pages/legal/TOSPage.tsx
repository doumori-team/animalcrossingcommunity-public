import { Link } from 'react-router';

import { ContentBox } from '@layout';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const TOSPage = () =>
{
	return (
		<ContentBox>
			<h1>Animal Crossing Community Terms of Service (TOS)</h1>
			<p><i>Please read the following Terms of Service carefully. This is not the usual legal jargon that comes at the beginning of software installs (you know, that screen where you quickly click I Accept). This TOS is a summary of the main rules that you must follow to be a member of this site. You will be responsible for these rules whether you read them or not, so be sure you understand them, and contact a moderator if anything is unclear.</i></p>
			<p>Animal Crossing Community prides itself on being a family-friendly community. Therefore, there are certain rules you must agree to as a member of this community. You agree, through your use of Animal Crossing Community, to abide by the rules set forth in this TOS, in the <Link to='/guidelines'>Community Guidelines</Link> and <Link to='/legal/policies'>Site Policies</Link>, and elsewhere on the site. You also agree to respect the decisions and authority of ACC staff in enforcing those rules.</p>
			<p>Any users found in violation of those rules will receive a warning from the Moderators and, if the behaviors continue, may lose the privilege to participate in this website. In extreme cases of misbehavior, the user in question will be permanently banned from the site. The staff considers this an action of last resort but will take such action if necessary to stop the disruptive behaviors. A banned user should *not* create additional accounts to circumvent the ban for any reason; any additional accounts will be blocked, and the original ban length may be lengthened as a consequence of the attempt to circumvent the ban. For more details about bans, please see the Site Bans section of the <Link to='/legal/policies'>Site Policies</Link>.</p>
			<p>Neither Animal Crossing Community nor its staff guarantees the accuracy, completeness, or usefulness of any information posted on the message boards or other areas of the site by community members. Messages posted by individual community members express the opinion and views of that member, and not necessarily the views of the site or its staff. Anyone who feels that a posted message or information is objectionable should notify a Moderator or Administrator immediately. The best way to do so is through the use of the "Report A Problem" button on most pages of the site. We reserve the right to remove any content that is deemed objectionable or otherwise not in keeping with the family-friendly atmosphere and rules of the site. This holds true for the message boards, Trading Post, user profiles, Patterns, and all other sections of the site.</p>
			<p>These Terms of Service constitute a living document, in that the staff reserves the right to modify the Terms of Service as needed. Changes to the Terms of Service will be posted in the Announcements, and your continued use of the site after such an announcement will be considered an agreement to the new Terms of Service as they are posted on the site.</p>
		</ContentBox>
	);
};

export default TOSPage;
