iD.ui.TagEditor = function(context, entity) {
    var event = d3.dispatch('changeTags', 'choose', 'close'),
        presets = context.presets(),
        tags,
        preset,
        selection_,
        presetUI,
        tagList;

    function tageditor(selection, newpreset) {
        selection_ = selection;
        var geometry = entity.geometry(context.graph());

        if (!preset) preset = presets.match(entity, context.graph());

        // preset was explicitly chosen
        if (newpreset) {
            tags = preset.removeTags(tags, geometry);

            newpreset.applyTags(tags, geometry);
            preset = newpreset;
        }

        selection.html('');

        var messagewrap = selection.append('div')
            .attr('class', 'header fillL cf');

        var back = messagewrap.append('button')
            .attr('class', 'preset-reset fl ' + geometry)
            .on('click', function() {
                event.choose(preset);
            });

        var icon = preset.icon || (geometry === 'line' ? 'other-line' : 'marker-stroked');

        back.append('div')
            .attr('class', 'col12')
            .append('span')
            .attr('class', 'preset-icon icon feature-' + icon);

        back.append('div')
            .attr('class', 'col12')
            .append('span')
            .attr('class', 'icon back');

        messagewrap.append('h3')
            .attr('class', 'inspector-inner fl')
            .text(t('inspector.editing_feature', { feature: preset.name() }));

        messagewrap.append('button')
            .attr('class', 'preset-close fr')
            .on('click', event.close)
            .append('span')
            .attr('class', 'icon close');

        var editorwrap = selection.append('div')
            .attr('class', 'tag-wrap inspector-body fillL2 inspector-body-' + geometry);

        presetUI = iD.ui.preset(context, entity)
            .preset(preset)
            .on('change', changeTags)
            .on('close', event.close);

        tagList = iD.ui.Taglist(context, entity)
            .on('change', changeTags);

        var tageditorpreset = editorwrap.append('div')
            .attr('class', 'inspector-preset cf fillL col12')
            .call(presetUI);

        editorwrap.append('div')
            .attr('class', 'inspector-inner col12 fillL2 additional-tags')
            .call(tagList, preset.id === 'other');

        if (!entity.isNew()) {
            tageditorpreset.append('div')
                .attr('class', 'view-on-osm')
                .append('a')
                .attr('href', 'http://www.openstreetmap.org/browse/' + entity.type + '/' + entity.osmId())
                .attr('target', '_blank')
                .text(t('inspector.view_on_osm'));
        }

        tageditor.tags(tags);
        changeTags();
    }

    function clean(o) {
        var out = {};
        for (var k in o) {
            if (o[k] && o[k] !== '') out[k] = o[k];
        }
        return out;
    }

    function changeTags(changed) {
        tags = clean(_.extend(tags, changed));
        event.changeTags(_.clone(tags));
    }

    tageditor.tags = function(newtags) {
        tags = _.clone(newtags);
        if (presetUI && tagList) {

            // change preset if necessary (undos/redos)
            var newmatch = presets
                .matchGeometry(entity, context.graph())
                .matchTags(entity.update({ tags: tags }));
            if (newmatch !== preset) {
                return tageditor(selection_, newmatch);
            }

            presetUI.change(tags);
            var rendered = []
                .concat(Object.keys(preset.tags))
                .concat(presetUI.rendered());
            tagList.tags(_.omit(tags, rendered));
        }
        return tageditor;
    };

    return d3.rebind(tageditor, event, 'on');
};
