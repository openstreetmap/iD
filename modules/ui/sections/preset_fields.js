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

    var section = uiSection('preset-fields', context)
        .label(() => t.append('inspector.fields'))
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

            const loc = _entityIDs.reduce(function(extent, entityID) {
                var entity = context.graph().entity(entityID);
                return extent.extend(entity.extent(context.graph()));
            }, geoExtent()).center();

            var presetsManager = presetManager;

            var allFields = [];
            var allMoreFields = [];
            var sharedTotalFields;

            _presets.forEach(function(preset) {
                var fields = preset.fields(loc);
                var moreFields = preset.moreFields(loc);

                if (_presets.length > 1) {
                    // If there is a mix of presets, use fallback field unless every preset supports the field
                    // e.g. "surface_segregated" will map back to "surface" as common field unless every preset uses it
                    fields = fields.map(function (field) {
                        if (field.fallbackKey) {
                            if (_presets.some(function (p) {
                                return p !== preset && !p.fields(loc).some(function (f) {
                                    return f.fallbackKey === field.fallbackKey;
                                })
                            })) {
                                return presetsManager.field(field.fallbackKey);
                            }
                        }
                        return field;
                    });
                }

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
                    var mainField = uiField(context, field, _entityIDs);
                    _fieldsArr.push(mainField);

                    // If a fallback field is specified, add it as well
                    // e.g. "surface_segregated" has "surface" as fallback when it's not shown itself
                    if (field.fallbackKey) {
                        if (!sharedFields.some(function (f) { return f.id === field.fallbackKey; })) {
                            var fallbackField = presetsManager.field(field.fallbackKey);
                            if (fallbackField) {
                                _fieldsArr.push(
                                    uiField(context, fallbackField, _entityIDs, {fallbackFor: mainField})
                                );
                            }
                        }
                    }
                }
            });

            var singularEntity = _entityIDs.length === 1 && graph.hasEntity(_entityIDs[0]);
            if (singularEntity && singularEntity.type === 'node' && singularEntity.isHighwayIntersection(graph) && presetsManager.field('restrictions')) {
                _fieldsArr.push(
                    uiField(context, presetsManager.field('restrictions'), _entityIDs)
                );
            }

            var additionalFields = utilArrayUnion(sharedMoreFields, presetsManager.universal());
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
