iD.tagReference = function(selection) {
    selection.each(function() {
        function g(x) { return function(d) { return d[x]; }; }
        var selection = d3.select(this);
        var header = selection.append('div')
            .attr('class','modal-section')
            .append('h2');
                header.append('span').attr('class','icon big icon-pre-text big-inspect');
                header.append('span').text(g('title'));
        var icon_row = selection.append('div')
            .attr('class','modal-section');
        var icons = icon_row.selectAll('span.icon')
            .data(g('types'))
            .enter()
            .append('span')
            .attr('title', function(d) {
                return 'used with ' + d;
            });
            // .attr('class', function(d) {
            //     // return 'icon icon-pre-text ' + d;
            // });
        icon_row
            .append('h5')
            .text('Description')
        icon_row
            .append('p')
            .text(g('description'));
        icon_row
            .append('a')
            .attr('href', function(d) {
                return 'http://wiki.openstreetmap.org/wiki/' + d.title;
            })
            .text(function(d) {
                return d.title + ' on wiki.osm.org';
            });
    });
};