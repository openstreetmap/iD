import { remove as removeDiacritics } from 'diacritics';
import { fixRTLTextForSvg, rtlRegex } from './svg_paths_rtl_fix';

import { t, textDirection } from './locale';
import { utilArrayUnion } from './array';
import { utilDetect } from './detect';


export function utilTagText(entity) {
    var obj = (entity && entity.tags) || {};
    return Object.keys(obj)
        .map(function(k) { return k + '=' + obj[k]; })
        .join(', ');
}


export function utilTagDiff(oldTags, newTags) {
    var tagDiff = [];
    var keys = utilArrayUnion(Object.keys(oldTags), Object.keys(newTags)).sort();
    keys.forEach(function(k) {
        var oldVal = oldTags[k];
        var newVal = newTags[k];

        if (oldVal && (!newVal || newVal !== oldVal)) {
            tagDiff.push({
                type: '-',
                key: k,
                oldVal: oldVal,
                newVal: newVal,
                display: '- ' + k + '=' + oldVal
            });
        }
        if (newVal && (!oldVal || newVal !== oldVal)) {
            tagDiff.push({
                type: '+',
                key: k,
                oldVal: oldVal,
                newVal: newVal,
                display: '+ ' + k + '=' + newVal
            });
        }
    });
    return tagDiff;
}


export function utilEntitySelector(ids) {
    return ids.length ? '.' + ids.join(',.') : 'nothing';
}


// returns an selector to select entity ids for:
//  - entityIDs passed in
//  - shallow descendant entityIDs for any of those entities that are relations
export function utilEntityOrMemberSelector(ids, graph) {
    var seen = new Set(ids);
    ids.forEach(collectShallowDescendants);
    return utilEntitySelector(Array.from(seen));

    function collectShallowDescendants(id) {
        var entity = graph.hasEntity(id);
        if (!entity || entity.type !== 'relation') return;

        entity.members
            .map(function(member) { return member.id; })
            .forEach(function(id) { seen.add(id); });
    }
}


// returns an selector to select entity ids for:
//  - entityIDs passed in
//  - deep descendant entityIDs for any of those entities that are relations
export function utilEntityOrDeepMemberSelector(ids, graph) {
    return utilEntitySelector(utilEntityAndDeepMemberIDs(ids, graph));
}


// returns an selector to select entity ids for:
//  - entityIDs passed in
//  - deep descendant entityIDs for any of those entities that are relations
export function utilEntityAndDeepMemberIDs(ids, graph) {
    var seen = new Set();
    ids.forEach(collectDeepDescendants);
    return Array.from(seen);

    function collectDeepDescendants(id) {
        if (seen.has(id)) return;
        seen.add(id);

        var entity = graph.hasEntity(id);
        if (!entity || entity.type !== 'relation') return;

        entity.members
            .map(function(member) { return member.id; })
            .forEach(collectDeepDescendants);   // recurse
    }
}

// returns an selector to select entity ids for:
//  - deep descendant entityIDs for any of those entities that are relations
export function utilDeepMemberSelector(ids, graph, skipMultipolgonMembers) {
    var idsSet = new Set(ids);
    var seen = new Set();
    var returners = new Set();
    ids.forEach(collectDeepDescendants);
    return utilEntitySelector(Array.from(returners));

    function collectDeepDescendants(id) {
        if (seen.has(id)) return;
        seen.add(id);

        if (!idsSet.has(id)) {
            returners.add(id);
        }

        var entity = graph.hasEntity(id);
        if (!entity || entity.type !== 'relation') return;
        if (skipMultipolgonMembers && entity.isMultipolygon()) return;
        entity.members
            .map(function(member) { return member.id; })
            .forEach(collectDeepDescendants);   // recurse
    }
}


// Adds or removes highlight styling for the specified entities
export function utilHighlightEntities(ids, highlighted, context) {
    context.surface()
        .selectAll(utilEntityOrDeepMemberSelector(ids, context.graph()))
        .classed('highlighted', highlighted);
}


// returns an Array that is the union of:
//  - nodes for any nodeIDs passed in
//  - child nodes of any wayIDs passed in
//  - descendant member and child nodes of relationIDs passed in
export function utilGetAllNodes(ids, graph) {
    var seen = new Set();
    var nodes = new Set();

    ids.forEach(collectNodes);
    return Array.from(nodes);

    function collectNodes(id) {
        if (seen.has(id)) return;
        seen.add(id);

        var entity = graph.hasEntity(id);
        if (!entity) return;

        if (entity.type === 'node') {
            nodes.add(entity);
        } else if (entity.type === 'way') {
            entity.nodes.forEach(collectNodes);
        } else {
            entity.members
                .map(function(member) { return member.id; })
                .forEach(collectNodes);   // recurse
        }
    }
}


export function utilDisplayName(entity) {
    var localizedNameKey = 'name:' + utilDetect().locale.toLowerCase().split('-')[0];
    var name = entity.tags[localizedNameKey] || entity.tags.name || entity.tags["building:flats"] || entity.tags.flats || entity.tags.houses || '';
    var network = entity.tags.cycle_network || entity.tags.network;
    var maxSpeed = entity.tags.maxspeed;
    var lanes = entity.tags.lanes;
    var lanesForward = entity.tags["lanes:forward"];
    var lanesBackward = entity.tags["lanes:backward"];
    var lanesBothWays = entity.tags["lanes:both_ways"];

    if (!name && entity.tags.ref) {
        name = entity.tags.ref;
        if (network) {
            name = network + ' ' + name;
        }
    }
    var lanesStr = '';
    if (lanes) {
        lanesStr += 'L' + lanes;
        if (lanesForward) {
            lanesStr += '>' + lanesForward;
        }
        if (lanesBackward) {
            lanesStr += '<' + lanesForward;
        }
        if (lanesBothWays) {
            lanesStr += '<>' + lanesBothWays;
        }
        lanesStr += ' ';
    }
    var maxSpeedStr = '';
    if (maxSpeed) {
        maxSpeedStr += 'S' + maxSpeed + ' ';
    }

    return maxSpeedStr + lanesStr + name;
}


export function utilDisplayNameForPath(entity) {
    var name = utilDisplayName(entity);
    var isFirefox = utilDetect().browser.toLowerCase().indexOf('firefox') > -1;

    if (!isFirefox && name && rtlRegex.test(name)) {
        name = fixRTLTextForSvg(name);
    }

    return name;
}


export function utilDisplayType(id) {
    return {
        n: t('inspector.node'),
        w: t('inspector.way'),
        r: t('inspector.relation')
    }[id.charAt(0)];
}


export function utilDisplayLabel(entity, context) {
    var displayName = utilDisplayName(entity);
    if (displayName) {
        // use the display name if there is one
        return displayName;
    }
    var preset = utilPreset(entity, context);
    if (preset && preset.name()) {
        // use the preset name if there is a match
        return preset.name();
    }
    // fallback to the display type (node/way/relation)
    return utilDisplayType(entity.id);
}


export function utilPreset(entity, context) {
    return context.presets().match(entity, context.graph());
}


export function utilEntityRoot(entityType) {
    return {
        node: 'n',
        way: 'w',
        relation: 'r'
    }[entityType];
}


export function utilStringQs(str) {
    return str.split('&').reduce(function(obj, pair){
        var parts = pair.split('=');
        if (parts.length === 2) {
            obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
        }
        return obj;
    }, {});
}


export function utilQsString(obj, noencode) {
    // encode everything except special characters used in certain hash parameters:
    // "/" in map states, ":", ",", {" and "}" in background
    function softEncode(s) {
        return encodeURIComponent(s).replace(/(%2F|%3A|%2C|%7B|%7D)/g, decodeURIComponent);
    }

    return Object.keys(obj).sort().map(function(key) {
        return encodeURIComponent(key) + '=' + (
            noencode ? softEncode(obj[key]) : encodeURIComponent(obj[key]));
    }).join('&');
}


export function utilPrefixDOMProperty(property) {
    var prefixes = ['webkit', 'ms', 'moz', 'o'];
    var i = -1;
    var n = prefixes.length;
    var s = document.body;

    if (property in s)
        return property;

    property = property.substr(0, 1).toUpperCase() + property.substr(1);

    while (++i < n) {
        if (prefixes[i] + property in s) {
            return prefixes[i] + property;
        }
    }

    return false;
}


export function utilPrefixCSSProperty(property) {
    var prefixes = ['webkit', 'ms', 'Moz', 'O'];
    var i = -1;
    var n = prefixes.length;
    var s = document.body.style;

    if (property.toLowerCase() in s) {
        return property.toLowerCase();
    }

    while (++i < n) {
        if (prefixes[i] + property in s) {
            return '-' + prefixes[i].toLowerCase() + property.replace(/([A-Z])/g, '-$1').toLowerCase();
        }
    }

    return false;
}


var transformProperty;
export function utilSetTransform(el, x, y, scale) {
    var prop = transformProperty = transformProperty || utilPrefixCSSProperty('Transform');
    var translate = utilDetect().opera ? 'translate('   + x + 'px,' + y + 'px)'
        : 'translate3d(' + x + 'px,' + y + 'px,0)';
    return el.style(prop, translate + (scale ? ' scale(' + scale + ')' : ''));
}


// Calculates Levenshtein distance between two strings
// see:  https://en.wikipedia.org/wiki/Levenshtein_distance
// first converts the strings to lowercase and replaces diacritic marks with ascii equivalents.
export function utilEditDistance(a, b) {
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
export function utilFastMouse(container) {
    var rect = container.getBoundingClientRect();
    var rectLeft = rect.left;
    var rectTop = rect.top;
    var clientLeft = +container.clientLeft;
    var clientTop = +container.clientTop;

    if (textDirection === 'rtl') {
        rectLeft = 0;
    }
    return function(e) {
        return [
            e.clientX - rectLeft - clientLeft,
            e.clientY - rectTop - clientTop];
    };
}


export function utilAsyncMap(inputs, func, callback) {
    var remaining = inputs.length;
    var results = [];
    var errors = [];

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
export function utilWrap(index, length) {
    if (index < 0) {
        index += Math.ceil(-index/length)*length;
    }
    return index % length;
}


/**
 * a replacement for functor
 *
 * @param {*} value any value
 * @returns {Function} a function that returns that value or the value if it's a function
 */
export function utilFunctor(value) {
    if (typeof value === 'function') return value;
    return function() {
        return value;
    };
}


export function utilNoAuto(selection) {
    var isText = (selection.size() && selection.node().tagName.toLowerCase() === 'textarea');

    return selection
        // assign 'new-password' even for non-password fields to prevent browsers (Chrome) ignoring 'off'
        .attr('autocomplete', 'new-password')
        .attr('autocorrect', 'off')
        .attr('autocapitalize', 'off')
        .attr('spellcheck', isText ? 'true' : 'false');
}


// https://stackoverflow.com/questions/194846/is-there-any-kind-of-hash-code-function-in-javascript
// https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
export function utilHashcode(str) {
    var hash = 0;
    if (str.length === 0) {
        return hash;
    }
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// returns version of `str` with all runs of special characters replaced by `_`;
// suitable for HTML ids, classes, selectors, etc.
export function utilSafeClassName(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}
