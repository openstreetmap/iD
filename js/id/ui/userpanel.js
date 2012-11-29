iD.userpanel = function(connection) {
    var event = d3.dispatch('logout', 'login');

    function user(selection) {
        function update() {
            selection.html('');
            if (connection.authenticated()) {
                connection.userDetails(function(user_details) {
                    selection.append('span')
                        .text('signed in as ')
                        .append('a')
                            .attr('href', connection.url() + '/user/' +
                                  user_details.display_name)
                            .attr('target', '_blank')
                            .text(user_details.display_name);
                    selection
                        .append('a')
                        .attr('class', 'logout')
                        .attr('href', '#')
                        .text('logout')
                        .on('click', function() {
                            d3.event.preventDefault();
                            event.logout();
                        });
                });
            } else {
                selection
                    .append('a')
                    .attr('class', 'login')
                    .attr('href', '#')
                    .text('login')
                    .on('click', event.login);
            }
        }
        connection.on('auth', update);
        update();
    }

    return d3.rebind(user, event, 'on');
};
