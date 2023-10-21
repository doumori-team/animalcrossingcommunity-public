import PropTypes from 'prop-types';

export default {
	id: PropTypes.number,
	question: PropTypes.string,
	startDate: PropTypes.any,
	endDate: PropTypes.any,
	duration: PropTypes.number,
	isMultipleChoice: PropTypes.bool,
	isEnabled: PropTypes.bool,
	userHasVoted: PropTypes.bool,
	description: PropTypes.string,
	options: PropTypes.arrayOf(PropTypes.shape({
		description: PropTypes.string,
		sequence: PropTypes.number,
		votes: PropTypes.number
	})),
};