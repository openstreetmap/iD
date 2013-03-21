iD.ui.tagReference = function(selection) {
    selection.each(function() {
        function g(x) { return function(d) { return d[x]; }; }
        var selection = d3.select(this);
        var header = selection.append('div')
            .attr('class','modal-section fillL header')
            .append('h3');

        header.selectAll('span.icon')
            .data(g('types'))
            .enter()
            .append('span')
            .attr('title', function(d) {
                return t('tag_reference.used_with', {type: d});
            })
            .attr('class', function(d) {
                return 'icon big icon-pre-text big-' + d;
            });
            header.append('span')
                .text(g('title'));

        var referenceBody = selection.append('div')
            .attr('class','modal-section fillL2');

        referenceBody
            .append('h4')
            .text(t('tag_reference.description'));

        if (selection.datum().image) {
            referenceBody
                .append('img')
                .attr('class', 'wiki-image')
                .attr('src', selection.datum().image.image_url);
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
                return t('tag_reference.on_wiki', {tag: d.title});
            });
    });
};
