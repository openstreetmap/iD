import * as d3 from 'd3';
import _ from 'lodash';
import { textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiFields } from './fields';
import { uiTagReference } from './tag_reference';
import { utilRebind } from '../util';


export function uiField(context, presetField, entity, options) {
    options = _.extend({
        show: true,
        wrap: true,
        remove: true,
        revert: true,
        info: true
    }, options);

    var dispatch = d3.dispatch('change'),
        field = _.clone(presetField),
        state = '',
        tags = {};


    field.impl = uiFields[field.type](field, context)
        .on('change', function(t, onInput) {
            dispatch.call('change', field, t, onInput);
        });

    if (entity && field.impl.entity) {
        field.impl.entity(entity);
    }

    field.keys = field.keys || [field.key];

    field.show = options.show;


    function isModified() {
        if (!entity) return false;
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
        if (!entity) return false;

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


    function showMore() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }


    field.render = function(selection) {
        var subfields = field.subfields;

        // Field container
        var container = selection.selectAll('.form-field')
            .data([field]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', function(d) { return 'form-field form-field-' + d.id; })
            .classed('nowrap', !options.wrap);

        // Label and buttons
        if (options.wrap) {
            var labelEnter = containerEnter
                .append('label')
                .attr('class', 'form-label')
                .attr('for', function(d) { return 'preset-input-' + d.id; })
                .text(function(d) { return d.label(); });

            var buttonEnter = labelEnter
                .append('div')
                .attr('class', 'form-label-button-wrap');

            if (options.remove) {
                buttonEnter
                    .append('button')
                    .attr('class', 'remove-icon')
                    .attr('tabindex', -1)
                    .call(svgIcon('#operation-delete'));
            }

            if (options.revert) {
                buttonEnter
                    .append('button')
                    .attr('class', 'modified-icon')
                    .attr('tabindex', -1)
                    .call(svgIcon(textDirection === 'rtl' ? '#icon-redo' : '#icon-undo'));
            }
        }

        // Field Input
        containerEnter
            .append('div')
            .attr('class', 'form-field-input-wrap');


        // Update
        container = container
            .merge(containerEnter);

        container.selectAll('.form-label-button-wrap .remove-icon')
            .on('click', remove);

        container.selectAll('.form-label-button-wrap .modified-icon')
            .on('click', revert);

        container
            .classed('modified', isModified())
            .classed('present', isPresent());

        var formWrap = container.select('.form-field-input-wrap');

        formWrap
            .call(field.impl);

        var moreButton = formWrap.selectAll('.more-icon')
            .data(subfields ? [0] : []);

        moreButton = moreButton.enter()
            .append('button')
            .attr('class', 'button-input-action more-icon minor')
            .attr('tabindex', -1)
            .call(svgIcon('#icon-more'))
            .merge(moreButton);

        moreButton
            .on('click', showMore);


        if (options.wrap && options.info) {
            var referenceKey = field.key;
            if (field.type === 'multiCombo') {   // lookup key without the trailing ':'
                referenceKey = referenceKey.replace(/:$/, '');
            }
            var reference = uiTagReference(field.reference || { key: referenceKey }, context);

            if (state === 'hover') {
                reference.showing(false);
            }

            container
                .call(reference.body)
                .select('.form-label-button-wrap')
                .call(reference.button);
        }

        var subfields = container.selectAll('.subfield-section')
            .data(subfields || []);

        subfields = subfields.enter()
            .append('div')
            .attr('class', 'subfield-section')
            .text('subfields')
            .merge(subfields);


        field.impl.tags(tags);

    };


    field.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return field;
    };


    field.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
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

