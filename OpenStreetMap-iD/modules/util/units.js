import { t, localizer } from '../core/localizer';

var OSM_PRECISION = 7;

/**
 * Returns a localized representation of the given length measurement.
 *
 * @param {Number} m area in meters
 * @param {Boolean} isImperial true for U.S. customary units; false for metric
 */
export function displayLength(m, isImperial) {
    var d = m * (isImperial ? 3.28084 : 1);
    var unit;

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
        quantity: d.toLocaleString(localizer.localeCode(), {
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
export function displayArea(m2, isImperial) {
    var locale = localizer.localeCode();
    var d = m2 * (isImperial ? 10.7639111056 : 1);
    var d1, d2, area;
    var unit1 = '';
    var unit2 = '';

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

function wrap(x, min, max) {
    var d = max - min;
    return ((x - min) % d + d) % d + min;
}

function clamp(x, min, max) {
    return Math.max(min, Math.min(x, max));
}

function roundToDecimal (target, decimalPlace) {
    target = Number(target);
    decimalPlace = Number(decimalPlace);
    const factor = Math.pow(10, decimalPlace);
    return Math.round(target * factor) /  factor;
}

function displayCoordinate(deg, pos, neg) {
    var displayCoordinate;
    var locale = localizer.localeCode();

    var degreesFloor = Math.floor(Math.abs(deg));
    var min = (Math.abs(deg) - degreesFloor) * 60;
    var minFloor = Math.floor(min);
    var sec = (min - minFloor) * 60;


    // if you input 45°,90°0'0.5" , sec should be 0.5 instead 0.499999…
    // in order to mitigate precision errors after calculating, round two time
    // 0.499999… => 0.5
    var fix = roundToDecimal(sec, 8);
    // 0.5 => 1
    var secRounded = roundToDecimal(fix, 0);

    if (secRounded === 60) {
        secRounded = 0;
        minFloor += 1;
        if (minFloor === 60) {
            minFloor = 0;
            degreesFloor += 1;
        }
    }
    displayCoordinate =
        t('units.arcdegrees', {
            quantity: degreesFloor.toLocaleString(locale)
        }) +
        (minFloor !== 0 || secRounded !== 0 ?
            t('units.arcminutes', {
                quantity: minFloor.toLocaleString(locale)
            }) : '') +
        (secRounded !== 0 ?
            t('units.arcseconds', {
                quantity: secRounded.toLocaleString(locale)
            }) : '' );

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
export function dmsCoordinatePair(coord) {
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
export function decimalCoordinatePair(coord) {
    return t('units.coordinate_pair', {
        latitude: clamp(coord[1], -90, 90).toFixed(OSM_PRECISION),
        longitude: wrap(coord[0], -180, 180).toFixed(OSM_PRECISION)
    });
}

// Return the parsed value  that @mapbox/sexagesimal can't parse
// return value format : [D, D]  ex:[ 35.1861, 136.83161 ]
export function dmsMatcher(q) {
    const matchers = [
        // D M SS , D M SS  ex: 35 11 10.1 , 136 49 53.8
        {
            condition: /^\s*(-?)\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*\,\s*(-?)\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*$/,
            parser: function(q) {
                const match = this.condition.exec(q);
                const lat = (+match[2]) + (+match[3]) / 60 + (+match[4]) / 3600;
                const lng = (+match[6]) + (+match[7]) / 60 + (+match[8]) / 3600;
                const isNegLat = match[1] === '-' ? -lat : lat;
                const isNegLng = match[5] === '-' ? -lng : lng;
                const d = [isNegLat, isNegLng];

                return d;
            }
        },
        // D MM , D MM ex: 35 11.1683 , 136 49.8966
        {
            condition: /^\s*(-?)\s*(\d+)\s+(\d+\.?\d*)\s*\,\s*(-?)\s*(\d+)\s+(\d+\.?\d*)\s*$/,
            parser: function(q) {
                const match = this.condition.exec(q);
                const lat = +match[2] + (+match[3]) / 60;
                const lng = +match[5] + (+match[6]) / 60;
                const isNegLat = match[1] === '-' ? -lat : lat;
                const isNegLng = match[4] === '-' ? -lng : lng;
                const d = [isNegLat, isNegLng];

                return d;
            }
        }
    ];
    for (const matcher of matchers) {
        if (matcher.condition.test(q)){
            return matcher.parser(q);
        }
    }
    return null;
}
