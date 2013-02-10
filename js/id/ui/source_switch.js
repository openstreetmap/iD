iD.ui.SourceSwitch = function(context) {
    function click() {
        d3.event.preventDefault();

        var live = d3.select(this).classed('live');

        context.map()
            .flush();

        context.connection()
            .url(live ? 'http://api06.dev.openstreetmap.org' : 'http://www.openstreetmap.org');

        d3.select(this)
            .text(live ? t('source_switch.dev') : t('source_switch.live'))
            .classed('live', !live);
    }

    return function(selection) {
        selection.append('a')
            .attr('href', '#')
            .text(t('source_switch.live'))
            .classed('live', true)
            .on('click', click);
    }
};
