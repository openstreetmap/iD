iD.ui.Inspector = function(context) {
    var event = d3.dispatch('changeTags', 'close', 'change'),
        initial = false,
        tagEditor;

    function inspector(selection) {
        var entity = selection.datum();

        var panewrap = selection
            .append('div')
            .classed('panewrap', true);

        var presetLayer = panewrap
            .append('div')
            .classed('pane', true);

        var tagLayer = panewrap
            .append('div')
            .classed('pane', true);

        var presetGrid = iD.ui.PresetGrid(context)
            .entity(entity)
            .on('close', function() {
                event.close();
            })
            .on('choose', function(preset) {

                panewrap
                    .transition()
                    .style('right', '0%');

                tagLayer.call(tagEditor, preset);

            });

        tagEditor = iD.ui.TagEditor(context)
            .tags(entity.tags)
            .on('changeTags', function(tags) {
                event.changeTags(entity, tags);
            })
            .on('close', function() {
                event.close(entity);
            })
            .on('choose', function() {

                panewrap
                    .transition()
                    .style('right', '-100%');

                presetLayer.call(presetGrid, true);

            });

        if (initial) {
            presetLayer.call(presetGrid);
        } else {
            tagLayer.call(tagEditor);
        }
    }

    inspector.tags = function() {
        tagEditor.tags.apply(this, arguments);
        return inspector;
    };

    inspector.initial = function(_) {
        initial = _;
        return inspector;
    };

    return d3.rebind(inspector, event, 'on');
};
