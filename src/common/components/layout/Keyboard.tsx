import { utils, constants } from '@utils';

const Keyboard = ({
	name,
	gameId,
}: KeyboardProps) =>
{
	if (!name.includes('[') &&
		(gameId === constants.gameIds.ACGC && !name.includes(' ') || gameId !== constants.gameIds.ACGC))
	{
		return (
			name
		);
	}

	let decodedName: string[] = [], decodedChar = '', middle = false;

	name.split('').map(char =>
	{
		if (char === ' ' && gameId === constants.gameIds.ACGC)
		{
			decodedName.push(decodeKeyboard('D0'));
		}
		else if (char === '[')
		{
			middle = true;
		}
		else if (char === ']')
		{
			decodedName.push(decodeKeyboard(decodedChar));
			decodedChar = '';
			middle = false;
		}
		else if (middle === true)
		{
			decodedChar += char;
		}
		else if (middle === false)
		{
			decodedName.push(char);
		}
	});

	return (
		decodedName.map((char, index) =>
		{
			if (char.includes('.png'))
			{
				return <img key={index} src={`${constants.AWS_URL}/images/keyboard/` + char} alt='Icon' />;
			}
			else
			{
				return char;
			}
		})
	);
};

function decodeKeyboard(keyboard: string): string
{
	let key = '';

	switch (keyboard)
	{
		case 'A1':
			key = '!';
			break;
		case 'A2':
			key = '?';
			break;
		case 'A3':
			key = '&quot;';
			break;
		case 'A4':
			key = '-';
			break;
		case 'A5':
			key = '~';
			break;
		case 'A6':
			key = '&#151;';
			break;
		case 'A7':
			key = "'";
			break;
		case 'A8':
			key = ';';
			break;
		case 'A9':
			key = ':';
			break;
		case 'A0':
			key = 'key.png';
			break;
		case 'B1':
			key = 'a';
			break;
		case 'B2':
			key = 'b';
			break;
		case 'B3':
			key = 'c';
			break;
		case 'B4':
			key = 'd';
			break;
		case 'B5':
			key = 'e';
			break;
		case 'B6':
			key = 'f';
			break;
		case 'B7':
			key = 'g';
			break;
		case 'B8':
			key = 'h';
			break;
		case 'B9':
			key = 'i';
			break;
		case 'B0':
			key = 'j';
			break;
		case 'C1':
			key = 'k';
			break;
		case 'C2':
			key = 'l';
			break;
		case 'C3':
			key = 'm';
			break;
		case 'C4':
			key = 'n';
			break;
		case 'C5':
			key = 'o';
			break;
		case 'C6':
			key = 'p';
			break;
		case 'C7':
			key = 'q';
			break;
		case 'C8':
			key = 'r';
			break;
		case 'C9':
			key = 's';
			break;
		case 'D1':
			key = 't';
			break;
		case 'D2':
			key = 'u';
			break;
		case 'D3':
			key = 'v';
			break;
		case 'D4':
			key = 'w';
			break;
		case 'D5':
			key = 'x';
			break;
		case 'D6':
			key = 'y';
			break;
		case 'D7':
			key = 'z';
			break;
		case 'D8':
			key = ',';
			break;
		case 'D9':
			key = '.';
			break;
		case 'D0':
			key = 'sp.png';
			break;
		case 'E1':
			key = '1';
			break;
		case 'E2':
			key = '2';
			break;
		case 'E3':
			key = '3';
			break;
		case 'E4':
			key = '4';
			break;
		case 'E5':
			key = '5';
			break;
		case 'E6':
			key = '6';
			break;
		case 'E7':
			key = '7';
			break;
		case 'E8':
			key = '8';
			break;
		case 'E9':
			key = '9';
			break;
		case 'E0':
			key = '0';
			break;
		case 'F1':
			key = 'A';
			break;
		case 'F2':
			key = 'B';
			break;
		case 'F3':
			key = 'C';
			break;
		case 'F4':
			key = 'D';
			break;
		case 'F5':
			key = 'E';
			break;
		case 'F6':
			key = 'F';
			break;
		case 'F7':
			key = 'G';
			break;
		case 'F8':
			key = 'H';
			break;
		case 'F9':
			key = 'I';
			break;
		case 'F0':
			key = 'J';
			break;
		case 'G1':
			key = 'K';
			break;
		case 'G2':
			key = 'L';
			break;
		case 'G3':
			key = 'M';
			break;
		case 'G4':
			key = 'N';
			break;
		case 'G5':
			key = 'O';
			break;
		case 'G6':
			key = 'P';
			break;
		case 'G7':
			key = 'Q';
			break;
		case 'G8':
			key = 'R';
			break;
		case 'G9':
			key = 'S';
			break;
		case 'H1':
			key = 'T';
			break;
		case 'H2':
			key = 'U';
			break;
		case 'H3':
			key = 'V';
			break;
		case 'H4':
			key = 'W';
			break;
		case 'H5':
			key = 'X';
			break;
		case 'H6':
			key = 'Y';
			break;
		case 'H7':
			key = 'Z';
			break;
		case 'H8':
			key = ',';
			break;
		case 'H9':
			key = '.';
			break;
		case 'H0':
			key = 'sp.png';
			break;
		case 'I1':
			key = '#';
			break;
		case 'I2':
			key = '?';
			break;
		case 'I3':
			key = '"';
			break;
		case 'I4':
			key = '-';
			break;
		case 'I5':
			key = '~';
			break;
		case 'I6':
			key = '&#151;';
			break;
		case 'I7':
			key = '•';
			break;
		case 'I8':
			key = ';';
			break;
		case 'I9':
			key = ':';
			break;
		case 'I0':
			key = 'Æ';
			break;
		case 'J1':
			key = '%';
			break;
		case 'J2':
			key = '&';
			break;
		case 'J3':
			key = '@';
			break;
		case 'J4':
			key = '_';
			break;
		case 'J5':
			key = '¯';
			break;
		case 'J6':
			key = '/';
			break;
		case 'J7':
			key = '¦';
			break;
		case 'J8':
			key = 'x';
			break;
		case 'J9':
			key = '÷';
			break;
		case 'J0':
			key = '=';
			break;
		case 'K1':
			key = '(';
			break;
		case 'K2':
			key = ')';
			break;
		case 'K3':
			key = '&lt;';
			break;
		case 'K4':
			key = '&gt;';
			break;
		case 'K5':
			key = '&raquo;';
			break;
		case 'K6':
			key = '&laquo;';
			break;
		case 'K9':
			key = '+';
			break;
		case 'K0':
			key = '';
			break;
		case 'L1':
			key = 'ß';
			break;
		case 'L2':
			key = 'Þ';
			break;
		case 'L3':
			key = 'ǎ';
			break;
		case 'L4':
			key = '§';
			break;
		case 'L5':
			key = '||';
			break;
		case 'L6':
			key = 'µ';
			break;
		case 'L7':
			key = '¬';
			break;
		case 'L8':
			key = ',';
			break;
		case 'L9':
			key = '.';
			break;
		case 'L0':
			key = 'sp.png';
			break;
		case 'P0':
			key = 'sp.png';
			break;
		case 'B11':
			key = 'à';
			break;
		case 'B12':
			key = 'á';
			break;
		case 'B13':
			key = 'â';
			break;
		case 'B14':
			key = 'ã';
			break;
		case 'B15':
			key = 'ä';
			break;
		case 'B16':
			key = 'å';
			break;
		case 'B31':
			key = 'ç';
			break;
		case 'B51':
			key = 'è';
			break;
		case 'B52':
			key = 'é';
			break;
		case 'B53':
			key = 'ê';
			break;
		case 'B54':
			key = 'ë';
			break;
		case 'B91':
			key = 'ì';
			break;
		case 'B92':
			key = 'í';
			break;
		case 'B93':
			key = 'î';
			break;
		case 'B94':
			key = 'ï';
			break;
		case 'C41':
			key = 'ñ';
			break;
		case 'C51':
			key = 'ò';
			break;
		case 'C52':
			key = 'ó';
			break;
		case 'C53':
			key = 'ô';
			break;
		case 'C54':
			key = 'õ';
			break;
		case 'C55':
			key = 'ö';
			break;
		case 'D21':
			key = 'ù';
			break;
		case 'D22':
			key = 'ú';
			break;
		case 'D23':
			key = 'û';
			break;
		case 'D24':
			key = 'ü';
			break;
		case 'D61':
			key = 'ý';
			break;
		case 'D62':
			key = 'ÿ';
			break;
		case 'E01':
			key = 'Ø';
			break;
		case 'E02':
			key = 'ø';
			break;
		case 'F11':
			key = 'À';
			break;
		case 'F12':
			key = 'Á';
			break;
		case 'F13':
			key = 'Â';
			break;
		case 'F14':
			key = 'Ã';
			break;
		case 'F15':
			key = 'Ä';
			break;
		case 'F16':
			key = 'Å';
			break;
		case 'F31':
			key = 'Ç';
			break;
		case 'F51':
			key = 'È';
			break;
		case 'F52':
			key = 'É';
			break;
		case 'F53':
			key = 'Ê';
			break;
		case 'F54':
			key = 'Ë';
			break;
		case 'F91':
			key = 'Ì';
			break;
		case 'F92':
			key = 'Í';
			break;
		case 'F93':
			key = 'Î';
			break;
		case 'F94':
			key = 'Ï';
			break;
		case 'G41':
			key = 'Ñ';
			break;
		case 'G51':
			key = 'Ò';
			break;
		case 'G52':
			key = 'Ó';
			break;
		case 'G53':
			key = 'Ô';
			break;
		case 'G54':
			key = 'Õ';
			break;
		case 'G55':
			key = 'Ö';
			break;
		case 'H21':
			key = 'Ù';
			break;
		case 'H22':
			key = 'Ú';
			break;
		case 'H23':
			key = 'Û';
			break;
		case 'H24':
			key = 'Ü';
			break;
		case 'H61':
			key = 'Ý';
			break;
		case 'H62':
			key = 'Ÿ';
			break;
		case 'A11':
			key = '¡';
			break;
		case 'A21':
			key = '¿';
			break;
		case 'A31':
			key = '„';
			break;
		case 'I01':
			key = 'æ';
			break;
		case 'L21':
			key = 'þ';
			break;
	}

	if (utils.realStringLength(key) === 0)
	{
		const keyboardConfig = constants.town.keyboardConfig;

		const foundKey = keyboardConfig.find(x => x.character === keyboard);

		if (foundKey)
		{
			key = `${foundKey.filename}.png`;
		}
	}

	return key;
}

type KeyboardProps = {
	name: string
	gameId: number
};

export default Keyboard;
