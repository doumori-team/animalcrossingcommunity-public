import { describe, test, expect, vi } from 'vitest';

import * as save from 'server/api/v1/pattern/save';
import { UserError } from '@errors';
import { constants, utils } from '@utils';
import * as APITypes from '@apiTypes';
import { mockAPIContext, mockDbQuery, mockACCCache } from 'tests/vitest.setup.ts';
import * as db from '@db';
import { PatternColorsType } from '@types';

const data = {
	id: '0',
	published: false,
	townId: '0',
	characterId: '0',
	patternName: 'jest test pattern',
	designId: 'MO-1234-1234-1234',
	data: '#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E62828,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E62828,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E62828,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E62828,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E62828,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E62828,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E62828,#E62828,#E62828,#E62828,#E62828,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E62828,#E6E6E6,#E6E6E6,#E62828,#E62828,#E62828,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6,#E6E6E6',
	dataUrl: 'data:image/png;base64,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',
	palette: '194,644,1334,1994,2438,3778,4018,4679,5114,5999,314,353,14,6,0',
	gamePaletteId: `${constants.gameIds.ACNH}-1`,
};

const expectedAPIData = {
	id: 0,
	published: false,
	townId: 0,
	characterId: 0,
	patternName: 'jest test pattern',
	designId: 'MO-1234-1234-1234',
	data: ['#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E62828','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E62828','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E62828','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E62828','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E62828','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E62828','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E62828','#E62828','#E62828','#E62828','#E62828','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E62828','#E6E6E6','#E6E6E6','#E62828','#E62828','#E62828','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6','#E6E6E6'],
	dataUrl: 'data:image/png;base64,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',
	palette: ['194','644','1334','1994','2438','3778','4018','4679','5114','5999','314','353','14','6','0'],
	gamePaletteId: `${constants.gameIds.ACNH}-1`,
};

describe('save API function', () =>
{
	test('api tests are converted corrected', async () =>
	{
		// Arrange & Act
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if user is not logged in', async () =>
	{
		// Arrange
		const tempAPIContext = {
			userId: null,
			query: vi.fn(),
		};

		const apiData = await APITypes.parse.bind(tempAPIContext)(save.default.apiTypes, data);

		tempAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(save.default.call(tempAPIContext, apiData)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if provided game id is not a number', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gamePaletteId: `Test-1`,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-ac-game'));
	});

	test('should throw error if game id not found in db', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-ac-game'));
	});

	test('should throw error if game id does not allow door pattern', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			characterId: 5,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: 5 }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if palette id is invalid', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gamePaletteId: `${constants.gameIds.ACNH}-20`,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if data is invalid', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			data: `#Lauren`,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if data is incorrect length', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			data: `#E6E6E6`,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if data is invalid', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			palette: `Lauren`,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if data is incorrect length', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			palette: `194`,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if character user does not match given user', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gamePaletteId: `${constants.gameIds.ACGC}-1`,
			characterId: 493,
			data: '#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff',
			palette: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: 493 }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACGC }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: 10 }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if town user does not match given user', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			townId: 134,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: 134 }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: 10 }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if given game does not match pattern game', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: 394,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: 394 }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		mockAPIContext.query.mockResolvedValueOnce({ username: 'test-user' });

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ creator_id: 5, published: false, game_id: constants.gameIds.ACGC }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if pattern user does not match given user', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: 394,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: 394 }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		mockAPIContext.query.mockResolvedValueOnce({ username: 'test-user' });

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ creator_id: 10, published: false, game_id: constants.gameIds.ACNH }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if pattern is published', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: 394,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: 394 }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		mockAPIContext.query.mockResolvedValueOnce({ username: 'test-user' });

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ creator_id: 5, published: true, game_id: constants.gameIds.ACNH }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('pattern-published'));
	});

	test('should update pattern if ID is provided', async () =>
	{
		// Arrange
		const patternId = 394;

		const tempData = {
			...data,
			id: patternId,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: patternId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		mockAPIContext.query.mockResolvedValueOnce({ username: 'test-user' });

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ creator_id: mockAPIContext.userId, published: false, game_id: constants.gameIds.ACNH }]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: patternId });
		expect(mockDbQuery).toBeCalledTimes(2);
	});

	test('should return correct QR Code', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;
		const colors = utils.getPatternColors(gameId);
		let data = (expectedAPIData.data as string[]).map(rgb =>
		{
			let id = (colors as PatternColorsType[number]).indexOf(rgb);

			if (gameId === constants.gameIds.ACNH && Number(rgb) === constants.pattern.transparentColorId)
			{
				id = constants.pattern.transparentColorId;
			}

			return Number(id);
		});

		const originalData = [...data];

		// Act
		const result = await save.createQRCode.call(
			mockAPIContext,
			gameId,
			expectedAPIData.patternName,
			'test-user',
			'ACC',
			expectedAPIData.palette.map(x => Number(x)),
			originalData,
			(colors as PatternColorsType[number]),
			(utils.getPatternColors(constants.gameIds.ACNL) as PatternColorsType[number]),
		);

		// Assert
		expect(result).toEqual('data:image/png;base64,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');
	});

	test('should insert a new pattern if no ID is provided', async () =>
	{
		// Arrange
		const newPatternId = 42;
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		mockAPIContext.query.mockResolvedValueOnce({ username: 'test-user' });

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: newPatternId }]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newPatternId });
		expect(mockDbQuery).toBeCalledTimes(1);
	});

	test('should update character if provided', async () =>
	{
		// Arrange
		const characterId = 493;
		const newPatternId = 42;
		const tempData = {
			...data,
			gamePaletteId: `${constants.gameIds.ACGC}-1`,
			characterId: characterId,
			data: '#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ffffff,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ca2222,#ca2222,#ca2222,#ca2222,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff,#ffffff',
			palette: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACGC }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockAPIContext.query.mockResolvedValueOnce({ username: 'test-user' });

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: newPatternId }]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newPatternId });
		expect(mockDbQuery).toBeCalledTimes(3);
	});

	test('should update town if provided', async () =>
	{
		// Arrange
		const townId = 134;
		const newPatternId = 42;
		const tempData = {
			...data,
			townId: townId,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockAPIContext.query.mockResolvedValueOnce({ username: 'test-user' });

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: newPatternId }]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newPatternId });
		expect(mockDbQuery).toBeCalledTimes(3);
	});

	test('should delete cache after saving', async () =>
	{
		// Arrange
		const newPatternId = 42;
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		mockAPIContext.query.mockResolvedValueOnce({ username: 'test-user' });

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: newPatternId }]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newPatternId });
		expect(mockACCCache.deleteMatch).toBeCalledTimes(1);
	});
});
