iD.ui.SourceSwitch = function(context) {
    var keys;

    function click() {
        d3.event.preventDefault();

        if (context.history().hasChanges() &&
            !window.confirm(t('source_switch.lose_changes'))) return;

        var live = d3.select(this)
            .classed('live');

        context.connection()
            .switch(live ? keys[1] : keys[0]);

        context.map()
            .flush();

        d3.select(this)
            .text(live ? t('source_switch.dev') : t('source_switch.live'))
            .classed('live', !live);
    }

    var sourceSwitch = function(selection) {
        selection.append('a')
            .attr('href', '#')
            .text(t('source_switch.live'))
            .classed('live', true)
            .attr('tabindex', -1)
            .on('click', click);
    };

    sourceSwitch.keys = function(_) {
        if (!arguments.length) return keys;
        keys = _;
        return sourceSwitch;
    };

    return sourceSwitch;
};
