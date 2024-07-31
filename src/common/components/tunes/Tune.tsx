import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser, RequirePermission } from '@behavior';
import { TuneType, TownType } from '@types';
import { utils, constants } from '@utils';
import { Confirm } from '@form';
import { ReportProblem } from '@layout';
import { UserContext } from '@contexts';

const Tune = ({
	townId,
	tune,
	townUserId
}: TuneProps) =>
{
    const encodedTownId = encodeURIComponent(Number(townId || 0));
    const encodedId = encodeURIComponent(tune.id);
    const gameNotes = utils.getTownTunes();
    const encodedTuneUserId = encodeURIComponent(tune.creator.id);

    let callback = '/town-tunes';

    if (townId != null && townId > 0)
    {
        callback = `/profile/${encodedTuneUserId}/towns`;
    }

    return (
        <div className='Tune'>
            <div className='Tune_links'>
                <RequireUser id={tune.creator.id} silent permission='modify-tunes'>
                    {tune.id && (
                        (townId != null && townId > 0) ?
                            <RequirePermission permission='modify-towns' silent>
                                <Link to={`/profile/${encodedTuneUserId}/town/${encodedTownId}/tune`}>
                                    Edit
                                </Link>
                            </RequirePermission>
                        :
                            <Link to={`/town-tune/${encodedId}/edit`}>Edit</Link>
                    )}
                    {tune.id && (
                        <Confirm
                            action='v1/tune/destroy'
                            callback={callback}
                            id={tune.id}
                            label='Delete'
                            message='Are you sure you want to delete this tune?'
                        />
                    )}
                </RequireUser>
                {(townId != null && townId > 0) ?
                    <RequireUser id={townUserId} silent>
                        <Confirm
                            action='v1/town/tune/destroy'
                            callback={callback}
                            id={townId}
                            label='Remove From Town'
                            message='Are you sure you want to remove the tune from this town?'
                        />
                    </RequireUser>
                :
                    <RequireUser silent><Link to={`/town-tune/${encodedId}/choose`}>Use as Town Tune</Link></RequireUser>
                }
            </div>

            <h1 className='Tune_name'>
                <div>
                    <ReportProblem type={tune.id ? constants.userTicket.types.tune : constants.userTicket.types.townTune} id={tune.id ? tune.id : Number(townId || 0)} />
                    {townId ? 'Town Tune: ' : ''}{tune.name}
                </div>
                {' '}
                <small className='Tune_submitted'>
                    <cite>
                    <UserContext.Consumer>
                            {currentUser => (
                                currentUser ? (
                                    <>
                                    (submitted by <Link to={`/profile/${encodeURIComponent(tune.creator.id)}`}>{tune.creator.username}</Link>{tune.formattedDate != null && ` on ${tune.formattedDate}`})
                                    </>
                                ) : (
                                    <>
                                    (submitted by {tune.creator.username}{tune.formattedDate != null && ` on ${tune.formattedDate}`})
                                    </>
                                )
                            )}
                        </UserContext.Consumer>
                    </cite>
                </small>
            </h1>

            <div className="Tune_notes">
                {tune.notes.map((noteId, index) =>
                    <span key={index}>
                        <img
                            src={`${constants.AWS_URL}/images/tunes/` + gameNotes[noteId].img_name}
                            alt='Tune Note'
                        />
                        {++index % 8 ? '' : <br/>}
                    </span>
                )}
            </div>
        </div>
    );
}

type TuneProps = {
	townId?: number
	tune: TuneType|NonNullable<TownType['tune']>
	townUserId?: number
};

export default Tune;
