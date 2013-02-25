iD.ui.Inspector = function() {
    var event = d3.dispatch('changeTags', 'close', 'change'),
        taginfo = iD.taginfo(),
        presetData = iD.presetData(),
        initial = false,
        inspectorbody,
        entity,
        presetUI,
        presetGrid,
        tagList,
        tagEditor,
        context;

    function inspector(selection) {

        entity = selection.datum();

        var messagewrap = selection.append('div')
                .attr('class', 'message inspector-inner fillL'),
            message = messagewrap.append('h3');

        inspectorbody = selection.append('div')
            .attr('class', 'fillL'),
        selection.append('div')
            .attr('class', 'inspector-actions pad1 fillD col12')
            .call(drawButtons);

        presetGrid = iD.ui.PresetGrid()
            .presetData(presetData)
            .entity(entity)
            .context(context)
            .on('message', changeMessage)
            .on('choose', function(preset) {
                inspectorbody.call(tagEditor, preset);
            });

        tagEditor = iD.ui.TagEditor()
            .presetData(presetData)
            .tags(entity.tags)
            .context(context)
            .on('message', changeMessage)
            .on('change', function() {
                event.changeTags(entity, inspector.tags());
            })
            .on('choose', function() {
                inspectorbody.call(presetGrid);
            });

        function changeMessage(msg) { message.text(msg);}


        if (initial) {
            inspectorbody.call(presetGrid);
        } else {
            inspectorbody.call(tagEditor);
        }

        selection.call(iD.ui.Toggle(true));
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
    }

    function apply(entity) {
        event.changeTags(entity, inspector.tags());
        event.close(entity);
    }

    inspector.tags = function(tags) {
        if (!arguments.length) {
            return tagEditor.tags();
        } else {
            tagEditor.tags.apply(this, arguments);
            return inspector;
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
