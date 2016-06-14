(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {}, global.iD.util = global.iD.util || {})));
}(this, function (exports) { 'use strict';

    function tagText(entity) {
        return d3.entries(entity.tags).map(function(e) {
            return e.key + '=' + e.value;
        }).join(', ');
    }

    function entitySelector(ids) {
        return ids.length ? '.' + ids.join(',.') : 'nothing';
    }

    function entityOrMemberSelector(ids, graph) {
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

    function displayName(entity) {
        var localeName = 'name:' + iD.detect().locale.toLowerCase().split('-')[0];
        return entity.tags[localeName] || entity.tags.name || entity.tags.ref;
    }

    function displayType(id) {
        return {
            n: t('inspector.node'),
            w: t('inspector.way'),
            r: t('inspector.relation')
        }[id.charAt(0)];
    }

    function stringQs(str) {
        return str.split('&').reduce(function(obj, pair){
            var parts = pair.split('=');
            if (parts.length === 2) {
                obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
            }
            return obj;
        }, {});
    }

    function qsString(obj, noencode) {
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

    function prefixDOMProperty(property) {
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

    function prefixCSSProperty(property) {
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
    function setTransform(el, x, y, scale) {
        var prop = transformProperty = transformProperty || prefixCSSProperty('Transform'),
            translate = iD.detect().opera ?
                'translate('   + x + 'px,' + y + 'px)' :
                'translate3d(' + x + 'px,' + y + 'px,0)';
        return el.style(prop, translate + (scale ? ' scale(' + scale + ')' : ''));
    }

    function getStyle(selector) {
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

    function editDistance(a, b) {
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
    function fastMouse(container) {
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
    const getPrototypeOf = Object.getPrototypeOf || function(obj) { return obj.__proto__; };
    /* eslint-enable no-proto */

    function asyncMap(inputs, func, callback) {
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
    function wrap(index, length) {
        if (index < 0)
            index += Math.ceil(-index/length)*length;
        return index % length;
    }

    // A per-domain session mutex backed by a cookie and dead man's
    // switch. If the session crashes, the mutex will auto-release
    // after 5 seconds.

    function SessionMutex(name) {
        var mutex = {},
            intervalID;

        function renew() {
            var expires = new Date();
            expires.setSeconds(expires.getSeconds() + 5);
            document.cookie = name + '=1; expires=' + expires.toUTCString();
        }

        mutex.lock = function() {
            if (intervalID) return true;
            var cookie = document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + name + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1');
            if (cookie) return false;
            renew();
            intervalID = window.setInterval(renew, 4000);
            return true;
        };

        mutex.unlock = function() {
            if (!intervalID) return;
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            clearInterval(intervalID);
            intervalID = null;
        };

        mutex.locked = function() {
            return !!intervalID;
        };

        return mutex;
    }

    function SuggestNames(preset, suggestions) {
        preset = preset.id.split('/', 2);
        var k = preset[0],
            v = preset[1];

        return function(value, callback) {
            var result = [];
            if (value && value.length > 2) {
                if (suggestions[k] && suggestions[k][v]) {
                    for (var sugg in suggestions[k][v]) {
                        var dist = iD.util.editDistance(value, sugg.substring(0, value.length));
                        if (dist < 3) {
                            result.push({
                                title: sugg,
                                value: sugg,
                                dist: dist
                            });
                        }
                    }
                }
                result.sort(function(a, b) {
                    return a.dist - b.dist;
                });
            }
            result = result.slice(0,3);
            callback(result);
        };
    }

    exports.tagText = tagText;
    exports.entitySelector = entitySelector;
    exports.entityOrMemberSelector = entityOrMemberSelector;
    exports.displayName = displayName;
    exports.displayType = displayType;
    exports.stringQs = stringQs;
    exports.qsString = qsString;
    exports.prefixDOMProperty = prefixDOMProperty;
    exports.prefixCSSProperty = prefixCSSProperty;
    exports.setTransform = setTransform;
    exports.getStyle = getStyle;
    exports.editDistance = editDistance;
    exports.fastMouse = fastMouse;
    exports.getPrototypeOf = getPrototypeOf;
    exports.asyncMap = asyncMap;
    exports.wrap = wrap;
    exports.SessionMutex = SessionMutex;
    exports.SuggestNames = SuggestNames;

    Object.defineProperty(exports, '__esModule', { value: true });

}));