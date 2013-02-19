iD.ui.PresetGrid = function() {
    var event = d3.dispatch('choose', 'message'),
        entity,
        context,
        presetData;

    function presetgrid(selection) {

        selection.html('');
        var wrap = selection.append('div')
            .attr('class', '');

        var viable = presetData.match(entity);
        event.message('What kind of ' + entity.geometry(context.graph()) + ' are you adding?');

        var grid = wrap.append('div')
            .attr('class', 'preset-grid pad1')
            .call(drawGrid, filter(''));

        var searchwrap = wrap.append('div')
            .attr('class', 'preset-grid-search-wrap');

        var search = searchwrap.append('input')
            .attr('class', 'preset-grid-search')
            .attr('type', 'search')
            .on('keyup', function() {
                var value = search.property('value'),
                    presets = filter(value);
                event.message('' + presets.length + ' results for ' + value);
                grid.call(drawGrid, presets);
            });


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
            .selectAll('div.grid-entry')
            .data(presets.slice(0, 12), name);

        var entered = entries.enter()
            .append('div')
            .attr('class', 'grid-entry col3')
            .on('click', function(d) {
                event.choose(d);
            });

        entered.append('div')
            .attr('class','grid-inner fillL')
            .append('div')
                .attr('class', function(d) { return 'maki-' + d.icon + '-24 icon'; });
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
