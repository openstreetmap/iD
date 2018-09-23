import { select as d3_select } from 'd3-selection';

import { t } from '../../util/locale';
import { geoSphericalDistance } from '../../geo';


export function pointBox(loc, context) {
    var rect = context.surfaceRect();
    var point = context.curtainProjection(loc);
    return {
        left: point[0] + rect.left - 40,
        top: point[1] + rect.top - 60,
        width: 80,
        height: 90
    };
}


export function pad(locOrBox, padding, context) {
    var box;
    if (locOrBox instanceof Array) {
        var rect = context.surfaceRect();
        var point = context.curtainProjection(locOrBox);
        box = {
            left: point[0] + rect.left,
            top: point[1] + rect.top
        };
    } else {
        box = locOrBox;
    }

    return {
        left: box.left - padding,
        top: box.top - padding,
        width: (box.width || 0) + 2 * padding,
        height: (box.width || 0) + 2 * padding
    };
}


export function icon(name, svgklass, useklass) {
    return '<svg class="icon ' + (svgklass || '') + '">' +
         '<use xlink:href="' + name + '"' +
         (useklass ? ' class="' + useklass + '"' : '') + '></use></svg>';
}


function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}


// console warning for missing walkthrough names
export var missingStrings = {};
function checkKey(key, text) {
    if (t(key, { default: undefined}) === undefined) {
        if (missingStrings.hasOwnProperty(key)) return;  // warn once
        missingStrings[key] = text;
        var missing = key + ': ' + text;
        if (typeof console !== 'undefined') console.log(missing); // eslint-disable-line
    }
}


export function localize(obj) {
    var key;

    // Assign name if entity has one..
    var name = obj.tags && obj.tags.name;
    if (name) {
        key = 'intro.graph.name.' + slugify(name);
        obj.tags.name = t(key, { default: name });
        checkKey(key, name);
    }

    // Assign street name if entity has one..
    var street = obj.tags && obj.tags['addr:street'];
    if (street) {
        key = 'intro.graph.name.' + slugify(street);
        obj.tags['addr:street'] = t(key, { default: street });
        checkKey(key, street);

        // Add address details common across walkthrough..
        var addrTags = [
            'block_number', 'city', 'county', 'district', 'hamlet', 'neighbourhood',
            'postcode', 'province', 'quarter', 'state', 'subdistrict', 'suburb'
        ];
        addrTags.forEach(function(k) {
            var key = 'intro.graph.' + k;
            var tag = 'addr:' + k;
            var val = obj.tags && obj.tags[tag];
            var str = t(key, { default: val });

            if (str) {
                if (str.match(/^<.*>$/) !== null) {
                    delete obj.tags[tag];
                } else {
                    obj.tags[tag] = str;
                }
            }
        });
    }

    return obj;
}


// Used to detect squareness.. some duplicataion of code from actionOrthogonalize.
export function isMostlySquare(points) {
    // note: uses 15 here instead of the 12 from actionOrthogonalize because
    // actionOrthogonalize can actually straighten some larger angles as it iterates
    var threshold = 15; // degrees within right or straight
    var lowerBound = Math.cos((90 - threshold) * Math.PI / 180);  // near right
    var upperBound = Math.cos(threshold * Math.PI / 180);         // near straight
    var mag;

    for (var i = 0; i < points.length; i++) {
        mag = Math.abs(normalizedDotProduct(i, points));
        if (mag > lowerBound && mag < upperBound) {
            return false;
        }
    }

    return true;


    function normalizedDotProduct(i, points) {
        var a = points[(i - 1 + points.length) % points.length];
        var b = points[i];
        var c = points[(i + 1) % points.length];
        var p = subtractPoints(a, b);
        var q = subtractPoints(c, b);

        p = normalizePoint(p);
        q = normalizePoint(q);

        return p[0] * q[0] + p[1] * q[1];


        function subtractPoints(a, b) {
            return [a[0] - b[0], a[1] - b[1]];
        }

        function normalizePoint(point) {
            var vector = [0, 0];
            var length = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
            if (length !== 0) {
                vector[0] = point[0] / length;
                vector[1] = point[1] / length;
            }
            return vector;
        }
    }
}


export function selectMenuItem(operation) {
    var selector = '.edit-menu .edit-menu-item-' + operation +
        ', .radial-menu .radial-menu-item-' + operation;
    return d3_select(selector);
}


export function transitionTime(point1, point2) {
    var distance = geoSphericalDistance(point1, point2);
    if (distance === 0)
        return 0;
    else if (distance < 80)
        return 500;
    else
        return 1000;
}
