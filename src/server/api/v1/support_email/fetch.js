import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import Imap from 'imap';
import * as accounts from '@accounts';
import { convert } from 'html-to-text';

/**
 * Duplicate found in tenmin.cjs. Must keep updated.
 */
export default async function fetch()
{
	// You must be on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
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

	function findTextPart(struct)
	{
		for (let i = 0, len = struct.length, r; i < len; ++i)
		{
			if (Array.isArray(struct[i]))
			{
				if (r = findTextPart(struct[i]))
				{
					return r;
				}
			}
			else if (struct[i].type === 'text' && (struct[i].subtype === 'plain' || struct[i].subtype === 'html'))
			{
				return [struct[i].partID, struct[i].type + '/' + struct[i].subtype, struct[i].encoding];
			}
		}
	}

	function decodeQuotedPrintable(data)
	{
		// normalise end-of-line signals
		data = data.replace(/(\r\n|\n|\r)/g, "\n");

		// replace equals sign at end-of-line with nothing
		data = data.replace(/=\n/g, "");

		// encoded text might contain percent signs
		// decode each section separately
		let bits = data.split('%');

		for (let i = 0; i < bits.length; i ++)
		{
			// replace equals sign with percent sign
			bits[i] = bits[i].replace(/=/g, '%');

			// decode the section
			try
			{
				bits[i] = decodeURIComponent(bits[i]);
			}
			catch (e)
			{
				bits[i] = '?';
			}
		}

		return(bits.join('%'));
	}

	/**
	 * Goes through search results.
	 * For each message, it grabs the plaintext message id and goes to grab that.
	 */
	function getMessages(results, cb)
	{
		let f = imap.fetch(
			results,
			{
				bodies: '',
				struct: true
			}
		);

		f.once('error', (err) => {
			cb(err);
		});

		f.on('message', (m) => {
			m.once('attributes', (attrs) => {
				let partId = findTextPart(attrs.struct);

				if (partId)
				{
					getMsgByUID(attrs.uid, cb, partId);
				}
			});
		});

		f.once('end', function() {
			console.log('Done fetching all messages!');

			imap.end();
		});
	}

	/**
	 * Grabs single message from results to read.
	 */
	function getMsgByUID(uid, cb, partId)
	{
		let f = imap.fetch(
			[uid],
			{
				bodies: ['HEADER.FIELDS (TO FROM SUBJECT DATE)', partId[0] ]
			}
		);

		let hadErr = false, msg = { header: undefined, body: '', uid: null };

		f.once('error', (err) => {
			hadErr = true;
			cb(err);
		});

		f.on('message', (m) => {
			m.on('body', (stream, info) => {
				let b = '';

				stream.on('data', (d) => {
					if (/^header/i.test(info.which))
					{
						// do nothing for header
					}
					else
					{
						d = d.toString('utf8');

						if (partId[2] === 'QUOTED-PRINTABLE' && typeof d === 'string')
						{
							d = decodeQuotedPrintable(d);
						}
					}

					b += d;
				});

				stream.once('end', () => {
					if (/^header/i.test(info.which))
					{
						msg.header = Imap.parseHeader(b);
						msg.uid = uid;
					}
					else
					{
						if (partId[1].includes('html'))
						{
							b = convert(b, {
								wordwrap: 130,
							});
						}

						msg.body = b;
					}
				});
			});
		});

		f.once('end', () => {
			if (hadErr)
			{
				return;
			}

			cb(undefined, msg);
		});
	}

	imap.once('ready', () => {
		imap.openBox('INBOX', false, (err, box) => {
			if (err)
			{
				console.error(err);
				return;
			}

			// get all not read in last day
			imap.search(['UNSEEN'], (err, results) => {
				if (err)
				{
					console.error(err);
					return;
				}

				if (!results || results.length === 0)
				{
					console.log('No unseen emails available.');

					imap.end();

					return;
				}
				else
				{
					console.log(`Importing ${results.length} emails`);
				}

				imap.setFlags(results, ['\\Seen'], (err) => {
					if (err)
					{
						console.error(err);
					}
				});

				// get messages; for every message then....
				getMessages(results, async (err, msg) => {
					if (err)
					{
						console.error(err);
						return;
					}

					// figure out info to insert into database
					let recorded = dateUtils.toDate(msg.header['date'][0]);
					let subject = msg.header['subject'][0];
					let from = msg.header['from'][0];
					let to = process.env.EMAIL_USER;
					let fromUserId = null;
					let body = msg.body;

					if (from.includes('<') && from.includes('>'))
					{
						let fromMatches = from.match(constants.regexes.parseEmail);

						if (fromMatches)
						{
							from = fromMatches[0];
						}
					}

					// see support_email.js
					try
					{
						const user = await accounts.getUserData(null, null, from);

						fromUserId = user.id;
					}
					catch (error)
					{
						// error OR user doesn't exist
					}

					if (constants.regexes.base64.test(body))
					{
						body = Buffer.from(body, 'base64').toString('ascii');
					}

					await db.query(`
						INSERT INTO support_email (from_email, from_user_id, to_email, subject, recorded, body, gmail_id)
						VALUES ($1, $2, $3, $4, $5, $6, $7)
						ON CONFLICT (gmail_id) DO UPDATE SET
							from_email = EXCLUDED.from_email,
							from_user_id = EXCLUDED.from_user_id,
							to_email = EXCLUDED.to_email,
							subject = EXCLUDED.subject,
							recorded = EXCLUDED.recorded,
							body = EXCLUDED.body
					`, from, fromUserId, to, subject, recorded, body, msg.uid);
				});
			});
		});
	});

	imap.once('error', (err) => {
		console.error('IMAP Error: ' + err);
	});

	imap.once('end', function() {
		console.log('Connection ended');
	});

	imap.connect();
}