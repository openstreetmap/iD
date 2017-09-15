import * as d3 from 'd3';
import { d3combobox } from '../lib/d3.combobox.js';
import { t } from '../util/locale';
import { services } from '../services/index';
import { svgIcon } from '../svg/index';
import { uiDisclosure } from './disclosure';
import { uiTagReference } from './tag_reference';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../util';


export function uiRawTagEditor(context) {
    var taginfo = services.taginfo,
        dispatch = d3.dispatch('change'),
        expandedPreference = (context.storage('raw_tag_editor.expanded') === 'true'),
        expandedCurrent = expandedPreference,
        updatePreference = true,
        readOnlyTags = [],
        showBlank = false,
        newRow,
        state,
        preset,
        tags,
        id;


    function rawTagEditor(selection) {
        var count = Object.keys(tags).filter(function(d) { return d; }).length;

        selection.call(uiDisclosure()
            .title(t('inspector.all_tags') + ' (' + count + ')')
            .expanded(expandedCurrent)
            .on('toggled', toggled)
            .content(content)
        );

        function toggled(expanded) {
            expandedCurrent = expanded;
            if (updatePreference) {
                expandedPreference = expanded;
                context.storage('raw_tag_editor.expanded', expanded);
            }
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }
    }


    function content(wrap) {
        var entries = d3.entries(tags);

        if (!entries.length || showBlank) {
            showBlank = false;
            entries.push({key: '', value: ''});
            newRow = '';
        }

        var list = wrap.selectAll('.tag-list')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'tag-list')
            .merge(list);

        var newTag = wrap.selectAll('.add-tag')
            .data([0]);

        newTag.enter()
            .append('button')
            .attr('class', 'add-tag')
            .on('click', addTag)
            .call(svgIcon('#icon-plus', 'light'));


        var items = list.selectAll('.tag-row')
            .data(entries, function(d) { return d.key; });

        items.exit()
            .each(unbind)
            .remove();

        // Enter

        var enter = items.enter()
            .append('li')
            .attr('class', 'tag-row cf')
            .classed('readonly', isReadOnly);

        enter
            .append('div')
            .attr('class', 'key-wrap')
            .append('input')
            .property('type', 'text')
            .attr('class', 'key')
            .attr('maxlength', 255)
            .call(utilNoAuto)
            .on('blur', keyChange)
            .on('change', keyChange);

        enter
            .append('div')
            .attr('class', 'input-wrap-position')
            .append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .attr('maxlength', 255)
            .call(utilNoAuto)
            .on('blur', valueChange)
            .on('change', valueChange)
            .on('keydown.push-more', pushMore);

        enter
            .append('button')
            .attr('tabindex', -1)
            .attr('class', 'remove minor')
            .call(svgIcon('#operation-delete'));


        // Update

        items = items
            .merge(enter)
            .sort(function(a, b) {
                return (a.key === newRow && b.key !== newRow) ? 1
                    : (a.key !== newRow && b.key === newRow) ? -1
                    : d3.ascending(a.key, b.key);
            });

        items
            .each(function(tag) {
                var row = d3.select(this),
                    key = row.select('input.key'),      // propagate bound data to child
                    value = row.select('input.value');  // propagate bound data to child

                if (id && taginfo) {
                    bindTypeahead(key, value);
                }

                var isRelation = (id && context.entity(id).type === 'relation'),
                    reference;

                if (isRelation && tag.key === 'type') {
                    reference = uiTagReference({ rtype: tag.value }, context);
                } else {
                    reference = uiTagReference({ key: tag.key, value: tag.value }, context);
                }

                if (state === 'hover') {
                    reference.showing(false);
                }

                row
                    .call(reference.button)
                    .call(reference.body);
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
            for (var i = 0; i < readOnlyTags.length; i++) {
                if (d.key.match(readOnlyTags[i]) !== null) {
                    return true;
                }
            }
            return false;
        }


        function pushMore() {
            if (d3.event.keyCode === 9 && !d3.event.shiftKey &&
                list.selectAll('li:last-child input.value').node() === this) {
                addTag();
            }
        }


        function bindTypeahead(key, value) {
            if (isReadOnly({ key: key })) return;
            var geometry = context.geometry(id);

            key.call(d3combobox()
                .container(context.container())
                .fetcher(function(value, callback) {
                    taginfo.keys({
                        debounce: true,
                        geometry: geometry,
                        query: value
                    }, function(err, data) {
                        if (!err) callback(sort(value, data));
                    });
                }));

            value.call(d3combobox()
                .container(context.container())
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
                var sameletter = [],
                    other = [];
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
            var row = d3.select(this);

            row.selectAll('input.key')
                .call(d3combobox.off);

            row.selectAll('input.value')
                .call(d3combobox.off);
        }


        function keyChange(d) {
            var kOld = d.key,
                kNew = this.value.trim(),
                tag = {};


            if (isReadOnly({ key: kNew })) {
                this.value = kOld;
                return;
            }

            if (kNew && kNew !== kOld) {
                var match = kNew.match(/^(.*?)(?:_(\d+))?$/),
                    base = match[1],
                    suffix = +(match[2] || 1);
                while (tags[kNew]) {  // rename key if already in use
                    kNew = base + '_' + suffix++;
                }
            }
            tag[kOld] = undefined;
            tag[kNew] = d.value;

            d.key = kNew; // Maintain DOM identity through the subsequent update.

            if (newRow === kOld) {  // see if this row is still a new row
                newRow = ((d.value === '' || kNew === '') ? kNew : undefined);
            }

            this.value = kNew;
            dispatch.call('change', this, tag);
        }


        function valueChange(d) {
            if (isReadOnly(d)) return;
            var tag = {};
            tag[d.key] = this.value;

            if (newRow === d.key && d.key !== '' && d.value !== '') {   // not a new row anymore
                newRow = undefined;
            }

            dispatch.call('change', this, tag);
        }


        function removeTag(d) {
            if (isReadOnly(d)) return;
            var tag = {};
            tag[d.key] = undefined;
            dispatch.call('change', this, tag);
            d3.select(this.parentNode).remove();
        }


        function addTag() {
            // Wrapped in a setTimeout in case it's being called from a blur
            // handler. Without the setTimeout, the call to `content` would
            // wipe out the pending value change.
            setTimeout(function() {
                showBlank = true;
                content(wrap);
                list.selectAll('li:last-child input.key').node().focus();
            }, 0);
        }
    }


    rawTagEditor.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return rawTagEditor;
    };


    rawTagEditor.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        if (preset.isFallback()) {
            expandedCurrent = true;
            updatePreference = false;
        } else {
            expandedCurrent = expandedPreference;
            updatePreference = true;
        }
        return rawTagEditor;
    };


    rawTagEditor.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        return rawTagEditor;
    };


    rawTagEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return rawTagEditor;
    };


    rawTagEditor.expanded = function(_) {
        if (!arguments.length) return expandedCurrent;
        expandedCurrent = _;
        updatePreference = false;
        return rawTagEditor;
    };


    rawTagEditor.readOnlyTags = function(_) {
        if (!arguments.length) return readOnlyTags;
        readOnlyTags = _;
        return rawTagEditor;
    };


    return utilRebind(rawTagEditor, dispatch, 'on');
}
