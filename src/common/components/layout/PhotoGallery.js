import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PhotoAlbum from 'react-photo-album';

import { RequireClientJS } from '@behavior';
import { constants } from '@utils';
import { fileShape } from '@propTypes';
import PhotoSlideshow from './PhotoSlideshow.js';

const PhotoGallery = ({userId, files, reportType}) =>
{
	const [fileIndex, setFileIndex] = useState(-1);

	const slides = files?.map(file => {
		return {
			src: `${constants.USER_FILE_DIR}${userId}/${file.fileId}`,
			alt: file.caption,
			title: file.caption,
			width: file.width,
			height: file.height,
			id: file.id,
			description: file.caption,
		};
	});

	const renderPhoto = ({photo, layoutOptions, imageProps: {alt, style, ...restImageProps}}) => (
		<div
			style={{
				boxSizing: 'content-box',
				alignItems: 'center',
				width: style?.width,
				padding: `${layoutOptions.padding - 2}px`,
				paddingBottom: 0,
			}}
		>
			<img
				alt={alt} style={{ ...style, width: '100%', padding: 0 }} {...restImageProps}
			/>
		</div>
	);

	return (
		<RequireClientJS>
			<PhotoAlbum
				layout='columns'
				photos={slides}
				onClick={({ index: current }) => setFileIndex(current)}
				spacing={5}
				padding={0}
				columns={4}
				renderPhoto={renderPhoto}
			/>
			<PhotoSlideshow
				userId={userId}
				files={files}
				reportType={reportType}
				fileIndex={fileIndex}
				setFileIndex={setFileIndex}
				key={fileIndex}
			/>
		</RequireClientJS>
	);
}

PhotoGallery.propTypes = {
	userId: PropTypes.number.isRequired,
	files: fileShape.isRequired,
	reportType: PropTypes.string,
};

export default PhotoGallery;