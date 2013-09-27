iD.ui.Attribution = function(context) {
    var selection;

    function update() {
        if (!context.background().baseLayerSource()) {
            selection.html('');
            return;
        }

        var attribution = selection.selectAll('.provided-by')
            .data([context.background().baseLayerSource()], function(d) { return d.name; });

        attribution.enter()
            .append('span')
            .attr('class', 'provided-by')
            .each(function(d) {
                var source = d.terms_text || d.id || d.name;

                if (d.logo) {
                    source = '<img class="source-image" src="' + context.imagePath(d.logo) + '">';
                }

                if (d.terms_url) {
                    d3.select(this)
                        .append('a')
                        .attr('href', d.terms_url)
                        .attr('target', '_blank')
                        .html(source);
                } else {
                    d3.select(this)
                        .text(source);
                }
            });

        attribution.exit()
            .remove();

        var copyright = attribution.selectAll('.copyright-notice')
            .data(function(d) {
                var notice = d.copyrightNotices(context.map().zoom(), context.map().extent());
                return notice ? [notice] : [];
            });

        copyright.enter()
            .append('span')
            .attr('class', 'copyright-notice');

        copyright.text(String);

        copyright.exit()
            .remove();
    }

    return function(select) {
        selection = select;

        context.background()
            .on('change.attribution', update);

        context.map()
            .on('move.attribution', _.throttle(update, 400));

        update();
    };
};
