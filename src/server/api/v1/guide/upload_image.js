import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/*
 * Get presigned url to upload to S3.
 */
async function upload_image({directory, fileName})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'image-upload'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const s3Client = new S3Client({
		region: process.env.AWS_BUCKET_REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_KEY
		}
	});

	const command = new PutObjectCommand({
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: `${directory}/${fileName}`
	});

	return await getSignedUrl(s3Client, command, {
		expiresIn: 30,
	});
}

upload_image.apiTypes = {
	directory: {
		type: APITypes.string,
		required: true,
	},
	fileName: {
		type: APITypes.string,
		required: true,
	},
}

export default upload_image;