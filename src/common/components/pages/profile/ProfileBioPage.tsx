import { Link, useOutletContext, Params } from 'react-router';

import { RequireUser } from '@behavior';
import { ContentBox, ReportProblem, Header, Section, Markup, PhotoGallery } from '@layout';
import { constants, routerUtils } from '@utils';
import { APIThisType, UserBioType, EmojiSettingType, UserType } from '@types';

export const action = routerUtils.formAction;

const ProfileBioPage = ({ loaderData, params }: { loaderData: ProfileBioPageProps, params: Params }) =>
{
	const { user } = useOutletContext() as { user: UserType };

	if (isNaN(Number(params.id)))
	{
		return;
	}

	const { bio, emojiSettings } = loaderData;

	return (
		<div className='ProfileBioPage'>
			<RequireUser permission='view-profiles'>
				<Header
					name='About Me'
					links={
						<>
							<RequireUser id={user.id} permission='modify-profiles' silent>
								<Link to={`/profile/${encodeURIComponent(user.id)}/edit`}>
									Edit
								</Link>
							</RequireUser>
							<Link to={`/threads/${encodeURIComponent(user.id)}`}>
								Threads
							</Link>
						</>
					}
				/>

				<Section>
					<div className='ProfileBioPage_section'>
						<div className='ProfileBioPage_option'>
							<ReportProblem
								type={constants.userTicket.types.profileName}
								id={user.id}
							/>
							<div>Name: {bio.name ? bio.name : user.username}</div>
						</div>

						{bio.location &&
							<div className='ProfileBioPage_option'>
								<ReportProblem
									type={constants.userTicket.types.profileLocation}
									id={user.id}
								/>
								<div>Location: {bio.location}</div>
							</div>
						}

						{bio.email &&
							<div className='ProfileBioPage_option'>
								Email: {bio.email}
							</div>
						}
					</div>
				</Section>

				{bio.bio &&
					<ContentBox>
						<div className='ProfileBioPage_bioContainer'>
							<ReportProblem
								type={constants.userTicket.types.profileBio}
								id={user.id}
							/>
							<Markup
								text={bio.bio}
								format={bio.format}
								emojiSettings={emojiSettings}
								key={Math.random()}
							/>
						</div>
					</ContentBox>
				}

				{bio.files.length > 0 &&
					<ContentBox>
						<PhotoGallery
							userId={user.id}
							files={bio.files}
							reportType={constants.userTicket.types.profileImage}
						/>
					</ContentBox>
				}
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<ProfileBioPageProps | undefined>
{
	if (isNaN(Number(id)))
	{
		return;
	}

	const [bio, emojiSettings] = await Promise.all([
		this.query('v1/users/bio', { id }),
		this.query('v1/settings/emoji', { userIds: [id] }),
	]);

	return { bio, emojiSettings };
}

export const loader = routerUtils.wrapLoader(loadData);

type ProfileBioPageProps = {
	bio: UserBioType
	emojiSettings: EmojiSettingType[]
};

export default ProfileBioPage;
