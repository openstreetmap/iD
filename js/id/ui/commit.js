iD.commit = function() {
    var event = d3.dispatch('cancel', 'save');

    function commit(selection) {
        var changes = selection.datum(),
            header = selection.append('div').attr('class', 'header modal-section'),
            body = selection.append('div').attr('class', 'body');

        header.append('h2').text('Upload Changes to OpenStreetMap');
        header.append('p').text('The changes you upload will be visible on all maps that use OpenStreetMap data.');

        var commit = body.append('div').attr('class','modal-section');
                commit.append('textarea')
                    .attr('class', 'changeset-comment')
                    .attr('placeholder', 'Brief Description of your contributions');

        var buttonwrap = commit.append('div')
                    .attr('class', 'buttons');

        var savebutton = buttonwrap.append('button')
            .attr('class', 'action wide')
            .on('click.save', function() {
                event.save({
                    comment: d3.select('textarea.changeset-comment').node().value
                });
            });
            savebutton.append('span').attr('class','icon save icon-pre-text');
            savebutton.append('span').attr('class','label').text('Save');

        var cancelbutton = buttonwrap.append('button')
            .attr('class', 'cancel wide')
            .on('click.cancel', function() {
                event.cancel();
            });
            cancelbutton.append('span').attr('class','icon close icon-pre-text');
            cancelbutton.append('span').attr('class','label').text('Cancel');

        function changesLength(d) { return changes[d].length; }

        var section = body.selectAll('div.commit-section')
            .data(['modified', 'deleted', 'created'].filter(changesLength))
            .enter()
            .append('div').attr('class', 'commit-section modal-section fillL2');

        section.append('h3').text(String)
            .append('small')
            .attr('class', 'count')
            .text(changesLength);

        function zipSame(d) {
            var c = [], n = -1;
            for (var i = 0; i < d.length; i++) {
                var desc = {
                    name: d[i].friendlyName(),
                    type: d[i].type,
                    count: 1,
                    tagText: iD.util.tagText(d[i])
                };
                if (c[n] &&
                    c[n].name == desc.name &&
                    c[n].tagText == desc.tagText) {
                    c[n].count++;
                } else {
                    c[++n] = desc;
                }
            }
            return c;
        }

        var li = section.append('ul')
            .attr('class','changeset-list')
            .selectAll('li')
            .data(function(d) { return zipSame(changes[d]); })
            .enter()
            .append('li');

        li.append('strong').text(function(d) {
            return (d.count > 1) ? d.type + 's ' : d.type + ' ';
        });
        li.append('span')
            .text(function(d) { return d.name; })
            .attr('title', function(d) { return d.tagText; });

        li.filter(function(d) { return d.count > 1; })
            .append('span')
            .attr('class', 'count')
            .text(function(d) { return d.count; });
    }

    return d3.rebind(commit, event, 'on');
};
