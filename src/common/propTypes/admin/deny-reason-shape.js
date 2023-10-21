import PropTypes from 'prop-types';

const denyReasonShape = PropTypes.shape({
	id: PropTypes.number,
	name: PropTypes.string,
	active: PropTypes.bool,
});

export default denyReasonShape;