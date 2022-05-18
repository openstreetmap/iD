import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';

export function uiAccount(context) {
    var osm = context.connection();


    function update(selection) {
        if (!osm) return;

        if (!osm.authenticated()) {
            selection.selectAll('.userLink, .logoutLink')
                .classed('hide', true);
            return;
        }

        osm.userDetails(function(err, details) {
            var userLink = selection.select('.userLink'),
                logoutLink = selection.select('.logoutLink');

            userLink.html('');
            logoutLink.html('');

            if (err || !details) return;

            selection.selectAll('.userLink, .logoutLink')
                .classed('hide', false);

            // Link
            var userLinkA = userLink.append('a')
                .attr('href', osm.userURL(details.display_name))
                .attr('target', '_blank');

            // Add thumbnail or dont
            if (details.image_url) {
                userLinkA.append('img')
                    .attr('class', 'icon pre-text user-icon')
                    .attr('src', details.image_url);
            } else {
                userLinkA
                    .call(svgIcon('#iD-icon-avatar', 'pre-text light'));
            }

            // Add user name
            userLinkA.append('span')
                .attr('class', 'label')
                .html(details.display_name);

            logoutLink.append('a')
                .attr('class', 'logout')
                .attr('href', '#')
                .call(t.append('logout'))
                .on('click.logout', function(d3_event) {
                    d3_event.preventDefault();
                    osm.logout();
                });
        });
    }


    return function(selection) {

        selection.append('li')
            .attr('class', 'userLink')
            .classed('hide', true);

        selection.append('li')
            .attr('class', 'logoutLink')
            .classed('hide', true);

        if (osm) {
            osm.on('change.account', function() { update(selection); });
            update(selection);
        }
    };
}
