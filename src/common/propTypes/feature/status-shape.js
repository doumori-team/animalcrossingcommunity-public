import PropTypes from 'prop-types';

const statusShape = PropTypes.shape({
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	sequence: PropTypes.number
})

export default statusShape;