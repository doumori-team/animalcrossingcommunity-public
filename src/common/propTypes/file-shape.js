import PropTypes from 'prop-types';

export default PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    fileId: PropTypes.string,
    name: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
}));