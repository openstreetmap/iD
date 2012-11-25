iD.Inspector = function() {
    var event = d3.dispatch('change', 'update', 'remove', 'close');

    function inspector(selection) {
        // http://jsfiddle.net/7WQjr/
        selection.each(function(entity) {
            d3.select(this).html("").append('button')
                .text('x')
                .attr('title', 'close')
                .attr('class', 'close')
                .on('click', function() {
                    event.close(entity);
                });

            var head = d3.select(this)
                .append('div')
                .attr('class', 'head');

            head.append('h2')
                .text(iD.Util.friendlyName(entity));

            head.append('a')
                .attr('class', 'permalink')
                .attr('href', 'http://www.openstreetmap.org/browse/' +
                      entity.type + '/' + entity.id.slice(1))
                .text('OSM');

            head.append('a')
                .attr('class', 'permalink')
                .attr('href', '#')
                .text('XML')
                .on('click', function() {
                    d3.event.stopPropagation();
                    iD.Util.codeWindow(iD.format.XML.mapping(entity));
                });

            head.append('a')
                .attr('class', 'permalink')
                .attr('href', '#')
                .text('GeoJSON')
                .on('click', function() {
                    d3.event.stopPropagation();
                    iD.Util.codeWindow(JSON.stringify(
                        iD.format.GeoJSON.mapping(entity), null, 2));
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
                        event.update(entity, newtags(table));
                        draw(formtags(table));
                    });

                row.append('td').append('input')
                    .attr('class', 'tag-value')
                    .property('value', function(d) { return d.value; })
                    .on('change', function(row) {
                        row.value = this.value;
                        event.update(entity, newtags(table));
                        draw(formtags(table));
                    });

                row.append('td').attr('class', 'tag-help').append('a')
                    .text('?')
                    .attr('target', '_blank')
                    .attr('href', function(d) {
                        return 'http://taginfo.openstreetmap.org/keys/' + d.key;
                    });
            }

            var data = d3.entries(entity.tags).concat([{ key: '', value: ''}]);
            draw(data);

            d3.select(this)
                .append('button')
                .attr('class', 'save')
                .text('Save')
                .on('click', function() {
                    event.change(entity, newtags(table));
                });

            d3.select(this)
                .append('button')
                .attr('class', 'delete')
                .text('Delete')
                .on('click', function() {
                    event.remove(entity);
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
