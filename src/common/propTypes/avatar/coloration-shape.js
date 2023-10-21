import PropTypes from 'prop-types';

const colorationShape = PropTypes.shape({
	id: PropTypes.number.isRequired,
	name: PropTypes.string.isRequired,
	css: PropTypes.string.isRequired
});

export default colorationShape;