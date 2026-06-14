import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import * as crypto from 'crypto';

import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType } from '@types';
import * as db from '@db';

/*
 * Get presigned url to upload to S3.
 */
async function upload_map(this: APIThisType, { imageExtension, townId }: uploadImageProps): Promise<{ s3PresignedUrl: string, fileName: string }>
{
	// Check parameters
	const [town] = await db.query(`
        SELECT user_id, game_id, name
        FROM town
        WHERE town.id = $1::int
    `, townId);

	if (town.user_id !== this.userId)
	{
		throw new UserError('permission');
	}

	if (town.game_id !== constants.gameIds.ACNH)
	{
		throw new UserError('bad-format');
	}

	// upload map

	const fileName = `${crypto.randomUUID()}.${imageExtension}`;

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
		Key: `${constants.USER_FILE_DIR2}${this.userId}/${fileName}`,
		ContentType: 'image/png',
	});

	const [file] = await db.query(`
        INSERT INTO file (file_id, name, caption, sequence)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `, fileName, `${town.name} Map`, `${town.name} Map`, 1);

	await db.query(`
        UPDATE town
        SET map_design_file_id = $1
        WHERE id = $2
    `, file.id, townId);

	return {
		s3PresignedUrl: await getSignedUrl(s3Client, command, {
			expiresIn: 30,
		}),
		fileName: fileName,
	};
}

upload_map.permissions = [
	'userId',
];

upload_map.apiTypes = {
	townId: {
		type: APITypes.townId,
		required: true,
	},
	imageExtension: {
		type: APITypes.string,
		required: true,
	},
};

type uploadImageProps = {
	townId: number
	imageExtension: string
};

export default upload_map;
