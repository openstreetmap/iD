iD.ui.Inspector = function(context, entity) {
    var entityEditor,
        newFeature = false;

    function browse() {
        context.enter(iD.modes.Browse(context));
    }

    function inspector(selection) {

        var reselect = selection.html();

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

        var presetList = iD.ui.PresetList(context, entity)
            .autofocus(newFeature)
            .on('close', browse)
            .on('choose', function(preset) {
                var right = panewrap.style('right').indexOf('%') > 0 ? '0%' : '0px';
                panewrap
                    .transition()
                    .style('right', right);

                tagLayer.call(entityEditor, preset);
            });

        entityEditor = iD.ui.EntityEditor(context, entity)
            .on('close', browse)
            .on('choose', function(preset) {
                var right = panewrap.style('right').indexOf('%') > 0 ?
                    '-100%' :
                    '-' + selection.style('width');
                panewrap
                    .transition()
                    .style('right', right);

                presetList
                    .current(preset)
                    .autofocus(true);

                presetLayer.call(presetList);
            });

        var tagless = _.without(Object.keys(entity.tags), 'area').length === 0;

        if (tagless) {
            panewrap.style('right', '-100%');
            presetLayer.call(presetList);
        } else {
            panewrap.style('right', '-0%');
            tagLayer.call(entityEditor);
        }

        if (d3.event) {
            // Pan the map if the clicked feature intersects with the position
            // of the inspector
            var inspectorSize = selection.size(),
                mapSize = context.map().size(),
                offset = 50,
                shiftLeft = d3.event.clientX - mapSize[0] + inspectorSize[0] + offset,
                center = (mapSize[0] / 2) + shiftLeft + offset;

            if (shiftLeft > 0 && inspectorSize[1] > d3.event.clientY) {
                context.map().centerEase(context.projection.invert([center, mapSize[1]/2]));
            }
        }
    }

    inspector.close = function(selection) {
        entityEditor.close();

        selection.transition()
            .style('right', '-500px')
            .each('end', function() {
                d3.select(this)
                    .style('display', 'none')
                    .html('');
            });
    };

    inspector.newFeature = function(_) {
        if (!arguments.length) return newFeature;
        newFeature = _;
        return inspector;
    };

    return inspector;
};
