iD.ui.Contributors = function(context) {
    var debouncedUpdate = _.debounce(function() { update(); }, 1000),
        limit = 4,
        hidden = false,
        wrap = d3.select(null);

    function update() {
        var users = {},
            entities = context.intersects(context.map().extent());

        entities.forEach(function(entity) {
            if (entity && entity.user) users[entity.user] = true;
        });

        var u = Object.keys(users),
            subset = u.slice(0, u.length > limit ? limit - 1 : limit);

        wrap.html('')
            .call(iD.svg.Icon('#icon-nearby', 'pre-text light'));

        var userList = d3.select(document.createElement('span'));

        userList.selectAll()
            .data(subset)
            .enter()
            .append('a')
            .attr('class', 'user-link')
            .attr('href', function(d) { return context.connection().userURL(d); })
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .text(String);

        if (u.length > limit) {
            var count = d3.select(document.createElement('span'));

            count.append('a')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .attr('href', function() {
                    return context.connection().changesetsURL(context.map().center(), context.map().zoom());
                })
                .text(u.length - limit + 1);

            wrap.append('span')
                .html(t('contributors.truncated_list', { users: userList.html(), count: count.html() }));

        } else {
            wrap.append('span')
                .html(t('contributors.list', { users: userList.html() }));
        }

        if (!u.length) {
            hidden = true;
            wrap
                .transition()
                .style('opacity', 0);

        } else if (hidden) {
            wrap
                .transition()
                .style('opacity', 1);
        }
    }

    return function(selection) {
        wrap = selection;
        update();

        context.connection().on('loaded.contributors', debouncedUpdate);
        context.map().on('move.contributors', debouncedUpdate);
    };
};
