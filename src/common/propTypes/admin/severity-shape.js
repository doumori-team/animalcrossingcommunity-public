import PropTypes from 'prop-types';

const severityShape = PropTypes.shape({
	id: PropTypes.number,
	name: PropTypes.string,
	description: PropTypes.string,
});

export default severityShape;