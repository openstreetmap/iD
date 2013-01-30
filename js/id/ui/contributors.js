iD.ui.contributors = function(map) {

    function contributors(selection) {

        var users = {},
            limit = 3,
            entities = map.history().graph().intersects(map.extent());

        for (var i in entities) {
            if (entities[i].user) users[entities[i].user] = true;
        }

        var u = Object.keys(users),
            subset = u.slice(0, limit);

        var l = selection
            .select('.contributor-list')
            .selectAll('a.user-link')
            .data(subset, function(d) { return d; });


        l.enter().append('a')
            .attr('class', 'user-link')
            .attr('href', function(d) { return map.connection().userUrl(d); })
            .attr('target', '_blank')
            .text(String);

        l.exit().remove();

        selection
            .select('.contributor-count')
            .html('');

        if (u.length > limit) {
            selection
                .select('.contributor-count')
                .append('a')
                .attr('target', '_blank')
                .attr('href', function() {
                    var ext = map.extent();
                    return 'http://www.openstreetmap.org/browse/changesets?bbox=' + [
                        ext[0][0], ext[0][1],
                        ext[1][0], ext[1][1]];
                })
                .text(' and ' + (u.length - limit) + ' others');
        } else {
            selection
                .select('.contributor-count')
                .html('');
        }

        if (!u.length) {
            selection.transition().style('opacity', 0);
        } else if (selection.style('opacity') === '0') {
            selection.transition().style('opacity', 1);
        }

    }

    return contributors;

};
