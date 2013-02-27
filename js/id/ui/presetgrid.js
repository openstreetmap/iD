iD.ui.PresetGrid = function(context) {
    var event = d3.dispatch('choose', 'message'),
        entity,
        presetData;

    function presetgrid(selection, preset) {

        selection.html('');

        var viable = presetData.match(entity);
        event.message(t('inspector.choose'));

        var searchwrap = selection.append('div')
            .attr('class', 'preset-grid-search-wrap inspector-inner');

        var grid = selection.append('div')
            .attr('class', 'preset-grid fillD inspector-body ' + entity.geometry(context.graph()))
            .call(drawGrid, filter(''));

        var search = searchwrap.append('input')
            .attr('class', 'preset-grid-search')
            .attr('type', 'search')
            .on('keyup', function() {
                // enter
                if (d3.event.keyCode === 13) {
                    choose(grid.selectAll('.grid-entry:first-child').datum());
                } else {
                    var value = search.property('value'),
                        presets = filter(value);
                    event.message('' + presets.length + ' results for ' + value);
                    grid.call(drawGrid, presets);
                    grid.classed('filtered', value.length);
                }
            });
        search.node().focus();

        if (preset) {
            selection.append('div')
                .attr('class', 'inspector-actions pad1 fillD col12')
                .call(drawButtons);
        }

        function filter(value) {
            if (!value) return presetData.defaults(entity);

            value = value.toLowerCase();

            // Uses levenshtein distance, with a couple of hacks
            // to prioritize exact substring matches
            return viable.sort(function(a, b) {
                var ia = a.name.indexOf(value) >= 0,
                    ib = b.name.indexOf(value) >= 0;

                if (ia && !ib) {
                    return -1;
                } else if (ib && !ia) {
                    return 1;
                }

                return iD.util.editDistance(value, a.name) - iD.util.editDistance(value, b.name);
            }).filter(function(d) {
                return iD.util.editDistance(value, d.name) - d.name.length + value.length < 3 ||
                    d.name === 'other';
            });
        }


        function choose(d) {
            // Category
            if (d.members) {
                search.property('value', '');
                viable = presetData.categories(d.name);
                drawGrid(selection, viable);

            // Preset
            } else {
                event.choose(d);
            }
        }

        function name(d) { return d.name; }

        function drawGrid(selection, presets) {

            var entries = selection
                .selectAll('button.grid-entry')
                .data(presets.slice(0, 12), name);

            var entered = entries.enter()
                .append('button')
                .attr('class', 'grid-entry col3')
                .on('click', choose);

            entered.append('div')
                .attr('class', function(d) {
                    var s = 'preset-icon-fill ' + entity.geometry(context.graph());
                    if (d.members) {
                        s += 'category';
                    } else {
                        for (var i in d.match.tags) {
                            s += ' tag-' + i + ' tag-' + i + '-' + d.match.tags[i];
                        }
                    }
                    return s;
                });

            entered.append('div')
                .attr('class', function(d) { return 'preset-' + d.icon + ' icon'; });

            var presetinspect;

            entered.append('button')
                .attr('tabindex', -1)
                .attr('class', 'preset-help minor')
                .on('click', function(d) {

                    // Display description box inline

                    d3.event.stopPropagation();

                    var entry = this.parentNode,
                        index,
                        entries = selection.selectAll('button.grid-entry');

                    if (presetinspect && presetinspect.remove().datum() === d) {
                        presetinspect = null;
                        return;
                    }

                    entries.each(function(d, i) {
                        if (this === entry) index = i;
                    });

                    var selector = '.grid-entry:nth-child(' + (Math.floor(index/4) * 4 + 5 ) + ')';

                    presetinspect = selection.insert('div', selector)
                        .attr('class', 'preset-inspect col12')
                        .datum(d);

                    presetinspect.append('h2').text(d.title || d.name);
                })
                .append('span')
                    .attr('class', 'icon inspect');

            entered.append('span').attr('class','label').text(name);

            entries.exit().remove();
            entries.order();
        }
    }

    function cancel() {
        event.choose();
    }

    function drawButtons(selection) {

        var inspectorButton = selection.append('button')
            .attr('class', 'apply action')
            .on('click', cancel);

        inspectorButton.append('span')
            .attr('class','label')
            .text(t('commit.cancel'));
    }

    presetgrid.presetData = function(_) {
        if (!arguments.length) return presetData;
        presetData = _;
        return presetgrid;
    };

    presetgrid.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return presetgrid;
    };

    return d3.rebind(presetgrid, event, 'on');
};
