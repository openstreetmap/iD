import * as d3 from 'd3';
import { t } from '../util/locale';
import { modeBrowse } from '../modes';
import { uiDisclosure } from './disclosure';
import { uiField } from './field';
import { uiFormFields } from './form_fields';
import { utilRebind } from '../util';


export function uiPresetEditor(context) {
    var dispatch = d3.dispatch('change'),
        formFields = uiFormFields(context),
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
                        uiField(context, field, entity)
                    );
                }
            });

            if (entity.isHighwayIntersection(context.graph()) && presets.field('restrictions')) {
                fieldsArr.push(
                    uiField(context, presets.field('restrictions'), entity)
                );
            }

            presets.universal().forEach(function(field) {
                if (preset.fields.indexOf(field) === -1) {
                    fieldsArr.push(
                        uiField(context, field, entity, { show: false })
                    );
                }
            });

            fieldsArr.forEach(function(field) {
                field
                    .on('change', function(t, onInput) {
                        dispatch.call('change', field, t, onInput);
                    });
            });
        }

        fieldsArr.forEach(function(field) {
            field
                .state(state)
                .tags(tags);
        });


        selection
            .call(formFields.fieldsArr(fieldsArr), 'inspector-inner fillL3');


        selection.selectAll('.wrap-form-field input')
            .on('keydown', function() {
                // if user presses enter, and combobox is not active, accept edits..
                if (d3.event.keyCode === 13 && d3.select('.combobox').empty()) {
                    context.enter(modeBrowse(context));
                }
            });
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
