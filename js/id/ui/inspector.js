iD.ui.Inspector = function(context) {
    var presetList,
        entityEditor,
        entityID,
        newFeature = false;

    function inspector(selection) {

        var reselect = selection.html(),
            entity = context.entity(entityID);

        selection
            .html('')
            .style('display', 'block')
            .style('right', '-500px')
            .style('opacity', 1)
            .transition()
            .duration(reselect ? 0 : 200)
            .style('right', '0px');

        var panewrap = selection
            .append('div')
            .classed('panewrap', true);

        var presetLayer = panewrap
            .append('div')
            .classed('pane grid-pane', true);

        var tagLayer = panewrap
            .append('div')
            .classed('pane tag-pane', true);

        presetList = iD.ui.PresetList(context, entity)
            .autofocus(newFeature)
            .on('choose', function(preset) {
                panewrap
                    .transition()
                    .style('right', '0%');

                tagLayer.call(entityEditor, preset);
            });

        entityEditor = iD.ui.EntityEditor(context, entity)
            .on('choose', function(preset) {
                panewrap
                    .transition()
                    .style('right', '-100%');

                presetList
                    .current(preset)
                    .autofocus(true);

                presetLayer.call(presetList);
            });

        var unused =
            _.without(Object.keys(entity.tags), 'area').length === 0 &&
            context.graph().parentRelations(entity).length === 0;

        if (unused) {
            panewrap.style('right', '-100%');
            presetLayer.call(presetList);
        } else {
            panewrap.style('right', '-0%');
            tagLayer.call(entityEditor);
        }
    }

    inspector.close = function(selection) {
        entityEditor.close();
        selection.html('');
    };

    inspector.entityID = function(_) {
        if (!arguments.length) return entityID;
        entityID = _;
        return inspector;
    };

    inspector.newFeature = function(_) {
        if (!arguments.length) return newFeature;
        newFeature = _;
        return inspector;
    };

    return inspector;
};
