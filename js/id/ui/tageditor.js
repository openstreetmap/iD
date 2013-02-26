iD.ui.TagEditor = function() {
    var event = d3.dispatch('changeTags', 'choose', 'close', 'change', 'message'),
        presetData = iD.presetData(),
        entity,
        tags,
        name,
        presetMatch,
        presetUI,
        tagList,
        context;

    function tageditor(selection, preset) {

        entity = selection.datum();
        var type = entity.type === 'node' ? entity.type : entity.geometry();

        // preset was explicitly chosen
        if (preset) {
            if (presetMatch) {
                // Strip preset's match tags
                tags = _.omit(tags, _.keys(presetMatch.match.tags));

                // Strip preset's default tags
                for (var i in presetMatch.form) {
                    var field = presetMatch.form[i];
                    if (field['default'] && field['default'][type] == tags[field.key]) {
                        delete tags[field.key];
                    }
                }
            }

            // Add new preset's match tags
            for (var k in preset.match.tags) {
                if (preset.match.tags[k] !== '*') tags[k] = preset.match.tags[k];
            }

            // Add new preset's defaults
            for (var f in preset.form) {
                f = preset.form[f];
                if (f.key && !tags[f.key] && f['default'] && f['default'][type]) {
                    tags[f.key] = f['default'][type];
                }
            }
        }

        presetMatch = preset || presetMatch || presetData.matchTags(entity);

        selection.html('');

        var editorwrap = selection.append('div')
            .attr('class', 'tag-wrap inspector-body');

        var headerwrap = editorwrap.append('div').attr('class','col12 head');

        var typewrap = headerwrap.append('div')
            .attr('class','col3 type inspector-inner');

        typewrap.append('h4').text('Type');

        var typebutton = typewrap.append('button')
            .attr('class','col12')
            .on('click', function() {
                event.choose();
            });

        typebutton.append('div')
            .attr('class', 'icon icon-pre-text' + (presetMatch ?  ' preset-' + presetMatch.icon : ''));

        typebutton.node().focus();

         var namewrap = headerwrap.append('div')
             .attr('class', 'name col9 inspector-inner');

        typebutton.append('span')
            .attr('class','label')
            .text(presetMatch.name);

        namewrap.append('h4').text(t('inspector.name'));

        name = namewrap.append('input')
            .attr('placeholder', 'unknown')
            .attr('class', 'major')
            .attr('type', 'text')
            .property('value', entity.tags.name)
            .on('blur', function() {
                event.change();
            });

        presetUI = iD.ui.preset()
            .context(context)
            .entity(entity)
            .on('change', function(tags) {
                event.change(tags);
            });

        tagList = iD.ui.Taglist()
            .context(context)
            .on('change', function(tags) {
                event.change(tags);
            });

        var tageditorpreset = editorwrap.append('div')
            .attr('class', 'inspector-preset');

        if (presetMatch) {
            tageditorpreset.call(presetUI
                .preset(presetMatch));
        }

        event.message(t('inspector.editing', { type: presetMatch.name }));

        editorwrap.append('div')
            .attr('class','inspector-inner col12 fillL2').call(tagList, presetMatch.name === 'other');

        tageditor.tags(tags);
        event.change(tags);
    }

    tageditor.tags = function(newtags) {
        if (!arguments.length) {
            tags = _.extend(presetUI.tags(), tagList.tags());
            if (name.property('value')) tags.name = name.property('value');
            return tags;
        } else {
            tags = _.clone(newtags);
            if (presetUI && tagList) {
                name.property('value', tags.name || '');
                presetUI.change(tags);
                tagList.tags(_.omit(tags, _.keys(presetUI.tags() || {}).concat(['name'])));
            }
            return tageditor;
        }
    };

    tageditor.presetData = function(_) {
        presetData = _;
        return tageditor;
    };

    tageditor.context = function(_) {
        context = _;
        return tageditor;
    };

    return d3.rebind(tageditor, event, 'on');
};
