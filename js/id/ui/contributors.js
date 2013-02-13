iD.ui.Contributors = function(context) {
    function update(selection) {
        var users = {},
            limit = 3,
            entities = context.history().intersects(context.map().extent());

        for (var i in entities) {
            if (entities[i].user) users[entities[i].user] = true;
        }

        var u = Object.keys(users),
            subset = u.slice(0, limit);

        selection.html('')
            .append('span')
            .attr('class', 'icon nearby icon-pre-text');

        var userList = d3.select(document.createElement('span'));

        userList.selectAll()
            .data(subset)
            .enter()
            .append('a')
            .attr('class', 'user-link')
            .attr('href', function(d) { return context.connection().userUrl(d); })
            .attr('target', '_blank')
            .text(String);

        if (u.length > limit) {
            var count = d3.select(document.createElement('span'));

            count.append('a')
                .attr('target', '_blank')
                .attr('href', function() {
                    var ext = context.map().extent();
                    return 'http://www.openstreetmap.org/browse/changesets?bbox=' + [
                        ext[0][0], ext[0][1],
                        ext[1][0], ext[1][1]];
                })
                .text(u.length - limit);

            selection.append('span')
                .html(t('contributors.truncated_list', {users: userList.html(), count: count.html()}));
        } else {
            selection.append('span')
                .html(t('contributors.list', {users: userList.html()}));
        }

        if (!u.length) {
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
