iD.tagReference = function(selection) {
    selection.each(function() {
        function g(x) { return function(d) { return d[x]; }; }
        var selection = d3.select(this);
        var header = selection.append('div')
            .attr('class','modal-section')
            .append('h2');

        header.selectAll('span.icon')
            .data(g('types'))
            .enter()
            .append('span')
            .attr('title', function(d) {
                return 'used with ' + d;
            })
            .attr('class', function(d) {
                return 'icon big icon-pre-text big-' + d;
            });
            header.append('span')
                .text(g('title'));

        referenceBody =  selection.append('div')
            .attr('class','modal-section');

        referenceBody
            .append('h5')
            .text('Description');

        if (selection.datum().image) {
            iD.wiki().image(selection.datum().image, function(err, src) {
                if (!err) {
                    referenceBody
                        .append('img')
                        .attr('class', 'wiki-image')
                        .attr('src', src);
                }
            });
        }

        referenceBody
            .append('p')
            .text(g('description'));
        referenceBody
            .append('a')
            .attr('target', '_blank')
            .attr('href', function(d) {
                return 'http://wiki.openstreetmap.org/wiki/' + d.title;
            })
            .text(function(d) {
                return d.title + ' on wiki.osm.org';
            });
    });
};
