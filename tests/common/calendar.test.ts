import { describe, test, expect } from 'vitest';

import { getSeason, getInternalSeason } from 'common/calendar.ts';
import { dateUtils } from '@utils';

describe('Calendar Season', () =>
{
	test('renders default with no errors', () =>
	{
		// Act
		const result = getSeason();

		// Assert
		expect(result).toEqual(expect.objectContaining({
			debug: false,
		}));
	});

	test('renders January 1st (After New Year, Last)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 0, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'newyear',
			bannerName: 'newyear',
		}));
	});

	test('renders January 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 0, 1, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [ '#b0c8d8', '#f0f0f0', '#e0e8e8', '#dae2e5' ],
			ui_colors: {
				default: '#e0e8e8',
				light: '#f0f0f0',
				lighter: '#dae2e5',
				dark: '#b0c8d8',
				header: 'rgba(230, 230, 255, .2)',
			},
			theme: 'snow',
			season: 'winter',
			event: 'newyearday',
			bannerName: 'newyearday',
			debug: false,
		}));
	});

	test('renders January 2nd (After New Year Day, Last)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 0, 2, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'newyearday',
			bannerName: 'newyearday',
		}));
	});

	test('renders January 2nd (After New Year Day)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 0, 2, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
		}));
	});

	test('renders January 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 0, 20, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [ '#b0c8d8', '#f0f0f0', '#e0e8e8', '#dae2e5' ],
			ui_colors: {
				default: '#e0e8e8',
				light: '#f0f0f0',
				lighter: '#dae2e5',
				dark: '#b0c8d8',
				header: 'rgba(230, 230, 255, .2)',
			},
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
			debug: false,
		}));
	});

	test('renders February 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 1, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [ '#b0c8d8', '#f0f0f0', '#e0e8e8', '#dae2e5' ],
			ui_colors: {
				default: '#e0e8e8',
				light: '#f0f0f0',
				lighter: '#dae2e5',
				dark: '#b0c8d8',
				header: 'rgba(230, 230, 255, .2)',
			},
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
			debug: false,
		}));
	});

	test('renders February 2nd (Before Groundhog Day)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 2, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
		}));
	});

	test('renders February 2nd (Groundhog Day)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 2, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'groundhog',
			bannerName: 'groundhog',
		}));
	});

	test('renders February 3rd (After Groundhog Day, Last)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 3, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'groundhog',
			bannerName: 'groundhog',
		}));
	});

	test('renders February 3rd (After Groundhog Day)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 3, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
		}));
	});

	test('renders February 15th (Before Presidents Day)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 15, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
		}));
	});

	test('renders February 15th (Presidents Day)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 15, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'presidentsday',
			bannerName: 'presidentsday',
		}));
	});

	test('renders February 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 20, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [ '#b0c8d8', '#f0f0f0', '#e0e8e8', '#dae2e5' ],
			ui_colors: {
				default: '#e0e8e8',
				light: '#f0f0f0',
				lighter: '#dae2e5',
				dark: '#b0c8d8',
				header: 'rgba(230, 230, 255, .2)',
			},
			theme: 'snow',
			season: 'winter',
			event: 'presidentsday',
			bannerName: 'presidentsday',
			debug: false,
		}));
	});

	test('renders February 22nd (After Presidents Day, Last)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 22, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'presidentsday',
			bannerName: 'presidentsday',
		}));
	});

	test('renders February 22nd (After Presidents Day)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 1, 22, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
		}));
	});

	test('renders March 1st (Before Spring)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 2, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			season: 'winter',
		}));
	});

	test('renders March 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 2, 1, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(145.33,100.00%,30.89%)',
				'hsl(94.72,59.17%,50.61%)',
				'hsl(130.83,64.10%,45.45%)',
				'hsl(76.81,60.27%,45.39%)',
			],
			ui_colors: {
				default: 'hsl(102.51,45.73%,40.00%)',
				light: 'hsl(103.71,31.44%,49.91%)',
				lighter: 'hsl(103.71,31.44%,79.91%)',
				dark: 'hsl(108.37,43.13%,33.54%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'spring',
			event: null,
			bannerName: 'spring',
			debug: false,
		}));
	});

	test('renders March 1st (Southern Hemisphere)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 2, 1, 5);

		// Act
		const result = getInternalSeason(dateOverride, false, true);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(115.01,72.10%,31.28%)',
				'hsl(98.37,59.91%,45.23%)',
				'hsl(107.86,74.56%,38.98%)',
				'hsl(101.90,73.61%,35.02%)',
			],
			ui_colors: {
				default: 'hsl(139.46,63.89%,36.18%)',
				light: 'hsl(104.58,45.74%,48.11%)',
				lighter: 'hsl(104.58,45.74%,78.11%)',
				dark: 'hsl(122.93,72.39%,27.33%)',
				header: 'rgba(200,0,0,.2)',
			},
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
			debug: false,
		}));
	});

	test('renders March 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 2, 20, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(146.90,100.00%,30.37%)',
				'hsl(98.12,59.95%,48.78%)',
				'hsl(134.76,74.06%,42.83%)',
				'hsl(99.60,71.01%,42.51%)',
			],
			ui_colors: {
				default: 'hsl(97.13,55.09%,40.00%)',
				light: 'hsl(96.68,41.97%,49.45%)',
				lighter: 'hsl(96.68,41.97%,79.45%)',
				dark: 'hsl(107.67,57.41%,33.78%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'spring',
			event: null,
			bannerName: 'spring',
			debug: false,
		}));
	});

	test('renders April 1st (Before Cherry, April Fools)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 2, 31, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'spring',
			event: null,
			bannerName: 'spring',
		}));
	});

	test('renders April 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 3, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(147.90,100.00%,30.03%)',
				'hsl(100.28,60.45%,47.62%)',
				'hsl(137.25,80.36%,41.17%)',
				'hsl(114.03,77.81%,40.69%)',
			],
			ui_colors: {
				default: 'hsl(93.72,61.01%,40.00%)',
				light: 'hsl(92.24,48.64%,49.15%)',
				lighter: 'hsl(92.24,48.64%,79.15%)',
				dark: 'hsl(107.22,66.44%,33.93%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'cherry',
			season: 'cherry',
			event: 'aprilfools',
			bannerName: 'cherry',
			debug: false,
		}));
	});

	test('renders April 1st (Southern Hemisphere)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 3, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride, false, true);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(55.98,59.25%,35.81%)',
				'hsl(58.15,86.86%,39.32%)',
				'hsl(49.36,82.68%,41.75%)',
				'hsl(71.57,73.43%,40.68%)',
			],
			ui_colors: {
				default: 'hsl(64.31,63.46%,42.03%)',
				light: 'hsl(56.62,59.32%,47.62%)',
				lighter: 'hsl(56.62,59.32%,77.62%)',
				dark: 'hsl(74.16,76.14%,31.31%)',
				header: 'rgba(200,0,0,.2)',
			},
			theme: 'default',
			season: 'autumn',
			event: 'aprilfools',
			bannerName: 'autumn',
			debug: false,
		}));
	});

	test('renders April 2nd (Last April Fools)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 3, 2, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'cherry',
			season: 'cherry',
			event: 'aprilfools',
			bannerName: 'cherry',
			debug: false,
		}));
	});

	test('renders April 2nd', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 3, 2, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'cherry',
			season: 'cherry',
			event: null,
			bannerName: 'cherry',
			debug: false,
		}));
	});

	test('renders April 10th (Last Cherry)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 3, 9, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'cherry',
			season: 'cherry',
			bannerName: 'cherry',
		}));
	});

	test('renders April 10th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 3, 10, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'spring',
			bannerName: 'spring',
		}));
	});

	test('renders April 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 3, 20, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(149.47,100.00%,29.51%)',
				'hsl(103.69,61.24%,45.78%)',
				'hsl(141.18,90.33%,38.54%)',
				'hsl(136.87,88.57%,37.80%)',
			],
			ui_colors: {
				default: 'hsl(118.21,66.76%,39.12%)',
				light: 'hsl(98.93,40.54%,51.82%)',
				lighter: 'hsl(98.93,40.54%,81.82%)',
				dark: 'hsl(130.69,80.00%,26.00%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'spring',
			event: null,
			bannerName: 'spring',
			debug: false,
		}));
	});

	test('renders May 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 4, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(150.39,100.00%,29.20%)',
				'hsl(105.67,61.69%,44.72%)',
				'hsl(143.46,96.11%,37.02%)',
				'hsl(150.09,94.80%,36.13%)',
			],
			ui_colors: {
				default: 'hsl(120.89,66.22%,39.39%)',
				light: 'hsl(103.22,41.75%,51.42%)',
				lighter: 'hsl(103.22,41.75%,81.42%)',
				dark: 'hsl(134.44,80.00%,26.00%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'spring',
			event: null,
			bannerName: 'spring',
			debug: false,
		}));
	});

	test('renders May 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 4, 20, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(152.35,100.00%,28.59%)',
				'hsl(109.30,57.53%,44.68%)',
				'hsl(143.65,95.13%,36.81%)',
				'hsl(160.35,99.14%,34.59%)',
			],
			ui_colors: {
				default: 'hsl(125.52,65.30%,39.85%)',
				light: 'hsl(110.64,43.84%,50.72%)',
				lighter: 'hsl(110.64,43.84%,80.72%)',
				dark: 'hsl(140.93,80.00%,26.00%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'spring',
			event: null,
			bannerName: 'spring',
			debug: false,
		}));
	});

	test('renders June 1st (Before Summer)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 5, 1, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			season: 'spring',
		}));
	});

	test('renders June 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 5, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(153.76,100.00%,28.17%)',
				'hsl(111.68,52.91%,45.38%)',
				'hsl(142.24,90.08%,37.65%)',
				'hsl(161.76,99.28%,34.17%)',
			],
			ui_colors: {
				default: 'hsl(128.45,64.71%,40.15%)',
				light: 'hsl(115.32,45.15%,50.28%)',
				lighter: 'hsl(115.32,45.15%,80.28%)',
				dark: 'hsl(145.03,80.00%,26.00%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'summer',
			event: null,
			bannerName: 'summer',
			debug: false,
		}));
	});

	test('renders June 1st (Southern Hemisphere)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 5, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride, false, true);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(11.85,47.95%,37.37%)',
				'hsl(32.64,66.33%,44.10%)',
				'hsl(23.69,59.48%,44.00%)',
				'hsl(350.68,36.00%,49.00%)',
			],
			ui_colors: {
				default: 'hsl(22.82,70.07%,32.08%)',
				light: 'hsl(18.88,46.19%,46.98%)',
				lighter: 'hsl(18.88,46.19%,76.98%)',
				dark: 'hsl(16.94,68.10%,25.99%)',
				header: 'rgba(230, 230, 255, .2)',
			},
			theme: 'default',
			season: 'winter',
			event: null,
			bannerName: 'winter',
			debug: false,
		}));
	});

	test('renders June 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 5, 20, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(155.97,100.00%,27.51%)',
				'hsl(115.46,45.59%,46.49%)',
				'hsl(140.03,82.09%,38.98%)',
				'hsl(163.97,99.50%,33.51%)',
			],
			ui_colors: {
				default: 'hsl(133.09,63.78%,40.61%)',
				light: 'hsl(122.74,47.24%,49.59%)',
				lighter: 'hsl(122.74,47.24%,79.59%)',
				dark: 'hsl(151.52,80.00%,26.00%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'summer',
			event: null,
			bannerName: 'summer',
			debug: false,
		}));
	});

	test('renders July 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 6, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(157.26,100.00%,27.12%)',
				'hsl(117.64,41.35%,47.13%)',
				'hsl(138.74,77.47%,39.76%)',
				'hsl(165.26,99.63%,33.12%)',
			],
			ui_colors: {
				default: 'hsl(135.77,63.25%,40.88%)',
				light: 'hsl(127.03,48.45%,49.18%)',
				lighter: 'hsl(127.03,48.45%,79.18%)',
				dark: 'hsl(155.28,80.00%,26.00%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'summer',
			event: null,
			bannerName: 'summer',
			debug: false,
		}));
	});

	test('renders July 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 6, 20, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(159.48,100.00%,26.46%)',
				'hsl(121.41,34.02%,48.24%)',
				'hsl(136.52,69.48%,41.09%)',
				'hsl(167.48,99.85%,32.46%)',
			],
			ui_colors: {
				default: 'hsl(140.88,76.18%,29.37%)',
				light: 'hsl(151.48,58.30%,35.82%)',
				lighter: 'hsl(151.48,58.30%,65.82%)',
				dark: 'hsl(156.22,71.47%,19.80%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'summer',
			event: null,
			bannerName: 'summer',
			debug: false,
		}));
	});

	test('renders August 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 7, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(160.88,100.00%,26.04%)',
				'hsl(123.79,29.40%,48.94%)',
				'hsl(135.12,64.44%,41.93%)',
				'hsl(168.88,99.99%,32.04%)',
			],
			ui_colors: {
				default: 'hsl(141.48,76.71%,28.07%)',
				light: 'hsl(147.11,57.89%,35.29%)',
				lighter: 'hsl(147.11,57.89%,65.29%)',
				dark: 'hsl(149.26,69.69%,19.90%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'summer',
			event: null,
			bannerName: 'summer',
			debug: false,
		}));
	});

	test('renders August Fireworks (Before)', () =>
	{
		// Arrange
		const year = new Date().getFullYear();
		const dayOfWeek = new Date(Date.UTC(year, 7, 1)).getUTCDay();
		const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
		const dateOverride = dateUtils.toUTC(year, 7, 1 + daysToAdd, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'summer',
			event: null,
			bannerName: 'summer',
		}));
	});

	test('renders August Fireworks', () =>
	{
		// Arrange
		const year = new Date().getFullYear();
		const dayOfWeek = new Date(Date.UTC(year, 7, 1)).getUTCDay();
		const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
		const dateOverride = dateUtils.toUTC(year, 7, 1 + daysToAdd, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'summer',
			event: 'fireworks',
			bannerName: 'fireworks',
		}));
	});

	test('renders August Fireworks (After, Last)', () =>
	{
		// Arrange
		const year = new Date().getFullYear();
		const dayOfWeek = new Date(Date.UTC(year, 7, 1)).getUTCDay();
		const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
		const dateOverride = dateUtils.toUTC(year, 7, 1 + daysToAdd + 1, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'summer',
			event: 'fireworks',
			bannerName: 'fireworks',
		}));
	});

	test('renders August Fireworks (After)', () =>
	{
		// Arrange
		const year = new Date().getFullYear();
		const dayOfWeek = new Date(Date.UTC(year, 7, 1)).getUTCDay();
		const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
		const dateOverride = dateUtils.toUTC(year, 7, 1 + daysToAdd + 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'summer',
			event: null,
			bannerName: 'summer',
		}));
	});

	test('renders August 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 7, 20, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(133.47,83.30%,29.16%)',
				'hsl(108.65,47.51%,46.74%)',
				'hsl(118.75,70.32%,40.19%)',
				'hsl(128.83,84.20%,33.81%)',
			],
			ui_colors: {
				default: 'hsl(140.24,68.86%,33.03%)',
				light: 'hsl(121.07,50.45%,43.14%)',
				lighter: 'hsl(121.07,50.45%,73.14%)',
				dark: 'hsl(133.14,71.34%,24.45%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'summer',
			event: null,
			bannerName: 'summer',
			debug: false,
		}));
	});

	test('renders September 1st (Before Autumn)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 8, 1, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			season: 'summer',
		}));
	});

	test('renders September 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 8, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(115.07,72.14%,31.27%)',
				'hsl(98.40,59.87%,45.24%)',
				'hsl(107.90,74.54%,38.99%)',
				'hsl(101.99,73.65%,35.01%)',
			],
			ui_colors: {
				default: 'hsl(139.46,63.90%,36.17%)',
				light: 'hsl(104.63,45.75%,48.10%)',
				lighter: 'hsl(104.63,45.75%,78.10%)',
				dark: 'hsl(122.96,72.39%,27.32%)',
				header: 'rgba(200,0,0,.2)',
			},
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
			debug: false,
		}));
	});

	test('renders September 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 8, 20, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(79.99,61.30%,34.28%)',
				'hsl(75.52,77.66%,41.87%)',
				'hsl(76.43,80.13%,39.70%)',
				'hsl(76.17,68.83%,38.13%)',
			],
			ui_colors: {
				default: 'hsl(70.70,52.10%,42.74%)',
				light: 'hsl(59.10,45.12%,50.10%)',
				lighter: 'hsl(59.10,45.12%,80.10%)',
				dark: 'hsl(88.01,78.98%,27.41%)',
				header: 'rgba(200,0,0,.2)',
			},
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
			debug: false,
		}));
	});

	test('renders October 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 9, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(55.98,59.25%,35.81%)',
				'hsl(58.15,86.86%,39.32%)',
				'hsl(49.36,82.68%,41.75%)',
				'hsl(71.57,73.43%,40.68%)',
			],
			ui_colors: {
				default: 'hsl(64.31,63.46%,42.03%)',
				light: 'hsl(56.62,59.32%,47.62%)',
				lighter: 'hsl(56.62,59.32%,77.62%)',
				dark: 'hsl(74.16,76.14%,31.31%)',
				header: 'rgba(200,0,0,.2)',
			},
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
			debug: false,
		}));
	});

	test('renders October 1st (Southern Hemisphere)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 9, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride, false, true);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(147.90,100.00%,30.03%)',
				'hsl(100.28,60.45%,47.62%)',
				'hsl(137.25,80.36%,41.17%)',
				'hsl(114.03,77.81%,40.69%)',
			],
			ui_colors: {
				default: 'hsl(93.72,61.01%,40.00%)',
				light: 'hsl(92.24,48.64%,49.15%)',
				lighter: 'hsl(92.24,48.64%,79.15%)',
				dark: 'hsl(107.22,66.44%,33.93%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'cherry',
			season: 'cherry',
			event: null,
			bannerName: 'cherry',
			debug: false,
		}));
	});

	test('renders October 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 9, 20, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(42.15,65.10%,40.07%)',
				'hsl(52.61,90.03%,42.39%)',
				'hsl(43.97,80.97%,45.39%)',
				'hsl(45.23,69.25%,47.10%)',
			],
			ui_colors: {
				default: 'hsl(53.14,78.14%,41.37%)',
				light: 'hsl(55.60,80.00%,43.63%)',
				lighter: 'hsl(55.60,80.00%,73.63%)',
				dark: 'hsl(50.29,74.97%,36.63%)',
				header: 'rgba(200,0,0,.2)',
			},
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
			debug: false,
		}));
	});

	test('renders October 29th (Before Anniversary)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 9, 28, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
		}));
	});

	test('renders October 29th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 9, 28, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'autumn',
			event: 'anniversary',
			bannerName: 'anniversary',
		}));
	});

	test('renders October 29th (After Anniversary, Last, Before Halloween)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 9, 29, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'autumn',
			event: 'anniversary',
			bannerName: 'anniversary',
		}));
	});

	test('renders October 29th (After Anniversary, Halloween)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 9, 29, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'autumn',
			event: 'halloween',
			bannerName: 'halloween',
		}));
	});

	test('renders November 1st (After Halloween, Last)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 10, 1, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'autumn',
			event: 'halloween',
			bannerName: 'halloween',
		}));
	});

	test('renders November 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 10, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(36.18,67.18%,41.38%)',
				'hsl(48.95,90.79%,43.59%)',
				'hsl(41.77,80.82%,46.38%)',
				'hsl(31.56,67.21%,49.18%)',
			],
			ui_colors: {
				default: 'hsl(32.64,77.60%,46.34%)',
				light: 'hsl(55.66,80.00%,43.00%)',
				lighter: 'hsl(55.66,80.00%,73.00%)',
				dark: 'hsl(29.24,60.03%,41.21%)',
				header: 'rgba(200,0,0,.2)',
			},
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
			debug: false,
		}));
	});

	test('renders November 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 10, 20, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(26.24,59.87%,38.62%)',
				'hsl(39.12,84.74%,42.00%)',
				'hsl(34.37,78.74%,44.00%)',
				'hsl(10.60,55.98%,47.13%)',
			],
			ui_colors: {
				default: 'hsl(17.74,69.75%,46.25%)',
				light: 'hsl(19.99,67.50%,51.75%)',
				lighter: 'hsl(19.99,67.50%,81.75%)',
				dark: 'hsl(13.00,80.00%,32.50%)',
				header: 'rgba(200,0,0,.2)',
			},
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
			debug: false,
		}));
	});

	test('renders November 22nd (Before Thanksgiving)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 10, 22, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
		}));
	});

	test('renders November 22nd (Thanksgiving)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 10, 22, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'autumn',
			event: 'thanksgiving',
			bannerName: 'thanksgiving',
		}));
	});

	test('renders November 29th (After Thanksgiving, Last)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 10, 29, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'autumn',
			event: 'thanksgiving',
			bannerName: 'thanksgiving',
		}));
	});

	test('renders November 29th (After Thanksgiving)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 10, 29, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'default',
			season: 'autumn',
			event: null,
			bannerName: 'autumn',
		}));
	});

	test('renders December 1st (Before Winter)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			season: 'autumn',
		}));
	});

	test('renders December 1st', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 1, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(11.80,47.87%,37.36%)',
				'hsl(32.58,66.17%,44.14%)',
				'hsl(23.59,59.32%,44.00%)',
				'hsl(350.77,36.00%,49.00%)',
			],
			ui_colors: {
				default: 'hsl(23.00,70.00%,32.00%)',
				light: 'hsl(19.00,46.00%,47.00%)',
				lighter: 'hsl(19.00,46.00%,77.00%)',
				dark: 'hsl(17.00,68.00%,26.00%)',
				header: 'rgba(230, 230, 255, .2)',
			},
			theme: 'default',
			season: 'winter',
			event: null,
			bannerName: 'winter',
			debug: false,
		}));
	});

	test('renders December 1st (Southern Hemisphere)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 1, 5);

		// Act
		const result = getInternalSeason(dateOverride, false, true);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [
				'hsl(153.76,100.00%,28.17%)',
				'hsl(111.69,52.89%,45.38%)',
				'hsl(142.24,90.06%,37.66%)',
				'hsl(161.76,99.28%,34.17%)',
			],
			ui_colors: {
				default: 'hsl(128.46,64.71%,40.15%)',
				light: 'hsl(115.34,45.16%,50.28%)',
				lighter: 'hsl(115.34,45.16%,80.28%)',
				dark: 'hsl(145.05,80.00%,26.00%)',
				header: 'rgba(0,190,0,.2)',
			},
			theme: 'default',
			season: 'summer',
			event: null,
			bannerName: 'summer',
			debug: false,
		}));
	});

	test('renders December 17th (Before Festive)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 17, 3);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
		}));
	});

	test('renders December 17th (Festive)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 17, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'festive',
			bannerName: 'festive',
		}));
	});

	test('renders December 20th', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 20, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			bg_colors: [ '#b0c8d8', '#f0f0f0', '#e0e8e8', '#dae2e5' ],
			ui_colors: {
				default: '#e0e8e8',
				light: '#f0f0f0',
				lighter: '#dae2e5',
				dark: '#b0c8d8',
				header: 'rgba(230, 230, 255, .2)',
			},
			theme: 'snow',
			season: 'winter',
			event: 'festive',
			bannerName: 'festive',
			debug: false,
		}));
	});

	test('renders December 24th (After Festive, Last)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 24, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'festive',
			bannerName: 'festive',
		}));
	});

	test('renders December 24th (Jingle)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 24, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'jingle',
			bannerName: 'jingle',
		}));
	});

	test('renders December 27th (After Jingle, Last)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 27, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'jingle',
			bannerName: 'jingle',
		}));
	});

	test('renders December 27th (After Jingle)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 27, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
		}));
	});

	test('renders December 30th (Before New Year)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 30, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: null,
			bannerName: 'winter',
		}));
	});

	test('renders December 30th (New Year)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 30, 5);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			theme: 'snow',
			season: 'winter',
			event: 'newyear',
			bannerName: 'newyear',
		}));
	});

	test('August Fireworks only on Sundays (Saturday has no event)', () =>
	{
		// Arrange — find a Saturday in August
		const year = new Date().getFullYear();
		const dayOfWeek = new Date(Date.UTC(year, 7, 1)).getUTCDay();
		const daysToSaturday = (6 - dayOfWeek + 7) % 7;
		const dateOverride = dateUtils.toUTC(year, 7, 1 + daysToSaturday, 4);

		// Sanity check: make sure it's actually a Saturday
		expect(dateUtils.dateToTimezone(dateOverride).getDay()).toBe(6);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			season: 'summer',
			event: null,
			bannerName: 'summer',
		}));
	});

	test('banner uses season name during April Fools (not aprilfools)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 3, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result.event).toBe('aprilfools');
		expect(result.bannerName).toBe('cherry'); // bannerName ignores aprilfools
	});

	test('banner uses season name during April Fools (Southern Hemisphere)', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 3, 1, 4);

		// Act
		const result = getInternalSeason(dateOverride, false, true);

		// Assert
		expect(result.event).toBe('aprilfools');
		expect(result.bannerName).toBe('autumn'); // SH autumn, not aprilfools
	});

	test('debug is true when dateOverride is used on non-live site', () =>
	{
		// Arrange & Act
		const result = getInternalSeason(
			dateUtils.toUTC((new Date).getFullYear(), 5, 15, 4),
			true, // debug flag
		);

		// Assert
		expect(result.debug).toBe(true);
	});

	test('Southern Hemisphere October is cherry blossom season', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 9, 5, 4);

		// Act
		const result = getInternalSeason(dateOverride, false, true);

		// Assert
		expect(result.season).toBe('cherry');
		expect(result.theme).toBe('cherry');
	});

	test('Southern Hemisphere December is summer', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 11, 15, 5);

		// Act
		const result = getInternalSeason(dateOverride, false, true);

		// Assert
		expect(result.season).toBe('summer');
		expect(result.theme).toBe('default');
	});

	test('Southern Hemisphere June is winter with snow theme', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 5, 15, 4);

		// Act
		const result = getInternalSeason(dateOverride, false, true);

		// Assert
		expect(result.season).toBe('winter');
		expect(result.theme).toBe('snow');
	});

	test('time is included in result', () =>
	{
		// Arrange
		const dateOverride = dateUtils.toUTC((new Date).getFullYear(), 6, 4, 4);

		// Act
		const result = getInternalSeason(dateOverride);

		// Assert
		expect(result.time).toBe(dateOverride);
	});
});
