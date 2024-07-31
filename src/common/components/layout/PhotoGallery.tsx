import React, { useState } from 'react';
import PhotoAlbum from 'react-photo-album';

import { RequireClientJS } from '@behavior';
import { constants } from '@utils';
import { FileType, FileInProcessType } from '@types';
import PhotoSlideshow from '@/components/layout/PhotoSlideshow.tsx';

const PhotoGallery = ({
	userId,
	files,
	reportType
}: PhotoGalleryProps) =>
{
	const [fileIndex, setFileIndex] = useState<number>(-1);

	const slides = files?.map(file => {
		return {
			src: `${constants.USER_FILE_DIR}${userId}/${file.fileId}`,
			alt: file.caption,
			title: file.caption,
			width: Number(file.width || 0),
			height: Number(file.height || 0),
			id: file.id,
			description: file.caption,
		};
	});

	const renderPhoto = ({photo, layoutOptions, imageProps: {alt, style, ...restImageProps}}: any) => (
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

type PhotoGalleryProps = {
	userId: number
	files: FileType[] | FileInProcessType[]
	reportType?: string
};

export default PhotoGallery;