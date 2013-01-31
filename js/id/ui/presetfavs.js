iD.ui.presetfavs = function() {
    var event = d3.dispatch('choose'),
        presetData;

    function favs(selection) {
        var favData = presetData.favs();

        selection.append('div')
            .attr('class', 'preset-fav')
            .selectAll('button.fav')
            .data(favData)
            .enter()
            .append('button')
            .attr('class', 'fav')
            .text(function(d) {
                return d.name;
            })
            .on('click', function(d) {
                event.choose(d);
            });
    }

    favs.presetData = function(_) {
        if (!arguments.length) return presetData;
        presetData = _;
        return favs;
    };

    return d3.rebind(favs, event, 'on');
};
