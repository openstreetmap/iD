iD.ui.Inspector = function(context, entity) {
    var event = d3.dispatch('changeTags', 'close', 'change'),
        tagEditor;

    function inspector(selection) {
        var panewrap = selection
            .append('div')
            .classed('panewrap', true);

        var presetLayer = panewrap
            .append('div')
            .classed('pane', true);

        var tagLayer = panewrap
            .append('div')
            .classed('pane', true);

        var presetGrid = iD.ui.PresetGrid(context, entity)
            .on('close', function() {
                event.close();
            })
            .on('choose', function(preset) {
                panewrap
                    .transition()
                    .style('right', '0%');

                tagLayer.call(tagEditor, preset);
            });

        tagEditor = iD.ui.TagEditor(context, entity)
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

        var initial = entity.isNew() && _.without(Object.keys(entity.tags), 'area').length === 0;

        if (initial) {
            panewrap.style('right', '-100%');
            presetLayer.call(presetGrid);
        } else {
            panewrap.style('right', '-0%');
            tagLayer.call(tagEditor);
        }
    }

    inspector.tags = function() {
        tagEditor.tags.apply(this, arguments);
        return inspector;
    };

    return d3.rebind(inspector, event, 'on');
};
