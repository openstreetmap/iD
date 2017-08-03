import * as d3 from 'd3';
import { d3combobox } from '../lib/d3.combobox.js';
import { t } from '../util/locale';
import { modeBrowse } from '../modes';
import { uiDisclosure } from './disclosure';
import { uiField } from './field';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../util';


export function uiPresetEditor(context) {
    var dispatch = d3.dispatch('change'),
        expandedPreference = (context.storage('preset_fields.expanded') !== 'false'),
        state,
        fieldsArr,
        preset,
        tags,
        entityId;


    function presetEditor(selection) {
        selection.call(uiDisclosure()
            .title(t('inspector.all_fields'))
            .expanded(expandedPreference)
            .on('toggled', toggled)
            .content(render)
        );

        function toggled(expanded) {
            expandedPreference = expanded;
            context.storage('preset_fields.expanded', expanded);
        }
    }


    function render(selection) {
        if (!fieldsArr) {
            var entity = context.entity(entityId),
                geometry = context.geometry(entityId),
                presets = context.presets();

            fieldsArr = [];

            preset.fields.forEach(function(field) {
                if (field.matchGeometry(geometry)) {
                    fieldsArr.push(
                        uiField(context, field, entity, true)
                    );
                }
            });

            if (entity.isHighwayIntersection(context.graph()) && presets.field('restrictions')) {
                fieldsArr.push(
                    uiField(context, presets.field('restrictions'), entity, true)
                );
            }

            presets.universal().forEach(function(field) {
                if (preset.fields.indexOf(field) === -1) {
                    fieldsArr.push(
                        uiField(context, field, entity)
                    );
                }
            });

            fieldsArr.forEach(function(field) {
                field
                    .tags(tags)
                    .on('change', function(t, onInput) {
                        dispatch.call('change', field, t, onInput);
                    });
            });
        }

        var shown = fieldsArr.filter(function(field) { return field.isShown(); }),
            notShown = fieldsArr.filter(function(field) { return !field.isShown(); });


        var form = selection.selectAll('.preset-form')
            .data([0]);

        form = form.enter()
            .append('div')
            .attr('class', 'preset-form inspector-inner fillL3')
            .merge(form);


        var fields = form.selectAll('.wrap-form-field')
            .data(shown, function(d) { return d.id; });

        fields.exit()
            .remove();

        // Enter
        var enter = fields.enter()
            .append('div')
            .attr('class', function(d) { return 'wrap-form-field wrap-form-field-' + d.id; });

        // Update
        fields = fields
            .merge(enter);

        fields
            .order()
            .each(function(d) {
                d3.select(this)
                    .call(d.render)
                    .selectAll('input')
                    .on('keydown', function() {
                        // if user presses enter, and combobox is not active, accept edits..
                        if (d3.event.keyCode === 13 && d3.select('.combobox').empty()) {
                            context.enter(modeBrowse(context));
                        }
                    });

                // d.tags(tags);
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
            .call(utilNoAuto)
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
            .call(d3combobox()
                .container(context.container())
                .data(notShown)
                .minItems(1)
                .on('accept', function (d) {
                    var field = d.field;
                    field.show = true;
                    render(selection);
                    field.focus();
                })
            );

    }


    presetEditor.preset = function(_) {
        if (!arguments.length) return preset;
        if (preset && preset.id === _.id) return presetEditor;
        preset = _;
        fieldsArr = null;
        return presetEditor;
    };


    presetEditor.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return presetEditor;
    };


    presetEditor.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        // Don't reset fieldsArr here.
        return presetEditor;
    };


    presetEditor.entityID = function(_) {
        if (!arguments.length) return entityId;
        if (entityId === _) return presetEditor;
        entityId = _;
        fieldsArr = null;
        return presetEditor;
    };


    return utilRebind(presetEditor, dispatch, 'on');
}
