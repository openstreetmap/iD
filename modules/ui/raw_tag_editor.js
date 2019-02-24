import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { svgIcon } from '../svg';
import { uiCombobox, uiDisclosure, uiTagReference } from './index';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../util';


export function uiRawTagEditor(context) {
    var taginfo = services.taginfo;
    var dispatch = d3_dispatch('change');
    var _readOnlyTags = [];
    var _orderedKeys = [];
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
        var rowData = [];
        var seen = {};
        var allKeys = Object.keys(_tags);
        var i, k;

        // When switching to a different entity or changing the state (hover/select)
        // we reorder the keys.  Otherwise leave them as the user entered - #5857
        if (!_orderedKeys.length) {
            _orderedKeys = allKeys.sort();
        }

        // push ordered keys first
        for (i = 0; i < _orderedKeys.length; i++) {
            k = _orderedKeys[i];
            if (_tags[k] === undefined) continue;   // e.g. tag was removed
            seen[k] = true;
            rowData.push({ key: k, value: _tags[k] });
        }
        // push unknown keys after - these are tags the user added
        for (i = 0; i < allKeys.length; i++) {
            k = allKeys[i];
            if (seen[k]) continue;
            rowData.push({ key: k, value: _tags[k] });
        }
        // push blank row last, if necessary
        if (!rowData.length || _showBlank) {
            _showBlank = false;
            rowData.push({ key: '', value: '' });
        }

        // List of tags
        var list = wrap.selectAll('.tag-list')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'tag-list')
            .merge(list);


        // Container for the Add button
        var addRowEnter = wrap.selectAll('.add-row')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'add-row');

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
            .order();

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
                            var filtered = data.filter(function(d) {
                                return _tags[d.value] === undefined;
                            });
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

            // if the key looks like "key=value", split them up - #5024
            if (kNew.indexOf('=') !== -1) {
                var parts = kNew
                    .split('=')
                    .map(function(str) { return str.trim(); })
                    .filter(Boolean);

                if (parts.length === 2) {
                    kNew = parts[0];
                    vNew = parts[1];
                }
            }

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
            _pendingChange[d.key] = this.value;
            scheduleChange();
        }


        function removeTag(d) {
            if (isReadOnly(d)) return;

            if (d.key === '') {    // removing the blank row
                _showBlank = false;
                content(wrap);
            } else {
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
            _orderedKeys = [];
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
            _orderedKeys = [];
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


    rawTagEditor.readOnlyTags = function(val) {
        if (!arguments.length) return _readOnlyTags;
        _readOnlyTags = val;
        return rawTagEditor;
    };


    return utilRebind(rawTagEditor, dispatch, 'on');
}
