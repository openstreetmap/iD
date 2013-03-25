iD.ui.PresetGrid = function(context, entity) {
    var event = d3.dispatch('choose', 'close'),
        default_limit = 9,
        currently_drawn = 9,
        presets,
        taginfo = iD.taginfo();

    function presetgrid(selection, preset) {

        selection.html('');

        presets = context.presets().matchGeometry(entity, context.graph());

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

        var show_more = gridwrap.append('button')
            .attr('class', 'fillL show-more')
            .text(t('inspector.show_more'))
            .on('click', function() {
                grid.call(drawGrid, (currently_drawn += default_limit));
            });

        grid.call(drawGrid, default_limit);

        var searchwrap = selection.append('div')
            .attr('class', 'preset-grid-search-wrap inspector-inner');

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
                currently_drawn = default_limit;
                grid.classed('filtered', value.length);
                if (value.length) {
                    var results = presets.search(value);
                    message.text(t('inspector.results', {
                        n: results.collection.length,
                        search: value
                    }));
                    grid.data([results.collection])
                        .call(drawGrid, default_limit);
                } else {
                    grid.data([context.presets().defaults(entity, 36).collection])
                        .call(drawGrid, default_limit);
                }
            }
        }

        var search = searchwrap.append('input')
            .attr('class', 'preset-grid-search major')
            .attr('placeholder','Search')
            .attr('type', 'search')
            .on('keydown', keydown)
            .on('keyup', keyup);

        searchwrap.append('span')
            .attr('class', 'icon search');

        search.node().focus();

        function choose(d) {
            // Category
            if (d.members) {
                var subgrid = insertBox(grid, d, 'subgrid');

                if (subgrid) {
                    subgrid.append('div')
                        .attr('class', 'arrow');

                    subgrid.append('div')
                        .attr('class', 'preset-grid fillL2 cf fl')
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

        function presetClass(d) {
            var s = 'preset-icon-fill ' + entity.geometry(context.graph());
            if (d.members) {
                s += 'category';
            } else {
                for (var i in d.tags) {
                    s += ' tag-' + i + ' tag-' + i + '-' + d.tags[i];
                }
            }
            return s;
        }

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
                    .each('end', function() {
                        shown.remove();
                    });


                if (shown.datum() === entity && shown.classed(klass)) return;
                shownIndex = Array.prototype.indexOf.call(shown.node().parentNode.childNodes, shown.node());
            }

            entries.each(function(d, i) {
                if (d === entity) index = i;
            });

            var insertIndex = index + 3 - index % 3;
            if (insertIndex > shownIndex) insertIndex ++;

            var elem = document.createElement('div');
            grid.node().insertBefore(elem, grid.node().childNodes[insertIndex]);

            var newbox = d3.select(elem)
                .attr('class', 'col12 box-insert ' + klass + ' arrow-' + (index % 3))
                .datum(entity);

            return newbox;
        }

        function drawGrid(selection, limit) {

            function helpClick(d) {
                d3.event.stopPropagation();

                var presetinspect = insertBox(selection, d, 'preset-inspect');

                if (!presetinspect) return;

                presetinspect
                    .style('max-height', '0px')
                    .style('padding-top', '0px')
                    .style('padding-bottom', '0px')
                    .style('opacity', '0')
                    .transition()
                    .duration(200)
                    .style('padding-top', '10px')
                    .style('padding-bottom', '20px')
                    .style('max-height', '200px')
                    .style('opacity', '1');

                presetinspect.append('h3')
                    .text(d.name());

                var tag = {key: Object.keys(d.tags)[0]};

                if (d.tags[tag.key] !== '*') {
                    tag.value = d.tags[tag.key];
                }

                presetinspect.append('div')
                    .call(iD.ui.TagReference(entity, tag));
            }

            if (selection.node() === grid.node()) {
                show_more
                    .style('display', (selection.data()[0].length > limit) ? 'block' : 'none');
            }

            selection.selectAll('.preset-inspect, .subgrid').remove();

            var entries = selection
                .selectAll('div.grid-entry-wrap')
                .data(function(d) { return d.slice(0, limit); }, name);

            entries.exit().remove();

            var entered = entries.enter()
                .append('div')
                .attr('class','grid-button-wrap col4 grid-entry-wrap')
                .classed('category', function(d) { return !!d.members; })
                .classed('current', function(d) { return d === preset; })
                    .append('button')
                    .attr('class', 'grid-entry')
                    .on('click', choose);

            entered.style('opacity', 0)
                    .transition()
                    .style('opacity', 1);

            entered.append('div')
                .attr('class', presetClass);

            var geometry = entity.geometry(context.graph()),
                fallbackIcon = geometry === 'line' ? 'other-line' : 'marker-stroked';

            entered.append('div')
                .attr('class', function(d) {
                    return 'feature-' + (d.icon || fallbackIcon) + ' icon';
                });

            entered.append('span')
                .attr('class','label')
                .text(name);

            entered.filter(function(d) {
                    return !d.members;
                })
                .append('button')
                .attr('tabindex', -1)
                .attr('class', 'preset-help')
                .on('click', helpClick, selection)
                .append('span')
                    .attr('class', 'icon inspect');

            entries.order();
        }
    }

    return d3.rebind(presetgrid, event, 'on');
};
