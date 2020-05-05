import { event as d3_event } from 'd3-selection';
import deepEqual from 'fast-deep-equal';

import { presetManager } from '../presets';
import { t } from '../core/localizer';
import { actionChangeTags } from '../actions/change_tags';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';
import { utilArrayIdentical } from '../util/array';
import { utilCleanTags, utilCombinedTags } from '../util';

import { uiSectionEntityIssues } from './sections/entity_issues';
import { uiSectionFeatureType } from './sections/feature_type';
import { uiSectionPresetFields } from './sections/preset_fields';
import { uiSectionRawMemberEditor } from './sections/raw_member_editor';
import { uiSectionRawMembershipEditor } from './sections/raw_membership_editor';
import { uiSectionRawTagEditor } from './sections/raw_tag_editor';
import { uiSectionSelectionList } from './sections/selection_list';
import { uiViewOnOSM } from './view_on_osm';

export function uiEntityEditor(context) {
    var _state = 'select';
    var _coalesceChanges = false;
    var _modified = false;
    var _base;
    var _entityIDs;
    var _activePresets = [];
    var _newFeature = false;

    var _sections;

    function entityEditor(selection) {

        var combinedTags = utilCombinedTags(_entityIDs, context.graph());

        // Header
        var header = selection.selectAll('.header')
            .data([0]);

        // Enter
        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        headerEnter
            .append('button')
            .attr('class', 'close')
            .on('click', function() { context.enter(modeBrowse(context)); })
            .call(svgIcon(_modified ? '#iD-icon-apply' : '#iD-icon-close'));

        headerEnter
            .append('h3');

        // Update
        header = header
            .merge(headerEnter);

        header.selectAll('h3')
            .text(_entityIDs.length === 1 ? t('inspector.edit') : t('inspector.edit_features'));

        // Body
        var body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter
        var bodyEnter = body.enter()
            .append('div')
            .attr('class', 'entity-editor inspector-body');

        // Update
        body = body
            .merge(bodyEnter);

        if (!_sections) {
            _sections = [
                uiSectionSelectionList(context),
                uiSectionFeatureType(context)
                    .on('choose.entityEditor', function(presets) {
                        entityEditor.presets(presets);
                    }),
                uiSectionEntityIssues(context),
                uiSectionPresetFields(context)
                    .on('change.entityEditor', changeTags)
                    .on('revert.entityEditor', revertTags),
                uiSectionRawTagEditor('raw-tag-editor', context)
                    .on('change.entityEditor', changeTags),
                uiSectionRawMemberEditor(context),
                uiSectionRawMembershipEditor(context)
            ];
        }

        _sections.forEach(function(section) {
            if (section.entityIDs) {
                section.entityIDs(_entityIDs);
            }
            if (section.presets) {
                section.presets(_activePresets);
            }
            if (section.tags) {
                section.tags(combinedTags);
            }
            if (section.state) {
                section.state(_state);
            }
            if (section.newFeature) {
                section.newFeature(_newFeature);
            }
            body.call(section.render);
        });

        body
            .selectAll('.key-trap-wrap')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'key-trap-wrap')
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

        var footer = selection.selectAll('.footer')
            .data([0]);

        footer = footer.enter()
            .append('div')
            .attr('class', 'footer')
            .merge(footer);

        footer
            .call(uiViewOnOSM(context)
                .what(context.hasEntity(_entityIDs.length === 1 && _entityIDs[0]))
            );

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
                context.container().selectAll('.entity-editor button.preset-reset .label')
                    .style('background-color', '#fff')
                    .transition()
                    .duration(750)
                    .style('background-color', null);
            }
        }
    }


    // Tag changes that fire on input can all get coalesced into a single
    // history operation when the user leaves the field.  #2342
    // Use explicit entityIDs in case the selection changes before the event is fired.
    function changeTags(entityIDs, changed, onInput) {

        var actions = [];
        for (var i in entityIDs) {
            var entityID = entityIDs[i];
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

        // remove any old field help overlay that might have gotten attached to the inspector
        context.container().selectAll('.field-help-body').remove();

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

            var match = presetManager.match(entity, graph);

            if (!counts[match.id]) counts[match.id] = 0;
            counts[match.id] += 1;
        }

        var matches = Object.keys(counts).sort(function(p1, p2) {
            return counts[p2] - counts[p1];
        }).map(function(pID) {
            return presetManager.item(pID);
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
        if (!val || !_activePresets || !utilArrayIdentical(val, _activePresets)) {
            _activePresets = val;
        }
        return entityEditor;
    };

    return entityEditor;
}
