import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { d3combobox } from '../../lib/d3.combobox.js';
import { services } from '../../services/index';
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
    var dispatch = d3.dispatch('change'),
        nominatim = services.geocoder,
        taginfo = services.taginfo,
        isMulti = (field.type === 'multiCombo'),
        isNetwork = (field.type === 'networkCombo'),
        isSemi = (field.type === 'semiCombo'),
        optstrings = field.strings && field.strings.options,
        optarray = field.options,
        snake_case = (field.snake_case || (field.snake_case === undefined)),
        combobox = d3combobox()
            .container(context.container())
            .minItems(isMulti || isSemi ? 1 : 2),
        comboData = [],
        multiData = [],
        container,
        input,
        entity,
        country;

    // ensure multiCombo field.key ends with a ':'
    if (isMulti && field.key.match(/:$/) === null) {
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
            var match = _.find(comboData, function(o) {
                return o.key && clean(o.value) === dval;
            });
            if (match) {
                return match.key;
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
            var match = _.find(comboData, function(o) { return o.key === tval && o.value; });
            if (match) {
                return match.value;
            }
        }

        if (field.type === 'typeCombo' && tval.toLowerCase() === 'yes') {
            return '';
        }

        return snake_case ? unsnake(tval) : tval;
    }


    function objectDifference(a, b) {
        return _.reject(a, function(d1) {
            return _.some(b, function(d2) { return d1.value === d2.value; });
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
            comboData = Object.keys(optstrings).map(function(k) {
                var v = field.t('options.' + k, { 'default': optstrings[k] });
                return {
                    key: k,
                    value: v,
                    title: v
                };
            });

        } else if (optarray) {
            comboData = optarray.map(function(k) {
                var v = snake_case ? unsnake(k) : k;
                return {
                    key: k,
                    value: v,
                    title: v
                };
            });
        }

        combobox.data(objectDifference(comboData, multiData));
        if (callback) callback(comboData);
    }


    function setTaginfoValues(q, callback) {
        var fn = isMulti ? 'multikeys' : 'values';
        var query = (isMulti ? field.key : '') + q;
        var hasCountryPrefix = isNetwork && country && country.indexOf(q.toLowerCase()) === 0;
        if (hasCountryPrefix) {
            query = country + ':';
        }

        var params = {
            debounce: (q !== ''),
            key: field.key,
            query: query
        };

        if (entity) {
            params.geometry = context.geometry(entity.id);
        }

        taginfo[fn](params, function(err, data) {
            if (err) return;
            if (hasCountryPrefix) {
                data = _.filter(data, function(d) {
                    return d.value.toLowerCase().indexOf(country + ':') === 0;
                });
            }

            comboData = _.map(data, function(d) {
                var k = d.value;
                if (isMulti) k = k.replace(field.key, '');
                var v = snake_case ? unsnake(k) : k;
                return {
                    key: k,
                    value: v,
                    title: isMulti ? v : d.title
                };
            });

            comboData = objectDifference(comboData, multiData);
            if (callback) callback(comboData);
        });
    }


    function setPlaceholder(d) {
        var ph;

        if (isMulti || isSemi) {
            ph = field.placeholder() || t('inspector.add');
        } else {
            var vals = _.map(d, 'value').filter(function(s) { return s.length < 20; }),
                placeholders = vals.length > 1 ? vals : _.map(d, 'key');
            ph = field.placeholder() || placeholders.slice(0, 3).join(', ');
        }

        if (ph.match(/(…|\.\.\.)$/) === null) {
            ph += '…';
        }

        container.selectAll('input')
            .attr('placeholder', ph);
    }


    function change() {
        var val = tagValue(utilGetSetValue(input)),
            t = {};

        if (isMulti || isSemi) {
            if (!val) return;
            container.classed('active', false);
            utilGetSetValue(input, '');
            if (isMulti) {
                field.keys.push(field.key + val);
                t[field.key + val] = 'yes';
            } else if (isSemi) {
                var arr = multiData.map(function(d) { return d.key; });
                arr.push(val);
                t[field.key] = _.compact(_.uniq(arr)).join(';');
            }
            window.setTimeout(function() { input.node().focus(); }, 10);

        } else {
            t[field.key] = val;
        }

        dispatch.call('change', this, t);
    }


    function removeMultikey(d) {
        d3.event.stopPropagation();
        var t = {};
        if (isMulti) {
            t[d.key] = undefined;
        } else if (isSemi) {
            _.remove(multiData, function(md) { return md.key === d.key; });
            var arr = multiData.map(function(md) { return md.key; });
            arr = _.compact(_.uniq(arr));
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
            .attr('id', 'preset-input-' + field.id)
            .call(utilNoAuto)
            .call(initCombo, selection)
            .merge(input);

        if (isNetwork && nominatim && entity) {
            var center = entity.extent(context.graph()).center();
            nominatim.countryCode(center, function (err, code) {
                country = code;
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
            multiData = [];

            if (isMulti) {
                // Build multiData array containing keys already set..
                Object.keys(tags).forEach(function(key) {
                    if (key.indexOf(field.key) !== 0 || tags[key].toLowerCase() !== 'yes') return;

                    var suffix = key.substring(field.key.length);
                    multiData.push({
                        key: key,
                        value: displayValue(suffix)
                    });
                });

                // Set keys for form-field modified (needed for undo and reset buttons)..
                field.keys = _.map(multiData, 'key');

            } else if (isSemi) {
                var arr = _.compact(_.uniq((tags[field.key] || '').split(';')));
                multiData = arr.map(function(key) {
                    return {
                        key: key,
                        value: displayValue(key)
                    };
                });
            }

            // Exclude existing multikeys from combo options..
            var available = objectDifference(comboData, multiData);
            combobox.data(available);

            // Hide 'Add' button if this field uses fixed set of
            // translateable optstrings and they're all currently used..
            container.selectAll('.combobox-input, .combobox-caret')
                .classed('hide', optstrings && !available.length);


            // Render chips
            var chips = container.selectAll('.chips')
                .data(multiData);

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


    combo.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return combo;
    };


    return utilRebind(combo, dispatch, 'on');
}
