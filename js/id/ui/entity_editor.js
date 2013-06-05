iD.ui.EntityEditor = function(context) {
    var event = d3.dispatch('choose'),
        state = 'select',
        id,
        preset;

    var rawTagEditor = iD.ui.RawTagEditor(context)
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
            .attr('class', 'fl preset-reset')
            .append('span')
            .attr('class', 'icon back');

        $enter.append('button')
            .attr('class', 'fr preset-close')
            .append('span')
            .attr('class', 'icon close');

        $enter.append('h3');

        // Update

        $header.select('h3')
            .text(preset.name());

        $header.select('.preset-close')
            .on('click', function() {
                context.enter(iD.modes.Browse(context));
            });

        var $body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter

        $enter = $body.enter().append('div')
            .attr('class', 'inspector-body');

        $enter.append('div')
            .attr('class', 'preset-icon-wrap inspector-inner')
            .append('button')
            .attr('class', 'preset-reset preset-icon-button')
            .call(bootstrap.tooltip()
                .title(t('inspector.back_tooltip'))
                .placement('right'));

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
                event.choose(preset);
            });

        // Update

        $body.select('.preset-icon-wrap button')
            .call(iD.ui.PresetIcon()
                .geometry(context.geometry(id))
                .preset(preset));

        $body.select('.inspector-preset')
            .call(iD.ui.preset(context)
                .preset(preset)
                .entityID(id)
                .tags(tags)
                .state(state)
                .on('change', changeTags));

        $body.select('.raw-tag-editor')
            .call(rawTagEditor
                .preset(preset)
                .entityID(id)
                .tags(tags)
                .state(state));

        if (entity.type === 'relation') {
            $body.select('.raw-member-editor')
                .style('display', 'block')
                .call(iD.ui.RawMemberEditor(context)
                    .entityID(id));
        } else {
            $body.select('.raw-member-editor')
                .style('display', 'none');
        }

        $body.select('.raw-membership-editor')
            .call(iD.ui.RawMembershipEditor(context)
                .entityID(id));

        function historyChanged() {
            var entity = context.hasEntity(id);
            if (!entity) return;
            preset = context.presets().match(entity, context.graph());
            entityEditor(selection);
        }

        context.history()
            .on('change.entity-editor', historyChanged);
    }

    function clean(o) {
        var out = {}, k, v;
        for (k in o) {
            if (k && (v = o[k]) !== undefined) {
                out[k] = v.trim();
            }
        }
        return out;
    }

    function changeTags(changed) {
        var entity = context.entity(id),
            tags = clean(_.extend({}, entity.tags, changed));

        if (!_.isEqual(entity.tags, tags)) {
            context.perform(
                iD.actions.ChangeTags(id, tags),
                t('operations.change_tags.annotation'));
        }
    }

    entityEditor.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return entityEditor;
    };

    entityEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        preset = context.presets().match(context.entity(id), context.graph());
        return entityEditor;
    };

    entityEditor.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return entityEditor;
    };

    return d3.rebind(entityEditor, event, 'on');
};
