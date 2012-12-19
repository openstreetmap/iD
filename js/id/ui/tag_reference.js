iD.tagReference = function(selection) {
    selection.each(function() {
        function g(x) { return function(d) { return d[x]; }; }
        var selection = d3.select(this);
        selection
            .append('div')
                .attr('class','header')
                .append('h2')
                    .text(g('title'));
        var icon_row = selection.append('div');
        var icons = icon_row.selectAll('span.icon')
            .data(g('types'))
            .enter()
            .append('span')
            .attr('title', function(d) {
                return 'used with ' + d;
            })
            .attr('class', function(d) {
                return 'icon add-' + d;
            });
        selection
            .append('a')
            .attr('href', function(d) {
                return 'http://wiki.openstreetmap.org/wiki/' + d.title;
            })
            .text(function(d) {
                return '→ ' + d.title + ' on wiki.osm.org';
            });
        selection
            .append('p')
            .text(g('description'));
    });
};
