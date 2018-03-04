// @flow
import { t } from './locale';
import { utilDetect } from './detect';

var OSM_PRECISION = 7;
var locale = utilDetect().locale;

/**
 * Returns a localized representation of the given length measurement.
 *
 * @param {Number} m area in meters
 * @param {Boolean} isImperial true for U.S. customary units; false for metric
 */
export function displayLength(m: number, isImperial: boolean): string {
	var d = m * (isImperial ? 3.28084 : 1),
		unit;

	if (isImperial) {
		if (d >= 5280) {
			d /= 5280;
			unit = 'miles';
		} else {
			unit = 'feet';
		}
	} else {
		if (d >= 1000) {
			d /= 1000;
			unit = 'kilometers';
		} else {
			unit = 'meters';
		}
	}

	return t('units.' + unit, {
		quantity: d.toLocaleString(locale, {
			maximumSignificantDigits: 4
		})
	});
}

/**
 * Returns a localized representation of the given area measurement.
 *
 * @param {Number} m2 area in square meters
 * @param {Boolean} isImperial true for U.S. customary units; false for metric
 */
export function displayArea(m2: number, isImperial: boolean): string {
	var d = m2 * (isImperial ? 10.7639111056 : 1),
		d1, d2, area;
	var unit1: string = '';
	var unit2: string = '';

	if (isImperial) {
		if (d >= 6969600) { // > 0.25mi² show mi²
			d1 = d / 27878400;
			unit1 = 'square_miles';
		} else {
			d1 = d;
			unit1 = 'square_feet';
		}

		if (d > 4356 && d < 43560000) { // 0.1 - 1000 acres
			d2 = d / 43560;
			unit2 = 'acres';
		}

	} else {
		if (d >= 250000) { // > 0.25km² show km²
			d1 = d / 1000000;
			unit1 = 'square_kilometers';
		} else {
			d1 = d;
			unit1 = 'square_meters';
		}

		if (d > 1000 && d < 10000000) { // 0.1 - 1000 hectares
			d2 = d / 10000;
			unit2 = 'hectares';
		}
	}

	area = t('units.' + unit1, {
		quantity: d1.toLocaleString(locale, {
			maximumSignificantDigits: 4
		})
	});

	if (d2) {
		return t('units.area_pair', {
			area1: area,
			area2: t('units.' + unit2, {
				quantity: d2.toLocaleString(locale, {
					maximumSignificantDigits: 2
				})
			})
		});
	} else {
		return area;
	}
}

function wrap(x: number, min: number, max: number): number {
	var d = max - min;
	return ((x - min) % d + d) % d + min;
}

function clamp(x: number, min: number, max: number): number {
	return Math.max(min, Math.min(x, max));
}

function displayCoordinate(deg: number, pos: any, neg: any): string {
	var min = (Math.abs(deg) - Math.floor(Math.abs(deg))) * 60,
		sec = (min - Math.floor(min)) * 60,
		displayDegrees = t('units.arcdegrees', {
			quantity: Math.floor(Math.abs(deg)).toLocaleString(locale)
		}),
		displayCoordinate;

	if (Math.floor(sec) > 0) {
		displayCoordinate = displayDegrees +
			t('units.arcminutes', {
				quantity: Math.floor(min).toLocaleString(locale)
			}) +
			t('units.arcseconds', {
				quantity: Math.round(sec).toLocaleString(locale)
			});
	} else if (Math.floor(min) > 0) {
		displayCoordinate = displayDegrees +
			t('units.arcminutes', {
				quantity: Math.round(min).toLocaleString(locale)
			});
	} else {
		displayCoordinate = t('units.arcdegrees', {
			quantity: Math.round(Math.abs(deg)).toLocaleString(locale)
		});
	}

	if (deg === 0) {
		return displayCoordinate;
	} else {
		return t('units.coordinate', {
			coordinate: displayCoordinate,
			direction: t('units.' + (deg > 0 ? pos : neg))
		});
	}
}

/**
 * Returns given coordinate pair in degree-minute-second format.
 *
 * @param {Array<Number>} coord longitude and latitude
 */
export function dmsCoordinatePair(coord: number[]): string {
	return t('units.coordinate_pair', {
		latitude: displayCoordinate(clamp(coord[1], -90, 90), 'north', 'south'),
		longitude: displayCoordinate(wrap(coord[0], -180, 180), 'east', 'west')
	});
}

/**
 * Returns the given coordinate pair in decimal format.
 * note: unlocalized to avoid comma ambiguity - see #4765
 *
 * @param {Array<Number>} coord longitude and latitude
 */
export function decimalCoordinatePair(coord: number[]): string {
	return t('units.coordinate_pair', {
		latitude: clamp(coord[1], -90, 90).toFixed(OSM_PRECISION),
		longitude: wrap(coord[0], -180, 180).toFixed(OSM_PRECISION)
	});
}
