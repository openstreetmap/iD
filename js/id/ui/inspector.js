iD.ui.Inspector = function(context) {
    var event = d3.dispatch('changeTags', 'close', 'change'),
        initial = false,
        tagEditor;

    function inspector(selection) {
        var entity = selection.datum();

        var presetLayer = selection
            .append('div')
            .style('right', '0px')
            .classed('pane', true);

        var tagLayer = selection
            .append('div')
            .style('right', '0px')
            .classed('pane', true);

        var presetGrid = iD.ui.PresetGrid(context)
            .entity(entity)
            .on('close', function() {
                event.close();
            })
            .on('choose', function(preset) {
                presetLayer
                    .style('display', 'block');

                tagLayer
                    .style('right', '-500px')
                    .style('display', 'block')
                    .call(tagEditor, preset)
                    .transition()
                    .style('right', '0px');
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
                tagLayer
                    .transition()
                    .style('right', '-500px')
                    .each('end', function() {
                        d3.select(this).style('display', 'none');
                    });
                presetLayer
                    .style('display', 'block')
                    .call(presetGrid, true);
            });

        if (initial) {
            tagLayer.style('display', 'none');
            presetLayer.call(presetGrid);
        } else {
            presetLayer.style('display', 'none');
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
