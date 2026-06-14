import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function upload_image(this: APIThisType, { directory, fileName }: uploadImageProps): Promise<string>
{
	const s3Client = new S3Client({
		region: process.env.AWS_BUCKET_REGION as string,
		endpoint: process.env.AWS_ENDPOINT_URL_S3 as string,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
		},
	});

	const command = new PutObjectCommand({
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: `${directory}/${fileName}`,
		ContentType: 'image/png',
	});

	return await getSignedUrl(s3Client, command, {
		expiresIn: 30,
	});
}

upload_image.permissions = [
	'modify-newsletter',
	'image-upload',
];

upload_image.apiTypes = {
	directory: {
		type: APITypes.string,
		required: true,
	},
	fileName: {
		type: APITypes.string,
		required: true,
	},
};

type uploadImageProps = {
	directory: string
	fileName: string
};

export default upload_image;
