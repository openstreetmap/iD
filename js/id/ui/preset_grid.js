iD.ui.PresetGrid = function(context, entity) {
    var event = d3.dispatch('choose', 'close'),
        defaultLimit = 9,
        currentlyDrawn = 9,
        presets,
        newFeature = false;

    function presetgrid(selection, preset) {

        selection.html('');

        presets = context.presets().matchGeometry(entity.geometry(context.graph()));

        var messagewrap = selection.append('div')
            .attr('class', 'header fillL cf');

        var message = messagewrap.append('h3')
            .attr('class', 'inspector-inner')
            .text(t('inspector.choose'));

        if (preset) {
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

        var gridwrap = selection.append('div')
            .attr('class', 'fillL2 inspector-body inspector-body-' + entity.geometry(context.graph()));

        var grid = gridwrap.append('div')
            .attr('class', 'preset-grid fillL cf')
            .data([context.presets().defaults(entity, 36).collection]);

        var showMore = gridwrap.append('button')
            .attr('class', 'fillL show-more')
            .text(t('inspector.show_more'))
            .on('click', function() {
                grid.call(drawGrid, (currentlyDrawn += defaultLimit));
            });

        grid.call(drawGrid, defaultLimit);

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
                choose(grid.selectAll('.grid-entry:first-child').datum());
            } else {
                currentlyDrawn = defaultLimit;
                grid.classed('filtered', value.length);
                if (value.length) {
                    var results = presets.search(value);
                    message.text(t('inspector.results', {
                        n: results.collection.length,
                        search: value
                    }));
                    grid.data([results.collection])
                        .call(drawGrid, defaultLimit);
                } else {
                    grid.data([context.presets().defaults(entity, 36).collection])
                        .call(drawGrid, defaultLimit);
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

        if (newFeature) {
            search.node().focus();
        }

        function choose(d) {
            // Category
            if (d.members) {
                var subgrid = insertBox(grid, d, 'subgrid');

                if (subgrid) {
                    subgrid.append('div')
                        .attr('class', 'arrow');

                    subgrid.append('div')
                        .attr('class', 'preset-grid fillL3 cf fl')
                        .data([d.members.collection])
                        .call(drawGrid, 1000);

                    subgrid.style('max-height', '0px')
                        .style('padding-bottom', '0px')
                        .transition()
                        .duration(300)
                        .style('padding-bottom', '20px')
                        .style('max-height', (d.members.collection.length / 3 * 150) + 200 + 'px');
                }

            // Preset
            } else {
                context.presets().choose(d);
                event.choose(d);
            }
        }

        function name(d) { return d.name(); }

        // Inserts a div inline after the entry for the provided entity
        // Used for preset descriptions, and for expanding categories
        function insertBox(grid, entity, klass) {

            var entries = grid.selectAll('button.grid-entry'),
                shown = grid.selectAll('.box-insert'),
                shownIndex = Infinity,
                index;

            if (shown.node()) {
                shown.transition()
                    .duration(200)
                    .style('opacity','0')
                    .style('max-height', '0px')
                    .style('padding-top', '0px')
                    .style('padding-bottom', '0px')
                    .remove();

                if (shown.datum() === entity && shown.classed(klass)) return;
                shownIndex = Array.prototype.indexOf.call(shown.node().parentNode.childNodes, shown.node());
            }

            entries.each(function(d, i) {
                if (d === entity) index = i;
            });

            if (index > shownIndex) index++;

            var elem = document.createElement('div');
            grid.node().insertBefore(elem, grid.node().childNodes[index + 1]);

            var newbox = d3.select(elem)
                .attr('class', 'col12 box-insert ' + klass + ' arrow')
                .datum(entity);

            return newbox;
        }

        function drawGrid(selection, limit) {

            function helpClick(d) {
                d3.event.stopPropagation();

                var presetinspect = insertBox(selection, d, 'preset-inspect');

                if (!presetinspect) return;

                var tag = {key: Object.keys(d.tags)[0]};

                if (d.tags[tag.key] !== '*') {
                    tag.value = d.tags[tag.key];
                }

                var tagReference = iD.ui.TagReference(entity, tag);
                presetinspect.style('max-height', '200px')
                    .call(tagReference);
                tagReference.show();
            }

            if (selection.node() === grid.node()) {
                showMore
                    .style('display', (selection.data()[0].length > limit) ? 'block' : 'none');
            }

            selection.selectAll('.preset-inspect, .subgrid').remove();

            var entries = selection
                .selectAll('div.grid-entry-wrap')
                .data(function(d) { return d.slice(0, limit); }, name);

            entries.exit()
                .remove();

            var entered = entries.enter()
                .append('div')
                .attr('class','grid-button-wrap col12 grid-entry-wrap')
                .classed('category', function(d) { return !!d.members; })
                .classed('current', function(d) { return d === preset; });

            var buttonInner = entered.append('button')
                .attr('class', 'grid-entry')
                .on('click', choose);

            buttonInner
                .style('opacity', 0)
                .transition()
                .style('opacity', 1);

            buttonInner
                .call(iD.ui.PresetIcon(context.geometry(entity.id)));

            var label = buttonInner.append('div')
                .attr('class','label')
                .text(name);

            entered.filter(function(d) { return !d.members; })
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'tag-reference-button minor')
                .on('click', helpClick, selection)
                .append('span')
                    .attr('class', 'icon inspect');

            entries.order();
        }
    }

    presetgrid.newFeature = function(_) {
        if (!arguments.length) return newFeature;
        newFeature = _;
        return presetgrid;
    };

    return d3.rebind(presetgrid, event, 'on');
};
