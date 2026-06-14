import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NodeType, NodeLiteType } from '@types';

async function react(this: APIThisType, { id, emoji }: reactProps): Promise<NodeType | null>
{
	const permission: boolean = await this.query('v1/node/permission', { permission: 'react', nodeId: id });

	if (!permission)
	{
		throw new UserError('permission');
	}

	const node: NodeLiteType = await this.query('v1/node/lite', { id: id });

	if (node.type !== 'post')
	{
		throw new UserError('bad-format');
	}

	const [blocked] = await db.query(`
		SELECT user_id
		FROM block_user
		WHERE block_user_id = $1::int AND user_id = $2::int
	`, this.userId, node.userId);

	if (blocked)
	{
		throw new UserError('blocked');
	}

	const [reacted] = await db.query(`
		SELECT node_id
		FROM node_reaction
		WHERE node_id = $1::int AND user_id = $2::int AND emoji = $3
	`, id, this.userId, emoji);

	const types = constants.notification.types;

	if (reacted)
	{
		await db.query(`
			DELETE FROM node_reaction
			WHERE node_id = $1::int AND user_id = $2::int AND emoji = $3
		`, id, this.userId, emoji);

		this.query('v1/notification/destroy', { id: id, type: types.postReaction });
	}
	else
	{
		await db.query(`
			INSERT INTO node_reaction (node_id, user_id, emoji) VALUES
			($1::int, $2::int, $3)
		`, id, this.userId, emoji);

		this.query('v1/notification/create', { id: id, type: types.postReaction });
	}

	return await this.query('v1/node/full', { id: id });
}

react.permissions = [
	'userId',
];

react.apiTypes = {
	id: {
		type: APITypes.nodeId,
		required: true,
	},
	emoji: {
		type: APITypes.string,
		required: true,
		includes: [
			'agreement',
			'love',
			'amazed',
			'excited',
			'greetings',
			'happiness',
			'laughter',
			'sorrow',
			'act_natural',
			'airplane',
			'arm_circles',
			'arm-swing_dance',
			'behold',
			'bewilderment',
			'body_twists',
			'cold_chill',
			'confetti',
			'confident',
			'curiosity',
			'daydreaming',
			'delight',
			'double_wave',
			'dozing',
			'eager',
			'encouraging',
			'feelin_it',
			'flex',
			'flourish',
			'glee',
			'groove_left',
			'groove_right',
			'grooving_hop',
			'haunt',
			'here_you_go',
			'hula',
			'inspiration',
			'intense',
			'island_stomp',
			'jammin',
			'joy',
			'jump',
			'lets_go',
			'listening_ears',
			'mistaken',
			'pleased',
			'posture_warm-up',
			'pride',
			'resignation',
			'say_cheese',
			'scare',
			'sheepishness',
			'shimmy',
			'shocked',
			'showmanship',
			'shyness',
			'side_bends',
			'side-to-side',
			'sighing',
			'sit_down',
			'sleepy',
			'sneezing',
			'sniff_sniff',
			'soak_it_in',
			'stretch',
			'surprise',
			'ta-da',
			'take_a_picture',
			'thought',
			'turnip_patch',
			'twisty_dance',
			'upper-body_circles',
			'viva',
			'wave_goodbye',
			'wide_arm_stretch',
			'work_it',
			'work_out',
			'worry',
			'yoga',
		],
	},
};

type reactProps = {
	id: number
	emoji: string
};

export default react;
