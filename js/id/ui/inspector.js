iD.ui.Inspector = function(context) {
    var event = d3.dispatch('changeTags', 'close', 'change'),
        presetData = iD.presetData(),
        initial = false,
        inspectorbody,
        entity,
        presetGrid,
        tagEditor;

    function inspector(selection) {

        entity = selection.datum();

        var messagewrap = selection.append('div')
                .attr('class', 'message inspector-inner fillL'),
            message = messagewrap.append('h3');

        inspectorbody = selection.append('div')
            .attr('class', 'fillL'),

        presetGrid = iD.ui.PresetGrid(context)
            .presetData(presetData)
            .entity(entity)
            .on('message', changeMessage)
            .on('choose', function(preset) {
                inspectorbody.call(tagEditor, preset);
            });

        tagEditor = iD.ui.TagEditor(context)
            .presetData(presetData)
            .tags(entity.tags)
            .on('message', changeMessage)
            .on('changeTags', function() {
                event.changeTags(entity, inspector.tags());
            })
            .on('close', function() {
                event.close(entity);
            })
            .on('choose', function() {
                inspectorbody.call(presetGrid, true);
            });

        function changeMessage(msg) { message.text(msg);}


        if (initial) {
            inspectorbody.call(presetGrid);
        } else {
            inspectorbody.call(tagEditor);
        }

        selection.call(iD.ui.Toggle(true));
    }

    inspector.tags = function() {
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

    return d3.rebind(inspector, event, 'on');
};
