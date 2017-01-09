import * as d3 from 'd3';
import _ from 'lodash';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { actionChangeTags } from '../actions/index';
import { modeBrowse } from '../modes/index';
import { svgIcon } from '../svg/index';
import { uiPresetIcon } from './preset_icon';
import { uiRawMemberEditor } from './raw_member_editor';
import { uiRawMembershipEditor } from './raw_membership_editor';
import { uiRawTagEditor } from './raw_tag_editor';
import { uiTagReference } from './tag_reference';
import { uiPreset } from './preset';
import { utilRebind } from '../util/rebind';

export function uiEntityEditor(context) {
    var dispatch = d3.dispatch('choose'),
        state = 'select',
        coalesceChanges = false,
        modified = false,
        base,
        id,
        activePreset,
        reference;

    var presetEditor = uiPreset(context)
        .on('change', changeTags);
    var rawTagEditor = uiRawTagEditor(context)
        .on('change', changeTags);


    function entityEditor(selection) {
        var entity = context.entity(id),
            tags = _.clone(entity.tags);

        // Header
        var header = selection.selectAll('.header')
            .data([0]);

        // Enter
        var enter = header.enter()
            .append('div')
            .attr('class', 'header fillL cf');

        enter
            .append('button')
            .attr('class', 'fl preset-reset preset-choose')
            .append('span')
            .html((textDirection === 'rtl') ? '&#9658;' : '&#9668;');

        enter
            .append('button')
            .attr('class', 'fr preset-close')
            .on('click', function() { context.enter(modeBrowse(context)); })
            .call(svgIcon(modified ? '#icon-apply' : '#icon-close'));

        enter
            .append('h3')
            .text(t('inspector.edit'));

        // Update
        header = header
            .merge(enter);

        header.selectAll('.preset-reset')
            .on('click', function() { dispatch.call('choose', this, activePreset); });


        // Body
        var body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter
        enter = body.enter()
            .append('div')
            .attr('class', 'inspector-body');

        enter
            .append('div')
            .attr('class', 'preset-list-item inspector-inner')
            .append('div')
            .attr('class', 'preset-list-button-wrap')
            .append('button')
            .attr('class', 'preset-list-button preset-reset')
            .call(tooltip().title(t('inspector.back_tooltip')).placement('bottom'))
            .append('div')
            .attr('class', 'label');

        enter
            .append('div')
            .attr('class', 'inspector-border inspector-preset');

        enter
            .append('div')
            .attr('class', 'inspector-border raw-tag-editor inspector-inner');

        enter
            .append('div')
            .attr('class', 'inspector-border raw-member-editor inspector-inner');

        enter
            .append('div')
            .attr('class', 'raw-membership-editor inspector-inner');

        // Update
        body = body
            .merge(enter);

        body.selectAll('.preset-list-button-wrap')
            .call(reference.button);

        body.selectAll('.preset-list-item')
            .call(reference.body);

        body.selectAll('.preset-reset')
            .on('click', function() { dispatch.call('choose', this, activePreset); });

        body.select('.preset-list-item button')
            .call(uiPresetIcon()
                .geometry(context.geometry(id))
                .preset(activePreset));

        body.select('.preset-list-item .label')
            .text(activePreset.name());

        body.select('.inspector-preset')
            .call(presetEditor
                .preset(activePreset)
                .entityID(id)
                .tags(tags)
                .state(state));

        body.select('.raw-tag-editor')
            .call(rawTagEditor
                .preset(activePreset)
                .entityID(id)
                .tags(tags)
                .state(state));

        if (entity.type === 'relation') {
            body.select('.raw-member-editor')
                .style('display', 'block')
                .call(uiRawMemberEditor(context)
                    .entityID(id));
        } else {
            body.select('.raw-member-editor')
                .style('display', 'none');
        }

        body.select('.raw-membership-editor')
            .call(uiRawMembershipEditor(context)
                .entityID(id));


        context.history()
            .on('change.entity-editor', historyChanged);


        function historyChanged() {
            if (state === 'hide') return;

            var entity = context.hasEntity(id),
                graph = context.graph();
            if (!entity) return;

            entityEditor.preset(context.presets().match(entity, graph));
            entityEditor.modified(base !== graph);
            entityEditor(selection);
        }
    }


    function clean(o) {

        function cleanVal(k, v) {
            function keepSpaces(k) {
                var whitelist = ['opening_hours', 'service_times', 'collection_times',
                    'operating_times', 'smoking_hours', 'happy_hours'];
                return _.some(whitelist, function(s) { return k.indexOf(s) !== -1; });
            }

            var blacklist = ['description', 'note', 'fixme'];
            if (_.some(blacklist, function(s) { return k.indexOf(s) !== -1; })) return v;

            var cleaned = v.split(';')
                .map(function(s) { return s.trim(); })
                .join(keepSpaces(k) ? '; ' : ';');

            // The code below is not intended to validate websites and emails.
            // It is only intended to prevent obvious copy-paste errors. (#2323)

            // clean website- and email-like tags
            if (k.indexOf('website') !== -1 ||
                k.indexOf('email') !== -1 ||
                cleaned.indexOf('http') === 0) {
                cleaned = cleaned
                    .replace(/[\u200B-\u200F\uFEFF]/g, '');  // strip LRM and other zero width chars

            }

            return cleaned;
        }

        var out = {}, k, v;
        for (k in o) {
            if (k && (v = o[k]) !== undefined) {
                out[k] = cleanVal(k, v);
            }
        }
        return out;
    }


    // Tag changes that fire on input can all get coalesced into a single
    // history operation when the user leaves the field.  #2342
    function changeTags(changed, onInput) {
        var entity = context.entity(id),
            annotation = t('operations.change_tags.annotation'),
            tags = _.clone(entity.tags);

        _.forEach(changed, function(v, k) {
            if (v !== undefined || tags.hasOwnProperty(k)) {
                tags[k] = v;
            }
        });

        if (!onInput) {
            tags = clean(tags);
        }

        if (!_.isEqual(entity.tags, tags)) {
            if (coalesceChanges) {
                context.overwrite(actionChangeTags(id, tags), annotation);
            } else {
                context.perform(actionChangeTags(id, tags), annotation);
                coalesceChanges = !!onInput;
            }
        }
    }


    entityEditor.modified = function(_) {
        if (!arguments.length) return modified;
        modified = _;
        d3.selectAll('button.preset-close use')
            .attr('xlink:href', (modified ? '#icon-apply' : '#icon-close'));
    };


    entityEditor.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return entityEditor;
    };


    entityEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        base = context.graph();
        entityEditor.preset(context.presets().match(context.entity(id), base));
        entityEditor.modified(false);
        coalesceChanges = false;
        return entityEditor;
    };


    entityEditor.preset = function(_) {
        if (!arguments.length) return activePreset;
        if (_ !== activePreset) {
            activePreset = _;
            reference = uiTagReference(activePreset.reference(context.geometry(id)), context)
                .showing(false);
        }
        return entityEditor;
    };


    return utilRebind(entityEditor, dispatch, 'on');
}
