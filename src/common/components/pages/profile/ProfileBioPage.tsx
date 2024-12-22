import React from 'react';
import { Link, useLoaderData, useOutletContext } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { ContentBox, ReportProblem, Header, Section, Markup, PhotoGallery } from '@layout';
import { constants, utils } from '@utils';
import { APIThisType, UserBioType, EmojiSettingType, UserType } from '@types';

const ProfileBioPage = () =>
{
	const { bio, emojiSettings, error } = useLoaderData() as ProfileBioPageProps;
	const { user } = useOutletContext() as { user: UserType };

	/**
	 * Sometimes react-router will start rendering the profile page before
	 * figuring out the given username's id
	 */
	if (error || bio === undefined || emojiSettings === undefined)
	{
		return null;
	}

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
					<div className='ProfileBioPage_option'>
						<ReportProblem
							type={constants.userTicket.types.profileName}
							id={user.id}
						/>Name: {bio.name ? bio.name : user.username}
					</div>

					{bio.location &&
						<div className='ProfileBioPage_option'>
							<ReportProblem
								type={constants.userTicket.types.profileLocation}
								id={user.id}
							/>Location: {bio.location}
						</div>
					}

					{bio.email &&
						<div className='ProfileBioPage_option'>
							Email: {bio.email}
						</div>
					}
				</Section>

				{bio.bio &&
					<ContentBox>
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

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<ProfileBioPageProps>
{
	if (!utils.isNumber(id))
	{
		return {
			error: 'unknown',
		};
	}

	const [bio, emojiSettings] = await Promise.all([
		this.query('v1/users/bio', { id }),
		this.query('v1/settings/emoji', { userIds: [id] }),
	]);

	return { bio, emojiSettings };
}

type ProfileBioPageProps = {
	bio?: UserBioType
	emojiSettings?: EmojiSettingType[]
	error?: string
};

export default ProfileBioPage;
