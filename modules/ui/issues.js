import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { svgIcon } from '../svg';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { geoExtent } from '../geo';
import { modeBrowse } from '../modes';
import { uiBackground } from './background';
import { uiDisclosure } from './disclosure';
import { uiHelp } from './help';
import { uiMapData } from './map_data';
import { uiSettingsCustomData } from './settings/custom_data';
import { uiTooltipHtml } from './tooltipHtml';


export function uiIssues(context) {
    var key = t('issues.key');
    var _shown = false;

    function update() {

    }

    function issues(selection) {

        function hidePane() {
            setVisible(false);
        }

        function togglePane() {
            if (d3_event) d3_event.preventDefault();
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== _shown) {
                button.classed('active', show);
                _shown = show;

                if (show) {
                    uiBackground.hidePane();
                    uiHelp.hidePane();
                    uiMapData.hidePane();
                    update();
                    
                    pane
                        .style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');

                } else {
                    pane
                        .style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-300px')
                        .on('end', function() {
                            d3_select(this).style('display', 'none');
                        });
                }
            }
        }

        var pane = selection
            .append('div')
            .attr('class', 'fillL map-pane hide');

        var paneTooltip = tooltip()
            .placement((textDirection === 'rtl') ? 'right' : 'left')
            .html(true)
            .title(uiTooltipHtml(t('issues.description'), key));

        var button = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', togglePane)
            .call(svgIcon('#iD-icon-alert', 'light'))
            .call(paneTooltip);

        var heading = pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('issues.title'));

        heading
            .append('button')
            .on('click', function() { uiIssues.hidePane(); })
            .call(svgIcon('#iD-icon-close'));

        update();

        context.keybinding()
            .on(key, togglePane);

        uiIssues.hidePane = hidePane;
        uiIssues.togglePane = togglePane;
        uiIssues.setVisible = setVisible;
    }

    return issues;
}
