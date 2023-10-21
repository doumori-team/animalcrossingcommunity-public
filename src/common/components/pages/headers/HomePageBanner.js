import React from 'react';
import PropTypes from 'prop-types';

const HomePageBanner = ({bannerName}) =>
(
	<h1 className='HomePageBanner'>
		<img
			className='HomePageBanner_foreground'
			src={`/images/banners/${bannerName}_foreground.png`}
			srcSet={`/images/banners/${bannerName}_foreground.png 1x, /images/banners/${bannerName}_foreground@2x.png 2x`}
			alt='Welcome to Animal Crossing Community!'
		/>
	</h1>
)

HomePageBanner.propTypes = {
	bannerName: PropTypes.string,
}

export default HomePageBanner;
