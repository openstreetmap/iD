iD.Inspector = function(graph) {
    var event = d3.dispatch('change', 'update', 'remove');

    function inspector(selection) {
        // http://jsfiddle.net/7WQjr/
        selection.each(function(d, i) {
            // TODO: there must be a better way to do this.
            d3.select(this).node().innerHTML = '';

            var head = d3.select(this)
                .append('div')
                .attr('class', 'head');

            head.append('h2')
                .text(iD.Util.friendlyName(d));

            head.append('a')
                .attr('class', 'permalink')
                .attr('href', 'http://www.openstreetmap.org/browse/' +
                      d.type + '/' + d.id.slice(1))
                .text('OSM');

            head.append('a')
                .attr('class', 'permalink')
                .attr('href', '#')
                .text('XML')
                .on('click', function() {
                    d3.event.stopPropagation();
                    iD.Util.codeWindow(iD.format.XML.mapping(graph.fetch(d.id)));
                });

            head.append('a')
                .attr('class', 'permalink')
                .attr('href', '#')
                .text('GeoJSON')
                .on('click', function() {
                    d3.event.stopPropagation();
                    iD.Util.codeWindow(JSON.stringify(
                        iD.format.GeoJSON.mapping(graph.fetch(d.id)), null, 2));
                });

            var table = d3.select(this)
                .append('table')
                .attr('class', 'inspector');

            table.append('thead').append('tr').selectAll('th')
                .data(['tag', 'value', ''])
                .enter()
                .append('th')
                    .text(String);

            var tbody = table.append('tbody');

            function draw(data) {
                var tr = tbody.selectAll('tr')
                    .data(data, function(d) { return d.key; });

                var row = tr.enter()
                    .append('tr');
                tr.exit().remove();

                row.append('td').append('input')
                    .attr('class', 'tag-key')
                    .property('value', function(d) { return d.key; })
                    .on('change', function(row) {
                        row.key = this.value;
                        event.update(d, newtags(table));
                        draw(formtags(table));
                    });

                row.append('td').append('input')
                    .attr('class', 'tag-value')
                    .property('value', function(d) { return d.value; })
                    .on('change', function(row) {
                        row.value = this.value;
                        event.update(d, newtags(table));
                        draw(formtags(table));
                    });

                row.append('td').attr('class', 'tag-help').append('a')
                    .text('?')
                    .attr('target', '_blank')
                    .attr('href', function(d) {
                        return 'http://taginfo.openstreetmap.org/keys/' + d.key;
                    });
            }

            var data = d3.entries(d.tags).concat([{ key: '', value: ''}]);
            draw(data);

            save = d3.select(this)
                .append('button')
                .text('Save')
                .on('click', function(d, i) {
                    event.change(d, newtags(table));
                });

            d3.select(this)
                .append('button')
                .text('Delete')
                .on('click', function(d, i) {
                    event.remove(d);
                });
        });
    }

    // TODO: there must be a function for this
    function unentries(x) {
        var obj = {};
        for (var i = 0; i < x.length; i++) {
            obj[x[i].key] = x[i].value;
        }
        return obj;
    }

    function formtags(table) {
        var t = newtags(table);
        if (Object.keys(t).indexOf('') === -1) t[''] = '';
        return d3.entries(t);
    }

    function newtags(table) {
        var inputs = table.selectAll('input.tag-value')
            .data();
        return unentries(inputs);
    }

    return d3.rebind(inspector, event, 'on');
};
