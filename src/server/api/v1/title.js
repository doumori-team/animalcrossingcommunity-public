import * as db from '@db';
import { utils } from '@utils';
import * as APITypes from '@apiTypes';

async function title({pathname})
{
    const siteName = 'Animal Crossing Community';
    const ending = ` | ${siteName}`;

    const sections = pathname.split('/');

    switch (sections[1])
    {
        case 'faq':
            return `FAQ${ending}`;
        case 'forums':
            const permission = await this.query('v1/node/permission', {permission: 'read', nodeId: sections[2]});

            if (permission)
            {
                if (sections[3] === 'history')
                {
                    return `Post History${ending}`;
                }

                const [node] = await db.query(`
                    SELECT title
                    FROM node_revision
                    WHERE node_revision.node_id = $1
                    ORDER BY time DESC
                    LIMIT 1
                `, sections[2]);

                if (node)
                {
                    return `${utils.ellipsisLongText(node.title)}${ending}`;
                }
            }

            return `ACC Forums${ending}`;
        case 'trading-post':
            return `Trading Post${ending}`;
        case 'town-tune':
        case 'town-tunes':
            return `Town Tunes${ending}`;
        case 'pattern':
        case 'patterns':
            return `Patterns${ending}`;
        case 'friend-codes':
            return `Friend Codes${ending}`;
        case 'bell-shop':
            return `Bell Shop${ending}`;
        case 'notifications':
            return `Notifications${ending}`;
        case 'profile':
            const [user1] = await db.query(`
                SELECT user_account_cache.username
                FROM user_account_cache
                WHERE id = $1::int
            `, sections[2]);

            if (user1)
            {
                return `${utils.getPossessiveNoun(user1.username)} Profile${ending}`;
            }

            break;
        case 'threads':
            const [user2] = await db.query(`
                SELECT user_account_cache.username
                FROM user_account_cache
                WHERE id = $1::int
            `, sections[2]);

            if (user2)
            {
                return `${utils.getPossessiveNoun(user2.username)} Threads${ending}`;
            }

            break;
        case 'ratings':
            const [user3] = await db.query(`
                SELECT user_account_cache.username
                FROM user_account_cache
                WHERE id = $1::int
            `, sections[2]);

            if (user3)
            {
                return `${utils.getPossessiveNoun(user3.username)} Ratings${ending}`;
            }

            break;
        case 'catalog':
            const [user4] = await db.query(`
                SELECT user_account_cache.username
                FROM user_account_cache
                WHERE id = $1::int
            `, sections[2]);

            if (user4)
            {
                return `${utils.getPossessiveNoun(user4.username)} Catalog${ending}`;
            }

            break;
        case 'settings':
            return `Settings${ending}`
        case 'guide':
        case 'guides':
            return `Guides${ending}`;
        case 'followed':
            switch (sections[2])
            {
                case 'thread':
                    return `Followed Threads${ending}`;
                case 'board':
                    return `Followed Boards${ending}`;
            }

            break;
        case 'new-member':
        case 'scout-hub':
            return `Scout Hub${ending}`;
        case 'automation':
            return `Automation${ending}`;
        case 'admin':
            return `Admin${ending}`;
        case 'modmin':
            return `Modmin${ending}`;
        case 'user-ticket':
        case 'user-tickets':
            return `User Tickets${ending}`;
        case 'user-matching':
            return `User Matching${ending}`;
        case 'user-session':
        case 'user-sessions':
            return `User Sessions${ending}`;
        case 'support-email':
        case 'support-emails':
            return `Support Emails${ending}`;
        case 'support-ticket':
        case 'support-tickets':
            return `Support Tickets${ending}`;
        case 'top-bells':
            return `Top Bells${ending}`;
        case 'ticket':
        case 'tickets':
            return `Tickets${ending}`;
        case 'guidelines':
            return `Community Guidelines${ending}`;
        case 'staff':
            return `Staff${ending}`;
        case 'staff-roles':
            return `Staff Roles${ending}`;
        case 'feature':
        case 'features':
            return `Features & Bugs${ending}`;
        case 'legal':
            switch (sections[2])
            {
                case 'policies':
                    return `Policies${ending}`;
                case 'privacy':
                    return `Privacy Policy${ending}`;
                case 'cookies':
                    return `Cookie Policy${ending}`;
                case 'terms':
                    return `TOS${ending}`;
                case 'coppa':
                    return `About COPPA${ending}`;
            }

            break;
        case 'honorary-citizens':
            return `Honorary Citizens${ending}`;
        case 'credits':
            return `Acknowledgements${ending}`;
        case 'site-statistics':
            return `Site Statistics${ending}`;
        case 'menu':
            return `Site Menu${ending}`;
        case 'buddies':
            return `Buddies${ending}`;
        case 'calendar':
            return `AC Calendar${ending}`;
        case 'donated':
        case 'donate':
            return `Donate${ending}`;
        case 'sign-up':
            return `Sign Up${ending}`;
        case 'congrats':
            return `Welcome${ending}`;
        case 'consent':
        case 'email-needed':
        case 'consent-needed':
            return `Consent${ending}`;
    }

    return siteName;
}

title.apiTypes = {
	pathname: {
		type: APITypes.string,
		default: '',
		required: true,
	},
}

export default title;