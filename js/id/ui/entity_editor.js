iD.ui.EntityEditor = function(context) {
    var event = d3.dispatch('choose'),
        id,
        preset;

    function entityEditor(selection) {
        var entity = context.entity(id),
            tags = _.clone(entity.tags);

        var $header = selection.selectAll('.header')
            .data([0]);

        // Enter

        var $enter = $header.enter().append('div')
            .attr('class', 'header fillL cf');

        $enter.append('button')
            .attr('class', 'preset-reset fl ')
            .append('span')
            .attr('class', 'icon back');

        $enter.append('h3')
            .attr('class', 'inspector-inner');

        $enter.append('button')
            .attr('class', 'preset-close fr')
            .append('span')
            .attr('class', 'icon close');

        // Update

        $header.select('h3')
            .text(t('inspector.editing_feature', {feature: preset.name()}));

        $header.select('.preset-reset')
            .on('click', function() {
                event.choose(preset);
            });

        $header.select('.preset-close')
            .on('click', function() {
                context.enter(iD.modes.Browse(context));
            });

        var $body = selection.selectAll('.inspector-body')
            .data([0]);

        // Enter

        $enter = $body.enter().append('div')
            .attr('class', 'tag-wrap inspector-body fillL2');

        $enter.append('div')
            .attr('class', 'preset-icon-wrap inspector-inner col12')
            .append('div')
            .attr('class', 'fillL');

        $enter.append('div')
            .attr('class', 'inspector-preset cf fillL col12');

        $enter.append('div')
            .attr('class', 'raw-tag-editor inspector-inner col12');

        $enter.append('div')
            .attr('class', 'raw-member-editor inspector-inner col12');

        $enter.append('div')
            .attr('class', 'raw-membership-editor inspector-inner col12');

        $enter.append('div')
            .attr('class', 'inspector-external-links inspector-inner col12');

        // Update

        $body.select('.preset-icon-wrap .fillL')
            .call(iD.ui.PresetIcon()
                .geometry(context.geometry(id))
                .preset(preset));

        $body.select('.inspector-preset')
            .call(iD.ui.preset(context)
                .preset(preset)
                .entityID(id)
                .tags(tags)
                .on('change', changeTags));

        $body.select('.raw-tag-editor')
            .call(iD.ui.RawTagEditor(context)
                .preset(preset)
                .entityID(id)
                .tags(tags)
                .on('change', changeTags));

        if (entity.type === 'relation') {
            $body.select('.raw-member-editor')
                .style('display', 'block')
                .call(iD.ui.RawMemberEditor(context)
                    .entityID(id));
        } else {
            $body.select('.raw-member-editor')
                .style('display', 'none')
        }

        $body.select('.raw-membership-editor')
            .call(iD.ui.RawMembershipEditor(context)
                .entityID(id));

        $body.select('.inspector-external-links')
            .call(iD.ui.ViewOnOSM(context)
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
        var out = {};
        for (var k in o) {
            var v = o[k].trim();
            if (v) out[k] = v;
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

    entityEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        preset = context.presets().match(context.entity(id), context.graph());
        return entityEditor;
    };

    entityEditor.preset = function(_) {
        if (!arguments.length) return preset;

        var entity = context.entity(id),
            geometry = context.geometry(id),
            tags = preset.removeTags(entity.tags, geometry);

        preset = _;
        tags = preset.applyTags(tags, geometry);

        context.perform(
            iD.actions.ChangeTags(id, tags),
            t('operations.change_tags.annotation'));

        return entityEditor;
    };

    entityEditor.close = function() {
        // Blur focused element so that tag changes are dispatched
        // See #1295
        document.activeElement.blur();

        // Firefox incorrectly implements blur, so typeahead elements
        // are not correctly removed. Remove any stragglers manually.
        d3.selectAll('div.typeahead').remove();

        context.history()
            .on('change.entity-editor', null);
    };

    return d3.rebind(entityEditor, event, 'on');
};
