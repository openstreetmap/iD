iD.ui.Inspector = function(context) {
    var event = d3.dispatch('changeTags', 'close', 'change'),
        initial = false,
        tagEditor;

    function inspector(selection) {
        var entity = selection.datum();

        var inspectorbody = selection.append('div')
            .attr('class', 'fillL');

        var presetGrid = iD.ui.PresetGrid(context)
            .entity(entity)
            .on('close', function() {
                event.close();
            })
            .on('choose', function(preset) {
                inspectorbody.call(tagEditor, preset);
            });

        tagEditor = iD.ui.TagEditor(context)
            .tags(entity.tags)
            .on('changeTags', function() {
                event.changeTags(entity, inspector.tags());
            })
            .on('close', function() {
                event.close(entity);
            })
            .on('choose', function() {
                inspectorbody.call(presetGrid, true);
            });

        inspectorbody.call(initial ? presetGrid : tagEditor);

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

    return d3.rebind(inspector, event, 'on');
};
