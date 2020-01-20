import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event, selectAll as d3_selectAll, select as d3_select } from 'd3-selection';
import deepEqual from 'fast-deep-equal';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { actionChangeTags } from '../actions/change_tags';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';
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
import { utilCleanTags, utilRebind } from '../util';


export function uiEntityEditor(context) {
    var dispatch = d3_dispatch('choose');
    var _state = 'select';
    var _coalesceChanges = false;
    var _modified = false;
    var _base;
    var _entityIDs;
    var _activePreset;
    var _tagReference;
    var _newFeature;

    var selectionList = uiSelectionList(context);
    var entityIssues = uiEntityIssues(context);
    var quickLinks = uiQuickLinks();
    var presetEditor = uiPresetEditor(context).on('change', changeTags);
    var rawTagEditor = uiRawTagEditor(context).on('change', changeTags);
    var rawMemberEditor = uiRawMemberEditor(context);
    var rawMembershipEditor = uiRawMembershipEditor(context);

    function entityEditor(selection) {
        var entityID = singularEntityID();
        var entity = entityID && context.entity(entityID);
        var tags = entity && Object.assign({}, entity.tags);  // shallow copy

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
            .text(entityID ? t('inspector.edit') : t('inspector.edit_features'));

        header.selectAll('.preset-reset')
            .style('display', entityID ? null : 'none')
            .on('click', function() {
                dispatch.call('choose', this, _activePreset);
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
                shouldHave: entityID,
                create: function(sectionEnter) {

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

                    // update quick links
                    var choices = [{
                        id: 'zoom_to',
                        label: 'inspector.zoom_to.title',
                        tooltip: function() {
                            return uiTooltipHtml(t('inspector.zoom_to.tooltip_feature'), t('inspector.zoom_to.key'));
                        },
                        click: function zoomTo() {
                            context.mode().zoomToSelected();
                        }
                    }];

                    sectionEnter
                        .append('div')
                        .attr('class', 'preset-quick-links')
                        .call(quickLinks.choices(choices));
                },
                update: function(section) {

                    // update header
                    if (_tagReference) {
                        section.selectAll('.preset-list-button-wrap .accessory-buttons')
                            .call(_tagReference.button);

                        section.selectAll('.preset-list-item')
                            .call(_tagReference.body);
                    }

                    section.selectAll('.preset-reset')
                        .on('click', function() {
                             dispatch.call('choose', this, _activePreset);
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

                }
            }, {
                klass: 'entity-issues',
                shouldHave: entityID,
                update: function(section) {
                    section
                        .call(entityIssues
                            .entityID(entityID)
                        );
                }
            }, {
                klass: 'preset-editor',
                shouldHave: entityID,
                update: function(section) {
                    section
                        .call(presetEditor
                            .preset(_activePreset)
                            .entityID(entityID)
                            .tags(tags)
                            .state(_state)
                        );
                }
            }, {
                klass: 'raw-tag-editor inspector-inner',
                shouldHave: true,
                update: function(section) {
                    section
                        .call(rawTagEditor
                            .preset(_activePreset)
                            .entityIDs(_entityIDs)
                            .state(_state)
                        );
                }
            }, {
                klass: 'raw-member-editor inspector-inner',
                shouldHave: entity && entity.type === 'relation',
                update: function(section) {
                    section
                        .call(rawMemberEditor
                            .entityID(entityID)
                        );
                }
            }, {
                klass: 'raw-membership-editor inspector-inner',
                shouldHave: entityID,
                update: function(section) {
                    section
                        .call(rawMembershipEditor
                            .entityID(entityID)
                        );
                }
            }, {
                klass: 'key-trap-wrap',
                shouldHave: true,
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
            return info.shouldHave;
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

            loadActivePreset();

            var graph = context.graph();
            entityEditor.modified(_base !== graph);
            entityEditor(selection);
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

        if (_activePreset && match.id !== _activePreset.id) {
            // flash the button to indicate the preset changed
            d3_selectAll('.entity-editor button.preset-reset .label')
                .style('background-color', '#fff')
                .transition()
                .duration(500)
                .style('background-color', null);
        }

        entityEditor.preset(match);
    }

    entityEditor.preset = function(val) {
        if (!arguments.length) return _activePreset;
        if (val !== _activePreset) {
            _activePreset = val;
            var entityID = singularEntityID();
            if (entityID) {
                _tagReference = uiTagReference(_activePreset.reference(context.geometry(entityID)), context)
                    .showing(false);
            }
        }
        return entityEditor;
    };


    return utilRebind(entityEditor, dispatch, 'on');
}
