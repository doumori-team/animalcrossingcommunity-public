import React from 'react';
import { Link } from 'react-router-dom';

import Avatar from '@/components/nodes/Avatar.tsx';
import { UserType } from '@types';
import StatusIndicator from '@/components/nodes/StatusIndicator.tsx';
import { constants, dateUtils } from '@utils';
import { ReportProblem } from '@layout';
import { UserContext } from '@contexts';

const PostAuthorInfo = ({
	avatar,
	group,
	username,
	lastActiveTime,
	id,
	userTitle,
	perks,
	signupDate
}: PostAuthorInfoProps) =>
{
    let badges = [];

    if (group.identifier !== constants.groupIdentifiers.user)
    {
        badges.push({id: group.identifier, label: group.name, link: `/staff-roles/${group.id}`});
    }

    if (perks >= 5)
    {
        badges.push({
            id: 'hc',
            label: 'Honorary Citizen',
            link: '/honorary-citizens'
        });
    }

    if (dateUtils.isNewMember(signupDate))
    {
        badges.push({id: 'New Member', label: 'New Member'});
    }

    return (
        <div className='PostAuthorInfo'>
            <UserContext.Consumer>
                {currentUser => (
                    currentUser?.id === id ? (
                        <Link to='/settings/avatar'>
                            <Avatar {...avatar} />
                        </Link>
                    ) : (
                        <Avatar {...avatar} />
                    )
                )}
            </UserContext.Consumer>

            <span className='PostAuthorInfo_username'>
                <UserContext.Consumer>
                    {currentUser => (
                        currentUser ? (
                            <>
                            <Link to={`/profile/${encodeURIComponent(id)}`}>
                                {username}
                            </Link>{userTitle && (<span className='PostAuthorInfo_title'> (<ReportProblem
                                    type={constants.userTicket.types.profileUserTitle}
                                    id={id}
                                />{userTitle})</span>)}
                            </>
                        ) : (
                            <>
                            {username}{userTitle && (<span className='PostAuthorInfo_title'> ({userTitle})</span>)}
                            </>
                        )
                    )}
                </UserContext.Consumer>
            </span>

            {userTitle && (
                <span className='PostAuthorInfo_userTitle'>
                    <ReportProblem
                        type={constants.userTicket.types.profileUserTitle}
                        id={id}
                    />{userTitle}
                </span>
            )}

            {badges.map(badge => (
                badge.link ? (
                    <Link key={badge.id} to={badge.link} className='PostAuthorInfo_userbadge'>
                        {badge.label}
                    </Link>
                ) : (
                    <span key={badge.id} className='PostAuthorInfo_userbadge'>
                        {badge.label}
                    </span>
                )
            ))}

            <span className='PostAuthorInfo_lastactive'>
                <StatusIndicator lastActiveTime={lastActiveTime} showDate={true} />
            </span>
        </div>
    );
}

type PostAuthorInfoProps = UserType & {
    perks: number
};

export default PostAuthorInfo;