iD.ui.TagEditor = function(context) {
    var event = d3.dispatch('changeTags', 'choose', 'close'),
        presets = context.presets(),
        entity,
        tags,
        name,
        preset,
        selection_,
        presetUI,
        tagList;

    function tageditor(selection, newpreset) {

        entity = selection.datum();
        selection_ = selection;
        geometry = entity.geometry(context.graph());

        // preset was explicitly chosen
        if (newpreset) {
            if (preset) {
                tags = preset.removeTags(tags, geometry);
            }

            newpreset.applyTags(tags, geometry);
            preset = newpreset;

        // find a preset that best fits
        } else if (!preset) {
            preset = presets.matchType(entity, context.graph()).matchTags(entity);
        }

        selection.html('');

        var messagewrap = selection.append('div')
            .attr('class', 'message inspector-inner fillL');

        var message = messagewrap.append('h3')
            .text(t('inspector.choose'));

        var editorwrap = selection.append('div')
            .attr('class', 'tag-wrap inspector-body ' + entity.geometry(context.graph()));

        var headerwrap = editorwrap.append('div').attr('class','col12 inspector-inner head');

        var typewrap = headerwrap.append('div')
            .attr('class','col3 type');

        var typebutton = typewrap.append('button')
            .attr('class','col12')
            .on('click', function() {
                event.choose();
            });

        typebutton.append('div')
            .attr('class', 'icon icon-pre-text' + (preset ?  ' preset-' + preset.icon : ''));

        typebutton.node().focus();

         var namewrap = headerwrap.append('div')
             .attr('class', 'name col9');

        typebutton.append('span')
            .attr('class','label')
            .text(preset.name);

        namewrap.append('h4').text(t('inspector.name'));

        name = namewrap.append('input')
            .attr('placeholder', 'unknown')
            .attr('class', 'major')
            .attr('type', 'text')
            .property('value', entity.tags.name || '')
            .on('blur', function() {
                event.changeTags();
            });

        presetUI = iD.ui.preset(context)
            .entity(entity)
            .on('change', function() {
                event.changeTags();
            });

        tagList = iD.ui.Taglist(context)
            .on('change', function() {
                event.changeTags();
            });

        var tageditorpreset = editorwrap.append('div')
            .attr('class', 'inspector-preset');

        if (preset) {
            tageditorpreset.call(presetUI
                .preset(preset));
        }

        message.text(t('inspector.editing', { type: preset.name }));

        editorwrap.append('div')
            .attr('class','inspector-inner col12 fillL2').call(tagList, preset.name === 'other');

        selection.append('div')
            .attr('class', 'inspector-actions pad1 fillD col12')
            .call(drawButtons);

        tageditor.tags(tags);

        event.changeTags();
    }

    function apply() {
        event.changeTags();
        event.close();
    }

    function drawButtons(selection) {

        var inspectorButton = selection.append('button')
            .attr('class', 'apply action')
            .on('click', apply);

        inspectorButton.append('span')
            .attr('class','label')
            .text(t('inspector.okay'));

        var minorButtons = selection.append('div')
            .attr('class','minor-buttons fl');

        // Don't add for created entities
        if (entity.osmId() > 0) {
            minorButtons.append('a')
                .attr('href', 'http://www.openstreetmap.org/browse/' + entity.type + '/' + entity.osmId())
                .attr('target', '_blank')
                .text(t('inspector.view_on_osm'));
        }
    }

    tageditor.tags = function(newtags) {
        if (!arguments.length) {
            tags = _.extend(presetUI.tags(), tagList.tags());
            if (name.property('value')) tags.name = name.property('value');
            return tags;
        } else {
            tags = _.clone(newtags);
            if (presetUI && tagList) {

                // change preset if necessary (undos/redos)
                var newmatch = presets.matchType(entity, context.graph()).matchTags(entity.update({ tags: tags }));
                if (newmatch !== preset) {
                    return tageditor(selection_, newmatch);
                }

                name.property('value', tags.name || '');
                presetUI.change(tags);
                tagList.tags(_.omit(tags, _.keys(presetUI.tags() || {}).concat(['name'])));
            }
            return tageditor;
        }
    };

    return d3.rebind(tageditor, event, 'on');
};
