#!/usr/bin/env node

// This is intended to be run every 10 minutes.
// It needs to be added to the scheduler from within the Heroku dashboard.

const pg = require('pg');
const Imap = require('imap');
const { convert } = require('html-to-text');

const pool = new pg.Pool(
{
	connectionString: process.env.DATABASE_URL,
	ssl: {rejectUnauthorized: false} // Heroku self-signs its database SSL certificates
});

async function tenmin()
{
	// Duplicate found in admin\support_email\fetch.js. Must keep updated.
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
				if (!results || results.length === 0)
				{
					console.log('No unseen emails available.');
					//imap.end();

					return;
				}

				if (err)
				{
					console.error(err);
					return;
				}

				// get messages; for every message then....
				getMessages(results, async (err, msg) => {
					if (err)
					{
						console.error(err);
						return;
					}

					// figure out info to insert into database
					let recorded = new Date(msg.header['date'][0]);
					let subject = msg.header['subject'][0];
					let from = msg.header['from'][0];
					let to = process.env.EMAIL_USER;
					let body = msg.body;

					if (from.includes('<') && from.includes('>'))
					{
						let fromMatches = from.match(/[^< ]+(?=>)/g);

						if (fromMatches)
						{
							from = fromMatches[0];
						}
					}

					if (/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/.test(body))
					{
						body = Buffer.from(body, 'base64').toString('ascii');
					}

					await pool.query(`
						INSERT INTO support_email (from_email, to_email, subject, recorded, body, gmail_id)
						VALUES ($1, $2, $3, $4, $5, $6)
						ON CONFLICT (gmail_id) DO UPDATE SET
							from_email = EXCLUDED.from_email,
							to_email = EXCLUDED.to_email,
							subject = EXCLUDED.subject,
							recorded = EXCLUDED.recorded,
							body = EXCLUDED.body
					`, [from, to, subject, recorded, body, msg.uid]);

					imap.setFlags([msg.uid], ['\\Seen'], (err) => {
						if (err)
						{
							console.error(err);
						}
					});
				});

				//imap.end();
			});
		});
	});

	imap.once('error', (err) => {
		console.error('IMAP Error: ' + err);
	});

	imap.connect();
}

tenmin().then(function()
{
	console.log("Ten Minute scripts complete");
});
