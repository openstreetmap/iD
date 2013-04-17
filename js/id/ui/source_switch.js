iD.ui.SourceSwitch = function(context) {
    function click() {
        d3.event.preventDefault();

        if (context.history().hasChanges() &&
            !window.confirm(t('source_switch.lose_changes'))) return;

        var live = d3.select(this)
            .classed('live');

        context.connection()
            .switch(live ? iD.data.keys[1] : iD.data.keys[0]);

        context.map()
            .flush();

        d3.select(this)
            .text(live ? t('source_switch.dev') : t('source_switch.live'))
            .classed('live', !live);
    }

    return function(selection) {
        selection.append('a')
            .attr('href', '#')
            .text(t('source_switch.live'))
            .classed('live', true)
            .attr('tabindex', -1)
            .on('click', click);
    };
};
