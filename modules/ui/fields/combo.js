import _compact from 'lodash-es/compact';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _map from 'lodash-es/map';
import _reject from 'lodash-es/reject';
import _remove from 'lodash-es/remove';
import _some from 'lodash-es/some';
import _uniq from 'lodash-es/uniq';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3combobox as d3_combobox } from '../../lib/d3.combobox.js';

import { t } from '../../util/locale';
import { services } from '../../services';

import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';

export {
    uiFieldCombo as uiFieldMultiCombo,
    uiFieldCombo as uiFieldNetworkCombo,
    uiFieldCombo as uiFieldSemiCombo,
    uiFieldCombo as uiFieldTypeCombo
};


export function uiFieldCombo(field, context) {
    var dispatch = d3_dispatch('change');
    var nominatim = services.geocoder;
    var taginfo = services.taginfo;
    var isMulti = (field.type === 'multiCombo');
    var isNetwork = (field.type === 'networkCombo');
    var isSemi = (field.type === 'semiCombo');
    var optstrings = field.strings && field.strings.options;
    var optarray = field.options;
    var snake_case = (field.snake_case || (field.snake_case === undefined));
    var caseSensitive = field.caseSensitive;
    var combobox = d3_combobox()
        .container(context.container())
        .caseSensitive(caseSensitive)
        .minItems(isMulti || isSemi ? 1 : 2);
    var container = d3_select(null);
    var input = d3_select(null);
    var _comboData = [];
    var _multiData = [];
    var _entity;
    var _country;

    // ensure multiCombo field.key ends with a ':'
    if (isMulti && /[^:]$/.test(field.key)) {
        field.key += ':';
    }


    function snake(s) {
        return s.replace(/\s+/g, '_');
    }

    function unsnake(s) {
        return s.replace(/_+/g, ' ');
    }

    function clean(s) {
        return s.split(';')
            .map(function(s) { return s.trim(); })
            .join(';');
    }


    // returns the tag value for a display value
    // (for multiCombo, dval should be the key suffix, not the entire key)
    function tagValue(dval) {
        dval = clean(dval || '');

        if (optstrings) {
            var found = _find(_comboData, function(o) {
                return o.key && clean(o.value) === dval;
            });
            if (found) {
                return found.key;
            }
        }

        if (field.type === 'typeCombo' && !dval) {
            return 'yes';
        }

        return (snake_case ? snake(dval) : dval) || undefined;
    }


    // returns the display value for a tag value
    // (for multiCombo, tval should be the key suffix, not the entire key)
    function displayValue(tval) {
        tval = tval || '';

        if (optstrings) {
            var found = _find(_comboData, function(o) { return o.key === tval && o.value; });
            if (found) {
                return found.value;
            }
        }

        if (field.type === 'typeCombo' && tval.toLowerCase() === 'yes') {
            return '';
        }

        return snake_case ? unsnake(tval) : tval;
    }


    function objectDifference(a, b) {
        return _reject(a, function(d1) {
            return _some(b, function(d2) { return d1.value === d2.value; });
        });
    }


    function initCombo(selection, attachTo) {
        if (optstrings) {
            selection.attr('readonly', 'readonly');
            selection.call(combobox, attachTo);
            setStaticValues(setPlaceholder);

        } else if (optarray) {
            selection.call(combobox, attachTo);
            setStaticValues(setPlaceholder);

        } else if (taginfo) {
            selection.call(combobox.fetcher(setTaginfoValues), attachTo);
            setTaginfoValues('', setPlaceholder);
        }
    }


    function setStaticValues(callback) {
        if (!(optstrings || optarray)) return;

        if (optstrings) {
            _comboData = Object.keys(optstrings).map(function(k) {
                var v = field.t('options.' + k, { 'default': optstrings[k] });
                return {
                    key: k,
                    value: v,
                    title: v
                };
            });

        } else if (optarray) {
            _comboData = optarray.map(function(k) {
                var v = snake_case ? unsnake(k) : k;
                return {
                    key: k,
                    value: v,
                    title: v
                };
            });
        }

        combobox.data(objectDifference(_comboData, _multiData));
        if (callback) callback(_comboData);
    }


    function setTaginfoValues(q, callback) {
        var fn = isMulti ? 'multikeys' : 'values';
        var query = (isMulti ? field.key : '') + q;
        var hasCountryPrefix = isNetwork && _country && _country.indexOf(q.toLowerCase()) === 0;
        if (hasCountryPrefix) {
            query = _country + ':';
        }

        var params = {
            debounce: (q !== ''),
            key: field.key,
            query: query
        };

        if (_entity) {
            params.geometry = context.geometry(_entity.id);
        }

        taginfo[fn](params, function(err, data) {
            if (err) return;
            if (hasCountryPrefix) {
                data = _filter(data, function(d) {
                    return d.value.toLowerCase().indexOf(_country + ':') === 0;
                });
            }

            _comboData = _map(data, function(d) {
                var k = d.value;
                if (isMulti) k = k.replace(field.key, '');
                var v = snake_case ? unsnake(k) : k;
                return {
                    key: k,
                    value: v,
                    title: isMulti ? v : d.title
                };
            });

            _comboData = objectDifference(_comboData, _multiData);
            if (callback) callback(_comboData);
        });
    }


    function setPlaceholder(d) {
        var ph;

        if (isMulti || isSemi) {
            ph = field.placeholder() || t('inspector.add');
        } else {
            var vals = _map(d, 'value').filter(function(s) { return s.length < 20; }),
                placeholders = vals.length > 1 ? vals : _map(d, 'key');
            ph = field.placeholder() || placeholders.slice(0, 3).join(', ');
        }

        if (!/(…|\.\.\.)$/.test(ph)) {
            ph += '…';
        }

        container.selectAll('input')
            .attr('placeholder', ph);
    }


    function change() {
        var val = tagValue(utilGetSetValue(input));
        var t = {};

        if (isMulti || isSemi) {
            if (!val) return;
            container.classed('active', false);
            utilGetSetValue(input, '');

            if (isMulti) {
                var key = field.key + val;
                if (_entity) {
                    // don't set a multicombo value to 'yes' if it already has a non-'no' value
                    // e.g. `language:de=main`
                    var old = _entity.tags[key] || '';
                    if (old && old.toLowerCase() !== 'no') return;
                }
                field.keys.push(key);
                t[key] = 'yes';

            } else if (isSemi) {
                var arr = _multiData.map(function(d) { return d.key; });
                arr.push(val);
                t[field.key] = _compact(_uniq(arr)).join(';');
            }

            window.setTimeout(function() { input.node().focus(); }, 10);

        } else {
            t[field.key] = val;
        }

        dispatch.call('change', this, t);
    }


    function removeMultikey(d) {
        d3_event.stopPropagation();
        var t = {};
        if (isMulti) {
            t[d.key] = undefined;
        } else if (isSemi) {
            _remove(_multiData, function(md) { return md.key === d.key; });
            var arr = _multiData.map(function(md) { return md.key; });
            arr = _compact(_uniq(arr));
            t[field.key] = arr.length ? arr.join(';') : undefined;
        }
        dispatch.call('change', this, t);
    }


    function combo(selection) {
        if (isMulti || isSemi) {
            container = selection.selectAll('ul').data([0]);

            container = container.enter()
                .append('ul')
                .attr('class', 'form-field-multicombo')
                .on('click', function() {
                    window.setTimeout(function() { input.node().focus(); }, 10);
                })
                .merge(container);

        } else {
            container = selection;
        }

        input = container.selectAll('input')
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.safeid)
            .call(utilNoAuto)
            .call(initCombo, selection)
            .merge(input);

        if (isNetwork && nominatim && _entity) {
            var center = _entity.extent(context.graph()).center();
            nominatim.countryCode(center, function (err, code) {
                _country = code;
            });
        }

        input
            .on('change', change)
            .on('blur', change);

        if (isMulti || isSemi) {
            combobox
                .on('accept', function() {
                    input.node().blur();
                    input.node().focus();
                });

            input
                .on('focus', function() { container.classed('active', true); });
        }
    }


    combo.tags = function(tags) {
        if (isMulti || isSemi) {
            _multiData = [];

            if (isMulti) {
                // Build _multiData array containing keys already set..
                for (var k in tags) {
                    if (k.indexOf(field.key) !== 0) continue;
                    var v = (tags[k] || '').toLowerCase();
                    if (v === '' || v === 'no') continue;

                    var suffix = k.substring(field.key.length);
                    _multiData.push({
                        key: k,
                        value: displayValue(suffix)
                    });
                }

                // Set keys for form-field modified (needed for undo and reset buttons)..
                field.keys = _map(_multiData, 'key');

            } else if (isSemi) {
                var arr = _compact(_uniq((tags[field.key] || '').split(';')));
                _multiData = arr.map(function(k) {
                    return {
                        key: k,
                        value: displayValue(k)
                    };
                });
            }

            // Exclude existing multikeys from combo options..
            var available = objectDifference(_comboData, _multiData);
            combobox.data(available);

            // Hide 'Add' button if this field uses fixed set of
            // translateable optstrings and they're all currently used..
            container.selectAll('.combobox-input, .combobox-caret')
                .classed('hide', optstrings && !available.length);


            // Render chips
            var chips = container.selectAll('.chips')
                .data(_multiData);

            chips.exit()
                .remove();

            var enter = chips.enter()
                .insert('li', 'input')
                .attr('class', 'chips');

            enter.append('span');
            enter.append('a');

            chips = chips.merge(enter);

            chips.select('span')
                .text(function(d) { return d.value; });

            chips.select('a')
                .on('click', removeMultikey)
                .attr('class', 'remove')
                .text('×');

        } else {
            utilGetSetValue(input, displayValue(tags[field.key]));
        }
    };


    combo.focus = function() {
        input.node().focus();
    };


    combo.entity = function(val) {
        if (!arguments.length) return _entity;
        _entity = val;
        return combo;
    };


    return utilRebind(combo, dispatch, 'on');
}
