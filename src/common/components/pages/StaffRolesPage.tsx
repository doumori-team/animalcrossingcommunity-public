import { Link } from 'react-router';

import { RequireUser, RequirePermission } from '@behavior';
import { ContentBox, Header } from '@layout';
import { constants, routerUtils } from '@utils';
import { Form, RichTextArea, Text } from '@form';
import NavMenu from '@/components/layout/NavMenu.tsx';
import { APIThisType, UserGroupType, EmojiSettingType } from '@types';

export const action = routerUtils.formAction;

const StaffRolesPage = ({ loaderData }: { loaderData: StaffRolesPageProps }) =>
{
	const { staffGroups, selectedGroupId, emojiSettings } = loaderData;

	const selectedStaffGroup = selectedGroupId ?
		staffGroups.find(sg => sg.id === selectedGroupId) : null;

	const sortOrder = [
		constants.staffIdentifiers.admin,
		constants.staffIdentifiers.mod,
		constants.staffIdentifiers.researcherTL,
		constants.staffIdentifiers.researcher,
		constants.staffIdentifiers.devTL,
		constants.staffIdentifiers.dev,
		constants.staffIdentifiers.scout,
	];

	let title = '';

	if (selectedStaffGroup)
	{
		title = `Apply to be a ${selectedStaffGroup.name}`;

		if ([
			constants.staffIdentifiers.mod,
			constants.staffIdentifiers.scout,
		].includes(selectedStaffGroup.identifier))
		{
			title = `Nominate a ${selectedStaffGroup.name}`;
		}
	}

	const getGroupInfo = (selectedStaffGroup: UserGroupType): any =>
	{
		switch (selectedStaffGroup.identifier)
		{
			case constants.staffIdentifiers.admin:
				return <>
					<div className='StaffRolesPage_description'>
						ACC was founded in October 2002 by <Link to={`/profile/1`}>jader201</Link>, shortly after the release of Animal Crossing: GameCube. In 2022. he transferred ownership of ACC to the current Administrators. The original site layout and graphics of ACC were created by <Link to={`/profile/129`}>hoggle</Link>, who is now inactive.

						There are Administrators who manage the ACC Staff and the site. Administrators have first acquired a significant amount of experience as Staff and therefore already have a good grounding in the ethics and principles of ACC. They are elected to the role by other Staff members.
					</div>
					<div className='StaffRolesPage_responsibilities'>
						<h3>Responsibilities</h3>
						<p>Administrators perform many of the same duties as Moderators. In addition to those, they have the following responsibilities:</p>
						<ul>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Recruitment of Staff</span> -- Administrators manage the recruitment process for new Staff.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Staff Training</span> -- New Staff are helped to settle into their role and are trained by their colleagues. This training is overseen and guided by the Administrators. The training and management of Staff is essential to ensure that all Staff work consistently, fairly and within the rules of the Site.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Site Announcements</span> -- Administrators are responsible for posting site announcements which inform the Community about Animal Crossing, ACC and other important updates or relevant information.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Manage Site Updates</span> -- Whether it's overseeing the Development team or initiating discussion of rule updates, Administrators are expected to be proactive in ensuring that the rules, systems, processes and features are kept up to date and are relevant to the Community whilst remaining true to the principles of the site.
							</li>
						</ul>
					</div>
				</>;
			case constants.staffIdentifiers.mod:
				return <>
					<div className='StaffRolesPage_description'>
						Moderators are Staff members that are level-headed and open minded when faced with difficult situations. Their job is to enforce the site rules and policies in a fair and consistent way, as well as to help the Community and provide mediation for disputes.
					</div>
					<div className='StaffRolesPage_responsibilities'>
						<h3>Responsibilities</h3>
						<p>Moderators are expected to fulfill the following duties:</p>
						<ul>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>User Tickets</span> -- Members send in a User Ticket to report a problem with user content. These UTs are reviewed and a proper course of action is enacted with regard to the reported content, the rule violation, the violation level and the user history.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Support Email</span> -- Moderators review and respond to all support emails.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Participate in Discussion</span> -- Moderators are expected to actively participate in various discussions. Their experience is essential in adding dimension to discussions, as is their familiarity with the patterns of behavior exhibited in the Community. Combined, both provide crucial insights that help to shape new rules and features.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Monitor Boards</span> -- Moderators regularly patrol boards to help keep the site family-friendly and also to help the Community.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Testing and Providing Feedback</span> -- Once Developers have completed the coding of potential updates, Moderators are instrumental in testing the features that directly relate to their job. Alongside the rest of the Staff, Moderators also test the universal features, to provide feedback on the changes, thus enabling a smoother transition for the Community.
							</li>
						</ul>
					</div>
					<div className='StaffRolesPage_recruitment'>
						<h3>Recruitment</h3>
						<p>Members do not apply for the role but can be nominated by others. Potential candidates are then observed, considered and subsequently chosen by the existing Moderators and Administrators. Since the role involves having access to sensitive information about users and the site, Moderators are expected to be trustworthy and discreet. Therefore, the decision to extend the offer of a Moderator role to a Member is only made after a vetting procedure, partly based on the following criteria required to fulfill the role:</p>
						<ul>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Age</span> -- Candidates are generally a minimum of 18 years old but there is no upper age restriction. We aim to have a good mixture of ages so that varying points of view are covered in discussion.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Site Activity</span> -- Only those that have been consistently active on ACC for at least 12 months are considered for this role.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Maturity</span> -- Moderators are level-headed, fair and objective since they are expected to remain calm in sometimes emotionally charged situations. We look for candidates who can handle the pressures of being provoked without having a tendency to retaliate.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Responsibility</span> -- Moderators have access to all private threads and can issue notifications for rule violations, but that doesn't mean that they should do so without good cause. We therefore look for candidates who have demonstrated that they can conduct themselves responsibly.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Communication</span> -- Moderators need to have good, clear communication with everyone. Good grammar and spelling is also important, as is their willingness to participate frequently in various discussions. Therefore candidates are assessed on how well they express themselves and respond to difficult situations.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Trustworthiness</span> -- Moderators conduct themselves in a professional, friendly and helpful manner. Adhering to site rules and respecting others will help to show that the candidate can be responsible and is likely to be trustworthy. Members with excessive notifications are not likely to be considered.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Helpfulness</span> -- Moderators not only enforce site rules but also help the Community with issues that require Moderator assistance and guidance. Members who are helpful to others and show a general concern for the well-being of the site are more likely to be considered.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Teamwork</span> -- Moderators work as a team, respecting the opinions of all Staff as well as offering their own observations. We therefore look for people who accept constructive criticism and respect that their own opinion is an equal among many.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Knowledge</span> -- Moderators have sound knowledge of the Site Rules and also knowledge of different aspects of ACC and the Animal Crossing games. New Moderators are expected to become very familiar with all three and therefore candidates are expected to have demonstrated basic knowledge in these areas before being considered.
							</li>
						</ul>
					</div>
				</>;
			case constants.staffIdentifiers.researcherTL:
				return <>
					<div className='StaffRolesPage_description'>
						A few Researchers are also given the position of Researcher Lead. They are responsible for overseeing events, as well as newsletter and other miscellaneous tasks. Team Leads delegate tasks and other assignments to each Researcher, begin conversations regarding upcoming events/tasks, and ensure all responsibilities required are met. Team Leads also keep documentation organized and manage upcoming deadlines by setting quotas and ensuring they are met.
					</div>
				</>;
			case constants.staffIdentifiers.researcher:
				return <>
					<div className='StaffRolesPage_description'>
						Although all Staff can put forward new ideas, Researchers are instrumental in the process of keeping ACC updated. Their ability to understand which ideas could greatly improve the site, leads to a constant supply of new threads initiating discussion of possible new features. The Researcher role also involves keeping up to date with the ideas posted by the Community on various boards and ensuring that these ideas are brought to the attention of all Staff. Although not all ideas are accepted as the features may not be possible or are incompatible with the purpose of the site, they are at least discussed and sometimes influence the outcome of other features that are implemented.
					</div>
					<div className='StaffRolesPage_responsibilities'>
						<h3>Responsibilities</h3>
						<p>Researchers are expected to fulfill the following duties:</p>
						<ul>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Initiate Feature Discussions</span> -- Researchers are required to help provide ideas for potential features and updates. They do this by initiating and then actively participating in discussions and looking for alternatives when the original ideas aren't feasible.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Monitor Site Suggestions Board</span> -- The <Link to={`/forums/${encodeURIComponent(constants.boardIds.siteSuggestions)}`}>Site Suggestions board</Link> is where the Community post suggestions and offer critique about the site. Researchers are required to actively participate in discussions and push good ideas from this board, to the attention of the Developers and other Staff.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Monitor Site Support Board</span> -- The <Link to={`/forums/${encodeURIComponent(constants.boardIds.siteSupport)}`}>Site Support board</Link> is where the Community requests help and informs the Staff of site errors. Some of the topics cover technical issues and legitimate concerns that only Developers are able to provide solutions for. However, some solutions require coding and therefore Researchers also monitor this board to ensure that the applicable discussion threads are created for the Developers.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Review Existing Content</span> -- Although new features are always a bonus, it's important to review existing content and refresh it, as well as fix bugs and faults. Researchers are required to look at current features and static content to see if updates may be required.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Testing and Providing Feedback</span> -- Once Developers have implemented new features, they and other Staff test out the features before adding them to the site. Researchers are instrumental in beta-testing and providing critical feedback on the changes, in an effort to provide a better transition for the Community.
							</li>
						</ul>
					</div>
					<div className='StaffRolesPage_recruitment'>
						<h3>Recruitment</h3>
						<p>Members who feel they have they have the skills to become part of the Researcher Team initially submit an application form. The ACC Staff consider a number of factors when assessing an application, some of which are listed below.</p>
						<ul>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Age</span> -- Applicants should be a minimum of 13 years old but there is no upper age restriction. We aim to have a good balance of younger and older members, with varying degrees of experience.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Site Activity</span> -- A person who has been active for a while can more easily assess which new features would be relevant to the Community and which features are in need of updating. Thus applications tend to be considered only from those who have been consistently active on ACC for at least 9 months.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Communication</span> -- Researchers need to have good, clear and precise communication with everyone. Applicants should therefore have a history of both expressing their ideas well and responding to others constructively on the public boards.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Responsibility</span> -- Adhering to site rules and respecting others will help to show that the applicant can be responsible and is likely to be trustworthy. This is important as Researchers are expected not to divulge any information to the Community which has been read or discussed on Staff boards.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Maturity</span> -- Applicants need to remain calm and composed at all times. Although communication is a crucial factor, applicants are also assessed on their responses when faced with critique or opposition to their opinions. Accepting that other people can have different but equally valid points, is seen as a sign of maturity.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Creativity</span> -- Applicants should have original and interesting ideas, that fit in with the purpose of the site.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Teamwork</span> -- Applicants need to demonstrate the ability to build upon ideas proposed by others, rather than only concern themselves with their own ideas and topics.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Knowledge</span> -- Researchers have a sound knowledge of different aspects of ACC and the Animal Crossing games. Therefore applicants are expected to have demonstrated great familiarity in these areas before being considered.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Creative Writing</span> -- Although we look for many criteria in potential Researchers, applications from those skilled mainly in creative writing are also welcome. Writers are essential for adding new material and in improving existing static content.
							</li>
						</ul>
					</div>
				</>;
			case constants.staffIdentifiers.devTL:
				return <>
					<div className='StaffRolesPage_description'>
						A few Developers are also given the position of Developer Team Leads and they act as gatekeepers for all code submissions. It is their job to merge every code change into one usable codebase by checking that features are working correctly. Team Leads also make decisions on whether features are ready for testing, plus they decide when each testing phase is complete. When Team Leads confirm that testing is free from errors and further amendments are not required, they then merge the changes to the live site. Team Leads may also be entrusted with sensitive information in order to upgrade the code as needed.
					</div>
				</>;
			case constants.staffIdentifiers.dev:
				return <>
					<div className='StaffRolesPage_description'>
						Developers work with Researchers and other Staff to discuss ideas for improving and updating the site. With their coding ability, Developers bring a unique perspective to discussions and also help to steer ideas because they know what is feasible within the existing code.
					</div>
					<div className='StaffRolesPage_responsibilities'>
						<h3>Responsibilities</h3>
						<p>Developers are expected to fulfill the following duties:</p>
						<ul>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Feature Discussions</span> -- Developers are required to actively participate in discussions on potential features by offering feedback, suggestions and alternatives.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Monitor Site Suggestions Board</span> -- The <Link to={`/forums/${encodeURIComponent(constants.boardIds.siteSuggestions)}`}>Site Suggestions board</Link> is where the Community post suggestions and offer critique about the site. Although this board is monitored mostly by Researchers, the Developers also need to occasionally add their unique insight.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Monitor Site Support Board</span> -- The <Link to={`/forums/${encodeURIComponent(constants.boardIds.siteSupport)}`}>Site Support board</Link> is where the Community requests help and informs the Staff of site errors. Some of the topics cover technical issues and legitimate concerns that only Developers are able to provide solutions for. Therefore, monitoring of this board is vital to the Developer role.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Add New Features</span> -- Developers work collaboratively with the other Staff to implement new features and ideas into the site. They are expected to keep the site user-friendly, fresh and innovative.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Update Existing Content</span> -- Although new features are always a bonus, it's important to review existing content and refresh it, as well as fix bugs and faults. Developers are required to be adaptable and able to work on small fixes as well as larger projects such as those required whenever there is a new release of Animal Crossing.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Testing and Providing Feedback</span> -- Developers are expected to test new features to make sure they work properly in their own local development environment and during the beta testing period.
							</li>
						</ul>
					</div>
					<div className='StaffRolesPage_recruitment'>
						<h3>Recruitment</h3>
						<p>Members who feel that they have the skills to become part of the Development Team should initially submit an application form. Staff consider a number of factors when assessing an application, some of which are listed below. Therefore, prior to submitting an application, it's prudent to understand both the requirements and the responsibilities for the role. Requirements include:</p>
						<ul>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Age</span> -- Applicants should be a minimum of 13 years old. We aim to have a good balance of younger and older members, with varying degrees of experience.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Site Activity</span> -- A person who has been active for a while can more easily assess which new features would be relevant to the Community and which features are in need of updating. However, new members showing lots of potential are also encouraged to apply.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Communication</span> -- Developers need to have clear and precise communication with everyone. Applicants should therefore have a history of both expressing their ideas well and responding to others constructively on the public boards.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Responsibility</span> -- Adhering to site rules and respecting others will help to show that the applicant can be responsible and is likely to be trustworthy. This is important as Developers are required to take responsibility for certain tasks and are expected not to divulge any information to the Community which has been read or discussed on Staff boards.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Maturity</span> -- Applicants need to be able to remain calm, composed, and respectful in all site discussions.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Creativity</span> -- Applicants should have original and interesting ideas that fit in with the purpose of the site.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Teamwork</span> -- Applicants need to demonstrate the ability to build upon ideas proposed by others, rather than only concern themselves with their own ideas and topics.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Technical and Graphical Skills</span> -- Members applying to become Developers are expected to have experience in some technologies that will be used in ACC, such as: Node.js; PostgreSQL; React; graphic design; HTML; CSS; and Git. Experience and knowledge of other programs or systems may still be useful, but anyone applying should be prepared to learn JavaScript.
							</li>
						</ul>
					</div>
				</>;
			case constants.staffIdentifiers.scout:
				return <>
					<div className='StaffRolesPage_description'>
						Scouts are Staff members who are friendly, helpful, active and knowledgeable. Therefore they are often the best people to contact when help is required. Members needing advice about Animal Crossing games, advice about ACC Contests, help with navigating around the site or guidance with boards and posting, are strongly encouraged to contact a Scout. Members needing help with Site Rules or with their accounts should contact a Moderator instead.
					</div>
					<div className='StaffRolesPage_responsibilities'>
						<h3>Responsibilities</h3>
						<p>Scouts are expected to fulfill the following duties:</p>
						<ul>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Adoptions</span> -- Scouts adopt New Members who have requested this service on the <Link to={`/new-member`}>Adoption page</Link>. Since New Members are heavily restricted in public posts for the first two weeks, having a Scout offer assistance and guidance helps them to quickly learn the ropes of ACC.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Monitor the Getting Started Board</span> -- Scouts regularly monitor the <Link to={`/forums/${encodeURIComponent(constants.boardIds.gettingStarted)}`}>Getting Started board</Link> to welcome people into the Community, to help those that are returning and also to answer questions and provide guidance.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Discussions</span> -- Scouts are immersed into the Community and the Staff so are in a unique position to understand the problems faced by all. They are therefore encouraged to propose helpful ideas and participate in discussions of new site features which would greatly benefit the Community but remain true to the principles of the site.
							</li>
							<li>
								<span className='StaffRolesPage_responsibilityTitle'>Testing and Providing Feedback</span> -- Once Developers have implemented new features, they and other Staff test out the features before adding them to the site. Scouts are instrumental in beta-testing and providing critical feedback on the changes, in an effort to provide a better transition for the Community.
							</li>
						</ul>
					</div>
					<div className='StaffRolesPage_recruitment'>
						<h3>Recruitment</h3>
						<p>Members do not submit applications to apply for the role but can be nominated by others. Potential candidates are then observed, considered and subsequently chosen by the Staff whose decisions are influenced by the following criteria required to fulfill the Scout role:</p>
						<ul>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Age</span> -- Candidates should be a minimum of 13 years old but there is no upper age restriction.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Site Activity</span> -- ACC continuously gains New Members, many of whom need Scout assistance. Therefore, candidates should have been consistently active and helpful on ACC for at least 9 months before they are considered for this role.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Disposition</span> -- Scouts are often the first member of Staff that New Members encounter and are also the friendly face of Staff. Candidates should therefore have a history of positive, helpful and friendly interactions with everyone.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Communication</span> -- Scouts need to have good, clear and friendly communication with everyone. Candidates should therefore have a history of both expressing themselves well and responding to others positively on the public boards.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Helpfulness</span> -- The central role of a Scout is to help the Community while contributing to the family-friendly and fun environment. Candidates should therefore have a history of helpful interactions and a basic understanding of the Site Rules. A background in running contests and games would also be desirable.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Knowledge</span> -- Scouts handle many questions about ACC and the AC games on a daily basis. They are also expected to adhere to Site Rules. Members who demonstrate good knowledge in these areas are more likely to be considered.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Responsibility</span> -- Members who adhere to the rules and respect others, are viewed as being responsible and likely to be trustworthy. Scouts sometimes have access to site sensitive information and need to be trusted not to share this information outside of the ACC Staff. Thus, candidates with excessive notifications are less likely to be considered.
							</li>
							<li>
								<span className='StaffRolesPage_recruitmentTitle'>Teamwork</span> -- Candidates need to demonstrate the ability to build upon ideas proposed by others, rather than only concern themselves with their own ideas and topics. Acknowledging various and opposing opinions shows that the candidate is interested in others and therefore can work within a team.
							</li>
						</ul>
					</div>
				</>;
		}
	};

	return (
		<div className='StaffRolesPage'>
			<Header name='Staff Roles'>
				<NavMenu>
					{staffGroups
						.sort((a, b) => sortOrder.indexOf(a.identifier) - sortOrder.indexOf(b.identifier))
						.map(staffGroup =>
							<NavMenu.Button path={`/staff-roles/${encodeURIComponent(staffGroup.id)}`} key={staffGroup.id}>
								{staffGroup.name}
							</NavMenu.Button>,
						)}
				</NavMenu>
			</Header>
			{selectedStaffGroup &&
				<ContentBox>
					<div className='StaffRolesPage_section'>
						{getGroupInfo(selectedStaffGroup)}
					</div>
					<RequireUser silent>
						{[
							constants.staffIdentifiers.mod,
							constants.staffIdentifiers.scout,
							constants.staffIdentifiers.dev,
							constants.staffIdentifiers.researcher,
						].includes(selectedStaffGroup.identifier) &&
							<div className='StaffRolesPage_section'>
								<h3>
									{[
										constants.staffIdentifiers.mod,
										constants.staffIdentifiers.scout,
									].includes(selectedStaffGroup.identifier) && 'Nomination'}
									{[
										constants.staffIdentifiers.dev,
										constants.staffIdentifiers.researcher,
									].includes(selectedStaffGroup.identifier) && 'Application'}
								</h3>
								<div className='StaffRolesPage_apply'>
									<p>While the Staff are not always looking to add more to the team, applications and nominations are welcome at any time. However, please understand that these won't be considered until we intend to recruit.</p>
									<ul>
										<li>
											Be sure to fully address all of the requirements for a position, providing examples where possible. Don't be afraid to write extensively as long as what you are including is useful for the Staff.
										</li>
										{[
											constants.staffIdentifiers.dev,
											constants.staffIdentifiers.researcher,
										].includes(selectedStaffGroup.identifier) &&
											<>
												<li>
													Submit only one application in a six month period. If you've not had a response, you may reapply six months after your previous application or if we announce that applications are needed. Wait for us to contact you. We will contact you only if your application is successful and if we are in need of additional Staff.
												</li>
												{[
													constants.staffIdentifiers.dev,
												].includes(selectedStaffGroup.identifier) &&
													<li>
														If you have evidence of your technical and / or graphical skills, be sure to include such evidence. For example, links to a website you contribute to, or examples of completely original graphic design. While this is not necessarily a requirement, failure to provide evidence for claimed qualifications may disqualify your application.
													</li>
												}
											</>
										}
									</ul>
								</div>
								<RequirePermission permission='apply-nominate-staff' silent>
									<fieldset className='NodeWritingInterface'>
										<Form action='v1/users/apply' showButton>
											<legend>
												<h1 className='NodeWritingInterface_heading'>
													{title}
												</h1>
											</legend>

											<input
												type='hidden'
												name='groupId'
												value={selectedGroupId}
											/>

											{[
												constants.staffIdentifiers.mod,
												constants.staffIdentifiers.scout,
											].includes(selectedStaffGroup.identifier) &&
												<Text
													hideLabels
													className='NodeWritingInterface_title'
													name='username'
													label='Title'
													maxLength={constants.max.postTitle}
													required
												/>
											}

											<RichTextArea
												textName='text'
												formatName='format'
												key={Math.random()}
												label={title}
												emojiSettings={emojiSettings}
												required
												upload
											/>
										</Form>
									</fieldset>
								</RequirePermission>
							</div>
						}
					</RequireUser>
				</ContentBox>
			}
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<StaffRolesPageProps>
{
	const selectedGroupId = Number(id);

	const [userGroups, emojiSettings] = await Promise.all([
		this.query('v1/user_groups'),
		this.query('v1/settings/emoji'),
	]);

	return {
		staffGroups: userGroups.filter((ug: UserGroupType) => [
			constants.staffIdentifiers.mod,
			constants.staffIdentifiers.researcher,
			constants.staffIdentifiers.dev,
			constants.staffIdentifiers.scout,
			constants.staffIdentifiers.admin,
			constants.staffIdentifiers.devTL,
			constants.staffIdentifiers.researcherTL,
		].includes(ug.identifier)),
		selectedGroupId: selectedGroupId,
		emojiSettings: emojiSettings,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type StaffRolesPageProps = {
	staffGroups: UserGroupType[]
	selectedGroupId: number
	emojiSettings: EmojiSettingType[]
};

export default StaffRolesPage;
