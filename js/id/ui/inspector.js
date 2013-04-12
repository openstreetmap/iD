iD.ui.Inspector = function(context, entity) {
    var tagEditor,
        id = entity.id,
        newFeature = false;

    function changeTags(tags) {
        var entity = context.entity(id);
        if (entity && !_.isEqual(entity.tags, tags)) {
            context.perform(
                iD.actions.ChangeTags(entity.id, tags),
                t('operations.change_tags.annotation'));
        }
    }

    function browse() {
        context.enter(iD.modes.Browse(context));
    }

    function update() {
        var entity = context.entity(id);
        if (entity) {
            tagEditor.tags(entity.tags);
        }
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

        var presetGrid = iD.ui.PresetGrid(context, entity)
            .newFeature(newFeature)
            .on('close', browse)
            .on('choose', function(preset) {
                var right = panewrap.style('right').indexOf('%') > 0 ? '0%' : '0px';
                panewrap
                    .transition()
                    .style('right', right);

                tagLayer.call(tagEditor, preset);
            });

        tagEditor = iD.ui.TagEditor(context, entity)
            .tags(entity.tags)
            .on('changeTags', changeTags)
            .on('close', browse)
            .on('choose', function(preset) {
                var right = panewrap.style('right').indexOf('%') > 0 ?
                    '-100%' :
                    '-' + selection.style('width');
                panewrap
                    .transition()
                    .style('right', right);

                presetLayer.call(presetGrid, preset);
            });

        var tagless = _.without(Object.keys(entity.tags), 'area').length === 0;

        if (tagless) {
            panewrap.style('right', '-100%');
            presetLayer.call(presetGrid);
        } else {
            panewrap.style('right', '-0%');
            tagLayer.call(tagEditor);
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

        context.history()
            .on('change.inspector', update);
    }

    inspector.close = function(selection) {
        selection.transition()
            .style('right', '-500px')
            .each('end', function() {
                d3.select(this)
                    .style('display', 'none')
                    .html('');
            });

        // Firefox incorrectly implements blur, so typeahead elements
        // are not correctly removed. Remove any stragglers manually.
        d3.selectAll('div.typeahead').remove();

        context.history()
            .on('change.inspector', null);
    };

    inspector.newFeature = function(_) {
        if (!arguments.length) return newFeature;
        newFeature = _;
        return inspector;
    };

    return inspector;
};
