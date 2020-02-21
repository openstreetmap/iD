import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { services } from '../../services';
import { svgIcon } from '../../svg/icon';
import { uiCombobox } from '../combobox';
import { uiSection } from '../section';
import { uiTagReference } from '../tag_reference';
import { t } from '../../util/locale';
import { utilArrayDifference, utilArrayIdentical } from '../../util/array';
import { utilGetSetValue, utilNoAuto, utilRebind, utilTagDiff } from '../../util';

export function uiSectionRawTagEditor(context) {

    var section = uiSection('raw-tag-editor', context)
        .title(function() {
            var count = Object.keys(_tags).filter(function(d) { return d; }).length;
            return t('inspector.tags_count', { count: count });
        })
        .expandedByDefault(false)
        .disclosureContent(renderDisclosureContent);

    var taginfo = services.taginfo;
    var dispatch = d3_dispatch('change');
    var availableViews = [
        { id: 'text', icon: '#fas-i-cursor' },
        { id: 'list', icon: '#fas-th-list' }
    ];

    var _tagView = (context.storage('raw-tag-editor-view') || 'list');   // 'list, 'text'
    var _readOnlyTags = [];
    // the keys in the order we want them to display
    var _orderedKeys = [];
    var _showBlank = false;
    var _updatePreference = true;
    var _expanded = false;
    var _pendingChange = null;
    var _state;
    var _presets;
    var _tags;
    var _entityIDs;

    function renderDisclosureContent(wrap) {

        // remove deleted keys
        _orderedKeys = _orderedKeys.filter(function(key) {
            return _tags[key] !== undefined;
        });

        // When switching to a different entity or changing the state (hover/select)
        // reorder the keys alphabetically.
        // We trigger this by emptying the `_orderedKeys` array, then it will be rebuilt here.
        // Otherwise leave their order alone - #5857, #5927
        var all = Object.keys(_tags).sort();
        var missingKeys = utilArrayDifference(all, _orderedKeys);
        for (var i in missingKeys) {
            _orderedKeys.push(missingKeys[i]);
        }

        // assemble row data
        var rowData = _orderedKeys.map(function(key, i) {
            return { index: i, key: key, value: _tags[key] };
        });

        // append blank row last, if necessary
        if (!rowData.length || _showBlank) {
            _showBlank = false;
            rowData.push({ index: rowData.length, key: '', value: '' });
        }


        // View Options
        var options = wrap.selectAll('.raw-tag-options')
            .data([0]);

        options.exit()
            .remove();

        var optionsEnter = options.enter()
            .insert('div', ':first-child')
            .attr('class', 'raw-tag-options');

        var optionEnter = optionsEnter.selectAll('.raw-tag-option')
            .data(availableViews, function(d) { return d.id; })
            .enter();

        optionEnter
            .append('button')
            .attr('class', function(d) {
                return 'raw-tag-option raw-tag-option-' + d.id + (_tagView === d.id ? ' selected' : '');
            })
            .attr('title', function(d) { return t('icons.' + d.id); })
            .on('click', function(d) {
                _tagView = d.id;
                context.storage('raw-tag-editor-view', d.id);

                wrap.selectAll('.raw-tag-option')
                    .classed('selected', function(datum) { return datum === d; });

                wrap.selectAll('.tag-text')
                    .classed('hide', (d.id !== 'text'))
                    .each(setTextareaHeight);

                wrap.selectAll('.tag-list, .add-row')
                    .classed('hide', (d.id !== 'list'));
            })
            .each(function(d) {
                d3_select(this)
                    .call(svgIcon(d.icon));
            });


        // View as Text
        var textData = rowsToText(rowData);
        var textarea = wrap.selectAll('.tag-text')
            .data([0]);

        textarea = textarea.enter()
            .append('textarea')
            .attr('class', 'tag-text' + (_tagView !== 'text' ? ' hide' : ''))
            .call(utilNoAuto)
            .attr('placeholder', t('inspector.key_value'))
            .attr('spellcheck', 'false')
            .merge(textarea);

        textarea
            .call(utilGetSetValue, textData)
            .each(setTextareaHeight)
            .on('input', setTextareaHeight)
            .on('blur', textChanged)
            .on('change', textChanged);


        // View as List
        var list = wrap.selectAll('.tag-list')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'tag-list' + (_tagView !== 'list' ? ' hide' : ''))
            .merge(list);


        // Container for the Add button
        var addRowEnter = wrap.selectAll('.add-row')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'add-row' + (_tagView !== 'list' ? ' hide' : ''));

        addRowEnter
            .append('button')
            .attr('class', 'add-tag')
            .call(svgIcon('#iD-icon-plus', 'light'))
            .on('click', addTag);

        addRowEnter
            .append('div')
            .attr('class', 'space-value');   // preserve space

        addRowEnter
            .append('div')
            .attr('class', 'space-buttons');  // preserve space


        // Tag list items
        var items = list.selectAll('.tag-row')
            .data(rowData, function(d) { return d.key; });

        items.exit()
            .each(unbind)
            .remove();


        // Enter
        var itemsEnter = items.enter()
            .append('li')
            .attr('class', 'tag-row')
            .classed('readonly', isReadOnly);

        var innerWrap = itemsEnter.append('div')
            .attr('class', 'inner-wrap');

        innerWrap
            .append('div')
            .attr('class', 'key-wrap')
            .append('input')
            .property('type', 'text')
            .attr('class', 'key')
            .attr('maxlength', context.maxCharsForTagKey())
            .call(utilNoAuto)
            .on('blur', keyChange)
            .on('change', keyChange);

        innerWrap
            .append('div')
            .attr('class', 'value-wrap')
            .append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .attr('maxlength', context.maxCharsForTagValue())
            .call(utilNoAuto)
            .on('blur', valueChange)
            .on('change', valueChange)
            .on('keydown.push-more', pushMore);

        innerWrap
            .append('button')
            .attr('tabindex', -1)
            .attr('class', 'form-field-button remove')
            .attr('title', t('icons.remove'))
            .call(svgIcon('#iD-operation-delete'));


        // Update
        items = items
            .merge(itemsEnter)
            .sort(function(a, b) { return a.index - b.index; });

        items
            .each(function(d) {
                var row = d3_select(this);
                var key = row.select('input.key');      // propagate bound data
                var value = row.select('input.value');  // propagate bound data

                if (_entityIDs && taginfo && _state !== 'hover') {
                    bindTypeahead(key, value);
                }

                var reference;

                if (typeof d.value !== 'string') {
                    reference = uiTagReference({ key: d.key }, context);
                } else {
                    var isRelation = _entityIDs && _entityIDs.some(function(entityID) {
                        return context.entity(entityID).type === 'relation';
                    });
                    if (isRelation && d.key === 'type') {
                        reference = uiTagReference({ rtype: d.value }, context);
                    } else {
                        reference = uiTagReference({ key: d.key, value: d.value }, context);
                    }
                }

                if (_state === 'hover') {
                    reference.showing(false);
                }

                row.select('.inner-wrap')      // propagate bound data
                    .call(reference.button);

                row.call(reference.body);

                row.select('button.remove');   // propagate bound data
            });

        items.selectAll('input.key')
            .attr('title', function(d) { return d.key; })
            .call(utilGetSetValue, function(d) { return d.key; })
            .attr('readonly', function(d) {
                return (isReadOnly(d) || (typeof d.value !== 'string')) || null;
            });

        items.selectAll('input.value')
            .attr('title', function(d) {
                return Array.isArray(d.value) ? d.value.filter(Boolean).join('\n') : d.value;
            })
            .classed('mixed', function(d) {
                return Array.isArray(d.value);
            })
            .attr('placeholder', function(d) {
                return typeof d.value === 'string' ? null : t('inspector.multiple_values');
            })
            .call(utilGetSetValue, function(d) {
                return typeof d.value === 'string' ? d.value : '';
            })
            .attr('readonly', function(d) {
                return isReadOnly(d) || null;
            });

        items.selectAll('button.remove')
            .on('mousedown', removeTag);  // 'click' fires too late - #5878

    }

    function isReadOnly(d) {
        for (var i = 0; i < _readOnlyTags.length; i++) {
            if (d.key.match(_readOnlyTags[i]) !== null) {
                return true;
            }
        }
        return false;
    }

    function setTextareaHeight() {
        if (_tagView !== 'text') return;

        var selection = d3_select(this);
        selection.style('height', null);
        selection.style('height', selection.node().scrollHeight + 5 + 'px');
    }

    function stringify(s) {
        return JSON.stringify(s).slice(1, -1);   // without leading/trailing "
    }

    function unstringify(s) {
        var leading = '';
        var trailing = '';
        if (s.length < 1 || s.charAt(0) !== '"') {
            leading = '"';
        }
        if (s.length < 2 || s.charAt(s.length - 1) !== '"' ||
            (s.charAt(s.length - 1) === '"' && s.charAt(s.length - 2) === '\\')
        ) {
            trailing = '"';
        }
        return JSON.parse(leading + s + trailing);
    }

    function rowsToText(rows) {
        var str = rows
            .filter(function(row) { return row.key && row.key.trim() !== ''; })
            .map(function(row) {
                var rawVal = row.value;
                if (typeof rawVal !== 'string') rawVal = '*';
                var val = rawVal ? stringify(rawVal) : '';
                return stringify(row.key) + '=' + val;
            })
            .join('\n');

        if (_state !== 'hover' && str.length) {
            return str + '\n';
        }
        return  str;
    }

    function textChanged() {
        var newText = this.value.trim();
        var newTags = {};
        var maxKeyLength = context.maxCharsForTagKey();
        var maxValueLength = context.maxCharsForTagValue();
        newText.split('\n').forEach(function(row) {
            var m = row.match(/^\s*([^=]+)=(.*)$/);
            if (m !== null) {
                var k = unstringify(m[1].trim()).substr(0, maxKeyLength);
                var v = unstringify(m[2].trim()).substr(0, maxValueLength);
                newTags[k] = v;
            }
        });

        var tagDiff = utilTagDiff(_tags, newTags);
        if (!tagDiff.length) return;

        _pendingChange  = _pendingChange || {};

        tagDiff.forEach(function(change) {
            if (isReadOnly({ key: change.key })) return;

            // skip unchanged multiselection placeholders
            if (change.newVal === '*' && typeof change.oldVal !== 'string') return;

            if (change.type === '-') {
                _pendingChange[change.key] = undefined;
            } else if (change.type === '+') {
                _pendingChange[change.key] = change.newVal || '';
            }
        });

        if (Object.keys(_pendingChange).length === 0) {
            _pendingChange = null;
            return;
        }

        scheduleChange();
    }

    function pushMore() {
        // if pressing Tab on the last value field with content, add a blank row
        if (d3_event.keyCode === 9 && !d3_event.shiftKey &&
            section.selection().selectAll('.tag-list li:last-child input.value').node() === this &&
            utilGetSetValue(d3_select(this))) {
            addTag();
        }
    }

    function bindTypeahead(key, value) {
        if (isReadOnly(key.datum())) return;

        if (Array.isArray(value.datum().value)) {
            value.call(uiCombobox(context, 'tag-value')
                .minItems(1)
                .fetcher(function(value, callback) {
                    var keyString = utilGetSetValue(key);
                    if (!_tags[keyString]) return;
                    var data = _tags[keyString].filter(Boolean).map(function(tagValue) {
                        return {
                            value: tagValue,
                            title: tagValue
                        };
                    });
                    callback(data);
                }));
            return;
        }

        var geometry = context.geometry(_entityIDs[0]);

        key.call(uiCombobox(context, 'tag-key')
            .fetcher(function(value, callback) {
                taginfo.keys({
                    debounce: true,
                    geometry: geometry,
                    query: value
                }, function(err, data) {
                    if (!err) {
                        var filtered = data.filter(function(d) { return _tags[d.value] === undefined; });
                        callback(sort(value, filtered));
                    }
                });
            }));

        value.call(uiCombobox(context, 'tag-value')
            .fetcher(function(value, callback) {
                taginfo.values({
                    debounce: true,
                    key: utilGetSetValue(key),
                    geometry: geometry,
                    query: value
                }, function(err, data) {
                    if (!err) callback(sort(value, data));
                });
            }));


        function sort(value, data) {
            var sameletter = [];
            var other = [];
            for (var i = 0; i < data.length; i++) {
                if (data[i].value.substring(0, value.length) === value) {
                    sameletter.push(data[i]);
                } else {
                    other.push(data[i]);
                }
            }
            return sameletter.concat(other);
        }
    }

    function unbind() {
        var row = d3_select(this);

        row.selectAll('input.key')
            .call(uiCombobox.off);

        row.selectAll('input.value')
            .call(uiCombobox.off);
    }

    function keyChange(d) {
        if (d3_select(this).attr('readonly')) return;

        var kOld = d.key;
        var kNew = this.value.trim();
        var row = this.parentNode.parentNode;
        var inputVal = d3_select(row).selectAll('input.value');
        var vNew = utilGetSetValue(inputVal);

        // allow no change if the key should be readonly
        if (isReadOnly({ key: kNew })) {
            this.value = kOld;
            return;
        }

        // switch focus if key is already in use
        if (kNew && kNew !== kOld) {
            if (_tags[kNew] !== undefined) {      // new key is already in use
                this.value = kOld;                // reset the key
                section.selection().selectAll('.tag-list input.value')
                    .each(function(d) {
                        if (d.key === kNew) {     // send focus to that other value combo instead
                            var input = d3_select(this).node();
                            input.focus();
                            input.select();
                        }
                    });
                return;
            }
        }

        _pendingChange  = _pendingChange || {};

        // exit if we are currently about to delete this row anyway - #6366
        if (_pendingChange.hasOwnProperty(d.key) && _pendingChange[d.key] === undefined) return;

        if (kOld) {
            _pendingChange[kOld] = undefined;
        }

        _pendingChange[kNew] = vNew;

        // update the ordered key index so this row doesn't change position
        var existingKeyIndex = _orderedKeys.indexOf(kOld);
        if (existingKeyIndex !== -1) _orderedKeys[existingKeyIndex] = kNew;

        d.key = kNew;    // update datum to avoid exit/enter on tag update
        d.value = vNew;

        this.value = kNew;
        utilGetSetValue(inputVal, vNew);
        scheduleChange();
    }

    function valueChange(d) {
        if (isReadOnly(d)) return;

        // exit if this is a multiselection and no value was entered
        if (typeof d.value !== 'string' && !this.value) return;

        _pendingChange  = _pendingChange || {};

        // exit if we are currently about to delete this row anyway - #6366
        if (_pendingChange.hasOwnProperty(d.key) && _pendingChange[d.key] === undefined) return;

        _pendingChange[d.key] = this.value;
        scheduleChange();
    }

    function removeTag(d) {
        if (isReadOnly(d)) return;

        if (d.key === '') {    // removing the blank row
            _showBlank = false;
            section.reRender();

        } else {
            // remove the key from the ordered key index
            _orderedKeys = _orderedKeys.filter(function(key) { return key !== d.key; });

            _pendingChange  = _pendingChange || {};
            _pendingChange[d.key] = undefined;
            scheduleChange();
        }
    }

    function addTag() {
        // Delay render in case this click is blurring an edited combo.
        // Without the setTimeout, the `content` render would wipe out the pending tag change.
        window.setTimeout(function() {
            _showBlank = true;
            section.reRender();
            section.selection().selectAll('.tag-list li:last-child input.key').node().focus();
        }, 20);
    }

    function scheduleChange() {
        // Delay change in case this change is blurring an edited combo. - #5878
        window.setTimeout(function() {
            dispatch.call('change', this, _pendingChange);
            _pendingChange = null;
        }, 10);
    }


    section.state = function(val) {
        if (!arguments.length) return _state;
        if (_state !== val) {
            _orderedKeys = [];
            _state = val;
        }
        return section;
    };


    section.presets = function(val) {
        if (!arguments.length) return _presets;
        _presets = val;
        if (_presets && _presets.length && _presets[0].isFallback()) {
            _expanded = true;
            _updatePreference = false;
        } else {
            _expanded = undefined;
            _updatePreference = true;
        }
        return section;
    };


    section.tags = function(val) {
        if (!arguments.length) return _tags;
        _tags = val;
        return section;
    };


    section.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        if (!_entityIDs || !val || !utilArrayIdentical(_entityIDs, val)) {
            _entityIDs = val;
            _orderedKeys = [];
        }
        return section;
    };


    section.expanded = function(val) {
        if (!arguments.length) return _expanded;
        _expanded = val;
        _updatePreference = false;
        return section;
    };


    // pass an array of regular expressions to test against the tag key
    section.readOnlyTags = function(val) {
        if (!arguments.length) return _readOnlyTags;
        _readOnlyTags = val;
        return section;
    };


    return utilRebind(section, dispatch, 'on');
}
