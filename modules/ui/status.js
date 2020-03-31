import _throttle from 'lodash-es/throttle';
import { event as d3_event } from 'd3-selection';

import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';


export function uiStatus(context) {
    var osm = context.connection();


    return function(selection) {
        if (!osm) return;

        function update(err, apiStatus) {
            selection.html('');

            if (err) {
                if (apiStatus === 'connectionSwitched') {
                    // if the connection was just switched, we can't rely on
                    // the status (we're getting the status of the previous api)
                    return;

                } else if (apiStatus === 'rateLimited') {
                    selection
                        .text(t('osm_api_status.message.rateLimit'))
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

                    // don't allow retrying too rapidly
                    var throttledRetry = _throttle(function() {
                        // try loading the visible tiles
                        context.loadTiles(context.projection);
                        // manually reload the status too in case all visible tiles were already loaded
                        osm.reloadApiStatus();
                    }, 2000);

                    // eslint-disable-next-line no-warning-comments
                    // TODO: nice messages for different error types
                    selection
                        .text(t('osm_api_status.message.error') + ' ')
                        .append('a')
                        // let the user manually retry their connection directly
                        .text(t('osm_api_status.retry'))
                        .on('click.retry', function() {
                            d3_event.preventDefault();
                            throttledRetry();
                        });
                }

            } else if (apiStatus === 'readonly') {
                selection.text(t('osm_api_status.message.readonly'));
            } else if (apiStatus === 'offline') {
                selection.text(t('osm_api_status.message.offline'));
            }

            selection.attr('class', 'api-status ' + (err ? 'error' : apiStatus));
        }

        osm.on('apiStatusChange.uiStatus', update);

        // reload the status periodically regardless of other factors
        window.setInterval(function() {
            osm.reloadApiStatus();
        }, 90000);

        // load the initial status in case no OSM data was loaded yet
        osm.reloadApiStatus();
    };
}
