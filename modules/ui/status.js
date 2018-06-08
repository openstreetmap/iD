import { event as d3_event } from 'd3-selection';

import { t } from '../util/locale';
import { svgIcon } from '../svg';


export function uiStatus(context) {
    var osm = context.connection();


    return function(selection) {
        if (!osm) return;

        function update() {
            osm.status(function(err, apiStatus) {
                selection.html('');

                if (err) {
                    if (apiStatus === 'connectionSwitched') {
                        // if the connection was just switched, we can't rely on
                        // the status (we're getting the status of the previous api)
                        return;

                    } else if (apiStatus === 'rateLimited') {
                        selection
                            .text(t('status.rateLimit'))
                            .append('a')
                            .attr('class', 'api-status-login')
                            .attr('target', '_blank')
                            .call(svgIcon('#iD-icon-out-link', 'inline'))
                            .append('span')
                            .text(t('login'))
                            .on('click.login', function() {
                                d3_event.preventDefault();
                                osm.authenticate();
                            });
                    } else {
                        // eslint-disable-next-line no-warning-comments
                        // TODO: nice messages for different error types
                        selection.text(t('status.error'));
                    }

                } else if (apiStatus === 'readonly') {
                    selection.text(t('status.readonly'));
                } else if (apiStatus === 'offline') {
                    selection.text(t('status.offline'));
                }

                selection.attr('class', 'api-status ' + (err ? 'error' : apiStatus));
            });
        }

        osm.on('change', function() { update(selection); });

        window.setInterval(update, 90000);
        update(selection);
    };
}
