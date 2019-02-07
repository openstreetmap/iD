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
    var _sortKeys = false;
    var _showBlank = false;
    var _updatePreference = true;
    var _expanded = false;
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
        var entries = [];
        var keys = Object.keys(_tags);
        if (_sortKeys) {
            _sortKeys = false;
            keys = keys.sort();
        }
        for (var i = 0; i < keys.length; i++) {
            entries.push({ key: keys[i], value: _tags[keys[i]] });
        }

        if (!entries.length || _showBlank) {
            _showBlank = false;
            entries.push({ key: '', value: '' });
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
            .data(entries, function(d) { return d.key; });

        items.exit()
            .each(unbind)
            .remove();


        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', 'tag-row')
            .classed('readonly', isReadOnly);

        var innerWrap = enter.append('div')
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
            .merge(enter)
            .order();

        items
            .each(function(tag) {
                var row = d3_select(this);
                var key = row.select('input.key');      // propagate bound data to child
                var value = row.select('input.value');  // propagate bound data to child

                if (_entityID && taginfo && _state !== 'hover') {
                    bindTypeahead(key, value);
                }

                var isRelation = (_entityID && context.entity(_entityID).type === 'relation');
                var reference;

                if (isRelation && tag.key === 'type') {
                    reference = uiTagReference({ rtype: tag.value }, context);
                } else {
                    reference = uiTagReference({ key: tag.key, value: tag.value }, context);
                }

                if (_state === 'hover') {
                    reference.showing(false);
                }

                row.select('.inner-wrap')
                    .call(reference.button);

                row.call(reference.body);
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
            .on('click', removeTag);



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

            var t = {};
            if (kOld) {
                t[kOld] = undefined;
            }
            t[kNew] = vNew;

            d.key = kNew;    // update datum to avoid exit/enter on tag update
            d.value = vNew;

            this.value = kNew;
            utilGetSetValue(inputVal, vNew);

            dispatch.call('change', this, t);
        }


        function valueChange(d) {
            if (isReadOnly(d)) return;
            var t = {};
            t[d.key] = this.value;
            dispatch.call('change', this, t);
        }


        function removeTag(d) {
            if (isReadOnly(d)) return;
            var t = {};
            t[d.key] = undefined;
            dispatch.call('change', this, t);
            d3_select(this.parentNode).remove();
        }


        function addTag() {
            // Wrapped in a setTimeout in case it's being called from a blur
            // handler. Without the setTimeout, the call to `content` would
            // wipe out the pending value change.
            window.setTimeout(function() {
                _showBlank = true;
                content(wrap);
                list.selectAll('li:last-child input.key').node().focus();
            }, 1);
        }
    }


    rawTagEditor.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
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
            _sortKeys = true;
        }
        _entityID = val;
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
