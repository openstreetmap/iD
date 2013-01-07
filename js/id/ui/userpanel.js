iD.userpanel = function(connection) {
    var event = d3.dispatch('logout', 'login');

    function user(selection) {
        function update() {
            selection.html('');
            if (connection.authenticated()) {
                selection.style('display', 'block');
                connection.userDetails(function(user_details) {
                    if (user_details.image_url) {
                        selection.append('img')
                            .attr('class', 'icon icon-pre-text')
                            .attr('src', user_details.image_url);
                    } else {
                        selection.append('span')
                            .attr('class','icon avatar icon-pre-text');
                    }
                    selection.append('span')
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
