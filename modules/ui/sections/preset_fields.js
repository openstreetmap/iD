import { dispatch as d3_dispatch } from 'd3-dispatch';

import { presetManager } from '../../presets';
import { t, localizer } from '../../core/localizer';
import { utilArrayIdentical } from '../../util/array';
import { utilArrayUnion, utilRebind } from '../../util';
import { geoExtent } from '../../geo/extent';
import { uiField } from '../field';
import { uiFormFields } from '../form_fields';
import { uiSection } from '../section';

export function uiSectionPresetFields(context) {

    const section = uiSection('preset-fields', context)
        .label(() => t.append('inspector.fields'))
        .disclosureContent(renderDisclosureContent);

    const dispatch = d3_dispatch('change', 'revert');
    const formFields = uiFormFields(context);
    let _state;
    let _fieldsArr;
    let _presets = [];
    let _tags;
    let _entityIDs;

    function renderDisclosureContent(selection) {
        if (!_fieldsArr) {

            const graph = context.graph();

            const geometries = Object.keys(_entityIDs.reduce(function(geoms, entityID) {
                geoms[graph.entity(entityID).geometry(graph)] = true;
                return geoms;
            }, {}));

            const loc = _entityIDs.reduce(function(extent, entityID) {
                const entity = context.graph().entity(entityID);
                return extent.extend(entity.extent(context.graph()));
            }, geoExtent()).center();

            const presetsManager = presetManager;

            let allFields = [];
            let allMoreFields = [];
            let sharedTotalFields;

            _presets.forEach(function(preset) {
                const fields = preset.fields(loc);
                const moreFields = preset.moreFields(loc);

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

            const sharedFields = allFields.filter(function(field) {
                return sharedTotalFields.indexOf(field) !== -1;
            });
            const sharedMoreFields = allMoreFields.filter(function(field) {
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

            const singularEntity = _entityIDs.length === 1 && graph.hasEntity(_entityIDs[0]);
            if (singularEntity && singularEntity.isHighwayIntersection(graph) && presetsManager.field('restrictions')) {
                _fieldsArr.push(
                    uiField(context, presetsManager.field('restrictions'), _entityIDs)
                );
            }

            const additionalFields = utilArrayUnion(sharedMoreFields, presetsManager.universal());
            additionalFields.sort(function(field1, field2) {
                return field1.title().localeCompare(field2.title(), localizer.localeCode());
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
