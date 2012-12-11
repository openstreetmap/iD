iD.commit = function() {
    var event = d3.dispatch('cancel', 'save');

    function commit(selection) {
        var changes = selection.datum(),
            header = selection.append('div').attr('class', 'header'),
            body = selection.append('div').attr('class', 'body');

        header.append('h2').text('Upload Changes to OpenStreetMap');
        header.append('p').text('the changes you upload will be visible on all maps using OpenStreetMap data');

        var section = body.selectAll('div.commit-section')
            .data(['modified', 'deleted', 'created'].filter(function(d) {
                return changes[d].length;
            }))
            .enter()
            .append('div').attr('class', 'commit-section');

        section.append('h3').text(String)
            .append('small')
            .attr('class', 'count')
            .text(function(d) { return changes[d].length; });

        var li = section.append('ul')
            .selectAll('li')
            .data(function(d) { return changes[d]; })
            .enter()
            .append('li');

        li.append('strong').text(function(d) { return d.type + ' '; });
        li.append('span')
            .text(function(d) {
                 return iD.util.friendlyName(d);
            })
            .attr('title', iD.util.tagText);

        body.append('textarea')
            .attr('class', 'changeset-comment')
            .attr('placeholder', 'Brief Description');

        body.append('button').text('Save')
            .attr('class', 'save')
            .on('click.save', function() {
                event.save({
                    comment: d3.select('textarea.changeset-comment').node().value
                });
            });
        body.append('button').text('Cancel')
            .attr('class', 'cancel')
            .on('click.cancel', function() {
                event.cancel();
            });
    }

    return d3.rebind(commit, event, 'on');
};
