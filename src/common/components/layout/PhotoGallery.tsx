import { useState } from 'react';
import { ColumnsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/columns.css';

import { RequireClientJS } from '@behavior';
import { constants } from '@utils';
import { FileType, FileInProcessType } from '@types';
import PhotoSlideshow from '@/components/layout/PhotoSlideshow.tsx';

const PhotoGallery = ({
	userId,
	files,
	reportType,
}: PhotoGalleryProps) =>
{
	const [fileIndex, setFileIndex] = useState<number>(-1);

	return (
		<RequireClientJS>
			<ColumnsPhotoAlbum
				photos={files?.map(file =>
				{
					return {
						src: `${constants.USER_FILE_DIR}${userId}/${file.fileId}`,
						alt: file.caption,
						title: file.caption,
						width: Number(file.width || 0),
						height: Number(file.height || 0),
						id: file.id,
						description: file.caption,
					};
				})}
				onClick={({ index }: { index: number }) => setFileIndex(index)}
				spacing={5}
				padding={0}
				columns={4}
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
};

type PhotoGalleryProps = {
	userId: number
	files: FileType[] | FileInProcessType[]
	reportType?: string
};

export default PhotoGallery;
