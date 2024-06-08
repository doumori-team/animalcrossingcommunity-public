import PropTypes from 'prop-types';

const shopShape = PropTypes.shape({
	id: PropTypes.number,
	name: PropTypes.string,
	shortDescription: PropTypes.string,
	description: PropTypes.shape({
		content: PropTypes.string,
		format: PropTypes.oneOf(['plaintext', 'markdown', 'bbcode']),
	}),
	formattedDate: PropTypes.any,
	free: PropTypes.bool,
	vacation: PropTypes.object,
	transfer: PropTypes.bool,
	active: PropTypes.bool,
	header: PropTypes.string,
	fileId: PropTypes.number,
	owners: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		username: PropTypes.string,
	})),
	games: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		shortname: PropTypes.string,
		perOrder: PropTypes.number,
		stackOrQuantity: PropTypes.bool,
		completeOrder: PropTypes.bool,
		items: PropTypes.arrayOf(PropTypes.string),
		color: PropTypes.string,
	})),
	pendingOrder: PropTypes.bool,
	transfer: PropTypes.bool,
	positiveRatingsTotal: PropTypes.number,
	neutralRatingsTotal: PropTypes.number,
	negativeRatingsTotal: PropTypes.number,
	statData: PropTypes.array,
	statsUsers: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		username: PropTypes.string,
	})),
	// ignore extraStatData
});

export default shopShape;