import * as d3 from 'd3';
import { t } from '../util/locale';
import { modeBrowse } from '../modes/index';


export function uiSourceSwitch(context) {
    var keys;


    function click() {
        d3.event.preventDefault();

        if (context.history().hasChanges() &&
            !window.confirm(t('source_switch.lose_changes'))) return;

        var live = d3.select(this)
            .classed('live');

        context.history().clearSaved();
        context.connection().switch(live ? keys[1] : keys[0]);
        context.enter(modeBrowse(context));
        context.flush();

        d3.select(this)
            .text(live ? t('source_switch.dev') : t('source_switch.live'))
            .classed('live', !live);
    }

    var sourceSwitch = function(selection) {
        selection
            .append('a')
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
}
