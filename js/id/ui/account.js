iD.ui.Account = function(context) {
    var connection = context.connection();

    function update(selection) {
        if (!connection.authenticated()) {
            selection.selectAll('#userLink, #logoutLink')
                .style('display', 'none');
            return;
        }

        connection.userDetails(function(err, details) {
            var userLink = selection.select('#userLink'),
                logoutLink = selection.select('#logoutLink');

            userLink.html('');
            logoutLink.html('');

            if (err) return;

            selection.selectAll('#userLink, #logoutLink')
                .style('display', 'list-item');

            // Link
            userLink.append('a')
                .attr('href', connection.userURL(details.display_name))
                .attr('target', '_blank');

            // Add thumbnail or dont
            if (details.image_url) {
                userLink.append('img')
                    .attr('class', 'icon icon-pre-text user-icon')
                    .attr('src', details.image_url);
            } else {
                userLink.append('span')
                    .attr('class', 'icon avatar light icon-pre-text');
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
                    connection.logout();
                });
        });
    }

    return function(selection) {
        selection.append('li')
            .attr('id', 'logoutLink')
            .style('display', 'none');

        selection.append('li')
            .attr('id', 'userLink')
            .style('display', 'none');

        connection.on('auth.account', function() { update(selection); });
        update(selection);
    };
};
