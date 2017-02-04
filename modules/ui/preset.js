import * as d3 from 'd3';
import _ from 'lodash';
import { d3combobox } from '../lib/d3.combobox.js';
import { t, textDirection } from '../util/locale';
import { modeBrowse } from '../modes/index';
import { svgIcon } from '../svg/index';
import { uiDisclosure } from './disclosure';
import { uiFields } from './fields/index';
import { uiTagReference } from './tag_reference';
import { utilRebind } from '../util/rebind';
import { utilGetSetValue } from '../util/get_set_value';


export function uiPreset(context) {
    var dispatch = d3.dispatch('change'),
        state,
        fieldsArr,
        preset,
        tags,
        id;


    // Field Constructor
    function UIField(field, entity, show) {
        field = _.clone(field);
        field.input = uiFields[field.type](field, context)
            .on('change', function(t, onInput) {
                dispatch.call('change', field, t, onInput);
            });

        if (field.input.entity) field.input.entity(entity);

        field.keys = field.keys || [field.key];

        field.show = show;

        field.shown = function() {
            return field.id === 'name' || field.show || _.some(field.keys, function(key) { return !!tags[key]; });
        };

        field.modified = function() {
            var original = context.graph().base().entities[entity.id];
            return _.some(field.keys, function(key) {
                return original ? tags[key] !== original.tags[key] : tags[key];
            });
        };

        field.revert = function() {
            var original = context.graph().base().entities[entity.id],
                t = {};
            field.keys.forEach(function(key) {
                t[key] = original ? original.tags[key] : undefined;
            });
            return t;
        };

        field.present = function() {
            return _.some(field.keys, function(key) {
                return tags[key];
            });
        };

        field.remove = function() {
            var t = {};
            field.keys.forEach(function(key) {
                t[key] = undefined;
            });
            return t;
        };

        return field;
    }


    function fieldKey(field) {
        return field.id;
    }


    function presets(selection) {
        selection.call(uiDisclosure()
            .title(t('inspector.all_fields'))
            .expanded(context.storage('preset_fields.expanded') !== 'false')
            .on('toggled', toggled)
            .content(content)
        );

        function toggled(expanded) {
            context.storage('preset_fields.expanded', expanded);
        }
    }


    function content(selection) {
        if (!fieldsArr) {
            var entity = context.entity(id),
                geometry = context.geometry(id),
                presets = context.presets();

            fieldsArr = [];

            if (presets.field('name')) {
                fieldsArr.push(UIField(presets.field('name'), entity));
            }

            preset.fields.forEach(function(field) {
                if (field.matchGeometry(geometry)) {
                    fieldsArr.push(UIField(field, entity, true));
                }
            });

            if (entity.isHighwayIntersection(context.graph()) && presets.field('restrictions')) {
                fieldsArr.push(UIField(presets.field('restrictions'), entity, true));
            }

            presets.universal().forEach(function(field) {
                if (preset.fields.indexOf(field) < 0) {
                    fieldsArr.push(UIField(field, entity));
                }
            });
        }

        var shown = fieldsArr.filter(function(field) { return field.shown(); }),
            notShown = fieldsArr.filter(function(field) { return !field.shown(); });


        var form = selection.selectAll('.preset-form')
            .data([0]);

        form = form.enter()
            .append('div')
            .attr('class', 'preset-form inspector-inner fillL3')
            .merge(form);


        var fields = form.selectAll('.form-field')
            .data(shown, fieldKey);

        fields.exit()
            .remove();

        // Enter
        var enter = fields.enter()
            .append('div')
            .attr('class', function(field) {
                return 'form-field form-field-' + field.id;
            });

        var label = enter
            .append('label')
            .attr('class', 'form-label')
            .attr('for', function(field) { return 'preset-input-' + field.id; })
            .text(function(field) { return field.label(); });

        var wrap = label
            .append('div')
            .attr('class', 'form-label-button-wrap');

        wrap.append('button')
            .attr('class', 'remove-icon')
            .attr('tabindex', -1)
            .call(svgIcon('#operation-delete'));

        wrap.append('button')
            .attr('class', 'modified-icon')
            .attr('tabindex', -1)
            .call(
                (textDirection === 'rtl') ? svgIcon('#icon-redo') : svgIcon('#icon-undo')
            );


        // Update
        fields = fields
            .merge(enter);

        fields.selectAll('.form-label-button-wrap .remove-icon')
            .on('click', remove);

        fields.selectAll('.modified-icon')
            .on('click', revert);

        fields
            .order()
            .classed('modified', function(field) { return field.modified(); })
            .classed('present', function(field) { return field.present(); })
            .each(function(field) {
                var reference = uiTagReference(field.reference || { key: field.key }, context);

                if (state === 'hover') {
                    reference.showing(false);
                }

                d3.select(this)
                    .call(field.input)
                    .selectAll('input')
                    .on('keydown', function() {
                        // if user presses enter, and combobox is not active, accept edits..
                        if (d3.event.keyCode === 13 && d3.select('.combobox').empty()) {
                            context.enter(modeBrowse(context));
                        }
                    })
                    .call(reference.body)
                    .select('.form-label-button-wrap')
                    .call(reference.button);

                field.input.tags(tags);
            });

        notShown = notShown.map(function(field) {
            return {
                title: field.label(),
                value: field.label(),
                field: field
            };
        });


        var more = selection.selectAll('.more-fields')
            .data((notShown.length > 0) ? [0] : []);

        more.exit()
            .remove();

        more = more.enter()
            .append('div')
            .attr('class', 'more-fields')
            .append('label')
            .text(t('inspector.add_fields'))
            .merge(more);


        var input = more.selectAll('.value')
            .data([0]);

        input.exit()
            .remove();

        input = input.enter()
            .append('input')
            .attr('class', 'value')
            .attr('type', 'text')
            .merge(input);

        input
            .call(utilGetSetValue, '')
            .attr('placeholder', function() {
                var placeholder = [];
                for (var field in notShown) {
                    placeholder.push(notShown[field].title);
                }
                return placeholder.slice(0,3).join(', ') + ((placeholder.length > 3) ? '…' : '');
            })
            .call(d3combobox().data(notShown)
                .minItems(1)
                .on('accept', show));


        function show(field) {
            field = field.field;
            field.show = true;
            content(selection);
            field.input.focus();
        }


        function revert(field) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            dispatch.call('change', field, field.revert());
        }


        function remove(field) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            dispatch.call('change', field, field.remove());
        }
    }


    presets.preset = function(_) {
        if (!arguments.length) return preset;
        if (preset && preset.id === _.id) return presets;
        preset = _;
        fieldsArr = null;
        return presets;
    };


    presets.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return presets;
    };


    presets.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        // Don't reset fieldsArr here.
        return presets;
    };


    presets.entityID = function(_) {
        if (!arguments.length) return id;
        if (id === _) return presets;
        id = _;
        fieldsArr = null;
        return presets;
    };


    return utilRebind(presets, dispatch, 'on');
}
