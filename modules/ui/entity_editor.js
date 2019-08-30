import {event as d3_event } from 'd3-selection';
import deepEqual from 'fast-deep-equal';

import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { actionChangePreset } from '../actions/change_preset';
import { actionChangeTags } from '../actions/change_tags';
import { uiPresetFavoriteButton } from './preset_favorite_button';
import { uiPresetIcon } from './preset_icon';
import { uiRawMemberEditor } from './raw_member_editor';
import { uiRawMembershipEditor } from './raw_membership_editor';
import { uiRawTagEditor } from './raw_tag_editor';
import { uiTagReference } from './tag_reference';
import { uiPresetBrowser } from './preset_browser';
import { uiPresetEditor } from './preset_editor';
import { uiEntityIssues } from './entity_issues';
import { uiSelectionList } from './selection_list';
import { utilCleanTags } from '../util';
import { uiViewOnOSM } from './view_on_osm';


export function uiEntityEditor(context) {
    var _state = 'select';
    var _coalesceChanges = false;
    var _modified = false;
    var _base;
    var _entityIDs;
    var _activePreset;
    var _tagReference;
    var _presetFavorite;
    var _newFeature;

    var selectionList = uiSelectionList(context);
    var entityIssues = uiEntityIssues(context);
    var presetEditor = uiPresetEditor(context).on('change', changeTags);
    var rawTagEditor = uiRawTagEditor(context).on('change', changeTags);
    var rawMemberEditor = uiRawMemberEditor(context);
    var rawMembershipEditor = uiRawMembershipEditor(context);
    var presetBrowser = uiPresetBrowser(context, [], choosePreset);

    function entityEditor(selection) {
        var entityID = singularEntityID();
        var entity = entityID && context.entity(entityID);
        var tags = entity && Object.assign({}, entity.tags);  // shallow copy

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

        function manageSection(klass, shouldHave, update, create) {
            var section = body.selectAll('.' + klass.split(' ')[0])
                .data(shouldHave ? [0] : []);

            section.exit().remove();

            var sectionEnter = section.enter()
                .append('div')
                .attr('class', klass);

            if (create && !sectionEnter.empty()) {
                create(sectionEnter);
            }

            section = sectionEnter
                .merge(section);

            if (update && !section.empty()) {
                update(section);
            }
        }

        manageSection('selection-list', _entityIDs.length > 1, function(section) {
            section
                .call(selectionList
                    .setSelectedIDs(_entityIDs)
                );
        });

        manageSection('preset-list-item inspector-inner', entityID, function(section) {

            if (_presetFavorite) {
                section.selectAll('.preset-list-button-wrap .accessory-buttons')
                    .call(_presetFavorite.button);
            }

            // update header
            if (_tagReference) {
                section.selectAll('.preset-list-button-wrap .accessory-buttons')
                    .call(_tagReference.button);

                section.selectAll('.preset-list-item')
                    .call(_tagReference.body);
            }

            section.selectAll('.preset-reset')
                .on('click', function() {
                    if (presetBrowser.isShown()) {
                        presetBrowser.hide();
                    } else {
                        presetBrowser.setAllowedGeometry([context.geometry(entityID)]);
                        presetBrowser.show();
                    }
                })
                .on('mousedown', function() {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                })
                .on('mouseup', function() {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                });

            section.select('.preset-list-item button')
                .call(uiPresetIcon(context)
                    .geometry(context.geometry(entityID))
                    .preset(_activePreset)
                    .pointMarker(false)
                );

            // NOTE: split on en-dash, not a hypen (to avoid conflict with hyphenated names)
            var label = section.select('.label-inner');
            var nameparts = label.selectAll('.namepart')
                .data(_activePreset.name().split(' – '), function(d) { return d; });

            nameparts.exit()
                .remove();

            nameparts
                .enter()
                .append('div')
                .attr('class', 'namepart')
                .text(function(d) { return d; });

        }, function(sectionEnter) {

            var presetButtonWrap = sectionEnter
                .append('div')
                .attr('class', 'preset-list-button-wrap');

            var presetButton = presetButtonWrap.append('button')
                .attr('class', 'preset-list-button preset-reset')
                .call(tooltip().title(t('inspector.back_tooltip')).placement('bottom'));

            presetButton
                .append('div')
                .attr('class', 'label')
                .append('div')
                .attr('class', 'label-inner');

            presetButtonWrap.append('div')
                .attr('class', 'accessory-buttons');

            // start with the preset browser open if the feature is new and untagged
            if (_newFeature && !entity.hasNonGeometryTags()) {
                presetBrowser.setAllowedGeometry([context.geometry(entityID)]);
                presetBrowser.show();
            }

            presetButtonWrap
                .call(presetBrowser.scrollContainer(body.select('.entity-editor')));
        });

        manageSection('entity-issues', entityID, function(section) {
            section
                .call(entityIssues
                    .entityID(entityID)
                );
        });

        manageSection('preset-editor', entityID, function(section) {
            section
                .call(presetEditor
                    .preset(_activePreset)
                    .entityID(entityID)
                    .tags(tags)
                    .state(_state)
                );
        });

        manageSection('raw-tag-editor inspector-inner', true, function(section) {
            section
                .call(rawTagEditor
                    .preset(_activePreset)
                    .entityIDs(_entityIDs)
                    .state(_state)
                );
        });

        manageSection('raw-member-editor inspector-inner', entity && entity.type === 'relation', function(section) {
            section
                .call(rawMemberEditor
                    .entityID(entityID)
                );
        });

        manageSection('raw-membership-editor inspector-inner', entityID, function(section) {
            section
                .call(rawMembershipEditor
                    .entityID(entityID)
                );
        });

        manageSection('key-trap-wrap', true, function(section) {
            section.select('key-trap')
                .on('keydown.key-trap', function() {
                // On tabbing, send focus back to the first field on the inspector-body
                // (probably the `name` field) #4159
                if (d3_event.keyCode === 9 && !d3_event.shiftKey) {
                    d3_event.preventDefault();
                    body.select('input').node().focus();
                }
            });
        }, function(sectionEnter) {
            sectionEnter
                .append('input')
                .attr('type', 'text')
                .attr('class', 'key-trap');
        });

        var footer = selection.selectAll('.inspector-footer')
            .data([0]);

        footer = footer.enter()
            .append('div')
            .attr('class', 'inspector-footer')
            .merge(footer);

        footer
            .call(uiViewOnOSM(context)
                .what(entityID && context.hasEntity(entityID))
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

            if (!_entityIDs.every(context.hasEntity)) return;

            loadActivePreset();

            var graph = context.graph();
            entityEditor.modified(_base !== graph);
            entityEditor(selection);
        }
    }

    function choosePreset(preset) {
        var entityID = singularEntityID();
        if (!entityID) return;

        context.perform(
            actionChangePreset(entityID, _activePreset, preset),
            t('operations.change_tags.annotation')
        );

        context.validator().validate();  // rerun validation
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
        if (_entityIDs === val) return entityEditor;  // exit early if no change

        _entityIDs = val;
        _base = context.graph();
        _coalesceChanges = false;

        loadActivePreset();

        return entityEditor
            .modified(false);
    };


    entityEditor.newFeature = function(val) {
        if (!arguments.length) return _newFeature;
        _newFeature = val;
        return entityEditor;
    };


    function singularEntityID() {
        if (_entityIDs.length === 1) {
            return _entityIDs[0];
        }
        return null;
    }


    function loadActivePreset() {
        var entityID = singularEntityID();
        var entity = entityID && context.hasEntity(entityID);
        if (!entity) return;

        var graph = context.graph();
        var match = context.presets().match(entity, graph);

        // A "weak" preset doesn't set any tags. (e.g. "Address")
        var weakPreset = _activePreset &&
            Object.keys(_activePreset.addTags || {}).length === 0;

        // Don't replace a weak preset with a fallback preset (e.g. "Point")
        if ((weakPreset && match.isFallback()) ||
            // don't reload for same preset
            match === _activePreset) return;

        _activePreset = match;
        _tagReference = uiTagReference(_activePreset.reference(context.geometry(entityID)), context)
            .showing(false);
        _presetFavorite = uiPresetFavoriteButton(_activePreset, context.geometry(entityID), context);
    }


    return entityEditor;
}
