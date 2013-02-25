iD.ui.PresetGrid = function() {
    var event = d3.dispatch('choose', 'message'),
        entity,
        context,
        presetData;

    function presetgrid(selection) {

        selection.html('');

        var viable = presetData.match(entity);
        event.message('What kind of ' + entity.geometry(context.graph()) + ' are you adding?');

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
                    var chosen = grid.selectAll('.grid-entry:first-child').datum();
                    if (chosen) event.choose(chosen);
                } else {
                    var value = search.property('value'),
                        presets = filter(value);
                    event.message('' + presets.length + ' results for ' + value);
                    grid.call(drawGrid, presets);
                    grid.classed('filtered', value.length);
                }
            });
        search.node().focus();


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
                return iD.util.editDistance(value, d.name) - d.name.length + value.length < 3;
            });
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
            .on('click', function(d) {
                // Category
                if (d.members) {
                    drawGrid(selection, presetData.categories(d.name));

                // Preset
                } else {
                    event.choose(d);
                }
            });

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

        entered.append('span').attr('class','label').text(name);

        entries.exit().remove();
        entries.order();
    }

    presetgrid.presetData = function(_) {
        if (!arguments.length) return presetData;
        presetData = _;
        return presetgrid;
    };

    presetgrid.context = function(_) {
        if (!arguments.length) return context;
        context = _;
        return presetgrid;
    };

    presetgrid.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return presetgrid;
    };



    return d3.rebind(presetgrid, event, 'on');
};
