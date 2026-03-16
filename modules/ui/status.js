import _throttle from 'lodash-es/throttle';

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
                    if (!osm.authenticated()) {
                        selection
                            .call(t.append('osm_api_status.message.rateLimit'))
                            .append('a')
                            .attr('href', '#')
                            .attr('class', 'api-status-login')
                            .attr('target', '_blank')
                            .call(svgIcon('#iD-icon-out-link', 'inline'))
                            .append('span')
                            .call(t.append('login'))
                            .on('click.login', function(d3_event) {
                                d3_event.preventDefault();
                                osm.authenticate();
                            });
                    } else {
                        selection.call(t.append('osm_api_status.message.rateLimited'));
                    }
                } else {

                    // don't allow retrying too rapidly
                    var throttledRetry = _throttle(function() {
                        // try loading the visible tiles
                        context.loadTiles(context.projection);
                        // manually reload the status too in case all visible tiles were already loaded
                        osm.reloadApiStatus();
                    }, 2000);

                    var suffix = ' ';
                    if (err) {
                        if (err.status && err.statusText) {
                            suffix = ` (${err.status} ${err.statusText}) `;
                        } else if (err.statusText) {
                            suffix = ` (${err.statusText}) `;
                        } else if (err.message) {
                            suffix = ` (${err.message}) `;
                        } else if (typeof err === 'string') {
                            suffix = ` (${err}) `;
                        }
                    }

                    selection
                        .call(t.append('osm_api_status.message.error', { suffix: suffix }))
                        .append('a')
                        .attr('href', '#')
                        // let the user manually retry their connection directly
                        .call(t.append('osm_api_status.retry'))
                        .on('click.retry', function(d3_event) {
                            d3_event.preventDefault();
                            throttledRetry();
                        });
                }

            } else if (apiStatus === 'readonly') {
                selection.call(t.append('osm_api_status.message.readonly'));
            } else if (apiStatus === 'offline') {
                selection.call(t.append('osm_api_status.message.offline'));
            }

            selection.attr('class', 'api-status ' + (err ? 'error' : apiStatus));
        }

        osm.on('apiStatusChange.uiStatus', update);

        context.history().on('storage_error', () => {
            selection.selectAll('span.local-storage-full').remove();
            selection
                .append('span')
                .attr('class', 'local-storage-full')
                .call(t.append('osm_api_status.message.local_storage_full'));
            selection.classed('error', true);
        });

        // reload the status periodically regardless of other factors
        window.setInterval(function() {
            osm.reloadApiStatus();
        }, 90000);

        // load the initial status in case no OSM data was loaded yet
        osm.reloadApiStatus();
    };
}
