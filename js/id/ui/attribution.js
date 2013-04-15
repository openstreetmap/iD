iD.ui.Attribution = function(context) {
    var selection;

    function update() {
        if (!context.background().source()) {
            selection.html('');
            return;
        }

        var attribution = selection.selectAll('.provided-by')
            .data([context.background().source()], function(d) { return d.data.name; });

        attribution.enter()
            .append('span')
            .attr('class', 'provided-by')
            .each(function(d) {
                var source = d.data.sourcetag || d.data.name;

                if (d.data.logo) {
                    source = '<img class="source-image" src="img/' + d.data.logo + '">';
                }

                if (d.data.terms_url) {
                    d3.select(this)
                        .append('a')
                        .attr('href', d.data.terms_url)
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
