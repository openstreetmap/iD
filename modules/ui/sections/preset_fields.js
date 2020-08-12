import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    event as d3_event
} from 'd3-selection';

import { presetManager } from '../../presets';
import { t, localizer } from '../../core/localizer';
import { utilArrayIdentical } from '../../util/array';
import { utilArrayUnion, utilRebind } from '../../util';
import { modeBrowse } from '../../modes/browse';
import { uiField } from '../field';
import { uiFormFields } from '../form_fields';
import { uiSection } from '../section';

export function uiSectionPresetFields(context) {

    var section = uiSection('preset-fields', context)
        .title(function() {
            return t('inspector.fields');
        })
        .disclosureContent(renderDisclosureContent);

    var dispatch = d3_dispatch('change', 'revert');
    var formFields = uiFormFields(context);
    var _state;
    var _fieldsArr;
    var _presets = [];
    var _tags;
    var _entityIDs;

    function renderDisclosureContent(selection) {
        if (!_fieldsArr) {

            var graph = context.graph();

            var geometries = Object.keys(_entityIDs.reduce(function(geoms, entityID) {
                geoms[graph.entity(entityID).geometry(graph)] = true;
                return geoms;
            }, {}));

            var presetsManager = presetManager;

            var allFields = [];
            var allMoreFields = [];
            var sharedTotalFields;

            _presets.forEach(function(preset) {
                var fields = preset.fields();
                var moreFields = preset.moreFields();

                allFields = utilArrayUnion(allFields, fields);
                allMoreFields = utilArrayUnion(allMoreFields, moreFields);

                if (!sharedTotalFields) {
                    sharedTotalFields = utilArrayUnion(fields, moreFields);
                } else {
                    sharedTotalFields = sharedTotalFields.filter(function(field) {
                        return fields.indexOf(field) !== -1 || moreFields.indexOf(field) !== -1;
                    });
                }
            });

            var sharedFields = allFields.filter(function(field) {
                return sharedTotalFields.indexOf(field) !== -1;
            });
            var sharedMoreFields = allMoreFields.filter(function(field) {
                return sharedTotalFields.indexOf(field) !== -1;
            });

            _fieldsArr = [];

            sharedFields.forEach(function(field) {
                if (field.matchAllGeometry(geometries)) {
                    _fieldsArr.push(
                        uiField(context, field, _entityIDs)
                    );
                }
            });

            var singularEntity = _entityIDs.length === 1 && graph.hasEntity(_entityIDs[0]);
            if (singularEntity && singularEntity.isHighwayIntersection(graph) && presetsManager.field('restrictions')) {
                _fieldsArr.push(
                    uiField(context, presetsManager.field('restrictions'), _entityIDs)
                );
            }

            var additionalFields = utilArrayUnion(sharedMoreFields, presetsManager.universal());
            additionalFields.sort(function(field1, field2) {
                return field1.label().localeCompare(field2.label(), localizer.localeCode());
            });

            additionalFields.forEach(function(field) {
                if (sharedFields.indexOf(field) === -1 &&
                    field.matchAllGeometry(geometries)) {
                    _fieldsArr.push(
                        uiField(context, field, _entityIDs, { show: false })
                    );
                }
            });

            _fieldsArr.forEach(function(field) {
                field
                    .on('change', function(t, onInput) {
                        dispatch.call('change', field, _entityIDs, t, onInput);
                    })
                    .on('revert', function(keys) {
                        dispatch.call('revert', field, keys);
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
                .klass('grouped-items-area')
            );


        selection.selectAll('.wrap-form-field input')
            .on('keydown', function() {
                // if user presses enter, and combobox is not active, accept edits..
                if (d3_event.keyCode === 13 && context.container().select('.combobox').empty()) {
                    context.enter(modeBrowse(context));
                }
            });
    }

    section.presets = function(val) {
        if (!arguments.length) return _presets;
        if (!_presets || !val || !utilArrayIdentical(_presets, val)) {
            _presets = val;
            _fieldsArr = null;
        }
        return section;
    };

    section.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        return section;
    };

    section.tags = function(val) {
        if (!arguments.length) return _tags;
        _tags = val;
        // Don't reset _fieldsArr here.
        return section;
    };

    section.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        if (!val || !_entityIDs || !utilArrayIdentical(_entityIDs, val)) {
            _entityIDs = val;
            _fieldsArr = null;
        }
        return section;
    };

    return utilRebind(section, dispatch, 'on');
}
