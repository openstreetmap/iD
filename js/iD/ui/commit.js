iD.Commit = function() {
    var event = d3.dispatch();

    function commit(selection) {
        var changes = selection.datum();
        var header = selection.append('div').attr('class', 'header');
        var body = selection.append('div').attr('class', 'body');

        header.append('h2').text('Save Changes to OpenStreetMap');

        var section = body.selectAll('div.section')
            .data(['modify', 'delete', 'create'])
            .enter()
            .append('div').attr('class', 'section');
        section.append('h3').text(String);
        section.append('ul')
            .selectAll('li')
            .data(function(d) {
                return changes[d];
            })
            .enter()
            .append('li')
            .text(function(d) {
                return d.type + iD.Util.friendlyName(d);
            });

        body.append('button').text('Save');
        body.append('button').text('Cancel');
    }

    return d3.rebind(commit, event, 'on');
};
