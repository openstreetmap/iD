import * as d3 from 'd3';
import { t } from '../util/locale';
import { svgIcon } from '../svg/index';


export function uiStatus(context) {
    var osm = context.connection();


    return function(selection) {
        if (!osm) return;

        function update() {
            osm.status(function(err, apiStatus) {
                selection.html('');

                if (err) {
                    if (apiStatus === 'rateLimited') {
                        selection
                            .text(t('status.rateLimit'))
                            .append('a')
                            .attr('class', 'api-status-login')
                            .attr('target', '_blank')
                            .call(svgIcon('#icon-out-link', 'inline'))
                            .append('span')
                            .text(t('login'))
                            .on('click.login', function() {
                                d3.event.preventDefault();
                                osm.authenticate();
                            });
                    } else {
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
