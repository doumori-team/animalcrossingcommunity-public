import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import Imap from 'imap';

/**
 * Very basic fetch. See admin\support_email for more info.
 */
export default async function fetch_email()
{
	// You must be on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	const imap = new Imap({
		user: process.env.EMAIL_USER,
		password: process.env.EMAIL_PASS,
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,
		tls: true,
		tlsOptions: { servername: process.env.EMAIL_HOST },
		//debug: console.error
	});

	imap.once('ready', () => {
		imap.openBox('INBOX', true, (err, box) => {
			if (err)
			{
				console.error(err);
				return;
			}

			let f = imap.seq.fetch(box.messages.total + ':*', {
				bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)','1']
			});

			f.on('message', (msg, seqno) => {
				msg.on('body', (stream, info) => {
					let buffer = '';

					stream.on('data', (chunk) => {
						buffer += chunk.toString('utf8');
					});

					stream.once('end', async () => {
						if (info.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)')
						{
							const header = Imap.parseHeader(buffer);

							let recorded = dateUtils.toDate(header['date'][0]);
							let subject = header['subject'][0];
							let from = header['from'][0];
							let to = process.env.EMAIL_USER;

							if (from.includes('<') && from.includes('>'))
							{
								let fromMatches = from.match(constants.regexes.parseEmail);

								if (fromMatches)
								{
									from = fromMatches[0];
								}
							}

							await db.query(`
								INSERT INTO support_email (from_email, to_email, subject, recorded, gmail_id)
								VALUES ($1, $2, $3, $4, $5)
								ON CONFLICT (gmail_id) DO UPDATE SET
									from_email = EXCLUDED.from_email,
									to_email = EXCLUDED.to_email,
									subject = EXCLUDED.subject,
									recorded = EXCLUDED.recorded
							`, from, to, subject, recorded, seqno);
						}
						else
						{
							if (constants.regexes.base64.test(buffer))
							{
								buffer = Buffer.from(buffer, 'base64').toString('ascii');
							}

							await db.query(`
								INSERT INTO support_email (body, gmail_id, recorded)
								VALUES ($1, $2, now())
								ON CONFLICT (gmail_id) DO UPDATE SET body = EXCLUDED.body
							`, buffer, seqno);
						}
					});
				});
			});

			f.once('error', (err) => {
				console.error('Fetch error: ' + err);
			});

			f.once('end', () => {
				imap.end();
			});
		});
	});

	imap.once('error', (err) => {
		console.error('IMAP Error: ' + err);
	});

	imap.connect();

	return {
		_success: `The latest email is being fetched. In most cases this should only take a few seconds. Try clicking 'View Latest Email' and the email contents will be displayed below the button.`,
	};
}