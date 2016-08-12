import { functor } from '../index';
import * as d3 from 'd3';
import { t } from './locale';
import { Detect } from './detect';
import { remove as removeDiacritics } from 'diacritics';
import _ from 'lodash';

export function tagText(entity) {
    return d3.entries(entity.tags).map(function(e) {
        return e.key + '=' + e.value;
    }).join(', ');
}

export function entitySelector(ids) {
    return ids.length ? '.' + ids.join(',.') : 'nothing';
}

export function entityOrMemberSelector(ids, graph) {
    var s = entitySelector(ids);

    ids.forEach(function(id) {
        var entity = graph.hasEntity(id);
        if (entity && entity.type === 'relation') {
            entity.members.forEach(function(member) {
                s += ',.' + member.id;
            });
        }
    });

    return s;
}

export function displayName(entity) {
    var localizedNameKey = 'name:' + Detect().locale.toLowerCase().split('-')[0],
        name = entity.tags[localizedNameKey] || entity.tags.name || '',
        network = entity.tags.cycle_network || entity.tags.network;
    if (!name && entity.tags.ref) {
        name = entity.tags.ref;
        if (network) {
            name = network + ' ' + name;
        }
    }
    return name;
}

export function displayType(id) {
    return {
        n: t('inspector.node'),
        w: t('inspector.way'),
        r: t('inspector.relation')
    }[id.charAt(0)];
}

export function stringQs(str) {
    return str.split('&').reduce(function(obj, pair){
        var parts = pair.split('=');
        if (parts.length === 2) {
            obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
        }
        return obj;
    }, {});
}

export function qsString(obj, noencode) {
    function softEncode(s) {
      // encode everything except special characters used in certain hash parameters:
      // "/" in map states, ":", ",", {" and "}" in background
      return encodeURIComponent(s).replace(/(%2F|%3A|%2C|%7B|%7D)/g, decodeURIComponent);
    }
    return Object.keys(obj).sort().map(function(key) {
        return encodeURIComponent(key) + '=' + (
            noencode ? softEncode(obj[key]) : encodeURIComponent(obj[key]));
    }).join('&');
}

export function prefixDOMProperty(property) {
    var prefixes = ['webkit', 'ms', 'moz', 'o'],
        i = -1,
        n = prefixes.length,
        s = document.body;

    if (property in s)
        return property;

    property = property.substr(0, 1).toUpperCase() + property.substr(1);

    while (++i < n)
        if (prefixes[i] + property in s)
            return prefixes[i] + property;

    return false;
}

export function prefixCSSProperty(property) {
    var prefixes = ['webkit', 'ms', 'Moz', 'O'],
        i = -1,
        n = prefixes.length,
        s = document.body.style;

    if (property.toLowerCase() in s)
        return property.toLowerCase();

    while (++i < n)
        if (prefixes[i] + property in s)
            return '-' + prefixes[i].toLowerCase() + property.replace(/([A-Z])/g, '-$1').toLowerCase();

    return false;
}


var transformProperty;
export function setTransform(el, x, y, scale) {
    var prop = transformProperty = transformProperty || prefixCSSProperty('Transform'),
        translate = Detect().opera ?
            'translate('   + x + 'px,' + y + 'px)' :
            'translate3d(' + x + 'px,' + y + 'px,0)';
    return el.style(prop, translate + (scale ? ' scale(' + scale + ')' : ''));
}

export function getStyle(selector) {
    for (var i = 0; i < document.styleSheets.length; i++) {
        var rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules || [];
        for (var k = 0; k < rules.length; k++) {
            var selectorText = rules[k].selectorText && rules[k].selectorText.split(', ');
            if (_.includes(selectorText, selector)) {
                return rules[k];
            }
        }
    }
}

// Calculates Levenshtein distance between two strings
// see:  https://en.wikipedia.org/wiki/Levenshtein_distance
// first converts the strings to lowercase and replaces diacritic marks with ascii equilivants.
export function editDistance(a, b) {
    a = removeDiacritics(a.toLowerCase());
    b = removeDiacritics(b.toLowerCase());
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    for (var i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (var j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i-1) === a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                    Math.min(matrix[i][j-1] + 1, // insertion
                    matrix[i-1][j] + 1)); // deletion
            }
        }
    }
    return matrix[b.length][a.length];
}

// a d3.mouse-alike which
// 1. Only works on HTML elements, not SVG
// 2. Does not cause style recalculation
export function fastMouse(container) {
    var rect = container.getBoundingClientRect(),
        rectLeft = rect.left,
        rectTop = rect.top,
        clientLeft = +container.clientLeft,
        clientTop = +container.clientTop;
    return function(e) {
        return [
            e.clientX - rectLeft - clientLeft,
            e.clientY - rectTop - clientTop];
    };
}

/* eslint-disable no-proto */
export var getPrototypeOf = Object.getPrototypeOf || function(obj) { return obj.__proto__; };
/* eslint-enable no-proto */

export function asyncMap(inputs, func, callback) {
    var remaining = inputs.length,
        results = [],
        errors = [];

    inputs.forEach(function(d, i) {
        func(d, function done(err, data) {
            errors[i] = err;
            results[i] = data;
            remaining--;
            if (!remaining) callback(errors, results);
        });
    });
}

// wraps an index to an interval [0..length-1]
export function wrap(index, length) {
    if (index < 0)
        index += Math.ceil(-index/length)*length;
    return index % length;
}

/**
 * a replacement for functor
 *
 * @param {*} value any value
 * @returns {Function} a function that returns that value or the value if it's a function
 */
export function functor(value) {
    if (typeof value === 'function') return value;
    return function() {
        return value;
    };
}
