import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { svgIcon } from '../svg/icon';
import { uiCombobox } from './combobox';
import { uiDisclosure } from './disclosure';
import { uiTagReference } from './tag_reference';
import { utilArrayDifference, utilGetSetValue, utilNoAuto, utilRebind, utilTagDiff } from '../util';


export function uiRawTagEditor(context) {
    var taginfo = services.taginfo;
    var dispatch = d3_dispatch('change');
    var availableViews = [
        { id: 'text', icon: '#fas-i-cursor' },
        { id: 'list', icon: '#fas-th-list' }
    ];

    var _tagView = (context.storage('raw-tag-editor-view') || 'list');   // 'list, 'text'
    var _readOnlyTags = [];
    var _indexedKeys = [];
    var _showBlank = false;
    var _updatePreference = true;
    var _expanded = false;
    var _pendingChange = null;
    var _state;
    var _preset;
    var _tags;
    var _entityID;


    function rawTagEditor(selection) {
        var count = Object.keys(_tags).filter(function(d) { return d; }).length;

        var disclosure = uiDisclosure(context, 'raw_tag_editor', false)
            .title(t('inspector.all_tags') + ' (' + count + ')')
            .on('toggled', toggled)
            .updatePreference(_updatePreference)
            .content(content);

        // Sometimes we want to force the raw_tag_editor to be opened/closed..
        // When undefined, uiDisclosure will use the user's stored preference.
        if (_expanded !== undefined) {
            disclosure.expanded(_expanded);
        }

        selection.call(disclosure);

        function toggled(expanded) {
            _expanded = expanded;
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }
    }


    function content(wrap) {
        // When switching to a different entity or changing the state (hover/select)
        // reorder the keys alphabetically.
        // We trigger this by emptying the `_indexedKeys` array, then it will be rebuilt here.
        // Otherwise leave their order alone - #5857, #5927
        var all = Object.keys(_tags).sort();
        var known = _indexedKeys.map(function(t) { return t.key; });
        var missing = utilArrayDifference(all, known);
        for (var i = 0; i < missing.length; i++) {
            _indexedKeys.push({ index: _indexedKeys.length, key: missing[i] });
        }

        // assemble row data, excluding any deleted tags
        var rowData = _indexedKeys.map(function(row) {
            var v = _tags[row.key];
            return (v === undefined) ? null : Object.assign(row, { value: v });
        }).filter(Boolean);

        // append blank row last, if necessary
        if (!_indexedKeys.length || _showBlank) {
            _showBlank = false;
            rowData.push({ index: _indexedKeys.length, key: '', value: '' });
        }


        // View Options
        var options = wrap.selectAll('.raw-tag-options')
            .data([0]);

        var optionsEnter = options.enter()
            .append('div')
            .attr('class', 'raw-tag-options');

        var optionEnter = optionsEnter.selectAll('.raw-tag-option')
            .data(availableViews, function(d) { return d.id; })
            .enter();

        optionEnter
            .append('button')
            .attr('class', function(d) {
                return 'raw-tag-option raw-tag-option-' + d.id + (_tagView === d.id ? ' selected' : '');
            })
            .attr('title', function(d) { return d.id; })
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
            .attr('spellcheck', 'false')
            .merge(textarea);

        textarea
            .call(utilGetSetValue, textData)
            .each(setTextareaHeight)
            .on('input', setTextareaHeight)
            .on('blur', textChanged)
            .on('change', textChanged);

        // If All Fields section is hidden, focus textarea and put cursor at end..
        var fieldsExpanded = d3_select('.hide-toggle-preset_fields.expanded').size();
        if (_state !== 'hover' && _tagView === 'text' && !fieldsExpanded) {
            var element = textarea.node();
            element.focus();
            element.setSelectionRange(textData.length, textData.length);
        }


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
            .attr('maxlength', 255)
            .call(utilNoAuto)
            .on('blur', keyChange)
            .on('change', keyChange);

        innerWrap
            .append('div')
            .attr('class', 'value-wrap')
            .append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .attr('maxlength', 255)
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

                if (_entityID && taginfo && _state !== 'hover') {
                    bindTypeahead(key, value);
                }

                var isRelation = (_entityID && context.entity(_entityID).type === 'relation');
                var reference;

                if (isRelation && d.key === 'type') {
                    reference = uiTagReference({ rtype: d.value }, context);
                } else {
                    reference = uiTagReference({ key: d.key, value: d.value }, context);
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
            .property('disabled', isReadOnly);

        items.selectAll('input.value')
            .attr('title', function(d) { return d.value; })
            .call(utilGetSetValue, function(d) { return d.value; })
            .property('disabled', isReadOnly);

        items.selectAll('button.remove')
            .on('mousedown', removeTag);  // 'click' fires too late - #5878



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
                .map(function(row) { return stringify(row.key) + '=' + stringify(row.value); })
                .join('\n');

            return _state === 'hover' ? str : str + '\n';
        }


        function textChanged() {
            var newText = this.value.trim();
            var newTags = {};
            newText.split('\n').forEach(function(row) {
                var m = row.match(/^\s*([^=]+)=(.*)$/);
                if (m !== null) {
                    var k = unstringify(m[1].trim());
                    var v = unstringify(m[2].trim());
                    newTags[k] = v;
                }
            });

            var tagDiff = utilTagDiff(_tags, newTags);
            if (!tagDiff.length) return;

            _pendingChange  = _pendingChange || {};

            tagDiff.forEach(function(change) {
                if (isReadOnly({ key: change.key })) return;

                if (change.type === '-') {
                    _pendingChange[change.key] = undefined;
                } else if (change.type === '+') {
                    _pendingChange[change.key] = change.newVal || '';
                }
            });

            scheduleChange();
        }


        function pushMore() {
            if (d3_event.keyCode === 9 && !d3_event.shiftKey &&
                list.selectAll('li:last-child input.value').node() === this) {
                addTag();
            }
        }


        function bindTypeahead(key, value) {
            if (isReadOnly(key.datum())) return;

            var geometry = context.geometry(_entityID);

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
                    list.selectAll('input.value')
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

            d.key = kNew;    // update datum to avoid exit/enter on tag update
            d.value = vNew;

            this.value = kNew;
            utilGetSetValue(inputVal, vNew);
            scheduleChange();
        }


        function valueChange(d) {
            if (isReadOnly(d)) return;

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
                content(wrap);

            } else {
                // remove from indexedKeys too, so that if the user puts it back,
                // it will be sorted to the end and not back to its original position
                _indexedKeys = _indexedKeys.filter(function(row) { return row.key !== d.key; });

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
                content(wrap);
                list.selectAll('li:last-child input.key').node().focus();
            }, 20);
        }


        function scheduleChange() {
            // Delay change in case this change is blurring an edited combo. - #5878
            window.setTimeout(function() {
                dispatch.call('change', this, _pendingChange);
                _pendingChange = null;
            }, 10);
        }

    }


    rawTagEditor.state = function(val) {
        if (!arguments.length) return _state;
        if (_state !== val) {
            _indexedKeys = [];
            _state = val;
        }
        return rawTagEditor;
    };


    rawTagEditor.preset = function(val) {
        if (!arguments.length) return _preset;
        _preset = val;
        if (_preset.isFallback()) {
            _expanded = true;
            _updatePreference = false;
        } else {
            _expanded = undefined;
            _updatePreference = true;
        }
        return rawTagEditor;
    };


    rawTagEditor.tags = function(val) {
        if (!arguments.length) return _tags;
        _tags = val;
        return rawTagEditor;
    };


    rawTagEditor.entityID = function(val) {
        if (!arguments.length) return _entityID;
        if (_entityID !== val) {
            _indexedKeys = [];
            _entityID = val;
        }
        return rawTagEditor;
    };


    rawTagEditor.expanded = function(val) {
        if (!arguments.length) return _expanded;
        _expanded = val;
        _updatePreference = false;
        return rawTagEditor;
    };


    // pass an array of regular expressions to test against the tag key
    rawTagEditor.readOnlyTags = function(val) {
        if (!arguments.length) return _readOnlyTags;
        _readOnlyTags = val;
        return rawTagEditor;
    };


    return utilRebind(rawTagEditor, dispatch, 'on');
}
