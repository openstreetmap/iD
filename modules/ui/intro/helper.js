import * as d3 from 'd3';
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


export function icon(name, svgklass) {
    return '<svg class="icon ' + (svgklass || '') + '">' +
         '<use xlink:href="' + name + '"></use></svg>';
}


function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}


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

    var name = obj.tags && obj.tags.name;
    if (name) {
        key = 'intro.graph.name.' + slugify(name);
        obj.tags.name = t(key, { default: name });
        checkKey(key, name);
    }
    var city = obj.tags && obj.tags['addr:city'];
    if (city) {
        key = 'intro.graph.city';
        obj.tags['addr:city'] = t(key, { default: city });
        checkKey(key, city);
    }
    var state = obj.tags && obj.tags['addr:state'];
    if (state) {
        key = 'intro.graph.state';
        obj.tags['addr:state'] = t(key, { default: state });
        checkKey(key, state);
    }
    var postcode = obj.tags && obj.tags['addr:postcode'];
    if (postcode) {
        key = 'intro.graph.postcode';
        obj.tags['addr:postcode'] = t(key, { default: postcode });
        checkKey(key, postcode);
    }

    return obj;
}


export function selectMenuItem(operation) {
    var selector = '.edit-menu .edit-menu-item-' + operation +
        ', .radial-menu .radial-menu-item-' + operation;
    return d3.select(selector);
}


export function transitionTime(point1, point2) {
    var distance = geoSphericalDistance(point1, point2);
    if (distance === 0)
        return 0;
    else if (distance < 80)
        return 500;
    else if (distance < 160)
        return 1000;
    else
        return 3000;
}
