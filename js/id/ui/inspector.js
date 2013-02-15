iD.ui.Inspector = function() {
    var event = d3.dispatch('changeTags', 'close', 'change'),
        taginfo = iD.taginfo(),
        presetData = iD.presetData(),
        initial = false,
        expert = false,
        inspectorbody,
        presetUI,
        tagList,
        context;

    function inspector(selection) {

        var entity = selection.datum();
            presetMatch = presetData.matchTags(entity);

        var iwrap = selection.append('div')
                .attr('class','inspector content hide'),
            messagewrap = iwrap.append('div')
                .attr('class', 'message inspector-inner fillL2'),
            message = messagewrap.append('h4');

        inspectorbody = iwrap.append('div')
            .attr('class', 'inspector-body'),
        iwrap.append('div')
            .attr('class', 'inspector-buttons pad1 fillD')
            .call(drawButtons);

        if (initial) {
            inspectorbody.call(iD.ui.PresetGrid()
                    .presetData(presetData)
                    .entity(selection.datum())
                    .on('choose', function(preset) {
                        inspectorbody.call(drawEditor, entity, preset);
                    }));
        } else {
            inspectorbody.call(drawEditor, entity, presetMatch);
        }

        iwrap.call(iD.ui.Toggle(true));
    }

    function drawEditor(selection, entity, presetMatch) {
        selection.html('');

        var editorwrap = selection.append('div')
            .attr('class', 'inspector-inner tag-wrap fillL2');

        var typewrap = editorwrap.append('div')
            .attr('class', 'type inspector-inner fillL');

        typewrap.append('h4')
            .text('Type');

        typewrap.append('img')
            .attr('class', 'preset-icon');

        typewrap.append('h3')
            .attr('class', 'preset-name')
            .text(presetMatch ? presetMatch.name : '');


        var namewrap = editorwrap.append('div')
                .attr('class', 'head inspector-inner fillL'),
            h2 = namewrap.append('h2');

        h2.append('span')
            .attr('class', 'icon big icon-pre-text big-' + entity.geometry(context.graph()));

        var name = h2.append('input')
            .attr('placeholder', 'name')
            .property('value', function() {
                return entity.tags.name || '';
            })
            .on('keyup', function() {
                var tags = inspector.tags();
                tags.name = this.value;
                inspector.tags(tags);
                event.change();
            });

        event.on('change.name', function() {
            var tags = inspector.tags();
            name.property('value', tags.name);
        });


        presetUI = iD.ui.preset()
            .on('change', function(tags) {
                event.change();
            });

        tagList = iD.ui.Taglist()
            .context(context)
            .on('change', function(tags) {
                event.change();
            });

        var inspectorpreset = editorwrap.append('div')
            .attr('class', 'inspector-preset cf');

        if (presetMatch && !expert) {
            inspectorpreset.call(presetUI
                    .preset(presetMatch));
        }

        var taglistwrap = editorwrap.append('div').call(tagList);

        inspector.tags(entity.tags);
    }

    function drawHead(selection) {
        var entity = selection.datum();

        var h2 = selection.append('h2');

        h2.append('span')
            .attr('class', 'icon big icon-pre-text big-' + entity.geometry(context.graph()));

        h2.append('span')
            .text(entity.friendlyName());
    }

    function drawButtons(selection) {
        var entity = selection.datum();

        var inspectorButton = selection.append('button')
            .attr('class', 'apply action')
            .on('click', apply);

        inspectorButton.append('span')
            .attr('class','label')
            .text(t('inspector.okay'));

        var minorButtons = selection.append('div')
            .attr('class','minor-buttons fl');

        minorButtons.append('a')
            .attr('href', 'http://www.openstreetmap.org/browse/' + entity.type + '/' + entity.osmId())
            .attr('target', '_blank')
            .text(t('inspector.view_on_osm'));

        var expertButton = selection.append('button')
            .attr('class', 'apply')
            .text('Tag view')
            .on('click', function() {
                expert = !expert;
                expertButton.text(expert ? 'Preset view' : 'Tag view');
                inspectorbody.call(drawEditor);
            });

    }

    function apply(entity) {
        event.changeTags(entity, inspector.tags());
        event.close(entity);
    }

    inspector.tags = function(tags) {
        if (!arguments.length) {
            return _.extend(presetUI.tags(), tagList.tags());
        } else {
            presetUI.change(tags);
            tagList.tags(_.omit(tags, _.keys(presetUI.tags() || {})));
        }
    };

    inspector.initial = function(_) {
        initial = _;
        return inspector;
    };

    inspector.presetData = function(_) {
        presetData = _;
        return inspector;
    };

    inspector.context = function(_) {
        context = _;
        return inspector;
    };

    return d3.rebind(inspector, event, 'on');
};
