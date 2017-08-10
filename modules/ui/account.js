import * as d3 from 'd3';
import { t } from '../util/locale';
import { svgIcon } from '../svg/index';


export function uiAccount(context) {
    var osm = context.connection();


    function update(selection) {
        if (!osm) return;

        if (!osm.authenticated()) {
            selection.selectAll('#userLink, #logoutLink')
                .classed('hide', true);
            return;
        }

        osm.userDetails(function(err, details) {
            var userLink = selection.select('#userLink'),
                logoutLink = selection.select('#logoutLink');

            userLink.html('');
            logoutLink.html('');

            if (err) return;

            selection.selectAll('#userLink, #logoutLink')
                .classed('hide', false);

            // Link
            userLink.append('a')
                .attr('href', osm.userURL(details.display_name))
                .attr('target', '_blank');

            // Add thumbnail or dont
            if (details.image_url) {
                userLink.append('img')
                    .attr('class', 'icon pre-text user-icon')
                    .attr('src', details.image_url);
            } else {
                userLink
                    .call(svgIcon('#icon-avatar', 'pre-text light'));
            }

            // Add user name
            userLink.append('span')
                .attr('class', 'label')
                .text(details.display_name);

            logoutLink.append('a')
                .attr('class', 'logout')
                .attr('href', '#')
                .text(t('logout'))
                .on('click.logout', function() {
                    d3.event.preventDefault();
                    osm.logout();
                });
        });
    }


    return function(selection) {
        selection.append('li')
            .attr('id', 'logoutLink')
            .classed('hide', true);

        selection.append('li')
            .attr('id', 'userLink')
            .classed('hide', true);

        if (osm) {
            osm.on('change.account', function() { update(selection); });
            update(selection);
        }
    };
}
