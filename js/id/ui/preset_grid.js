iD.ui.PresetGrid = function(context, entity) {
    var event = d3.dispatch('choose', 'close'),
        presets, current,
        autofocus = false;

    function presetGrid(selection) {
        var geometry = entity.geometry(context.graph());
        presets = context.presets().matchGeometry(geometry);

        selection.html('');

        var messagewrap = selection.append('div')
            .attr('class', 'header fillL cf');

        var message = messagewrap.append('h3')
            .attr('class', 'inspector-inner')
            .text(t('inspector.choose'));

        if (current) {
            messagewrap.append('button')
                .attr('class', 'preset-choose')
                .on('click', event.choose)
                .append('span')
                .attr('class', 'icon forward');
        } else {
            messagewrap.append('button')
                .attr('class', 'close')
                .on('click', event.close)
                .append('span')
                .attr('class', 'icon close');
        }

        function keydown() {
            // hack to let delete shortcut work when search is autofocused
            if (search.property('value').length === 0 &&
                (d3.event.keyCode === d3.keybinding.keyCodes['⌫'] ||
                 d3.event.keyCode === d3.keybinding.keyCodes['⌦'])) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                iD.operations.Delete([entity.id], context)();
            } else if (search.property('value').length === 0 &&
                (d3.event.ctrlKey || d3.event.metaKey) &&
                d3.event.keyCode === d3.keybinding.keyCodes.z) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                context.undo();
            } else if (!d3.event.ctrlKey && !d3.event.metaKey) {
                d3.select(this).on('keydown', null);
            }
        }

        function keyup() {
            // enter
            var value = search.property('value');
            if (d3.event.keyCode === 13 && value.length) {
                grid.selectAll('.grid-entry:first-child').datum().choose();
            } else {
                grid.classed('filtered', value.length);
                if (value.length) {
                    var results = presets.search(value);
                    message.text(t('inspector.results', {
                        n: results.collection.length,
                        search: value
                    }));
                    grid.call(drawGrid, results);
                } else {
                    grid.call(drawGrid, context.presets().defaults(geometry, 36));
                }
            }
        }

        var searchwrap = selection.append('div')
            .attr('class', 'preset-grid-search-wrap');

        var search = searchwrap.append('input')
            .attr('class', 'major')
            .attr('placeholder', t('inspector.search'))
            .attr('type', 'search')
            .on('keydown', keydown)
            .on('keyup', keyup);

        searchwrap.append('span')
            .attr('class', 'icon search');

        if (autofocus) {
            search.node().focus();
        }

        var gridwrap = selection.append('div')
            .attr('class', 'fillL2 inspector-body inspector-body-' + geometry);

        var grid = gridwrap.append('div')
            .attr('class', 'preset-grid fillL cf')
            .call(drawGrid, context.presets().defaults(geometry, 36));
    }

    function drawGrid(grid, presets) {
        var collection = presets.collection.map(function(preset) {
            return preset.members ? CategoryItem(preset) : PresetItem(preset)
        });

        var items = grid.selectAll('.preset-item')
            .data(collection, function(d) { return d.preset.id; });

        items.enter().append('div')
            .attr('class', 'preset-item')
            .classed('current', function(item) { return item.preset === current; })
            .each(function(item) {
                d3.select(this).call(item);
            })
            .style('opacity', 0)
            .transition()
            .style('opacity', 1);

        items.order();

        items.exit()
            .remove();
    }

    function CategoryItem(preset) {
        var box, subgrid, shown = false;

        function item(selection) {
            var wrap = selection.append('div')
                .attr('class', 'grid-button-wrap category col12');

            wrap.append('button')
                .datum(preset)
                .attr('class', 'grid-entry')
                .call(iD.ui.PresetIcon(context.geometry(entity.id)))
                .on('click', item.choose)
                .append('div')
                .attr('class', 'label')
                .text(preset.name());

            box = selection.append('div')
                .attr('class', 'subgrid col12')
                .style('max-height', '0');

            box.append('div')
                .attr('class', 'arrow');

            subgrid = box.append('div')
                .attr('class', 'preset-grid fillL3 cf fl');
        }

        item.choose = function() {
            if (shown) {
                shown = false;
                box.transition()
                    .duration(200)
                    .style('opacity', '0')
                    .style('max-height', '0')
                    .style('padding-bottom', '0');
            } else {
                shown = true;
                subgrid.call(drawGrid, preset.members);
                box.transition()
                    .duration(200)
                    .style('opacity', '1')
                    .style('max-height', 200 + preset.members.collection.length * 80 + 'px')
                    .style('padding-bottom', '20px');
            }
        };

        item.preset = preset;

        return item;
    }

    function PresetItem(preset) {
        function item(selection) {
            var wrap = selection.append('div')
                .attr('class', 'grid-button-wrap col12');

            wrap.append('button')
                .datum(preset)
                .attr('class', 'grid-entry')
                .call(iD.ui.PresetIcon(context.geometry(entity.id)))
                .on('click', item.choose)
                .append('div')
                .attr('class', 'label')
                .text(preset.name());

            wrap.call(iD.ui.TagReferenceButton()
                .on('click', item.help));

            selection.append('div')
                .attr('class', 'preset-inspect col12')
                .style('max-height', '200px')
                .call(item.reference);
        }

        item.choose = function() {
            context.presets().choose(preset);
            event.choose(preset);
        };

        item.help = function() {
            d3.event.stopPropagation();
            item.reference.toggle();
        };

        item.preset = preset;
        item.reference = iD.ui.TagReference(null, preset.reference());

        return item;
    }

    presetGrid.autofocus = function(_) {
        if (!arguments.length) return autofocus;
        autofocus = _;
        return presetGrid;
    };

    presetGrid.current = function(_) {
        if (!arguments.length) return current;
        current = _;
        return presetGrid;
    };

    return d3.rebind(presetGrid, event, 'on');
};
