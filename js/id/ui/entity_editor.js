iD.ui.EntityEditor = function(context, entity) {
    var event = d3.dispatch('choose', 'close'),
        presets = context.presets(),
        id = entity.id,
        tags = _.clone(entity.tags),
        preset,
        selection_,
        presetUI,
        rawTagEditor,
        rawMemberEditor,
        rawMembershipEditor;

    function update() {
        var entity = context.hasEntity(id);
        if (!entity) return;

        tags = _.clone(entity.tags);

        // change preset if necessary (undos/redos)
        var newmatch = presets.match(entity, context.graph());
        if (newmatch !== preset) {
            entityEditor(selection_, newmatch);
            return;
        }

        presetUI.change(tags);
        rawTagEditor.tags(tags);
        if (rawMemberEditor) rawMemberEditor.change();
        rawMembershipEditor.change();
    }

    function entityEditor(selection, newpreset) {
        selection_ = selection;
        var geometry = entity.geometry(context.graph());

        if (!preset) preset = presets.match(entity, context.graph());

        // preset was explicitly chosen
        if (newpreset) {
            tags = preset.removeTags(tags, geometry);

            newpreset.applyTags(tags, geometry);
            preset = newpreset;
        }

        selection
            .datum(preset)
            .html('');

        var messagewrap = selection.append('div')
            .attr('class', 'header fillL cf');

        messagewrap.append('button')
            .attr('class', 'preset-reset fl ')
            .on('click', function() {
                event.choose(preset);
            })
            .append('span')
            .attr('class', 'icon back');

        messagewrap.append('h3')
            .attr('class', 'inspector-inner')
            .text(t('inspector.editing_feature', { feature: preset.name() }));

        messagewrap.append('button')
            .attr('class', 'preset-close fr')
            .on('click', event.close)
            .append('span')
            .attr('class', 'icon close');

        var editorwrap = selection.append('div')
            .attr('class', 'tag-wrap inspector-body fillL2');

        editorwrap.append('div')
            .attr('class', 'col12 inspector-inner preset-icon-wrap')
            .append('div')
            .attr('class','fillL')
            .call(iD.ui.PresetIcon(context.geometry(entity.id)));

        presetUI = iD.ui.preset(context, entity, preset)
            .on('change', changeTags)
            .on('close', event.close);

        var tageditorpreset = editorwrap.append('div')
            .attr('class', 'inspector-preset cf fillL col12')
            .call(presetUI);

        rawTagEditor = iD.ui.RawTagEditor(context, entity)
            .on('change', changeTags);

        editorwrap.append('div')
            .attr('class', 'inspector-inner raw-tag-editor col12')
            .call(rawTagEditor, preset.id === 'other');

        if (entity.type === 'relation') {
            rawMemberEditor = iD.ui.RawMemberEditor(context, entity);

            editorwrap.append('div')
                .attr('class', 'inspector-inner raw-membership-editor col12')
                .call(rawMemberEditor);
        }

        rawMembershipEditor = iD.ui.RawMembershipEditor(context, entity);

        editorwrap.append('div')
            .attr('class', 'inspector-inner raw-membership-editor col12')
            .call(rawMembershipEditor);

        if (!entity.isNew()) {
            var osmLink = tageditorpreset.append('div')
                .attr('class', 'col12 inspector-inner')
                .append('a')
                .attr('href', context.connection().entityURL(entity))
                .attr('target', '_blank');

            osmLink.append('span')
                .attr('class','icon icon-pre-text out-link');

            osmLink.append('span').text(t('inspector.view_on_osm'));
        }

        presetUI.change(tags);
        rawTagEditor.tags(tags);

        changeTags();

        context.history()
            .on('change.entity-editor', update);
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
        tags = clean(_.extend(tags, changed));
        var entity = context.hasEntity(id);
        if (entity && !_.isEqual(entity.tags, tags)) {
            context.perform(
                iD.actions.ChangeTags(entity.id, tags),
                t('operations.change_tags.annotation'));
        }
    }

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
