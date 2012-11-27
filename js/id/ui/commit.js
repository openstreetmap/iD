iD.commit = function() {
    var event = d3.dispatch('cancel', 'save');

    function commit(selection) {
        var changes = selection.datum(),
            header = selection.append('div').attr('class', 'header'),
            body = selection.append('div').attr('class', 'body');

        header.append('h2').text('Save Changes to OpenStreetMap');

        var section = body.selectAll('div.section')
            .data(['modify', 'delete', 'create'].filter(function(d) {
                return changes[d].length;
            }))
            .enter()
            .append('div').attr('class', 'section');

        section.append('h3').text(String)
            .append('small')
            .attr('class', 'count')
            .text(function(d) { return changes[d].length; });

        var li = section.append('ul')
            .selectAll('li')
            .data(function(d) { return changes[d]; })
            .enter()
            .append('li');

        li.append('strong').text(function(d) {
            return d.type + ' ';
        });
        li.append('span').text(function(d) {
             return iD.Util.friendlyName(d);
        });

        body.append('textarea')
            .attr('class', 'changeset-comment')
            .attr('placeholder', 'Brief Description');

        body.append('button').text('Save')
            .on('click', function() {
                event.save({
                    comment: d3.select('textarea.changeset-comment').node().value
                });
            });
        body.append('button').text('Cancel')
            .on('click', function() {
                event.cancel();
            });
    }

    return d3.rebind(commit, event, 'on');
};
