import { t } from '../util/locale';
import _ from 'lodash';
import { Browse } from '../modes/index';
import { ChangeTags } from '../actions/index';
import { Icon } from '../svg/index';
import { PresetIcon } from './preset_icon';
import { RawMemberEditor } from './raw_member_editor';
import { RawMembershipEditor } from './raw_membership_editor';
import { RawTagEditor } from './raw_tag_editor';
import { TagReference } from './tag_reference';
import { preset } from './preset';

export function EntityEditor(context) {
    var dispatch = d3.dispatch('choose'),
        state = 'select',
        coalesceChanges = false,
        modified = false,
        base,
        id,
        activePreset,
        reference;

    var presetEditor = preset(context)
        .on('change', changeTags);
    var rawTagEditor = RawTagEditor(context)
        .on('change', changeTags);

    function entityEditor(selection) {
        var entity = context.entity(id),
            tags = _.clone(entity.tags);

        var $header = selection.selectAll('.header')
            .data([0]);

        // Enter
        var $enter = $header.enter().append('div')
            .attr('class', 'header fillL cf');

        $enter.append('button')
            .attr('class', 'fl preset-reset preset-choose')
            .append('span')
            .html('&#9668;');

        $enter.append('button')
            .attr('class', 'fr preset-close')
            .call(Icon(modified ? '#icon-apply' : '#icon-close'));

        $enter.append('h3');

        // Update
        $header.select('h3')
            .text(t('inspector.edit'));

        $header.select('.preset-close')
            .on('click', function() {
                context.enter(Browse(context));
            });

        var $body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter
        $enter = $body.enter().append('div')
            .attr('class', 'inspector-body');

        $enter.append('div')
            .attr('class', 'preset-list-item inspector-inner')
            .append('div')
            .attr('class', 'preset-list-button-wrap')
            .append('button')
            .attr('class', 'preset-list-button preset-reset')
            .call(bootstrap.tooltip()
                .title(t('inspector.back_tooltip'))
                .placement('bottom'))
            .append('div')
            .attr('class', 'label');

        $body.select('.preset-list-button-wrap')
            .call(reference.button);

        $body.select('.preset-list-item')
            .call(reference.body);

        $enter.append('div')
            .attr('class', 'inspector-border inspector-preset');

        $enter.append('div')
            .attr('class', 'inspector-border raw-tag-editor inspector-inner');

        $enter.append('div')
            .attr('class', 'inspector-border raw-member-editor inspector-inner');

        $enter.append('div')
            .attr('class', 'raw-membership-editor inspector-inner');

        selection.selectAll('.preset-reset')
            .on('click', function() {
                dispatch.choose(activePreset);
            });

        // Update
        $body.select('.preset-list-item button')
            .call(PresetIcon()
                .geometry(context.geometry(id))
                .preset(activePreset));

        $body.select('.preset-list-item .label')
            .text(activePreset.name());

        $body.select('.inspector-preset')
            .call(presetEditor
                .preset(activePreset)
                .entityID(id)
                .tags(tags)
                .state(state));

        $body.select('.raw-tag-editor')
            .call(rawTagEditor
                .preset(activePreset)
                .entityID(id)
                .tags(tags)
                .state(state));

        if (entity.type === 'relation') {
            $body.select('.raw-member-editor')
                .style('display', 'block')
                .call(RawMemberEditor(context)
                    .entityID(id));
        } else {
            $body.select('.raw-member-editor')
                .style('display', 'none');
        }

        $body.select('.raw-membership-editor')
            .call(RawMembershipEditor(context)
                .entityID(id));

        function historyChanged() {
            if (state === 'hide') return;

            var entity = context.hasEntity(id),
                graph = context.graph();
            if (!entity) return;

            entityEditor.preset(context.presets().match(entity, graph));
            entityEditor.modified(base !== graph);
            entityEditor(selection);
        }

        context.history()
            .on('change.entity-editor', historyChanged);
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
            tags = _.extend({}, entity.tags, changed);

        if (!onInput) {
            tags = clean(tags);
        }
        if (!_.isEqual(entity.tags, tags)) {
            if (coalesceChanges) {
                context.overwrite(ChangeTags(id, tags), annotation);
            } else {
                context.perform(ChangeTags(id, tags), annotation);
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
            reference = TagReference(activePreset.reference(context.geometry(id)), context)
                .showing(false);
        }
        return entityEditor;
    };

    return d3.rebind(entityEditor, dispatch, 'on');
}
