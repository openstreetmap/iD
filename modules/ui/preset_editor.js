import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { currentLocale, t } from '../util/locale';
import { modeBrowse } from '../modes/browse';
import { uiDisclosure } from './disclosure';
import { uiField } from './field';
import { uiFormFields } from './form_fields';
import { utilArrayUnion, utilRebind } from '../util';


export function uiPresetEditor(context) {
    var dispatch = d3_dispatch('change');
    var formFields = uiFormFields(context);
    var _state;
    var _fieldsArr;
    var _preset;
    var _tags;
    var _entityID;


    function presetEditor(selection) {
        selection.call(uiDisclosure(context, 'preset_fields', true)
            .title(t('inspector.all_fields'))
            .content(render)
        );
    }


    function render(selection) {
        if (!_fieldsArr) {
            var entity = context.entity(_entityID);
            var geometry = context.geometry(_entityID);
            var presets = context.presets();

            _fieldsArr = [];

            _preset.fields.forEach(function(field) {
                if (field.matchGeometry(geometry)) {
                    _fieldsArr.push(
                        uiField(context, field, entity)
                    );
                }
            });

            if (entity.isHighwayIntersection(context.graph()) && presets.field('restrictions')) {
                _fieldsArr.push(
                    uiField(context, presets.field('restrictions'), entity)
                );
            }

            var additionalFields = utilArrayUnion(_preset.moreFields, presets.universal());
            additionalFields.sort(function(field1, field2) {
                return field1.label().localeCompare(field2.label(), currentLocale);
            });

            additionalFields.forEach(function(field) {
                if (_preset.fields.indexOf(field) === -1 &&
                    field.matchGeometry(geometry)) {
                    _fieldsArr.push(
                        uiField(context, field, entity, { show: false })
                    );
                }
            });

            _fieldsArr.forEach(function(field) {
                field
                    .on('change', function(t, onInput) {
                        dispatch.call('change', field, t, onInput);
                    });
            });
        }

        _fieldsArr.forEach(function(field) {
            field
                .state(_state)
                .tags(_tags);
        });


        selection
            .call(formFields
                .fieldsArr(_fieldsArr)
                .state(_state)
                .klass('inspector-inner fillL3')
            );


        selection.selectAll('.wrap-form-field input')
            .on('keydown', function() {
                // if user presses enter, and combobox is not active, accept edits..
                if (d3_event.keyCode === 13 && d3_select('.combobox').empty()) {
                    context.enter(modeBrowse(context));
                }
            });
    }


    presetEditor.preset = function(val) {
        if (!arguments.length) return _preset;
        if (_preset && _preset.id === val.id) return presetEditor;
        _preset = val;
        _fieldsArr = null;
        return presetEditor;
    };


    presetEditor.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        return presetEditor;
    };


    presetEditor.tags = function(val) {
        if (!arguments.length) return _tags;
        _tags = val;
        // Don't reset _fieldsArr here.
        return presetEditor;
    };


    presetEditor.entityID = function(val) {
        if (!arguments.length) return _entityID;
        if (_entityID === val) return presetEditor;
        _entityID = val;
        _fieldsArr = null;
        return presetEditor;
    };


    return utilRebind(presetEditor, dispatch, 'on');
}
