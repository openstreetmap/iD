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
                var value = search.property('value'),
                    presets = filter(value);
                event.message('' + presets.length + ' results for ' + value);
                grid.call(drawGrid, presets);
                grid.classed('filtered', value.length);
            })
            .on('change', function() {
                var chosen = grid.selectAll('.grid-entry:first-child').datum();
                if (chosen) event.choose(chosen);
            });
        search.node().focus();


        function filter(value) {
            value = value.toLowerCase();
            return viable.filter(function(v) {
                return v.name.toLowerCase().indexOf(value) !== -1;
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
                event.choose(d);
            });

        entered.append('div')
            .attr('class', function(d) {
                var s = 'preset-icon-fill ' + entity.geometry(context.graph());
                for (var i in d.match.tags) {
                    s += ' tag-' + i + ' tag-' + i + '-' + d.match.tags[i];
                }
                return s;
            });

        entered.append('div')
            .attr('class', function(d) { return 'preset-' + d.icon + ' icon'; });

        entered.append('span').attr('class','label').text(name);

        entries.exit().remove();
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
