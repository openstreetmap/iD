import _clone from 'lodash-es/clone';
import _isEmpty from 'lodash-es/isEmpty';
import _isEqual from 'lodash-es/isEqual';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    selectAll as d3_selectAll
} from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { actionChangeTags } from '../actions';
import { modeBrowse } from '../modes';
import { svgIcon } from '../svg';
import { uiPresetFavorite } from './preset_favorite';
import { uiPresetIcon } from './preset_icon';
import { uiQuickLinks } from './quick_links';
import { uiRawMemberEditor } from './raw_member_editor';
import { uiRawMembershipEditor } from './raw_membership_editor';
import { uiRawTagEditor } from './raw_tag_editor';
import { uiTagReference } from './tag_reference';
import { uiPresetEditor } from './preset_editor';
import { uiEntityIssues } from './entity_issues';
import { uiTooltipHtml } from './tooltipHtml';
import { utilCleanTags, utilRebind } from '../util';


export function uiEntityEditor(context) {
    var dispatch = d3_dispatch('choose');
    var _state = 'select';
    var _coalesceChanges = false;
    var _modified = false;
    var _base;
    var _entityID;
    var _activePreset;
    var _tagReference;
    var _presetFavorite;

    var entityIssues = uiEntityIssues(context);
    var quickLinks = uiQuickLinks();
    var presetEditor = uiPresetEditor(context).on('change', changeTags);
    var rawTagEditor = uiRawTagEditor(context).on('change', changeTags);
    var rawMemberEditor = uiRawMemberEditor(context);
    var rawMembershipEditor = uiRawMembershipEditor(context);

    function entityEditor(selection) {
        var entity = context.entity(_entityID);
        var tags = _clone(entity.tags);

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
            .append('h3')
            .text(t('inspector.edit'));

        // Update
        header = header
            .merge(headerEnter);

        header.selectAll('.preset-reset')
            .on('click', function() {
                dispatch.call('choose', this, _activePreset);
            });


        // Body
        var body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter
        var bodyEnter = body.enter()
            .append('div')
            .attr('class', 'inspector-body');

        bodyEnter
            .append('div')
            .attr('class', 'preset-list-item inspector-inner')
            .append('div')
            .attr('class', 'preset-list-button-wrap')
            .append('button')
            .attr('class', 'preset-list-button preset-reset')
            .call(tooltip().title(t('inspector.back_tooltip')).placement('bottom'))
            .append('div')
            .attr('class', 'label')
            .append('div')
            .attr('class', 'label-inner');

        bodyEnter
            .append('div')
            .attr('class', 'preset-quick-links');

        bodyEnter
            .append('div')
            .attr('class', 'entity-issues');

        bodyEnter
            .append('div')
            .attr('class', 'preset-editor');

        bodyEnter
            .append('div')
            .attr('class', 'raw-tag-editor inspector-inner');

        bodyEnter
            .append('div')
            .attr('class', 'raw-member-editor inspector-inner');

        bodyEnter
            .append('div')
            .attr('class', 'raw-membership-editor inspector-inner');

        bodyEnter
            .append('input')
            .attr('type', 'text')
            .attr('class', 'key-trap');


        // Update
        body = body
            .merge(bodyEnter);

        if (_presetFavorite) {
            body.selectAll('.preset-list-button-wrap')
                .call(_presetFavorite.button);
        }

        // update header
        if (_tagReference) {
            body.selectAll('.preset-list-button-wrap')
                .call(_tagReference.button);

            body.selectAll('.preset-list-item')
                .call(_tagReference.body);
        }

        body.selectAll('.preset-reset')
            .on('click', function() {
                dispatch.call('choose', this, _activePreset);
            });

        body.select('.preset-list-item button')
            .call(uiPresetIcon()
                .geometry(context.geometry(_entityID))
                .preset(_activePreset)
            );

        // NOTE: split on en-dash, not a hypen (to avoid conflict with hyphenated names)
        var label = body.select('.label-inner');
        var nameparts = label.selectAll('.namepart')
            .data(_activePreset.name().split(' – '), function(d) { return d; });

        nameparts.exit()
            .remove();

        nameparts
            .enter()
            .append('div')
            .attr('class', 'namepart')
            .text(function(d) { return d; });

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

        body.select('.preset-quick-links')
            .call(quickLinks.choices(choices));


        // update editor sections
        body.select('.entity-issues')
            .call(entityIssues
                .entityID(_entityID)
            );

        body.select('.preset-editor')
            .call(presetEditor
                .preset(_activePreset)
                .entityID(_entityID)
                .tags(tags)
                .state(_state)
            );

        body.select('.raw-tag-editor')
            .call(rawTagEditor
                .preset(_activePreset)
                .entityID(_entityID)
                .tags(tags)
                .state(_state)
            );

        if (entity.type === 'relation') {
            body.select('.raw-member-editor')
                .style('display', 'block')
                .call(rawMemberEditor
                    .entityID(_entityID)
                );
        } else {
            body.select('.raw-member-editor')
                .style('display', 'none');
        }

        body.select('.raw-membership-editor')
            .call(rawMembershipEditor
                .entityID(_entityID)
            );

        body.select('.key-trap')
            .on('keydown.key-trap', function() {
                // On tabbing, send focus back to the first field on the inspector-body
                // (probably the `name` field) #4159
                if (d3_event.keyCode === 9 && !d3_event.shiftKey) {
                    d3_event.preventDefault();
                    body.select('input').node().focus();
                }
            });

        context.history()
            .on('change.entity-editor', historyChanged);


        function historyChanged() {
            if (_state === 'hide') return;

            var entity = context.hasEntity(_entityID);
            var graph = context.graph();
            if (!entity) return;

            var match = context.presets().match(entity, graph);
            var activePreset = entityEditor.preset();
            var weakPreset = activePreset && _isEmpty(activePreset.addTags);

            // A "weak" preset doesn't set any tags. (e.g. "Address")
            // Don't replace a weak preset with a fallback preset (e.g. "Point")
            if (!(weakPreset && match.isFallback())) {
                entityEditor.preset(match);
            }
            entityEditor.modified(_base !== graph);
            entityEditor(selection);
        }
    }


    // Tag changes that fire on input can all get coalesced into a single
    // history operation when the user leaves the field.  #2342
    function changeTags(changed, onInput) {
        var entity = context.entity(_entityID);
        var annotation = t('operations.change_tags.annotation');
        var tags = _clone(entity.tags);

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

        if (!_isEqual(entity.tags, tags)) {
            if (_coalesceChanges) {
                context.overwrite(actionChangeTags(_entityID, tags), annotation);
            } else {
                context.perform(actionChangeTags(_entityID, tags), annotation);
                _coalesceChanges = !!onInput;
            }
        }
    }


    entityEditor.modified = function(val) {
        if (!arguments.length) return _modified;
        _modified = val;
        d3_selectAll('button.preset-close use')
            .attr('xlink:href', (_modified ? '#iD-icon-apply' : '#iD-icon-close'));
        return entityEditor;
    };


    entityEditor.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        return entityEditor;
    };


    entityEditor.entityID = function(val) {
        if (!arguments.length) return _entityID;
        _entityID = val;
        _base = context.graph();
        _coalesceChanges = false;

        // reset the scroll to the top of the inspector
        var body = d3_selectAll('.entity-editor-pane .inspector-body');
        if (!body.empty()) {
            body.node().scrollTop = 0;
        }

        var presetMatch = context.presets().match(context.entity(_entityID), _base);

        return entityEditor
            .preset(presetMatch)
            .modified(false);
    };


    entityEditor.preset = function(val) {
        if (!arguments.length) return _activePreset;
        if (val !== _activePreset) {
            _activePreset = val;
            _tagReference = uiTagReference(_activePreset.reference(context.geometry(_entityID)), context)
                .showing(false);
            _presetFavorite = uiPresetFavorite(_activePreset, context.geometry(_entityID), context);
        }
        return entityEditor;
    };


    return utilRebind(entityEditor, dispatch, 'on');
}
