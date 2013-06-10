iD.ui.Contributors = function(context) {

    var lineheight;

    function update(selection, u, limit) {

        if (!u) {
            var users = {},
                entities = context.intersects(context.map().extent());

            entities.forEach(function(entity) {
                if (entity && entity.user) users[entity.user] = true;
            });

            limit = 4;
            u = Object.keys(users);
        }

        var subset = u.slice(0, u.length > limit ? limit - 1 : limit);

        selection.html('');

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
                    return context.connection().changesetsURL(context.map().extent());
                })
                .text(u.length - limit + 1);

            selection.append('span')
                .html(t('contributors.truncated_list', {users: userList.html(), count: count.html()}));
        } else {
            selection.append('span')
                .html(t('contributors.list', {users: userList.html()}));
        }

        lineheight = lineheight || parseInt(selection.style('line-height'), 10);

        if (selection.size()[1] > lineheight && limit > 1) {
            return update(selection, u, limit - 1);
        } else if (!u.length) {
            selection.transition().style('opacity', 0);
        } else if (selection.style('opacity') === '0') {
            selection.transition().style('opacity', 1);
        }

    }

    return function(selection) {
        update(selection);

        context.connection().on('load.contributors', function() {
            update(selection);
        });

        context.map().on('move.contributors', _.debounce(function() {
            update(selection);
        }, 500));
    };
};
