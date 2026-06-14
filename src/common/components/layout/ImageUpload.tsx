import { useState } from 'react';
import axios from 'axios';

import { RequirePermission, RequireClientJS } from '@behavior';
import ErrorMessage from '@/components/layout/ErrorMessage.tsx';
import { Alert, Button } from '@form';
import { iso } from 'common/iso.ts';
import { constants } from '@utils';

const ImageUpload = ({
	directory,
	api,
	hidden = false,
	fileIdName = 'fileId',
	label = 'Upload Image',
}: ImageUploadProps) =>
{
	const [errors, setErrors] = useState<string[]>([]);
	const [success, setSuccess] = useState<boolean>(false);
	const [uploadedFileName, setUploadedFileName] = useState<string>('');
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const scanFile = async (e: any): Promise<void> =>
	{
		const file = e.target.files[0];

		setSuccess(false);
		setUploadedFileName('');
		setFile(null);

		if (typeof file === 'undefined')
		{
			return;
		}

		// 10000 KB / 10 MB max size
		if (file.size > 10000000)
		{
			setErrors(['image-file-size-too-large']);

			return;
		}

		setFile(file);
	};

	const uploadImage = async () =>
	{
		if (file === null)
		{
			return;
		}

		setLoading(true);

		const params = {
			directory,
			fileName: file.name,
		};

		(await iso).query(null, api, params)
			.then(async (s3PresignedUrl: string) =>
			{
				try
				{
					await axios.put(s3PresignedUrl, file, { headers: { 'Content-Type': file.type } });

					setSuccess(true);
					setUploadedFileName(file.name);
					setFile(null);
					setLoading(false);
				}
				catch (error: unknown)
				{
					console.error('Error attempting to upload.', error);

					setErrors(['bad-format']);
					setLoading(false);
				}
			})
			.catch((_: unknown) =>
			{
				setErrors(['bad-format']);
				setLoading(false);
			});
	};

	return (
		<RequirePermission permission='image-upload' silent>
			<div className='ImageUpload'>
				{errors.map(
					(identifier, index) =>
						<ErrorMessage identifier={identifier} key={index} />,
				)}

				{success &&
					<Alert type='success'>
						Your file has been uploaded: {`${constants.AWS_URL}/${directory}/${uploadedFileName}`}
					</Alert>
				}

				{hidden && uploadedFileName &&
					<input
						type='hidden'
						name={fileIdName}
						value={uploadedFileName}
					/>
				}

				<RequireClientJS fallback={
					<ErrorMessage identifier='javascript-required' />
				}
				>
					<div className='ImageUpload_upload'>
						<h3>{label}:</h3>
						<input type='file' accept='image/*' onChange={scanFile} />

						<Button
							label='Upload Image'
							type='submit'
							loading={loading}
							clickHandler={uploadImage}
							className='Form_button'
						/>
					</div>
				</RequireClientJS>
			</div>
		</RequirePermission>
	);
};

type ImageUploadProps = {
	directory: string
	api: string
	hidden?: boolean
	fileIdName?: string
	label?: string
};

export default ImageUpload;
