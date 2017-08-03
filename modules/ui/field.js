import * as d3 from 'd3';
import _ from 'lodash';
import { textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiFields } from './fields';
import { uiTagReference } from './tag_reference';
import { utilRebind } from '../util';


export function uiField(context, presetField, entity, show) {
    var dispatch = d3.dispatch('change'),
        field = _.clone(presetField),
        tags;


    field.impl = uiFields[field.type](field, context)
        .on('change', function(t, onInput) {
            dispatch.call('change', field, t, onInput);
        });

    if (field.impl.entity) {
        field.impl.entity(entity);
    }

    field.keys = field.keys || [field.key];

    field.show = show;


    function isModified() {
        var original = context.graph().base().entities[entity.id];
        return _.some(field.keys, function(key) {
            return original ? tags[key] !== original.tags[key] : tags[key];
        });
    }


    function isPresent() {
        return _.some(field.keys, function(key) {
            return tags[key];
        });
    }


    function revert(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        var original = context.graph().base().entities[entity.id],
            t = {};
        d.keys.forEach(function(key) {
            t[key] = original ? original.tags[key] : undefined;
        });

        dispatch.call('change', d, t);
    }


    function remove(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        var t = {};
        d.keys.forEach(function(key) {
            t[key] = undefined;
        });

        dispatch.call('change', d, t);
    }


    field.render = function(selection) {
        var container = selection.selectAll('.form-field')
            .data([field]);

        // Enter
        var enter = container.enter()
            .append('div')
            .attr('class', function(d) { return 'form-field form-field-' + d.id; });

        var label = enter
            .append('label')
            .attr('class', 'form-label')
            .attr('for', function(d) { return 'preset-input-' + d.id; })
            .text(function(d) { return d.label(); });

        var wrap = label
            .append('div')
            .attr('class', 'form-label-button-wrap');

        wrap
            .append('button')
            .attr('class', 'remove-icon')
            .attr('tabindex', -1)
            .call(svgIcon('#operation-delete'));

        wrap
            .append('button')
            .attr('class', 'modified-icon')
            .attr('tabindex', -1)
            .call(
                (textDirection === 'rtl') ? svgIcon('#icon-redo') : svgIcon('#icon-undo')
            );


        // Update
        container = container
            .merge(enter);

        container.selectAll('.form-label-button-wrap .remove-icon')
            .on('click', remove);

        container.selectAll('.form-label-button-wrap .modified-icon')
            .on('click', revert);

        container
            .classed('modified', isModified())
            .classed('present', isPresent())
            .each(function(d) {
                var referenceKey = d.key;
                if (d.type === 'multiCombo') {   // lookup key without the trailing ':'
                    referenceKey = referenceKey.replace(/:$/, '');
                }
                var reference = uiTagReference(d.reference || { key: referenceKey }, context);

//FIXME
                // if (state === 'hover') {
                //     reference.showing(false);
                // }

                d3.select(this)
                    .call(d.impl);

                d3.select(this)
                    .call(reference.body)
                    .select('.form-label-button-wrap')
                    .call(reference.button);

                d.impl.tags(tags);
            });
    };


    field.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        // field.impl.tags(tags);
        return field;
    };


    field.isShown = function() {
        return field.show || _.some(field.keys, function(key) { return !!tags[key]; });
    };


    field.focus = function() {
        field.impl.focus();
    };


    return utilRebind(field, dispatch, 'on');
}

