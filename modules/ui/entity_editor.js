import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event, selectAll as d3_selectAll, select as d3_select } from 'd3-selection';
import deepEqual from 'fast-deep-equal';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { actionChangeTags } from '../actions/change_tags';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';
import { uiDisclosure } from './disclosure';
import { uiPresetIcon } from './preset_icon';
import { uiQuickLinks } from './quick_links';
import { uiRawMemberEditor } from './raw_member_editor';
import { uiRawMembershipEditor } from './raw_membership_editor';
import { uiRawTagEditor } from './raw_tag_editor';
import { uiTagReference } from './tag_reference';
import { uiPresetEditor } from './preset_editor';
import { uiEntityIssues } from './entity_issues';
import { uiSelectionList } from './selection_list';
import { uiTooltipHtml } from './tooltipHtml';
import { utilArrayIdentical } from '../util/array';
import { utilCleanTags, utilCombinedTags, utilRebind } from '../util';


export function uiEntityEditor(context) {
    var dispatch = d3_dispatch('choose');
    var _state = 'select';
    var _coalesceChanges = false;
    var _modified = false;
    var _base;
    var _entityIDs;
    var _activePresets = [];
    var _tagReference;
    var _newFeature;

    var selectionList = uiSelectionList(context);
    var entityIssues = uiEntityIssues(context);
    var quickLinks = uiQuickLinks();
    var presetEditor = uiPresetEditor(context).on('change', changeTags).on('revert', revertTags);
    var rawTagEditor = uiRawTagEditor(context).on('change', changeTags);
    var rawMemberEditor = uiRawMemberEditor(context);
    var rawMembershipEditor = uiRawMembershipEditor(context);

    function entityEditor(selection) {

        var singularEntityID = _entityIDs.length === 1 && _entityIDs[0];
        var singularEntity = singularEntityID && context.entity(singularEntityID);

        var combinedTags = utilCombinedTags(_entityIDs, context.graph());

        // Header
        var header = selection.selectAll('.header')
            .data([0]);

        // Enter
        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'header fillL cf');

        headerEnter
            .append('button')
            .attr('class', 'fl preset-reset preset-choose')
            .call(svgIcon((textDirection === 'rtl') ? '#iD-icon-forward' : '#iD-icon-backward'));

        headerEnter
            .append('button')
            .attr('class', 'fr preset-close')
            .on('click', function() { context.enter(modeBrowse(context)); })
            .call(svgIcon(_modified ? '#iD-icon-apply' : '#iD-icon-close'));

        headerEnter
            .append('h3');

        // Update
        header = header
            .merge(headerEnter);

        header.selectAll('h3')
            .text(singularEntityID ? t('inspector.edit') : t('inspector.edit_features'));

        header.selectAll('.preset-reset')
            .on('click', function() {
                dispatch.call('choose', this, _activePresets);
            });

        // Body
        var body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter
        var bodyEnter = body.enter()
            .append('div')
            .attr('class', 'entity-editor inspector-body sep-top');

        // Update
        body = body
            .merge(bodyEnter);

        var sectionInfos = [
            {
                klass: 'selected-features inspector-inner',
                shouldHave: _entityIDs.length > 1,
                update: function(section) {
                    section
                        .call(selectionList
                            .selectedIDs(_entityIDs)
                        );
                }
            },
            {
                klass: 'preset-list-item inspector-inner',
                update: function(section) {

                    section.classed('mixed-types', _activePresets.length > 1);

                    section
                        .call(
                            uiDisclosure(context, 'feature_type', true)
                                .title(t('inspector.feature_type'))
                                .content(renderFeatureType)
                        );

                    function renderFeatureType(selection) {
                        var presetButtonWrap = selection
                            .selectAll('.preset-list-button-wrap')
                            .data([0])
                            .enter()
                            .append('div')
                            .attr('class', 'preset-list-button-wrap');

                        var presetButton = presetButtonWrap
                            .append('button')
                            .attr('class', 'preset-list-button preset-reset')
                            .call(tooltip()
                                .title(t('inspector.back_tooltip'))
                                .placement('bottom')
                            );

                        presetButton.append('div')
                            .attr('class', 'preset-icon-container');

                        presetButton
                            .append('div')
                            .attr('class', 'label')
                            .append('div')
                            .attr('class', 'label-inner');

                        presetButtonWrap.append('div')
                            .attr('class', 'accessory-buttons');

                        var tagReferenceBodyWrap = selection
                            .selectAll('.tag-reference-body-wrap')
                            .data([0]);

                        tagReferenceBodyWrap = tagReferenceBodyWrap
                            .enter()
                            .append('div')
                            .attr('class', 'tag-reference-body-wrap')
                            .merge(tagReferenceBodyWrap);

                        selection
                            .selectAll('.preset-quick-links')
                            .data([0])
                            .enter()
                            .append('div')
                            .attr('class', 'preset-quick-links')
                            .call(quickLinks.choices([{
                                id: 'zoom_to',
                                label: 'inspector.zoom_to.title',
                                tooltip: function() {
                                    return uiTooltipHtml(t('inspector.zoom_to.tooltip_feature'), t('inspector.zoom_to.key'));
                                },
                                click: function zoomTo() {
                                    context.mode().zoomToSelected();
                                }
                            }]));

                        // update header
                        if (_tagReference) {
                            selection.selectAll('.preset-list-button-wrap .accessory-buttons')
                                .style('display', _activePresets.length === 1 ? null : 'none')
                                .call(_tagReference.button);

                            tagReferenceBodyWrap
                                .style('display', _activePresets.length === 1 ? null : 'none')
                                .call(_tagReference.body);
                        }

                        selection.selectAll('.preset-reset')
                            .on('click', function() {
                                 dispatch.call('choose', this, _activePresets);
                            })
                            .on('mousedown', function() {
                                d3_event.preventDefault();
                                d3_event.stopPropagation();
                            })
                            .on('mouseup', function() {
                                d3_event.preventDefault();
                                d3_event.stopPropagation();
                            });

                        var geometries = entityGeometries();
                        selection.select('.preset-list-item button')
                            .call(uiPresetIcon(context)
                                .geometry(_activePresets.length === 1 ? (geometries.length === 1 && geometries[0]) : null)
                                .preset(_activePresets.length === 1 ? _activePresets[0] : context.presets().item('point'))
                            );

                        // NOTE: split on en-dash, not a hypen (to avoid conflict with hyphenated names)
                        var names = _activePresets.length === 1 ? _activePresets[0].name().split(' – ') : [t('inspector.multiple_types')];

                        var label = selection.select('.label-inner');
                        var nameparts = label.selectAll('.namepart')
                            .data(names, function(d) { return d; });

                        nameparts.exit()
                            .remove();

                        nameparts
                            .enter()
                            .append('div')
                            .attr('class', 'namepart')
                            .text(function(d) { return d; });
                    }
                }
            },
            {
                klass: 'entity-issues',
                update: function(section) {
                    section
                        .call(entityIssues
                            .entityIDs(_entityIDs)
                        );
                }
            }, {
                klass: 'preset-editor',
                update: function(section) {
                    section
                        .call(presetEditor
                            .presets(_activePresets)
                            .entityIDs(_entityIDs)
                            .tags(combinedTags)
                            .state(_state)
                        );
                }
            }, {
                klass: 'raw-tag-editor inspector-inner',
                update: function(section) {
                    section
                        .call(rawTagEditor
                            .preset(_activePresets[0])
                            .entityIDs(_entityIDs)
                            .tags(combinedTags)
                            .state(_state)
                        );
                }
            }, {
                klass: 'raw-member-editor inspector-inner',
                shouldHave: singularEntity && singularEntity.type === 'relation',
                update: function(section) {
                    section
                        .call(rawMemberEditor
                            .entityID(singularEntityID)
                        );
                }
            }, {
                klass: 'raw-membership-editor inspector-inner',
                shouldHave: singularEntityID,
                update: function(section) {
                    section
                        .call(rawMembershipEditor
                            .entityID(singularEntityID)
                        );
                }
            }, {
                klass: 'key-trap-wrap',
                create: function(sectionEnter) {
                    sectionEnter
                        .append('input')
                        .attr('type', 'text')
                        .attr('class', 'key-trap')
                        .on('keydown.key-trap', function() {
                            // On tabbing, send focus back to the first field on the inspector-body
                            // (probably the `name` field) #4159
                            if (d3_event.keyCode === 9 && !d3_event.shiftKey) {
                                d3_event.preventDefault();
                                body.select('input').node().focus();
                            }
                        });
                }
            }
        ];

        sectionInfos = sectionInfos.filter(function(info) {
            return info.shouldHave === undefined || info.shouldHave;
        });

        var sections = body.selectAll('.section')
            .data(sectionInfos, function(d) { return d.klass; });

        sections.exit().remove();

        var sectionsEnter = sections.enter()
            .append('div')
            .attr('class', function(d) {
                return 'section ' + d.klass;
            });

        sectionsEnter.each(function(d) {
            if (d.create) {
                d.create(d3_select(this));
            }
        });

        sections = sectionsEnter
            .merge(sections);

        sections.each(function(d) {
            if (d.update) {
                d.update(d3_select(this));
            }
        });

        context.history()
            .on('change.entity-editor', historyChanged);

        function historyChanged(difference) {
            if (selection.selectAll('.entity-editor').empty()) return;
            if (_state === 'hide') return;
            var significant = !difference ||
                    difference.didChange.properties ||
                    difference.didChange.addition ||
                    difference.didChange.deletion;
            if (!significant) return;

            _entityIDs = _entityIDs.filter(context.hasEntity);
            if (!_entityIDs.length) return;

            var priorActivePreset = _activePresets.length === 1 && _activePresets[0];

            loadActivePresets();

            var graph = context.graph();
            entityEditor.modified(_base !== graph);
            entityEditor(selection);

            if (priorActivePreset && _activePresets.length === 1 && priorActivePreset !== _activePresets[0]) {
                // flash the button to indicate the preset changed
                d3_selectAll('.entity-editor button.preset-reset .label')
                    .style('background-color', '#fff')
                    .transition()
                    .duration(750)
                    .style('background-color', null);
            }
        }
    }


    // Tag changes that fire on input can all get coalesced into a single
    // history operation when the user leaves the field.  #2342
    function changeTags(changed, onInput) {

        var actions = [];
        for (var i in _entityIDs) {
            var entityID = _entityIDs[i];
            var entity = context.entity(entityID);

            var tags = Object.assign({}, entity.tags);   // shallow copy

            for (var k in changed) {
                if (!k) continue;
                var v = changed[k];
                if (v !== undefined || tags.hasOwnProperty(k)) {
                    tags[k] = v;
                }
            }

            if (!onInput) {
                tags = utilCleanTags(tags);
            }

            if (!deepEqual(entity.tags, tags)) {
                actions.push(actionChangeTags(entityID, tags));
            }
        }

        if (actions.length) {
            var combinedAction = function(graph) {
                actions.forEach(function(action) {
                    graph = action(graph);
                });
                return graph;
            };

            var annotation = t('operations.change_tags.annotation');

            if (_coalesceChanges) {
                context.overwrite(combinedAction, annotation);
            } else {
                context.perform(combinedAction, annotation);
                _coalesceChanges = !!onInput;
            }
        }

        // if leaving field (blur event), rerun validation
        if (!onInput) {
            context.validator().validate();
        }
    }

    function revertTags(keys) {

        var actions = [];
        for (var i in _entityIDs) {
            var entityID = _entityIDs[i];

            var original = context.graph().base().entities[entityID];
            var changed = {};
            for (var j in keys) {
                var key = keys[j];
                changed[key] = original ? original.tags[key] : undefined;
            }

            var entity = context.entity(entityID);
            var tags = Object.assign({}, entity.tags);   // shallow copy

            for (var k in changed) {
                if (!k) continue;
                var v = changed[k];
                if (v !== undefined || tags.hasOwnProperty(k)) {
                    tags[k] = v;
                }
            }


            tags = utilCleanTags(tags);

            if (!deepEqual(entity.tags, tags)) {
                actions.push(actionChangeTags(entityID, tags));
            }

        }

        if (actions.length) {
            var combinedAction = function(graph) {
                actions.forEach(function(action) {
                    graph = action(graph);
                });
                return graph;
            };

            var annotation = t('operations.change_tags.annotation');

            if (_coalesceChanges) {
                context.overwrite(combinedAction, annotation);
            } else {
                context.perform(combinedAction, annotation);
                _coalesceChanges = false;
            }
        }

        context.validator().validate();
    }


    entityEditor.modified = function(val) {
        if (!arguments.length) return _modified;
        _modified = val;
        return entityEditor;
    };


    entityEditor.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        return entityEditor;
    };


    entityEditor.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        if (val && _entityIDs && utilArrayIdentical(_entityIDs, val)) return entityEditor;  // exit early if no change

        _entityIDs = val;
        _base = context.graph();
        _coalesceChanges = false;

        loadActivePresets();

        return entityEditor
            .modified(false);
    };


    entityEditor.newFeature = function(val) {
        if (!arguments.length) return _newFeature;
        _newFeature = val;
        return entityEditor;
    };


    function loadActivePresets() {

        var graph = context.graph();

        var counts = {};

        for (var i in _entityIDs) {
            var entity = graph.hasEntity(_entityIDs[i]);
            if (!entity) return;

            var match = context.presets().match(entity, graph);

            if (!counts[match.id]) counts[match.id] = 0;
            counts[match.id] += 1;
        }

        var matches = Object.keys(counts).sort(function(p1, p2) {
            return counts[p2] - counts[p1];
        }).map(function(pID) {
            return context.presets().item(pID);
        });

        // A "weak" preset doesn't set any tags. (e.g. "Address")
        var weakPreset = _activePresets.length === 1 &&
            Object.keys(_activePresets[0].addTags || {}).length === 0;
        // Don't replace a weak preset with a fallback preset (e.g. "Point")
        if (weakPreset && matches.length === 1 && matches[0].isFallback()) return;

        entityEditor.presets(matches);
    }

    entityEditor.presets = function(val) {
        if (!arguments.length) return _activePresets;

        // don't reload the same preset
        if (!utilArrayIdentical(val, _activePresets)) {

            _activePresets = val;

            var geometries = entityGeometries();
            if (_activePresets.length === 1 && geometries.length) {
                _tagReference = uiTagReference(_activePresets[0].reference(geometries[0]), context)
                    .showing(false);
            }
        }
        return entityEditor;
    };

    function entityGeometries() {

        var counts = {};

        for (var i in _entityIDs) {
            var geometry = context.geometry(_entityIDs[i]);
            if (!counts[geometry]) counts[geometry] = 0;
            counts[geometry] += 1;
        }

        return Object.keys(counts).sort(function(geom1, geom2) {
            return counts[geom2] - counts[geom1];
        });
    }

    return utilRebind(entityEditor, dispatch, 'on');
}
