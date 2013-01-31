iD.ui.presetsearch = function() {
    var event = d3.dispatch('choose'),
        entity,
        presetData;

    function search(selection) {
        var viable = presetData.match(entity);

        function filter(value) {
            value = value.toLowerCase();
            return viable.filter(function(v) {
                return v.name.toLowerCase().indexOf(value) !== -1;
            }).map(function(v) {
                return {
                    title: v.name,
                    value: v.name
                };
            });
        }

        function find(value) {
            return _.find(viable, function(v) {
                return v.name == value;
            });
        }

        var preset_search_input = selection.append('div')
            .attr('class', 'preset-search-input')
            .append('h3')
            .append('input')
            .attr('placeholder', 'preset search')
            .call(d3.typeahead()
                .autohighlight(true)
                .data(function(_, callback) {
                    callback(filter(preset_search_input.property('value')));
                })
                .on('accept', function() {
                    event.choose(find(preset_search_input.property('value')));
                }));
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
