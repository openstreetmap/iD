import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event, select as d3_select } from 'd3-selection';
import { drag as d3_drag } from 'd3-drag';
import * as countryCoder from '@ideditor/country-coder';

import { fileFetcher } from '../../core/file_fetcher';
import { osmEntity } from '../../osm/entity';
import { t } from '../../core/localizer';
import { services } from '../../services';
import { uiCombobox } from '../combobox';
import { utilArrayUniq, utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent, utilUnicodeCharsCount } from '../../util';

export {
    uiFieldCombo as uiFieldMultiCombo,
    uiFieldCombo as uiFieldNetworkCombo,
    uiFieldCombo as uiFieldSemiCombo,
    uiFieldCombo as uiFieldTypeCombo
};


export function uiFieldCombo(field, context) {
    var dispatch = d3_dispatch('change');
    var taginfo = services.taginfo;
    var isMulti = (field.type === 'multiCombo');
    var isNetwork = (field.type === 'networkCombo');
    var isSemi = (field.type === 'semiCombo');
    var optstrings = field.strings && field.strings.options;
    var optarray = field.options;
    var snake_case = (field.snake_case || (field.snake_case === undefined));
    var caseSensitive = field.caseSensitive;
    var combobox = uiCombobox(context, 'combo-' + field.safeid)
        .caseSensitive(caseSensitive)
        .minItems(isMulti || isSemi ? 1 : 2);
    var container = d3_select(null);
    var inputWrap = d3_select(null);
    var input = d3_select(null);
    var _comboData = [];
    var _multiData = [];
    var _entityIDs = [];
    var _tags;
    var _countryCode;
    var _staticPlaceholder;

    // initialize deprecated tags array
    var _dataDeprecated = [];
    fileFetcher.get('deprecated')
        .then(function(d) { _dataDeprecated = d; })
        .catch(function() { /* ignore */ });


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
            var found = _comboData.find(function(o) {
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
            var found = _comboData.find(function(o) {
                return o.key === tval && o.value;
            });
            if (found) {
                return found.value;
            }
        }

        if (field.type === 'typeCombo' && tval.toLowerCase() === 'yes') {
            return '';
        }

        return snake_case ? unsnake(tval) : tval;
    }


    // Compute the difference between arrays of objects by `value` property
    //
    // objectDifference([{value:1}, {value:2}, {value:3}], [{value:2}])
    // > [{value:1}, {value:3}]
    //
    function objectDifference(a, b) {
        return a.filter(function(d1) {
            return !b.some(function(d2) {
                return !d2.isMixed && d1.value === d2.value;
            });
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
        var hasCountryPrefix = isNetwork && _countryCode && _countryCode.indexOf(q.toLowerCase()) === 0;
        if (hasCountryPrefix) {
            query = _countryCode + ':';
        }

        var params = {
            debounce: (q !== ''),
            key: field.key,
            query: query
        };

        if (_entityIDs.length) {
            params.geometry = context.graph().geometry(_entityIDs[0]);
        }

        taginfo[fn](params, function(err, data) {
            if (err) return;

            data = data.filter(function(d) {

                if (field.type === 'typeCombo' && d.value === 'yes') {
                    // don't show the fallback value
                    return false;
                }

                // don't show values with very low usage
                return !d.count || d.count > 10;
            });

            var deprecatedValues = osmEntity.deprecatedTagValuesByKey(_dataDeprecated)[field.key];
            if (deprecatedValues) {
                // don't suggest deprecated tag values
                data = data.filter(function(d) {
                    return deprecatedValues.indexOf(d.value) === -1;
                });
            }

            if (hasCountryPrefix) {
                data = data.filter(function(d) {
                    return d.value.toLowerCase().indexOf(_countryCode + ':') === 0;
                });
            }

            // hide the caret if there are no suggestions
            container.classed('empty-combobox', data.length === 0);

            _comboData = data.map(function(d) {
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


    function setPlaceholder(values) {

        if (isMulti || isSemi) {
            _staticPlaceholder = field.placeholder() || t('inspector.add');
        } else {
            var vals = values
                .map(function(d) { return d.value; })
                .filter(function(s) { return s.length < 20; });

            var placeholders = vals.length > 1 ? vals : values.map(function(d) { return d.key; });
            _staticPlaceholder = field.placeholder() || placeholders.slice(0, 3).join(', ');
        }

        if (!/(…|\.\.\.)$/.test(_staticPlaceholder)) {
            _staticPlaceholder += '…';
        }

        var ph;
        if (!isMulti && !isSemi && _tags && Array.isArray(_tags[field.key])) {
            ph = t('inspector.multiple_values');
        } else {
            ph =  _staticPlaceholder;
        }

        container.selectAll('input')
            .attr('placeholder', ph);
    }


    function change() {
        var t = {};
        var val;

        if (isMulti || isSemi) {
            val = tagValue(utilGetSetValue(input).replace(/,/g, ';')) || '';
            container.classed('active', false);
            utilGetSetValue(input, '');

            var vals = val.split(';').filter(Boolean);
            if (!vals.length) return;

            if (isMulti) {
                utilArrayUniq(vals).forEach(function(v) {
                    var key = field.key + v;
                    if (_tags) {
                        // don't set a multicombo value to 'yes' if it already has a non-'no' value
                        // e.g. `language:de=main`
                        var old = _tags[key];
                        if (typeof old === 'string' && old.toLowerCase() !== 'no') return;
                    }
                    key = context.cleanTagKey(key);
                    field.keys.push(key);
                    t[key] = 'yes';
                });

            } else if (isSemi) {
                var arr = _multiData.map(function(d) { return d.key; });
                arr = arr.concat(vals);
                t[field.key] = context.cleanTagValue(utilArrayUniq(arr).filter(Boolean).join(';'));
            }

            window.setTimeout(function() { input.node().focus(); }, 10);

        } else {
            var rawValue = utilGetSetValue(input);

            // don't override multiple values with blank string
            if (!rawValue && Array.isArray(_tags[field.key])) return;

            val = context.cleanTagValue(tagValue(rawValue));
            t[field.key] = val || undefined;
        }

        dispatch.call('change', this, t);
    }


    function removeMultikey(d) {
        d3_event.stopPropagation();
        var t = {};
        if (isMulti) {
            t[d.key] = undefined;
        } else if (isSemi) {
            var arr = _multiData.map(function(md) {
                return md.key === d.key ? null : md.key;
            }).filter(Boolean);

            arr = utilArrayUniq(arr);
            t[field.key] = arr.length ? arr.join(';') : undefined;
        }
        dispatch.call('change', this, t);
    }


    function combo(selection) {
        container = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        var type = (isMulti || isSemi) ? 'multicombo': 'combo';
        container = container.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + type)
            .merge(container);

        if (isMulti || isSemi) {
            container = container.selectAll('.chiplist')
                .data([0]);

            var listClass = 'chiplist';

            // Use a separate line for each value in the Destinations field
            // to mimic highway exit signs
            if (field.key === 'destination') {
                listClass += ' full-line-chips';
            }

            container = container.enter()
                .append('ul')
                .attr('class', listClass)
                .on('click', function() {
                    window.setTimeout(function() { input.node().focus(); }, 10);
                })
                .merge(container);


            inputWrap = container.selectAll('.input-wrap')
                .data([0]);

            inputWrap = inputWrap.enter()
                .append('li')
                .attr('class', 'input-wrap')
                .merge(inputWrap);

            input = inputWrap.selectAll('input')
                .data([0]);
        } else {
            input = container.selectAll('input')
                .data([0]);
        }

        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', field.domId)
            .call(utilNoAuto)
            .call(initCombo, selection)
            .merge(input);

        if (isNetwork) {
            var extent = combinedEntityExtent();
            var countryCode = extent && countryCoder.iso1A2Code(extent.center());
            _countryCode = countryCode && countryCode.toLowerCase();
        }

        input
            .on('change', change)
            .on('blur', change);

        input
            .on('keydown.field', function() {
                switch (d3_event.keyCode) {
                    case 13: // ↩ Return
                        input.node().blur(); // blurring also enters the value
                        d3_event.stopPropagation();
                        break;
                }
            });

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
        _tags = tags;

        if (isMulti || isSemi) {
            _multiData = [];

            var maxLength;

            if (isMulti) {
                // Build _multiData array containing keys already set..
                for (var k in tags) {
                    if (k.indexOf(field.key) !== 0) continue;
                    var v = tags[k];
                    if (!v || (typeof v === 'string' && v.toLowerCase() === 'no')) continue;

                    var suffix = k.substring(field.key.length);
                    _multiData.push({
                        key: k,
                        value: displayValue(suffix),
                        isMixed: Array.isArray(v)
                    });
                }

                // Set keys for form-field modified (needed for undo and reset buttons)..
                field.keys = _multiData.map(function(d) { return d.key; });

                // limit the input length so it fits after prepending the key prefix
                maxLength = context.maxCharsForTagKey() - utilUnicodeCharsCount(field.key);

            } else if (isSemi) {

                var allValues = [];
                var commonValues;
                if (Array.isArray(tags[field.key])) {

                    tags[field.key].forEach(function(tagVal) {
                        var thisVals = utilArrayUniq((tagVal || '').split(';')).filter(Boolean);
                        allValues = allValues.concat(thisVals);
                        if (!commonValues) {
                            commonValues = thisVals;
                        } else {
                            commonValues = commonValues.filter(value => thisVals.includes(value));
                        }
                    });
                    allValues = utilArrayUniq(allValues).filter(Boolean);

                } else {
                    allValues =  utilArrayUniq((tags[field.key] || '').split(';')).filter(Boolean);
                    commonValues = allValues;
                }

                _multiData = allValues.map(function(v) {
                    return {
                        key: v,
                        value: displayValue(v),
                        isMixed: !commonValues.includes(v)
                    };
                });

                var currLength = utilUnicodeCharsCount(commonValues.join(';'));

                // limit the input length to the remaining available characters
                maxLength = context.maxCharsForTagValue() - currLength;

                if (currLength > 0) {
                    // account for the separator if a new value will be appended to existing
                    maxLength -= 1;
                }
            }
            // a negative maxlength doesn't make sense
            maxLength = Math.max(0, maxLength);

            var allowDragAndDrop = isSemi // only semiCombo values are ordered
                && !Array.isArray(tags[field.key]);

            // Exclude existing multikeys from combo options..
            var available = objectDifference(_comboData, _multiData);
            combobox.data(available);

            // Hide 'Add' button if this field uses fixed set of
            // translateable optstrings and they're all currently used,
            // or if the field is already at its character limit
            var hideAdd = (optstrings && !available.length) || maxLength <= 0;
            container.selectAll('.chiplist .input-wrap')
                .style('display', hideAdd ? 'none' : null);


            // Render chips
            var chips = container.selectAll('.chip')
                .data(_multiData);

            chips.exit()
                .remove();

            var enter = chips.enter()
                .insert('li', '.input-wrap')
                .attr('class', 'chip');

            enter.append('span');
            enter.append('a');

            chips = chips.merge(enter)
                .order()
                .classed('draggable', allowDragAndDrop)
                .classed('mixed', function(d) {
                    return d.isMixed;
                })
                .attr('title', function(d) {
                    return d.isMixed ? t('inspector.unshared_value_tooltip') : null;
                });

            if (allowDragAndDrop) {
                registerDragAndDrop(chips);
            }

            chips.select('span')
                .text(function(d) { return d.value; });

            chips.select('a')
                .on('click', removeMultikey)
                .attr('class', 'remove')
                .text('×');

        } else {
            var isMixed = Array.isArray(tags[field.key]);

            var mixedValues = isMixed && tags[field.key].map(function(val) {
                return displayValue(val);
            }).filter(Boolean);

            utilGetSetValue(input, !isMixed ? displayValue(tags[field.key]) : '')
                .attr('title', isMixed ? mixedValues.join('\n') : undefined)
                .attr('placeholder', isMixed ? t('inspector.multiple_values') : _staticPlaceholder || '')
                .classed('mixed', isMixed);
        }
    };

    function registerDragAndDrop(selection) {

        // allow drag and drop re-ordering of chips
        var dragOrigin, targetIndex;
        selection.call(d3_drag()
            .on('start', function() {
                dragOrigin = {
                    x: d3_event.x,
                    y: d3_event.y
                };
                targetIndex = null;
            })
            .on('drag', function(d, index) {
                var x = d3_event.x - dragOrigin.x,
                    y = d3_event.y - dragOrigin.y;

                if (!d3_select(this).classed('dragging') &&
                    // don't display drag until dragging beyond a distance threshold
                    Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) <= 5) return;

                d3_select(this)
                    .classed('dragging', true);

                targetIndex = null;
                var targetIndexOffsetTop = null;
                var draggedTagWidth = d3_select(this).node().offsetWidth;

                if (field.key === 'destination') { // meaning tags are full width
                    container.selectAll('.chip')
                        .style('transform', function(d2, index2) {
                            var node = d3_select(this).node();

                            if (index === index2) {
                                return 'translate(' + x + 'px, ' + y + 'px)';
                            // move the dragged tag up the order
                            } else if (index2 > index && d3_event.y > node.offsetTop) {
                                if (targetIndex === null || index2 > targetIndex) {
                                    targetIndex = index2;
                                }
                                return 'translateY(-100%)';
                            // move the dragged tag down the order
                            } else if (index2 < index && d3_event.y < node.offsetTop + node.offsetHeight) {
                                if (targetIndex === null || index2 < targetIndex) {
                                    targetIndex = index2;
                                }
                                return 'translateY(100%)';
                            }
                            return null;
                        });
                } else {
                    container.selectAll('.chip')
                        .each(function(d2, index2) {
                            var node = d3_select(this).node();

                            // check the cursor is in the bounding box
                            if (
                                index !== index2 &&
                                d3_event.x < node.offsetLeft + node.offsetWidth + 5 &&
                                d3_event.x > node.offsetLeft &&
                                d3_event.y < node.offsetTop + node.offsetHeight &&
                                d3_event.y > node.offsetTop
                            ) {
                                targetIndex = index2;
                                targetIndexOffsetTop = node.offsetTop;
                            }
                        })
                        .style('transform', function(d2, index2) {
                            var node = d3_select(this).node();

                            if (index === index2) {
                                return 'translate(' + x + 'px, ' + y + 'px)';
                            }

                            // only translate tags in the same row
                            if (node.offsetTop === targetIndexOffsetTop) {
                                if (index2 < index && index2 >= targetIndex) {
                                    return 'translateX(' + draggedTagWidth + 'px)';
                                } else if (index2 > index && index2 <= targetIndex) {
                                    return 'translateX(-' + draggedTagWidth + 'px)';
                                }
                            }
                            return null;
                        });
                    }
            })
            .on('end', function(d, index) {
                if (!d3_select(this).classed('dragging')) {
                    return;
                }

                d3_select(this)
                    .classed('dragging', false);

                container.selectAll('.chip')
                    .style('transform', null);

                if (typeof targetIndex === 'number') {
                    var element = _multiData[index];
                    _multiData.splice(index, 1);
                    _multiData.splice(targetIndex, 0, element);

                    var t = {};

                    if (_multiData.length) {
                        t[field.key] = _multiData.map(function(element) {
                            return element.key;
                        }).join(';');
                    } else {
                        t[field.key] = undefined;
                    }

                    dispatch.call('change', this, t);
                }
                dragOrigin = undefined;
                targetIndex = undefined;
            })
        );
    }


    combo.focus = function() {
        input.node().focus();
    };


    combo.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return combo;
    };


    function combinedEntityExtent() {
        return _entityIDs && _entityIDs.length && utilTotalExtent(_entityIDs, context.graph());
    }


    return utilRebind(combo, dispatch, 'on');
}
