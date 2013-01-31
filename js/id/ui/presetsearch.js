iD.ui.presetsearch = function() {
    var event = d3.dispatch('choose'),
        presetData;

    function search(selection) {
        var viable = presetData.match(entity);

        function filter(value) {
            value = value.toLowerCase();
            return viable.filter(function(v) {
                return v.name.toLowerCase().indexOf(value) !== -1;
            });
        }

        function showResults() {
            var values = filter(this.value).slice(0, 10);

            var res = search_output.selectAll('div.preset-search-result')
                .data(values, function(d) { return d.name; });

            res.exit().remove();

            res.enter()
                .append('button')
                .attr('class', 'preset-search-result')
                .text(function(d) {
                    return d.name;
                })
                .on('click', function(d) {
                    search_output
                        .selectAll('button.preset-search-result')
                        .remove();
                    event.choose(d);
                });
        }

        selection.append('div')
            .attr('class', 'preset-search-input')
            .append('h3')
            .append('input')
            .on('keyup', showResults)
            .on('change', showResults);

        var search_output = selection.append('div')
            .attr('class', 'preset-search-output');
    }

    search.presetData = function(_) {
        if (!arguments.length) return presetData;
        presetData = _;
        return search;
    };

    search.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return search;
    };

    return d3.rebind(search, event, 'on');
};
