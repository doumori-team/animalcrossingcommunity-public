import PropTypes from 'prop-types';

const ruleShape = PropTypes.shape({
	id: PropTypes.number,
	number: PropTypes.number,
	name: PropTypes.string,
	startDate: PropTypes.any,
	description: PropTypes.string,
	violations: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		severityId: PropTypes.number,
		violation: PropTypes.string,
		number: PropTypes.number,
	})),
	originalRuleId: PropTypes.number,
	categoryId: PropTypes.number,
	category: PropTypes.string,
	reportable: PropTypes.bool,
});

export default ruleShape;