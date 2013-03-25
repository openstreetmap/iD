iD.ui.Attribution = function(context) {
    var selection;

    function update() {
        var d = context.background().source();

        var provided_by = selection
            .html('')
            .append('span')
            .attr('class', 'provided-by');

        if (!d) return;

        var source = d.data.sourcetag || d.data.name;
        if (d.data.logo) {
            source = '<img class="source-image" src="img/' + d.data.logo + '">';
        }

        if (d.data.terms_url) {
            provided_by.append('a')
                .attr('href', d.data.terms_url)
                .attr('target', '_blank')
                .html(source);
        } else {
            provided_by.text(source);
        }

        var copyright = d.copyrightNotices(context.map().zoom(), context.map().extent());
        if (copyright) {
            provided_by.append('span')
                .text(copyright);
        }
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
