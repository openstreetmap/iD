iD.ui.Account = function(context) {
    var connection = context.connection();

    function update(selection) {
        if (!connection.authenticated()) {
            selection.html('')
                .style('display', 'none');
            return;
        }

        selection.style('display', 'block');

        connection.userDetails(function(err, details) {
            selection.html('');

            if (err) return;

            // Link
            var userLink = selection.append('a')
                .attr('href', connection.url() + '/user/' + details.display_name)
                .attr('target', '_blank');

            // Add thumbnail or dont
            if (details.image_url) {
                userLink.append('img')
                    .attr('class', 'icon icon-pre-text user-icon')
                    .attr('src', details.image_url);
            } else {
                userLink.append('span')
                    .attr('class', 'icon avatar icon-pre-text');
            }

            // Add user name
            userLink.append('span')
                .attr('class', 'label')
                .text(details.display_name);

            selection.append('a')
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
        connection.on('auth', function() { update(selection); });
        update(selection);
    };
};
