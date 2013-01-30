iD.ui.userpanel = function(connection) {
    var event = d3.dispatch('logout', 'login');

    function user(selection) {
        function update() {
            if (connection.authenticated()) {
                selection.style('display', 'block');
                connection.userDetails(function(user_details) {

                    selection.html('');

                    // Link
                    var userLink = selection.append('a')
                            .attr('href', connection.url() + '/user/' +
                                  user_details.display_name)
                            .attr('target', '_blank');

                    // Add thumbnail or dont
                    if (user_details.image_url) {
                        userLink.append('img')
                            .attr('class', 'icon icon-pre-text user-icon')
                            .attr('src', user_details.image_url);
                    } else {
                        userLink.append('span')
                            .attr('class','icon avatar icon-pre-text');
                    }

                    // Add user name
                    userLink.append('span')
                        .attr('class','label')
                        .text(user_details.display_name);

                    selection
                        .append('a')
                        .attr('class', 'logout')
                        .attr('href', '#')
                        .text(t('logout'))
                        .on('click.logout', function() {
                            d3.event.preventDefault();
                            event.logout();
                        });
                });
            } else {
                selection.html('').style('display', 'none');
            }
        }
        connection.on('auth', update);
        update();
    }

    return d3.rebind(user, event, 'on');
};
