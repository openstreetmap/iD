iD.ui.contributors = function(map) {

    function contributors(selection) {

        var users = {},
            entities = map.history().graph().intersects(map.extent());
        for (var i in entities) {
            if (entities[i].user) {
                users[entities[i].user] = true;
                if (Object.keys(users).length > 10) break;
            }
        }
        var u = Object.keys(users);
        var l = selection.selectAll('a.user-link').data(u);
        l.enter().append('a')
            .attr('class', 'user-link')
            .attr('href', function(d) { return map.connection().userUrl(d); })
            .attr('target', '_blank')
            .text(String);
        l.exit().remove();

        if (!u.length) {
            selection.transition().style('opacity', 0);
        } else if (selection.style('opacity') === '0') {
            selection.transition().style('opacity', 1);
        }

    }

    return contributors;

};
