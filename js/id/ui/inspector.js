iD.Inspector = function() {
    var event = d3.dispatch('changeTags', 'changeWayDirection', 'update', 'remove', 'close');

    function drawhead(selection) {
        selection.html('');
        selection.append('h2')
            .text(iD.Util.friendlyName(selection.datum()));
        selection.append('a')
            .attr('class', 'permalink')
            .attr('href', function(d) {
                return 'http://www.openstreetmap.org/browse/' +
                  d.type + '/' + d.id.slice(1);
            })
            .text('View on OSM');
        selection.append('a')
            .attr({ 'class': 'permalink', href: '#' }).text('XML')
            .on('click', function(d) {
                d3.event.stopPropagation();
                iD.Util.codeWindow(iD.format.XML.mapping(d));
            });
        selection.append('a')
            .attr({ 'class': 'permalink', href: '#' }).text('GeoJSON')
            .on('click', function(d) {
                d3.event.stopPropagation();
                iD.Util.codeWindow(JSON.stringify(
                    iD.format.GeoJSON.mapping(d), null, 2));
            });
        if (selection.datum().type === 'way') {
            selection.append('a')
                .attr('class', 'permalink')
                .attr('href', '#')
                .text('Reverse Direction')
                .on('click', function(d) {
                    event.changeWayDirection(iD.Entity(d, {
                        nodes: _.pluck(d.nodes.slice().reverse(), 'id')
                    }));
                });
        }
    }

    function inspector(selection) {
        selection.each(function(entity) {
            selection.html("").append('button')
                .text('x').attr({ title: 'close', 'class': 'close' })
                .on('click', function() {
                    event.close(entity);
                });

            var head = selection.append('div')
                .attr('class', 'head').call(drawhead);

            var table = selection
                .append('div').attr('class', 'tag-table-wrap')
                .append('table').attr('class', 'inspector');

            table.append('thead').append('tr').selectAll('th')
                .data(['tag', 'value', ''])
                .enter()
                .append('th').text(String);

            var tbody = table.append('tbody');

            function draw(data) {
                tr = tbody.selectAll('tr')
                    .data(d3.entries(data));
                tr.exit().remove();
                row = tr.enter().append('tr');
                valuetds = row.selectAll('td')
                    .data(function(d) { return [d, d]; });
                valuetds.enter().append('td').append('input')
                    .property('value', function(d, i) { return d[i ? 'value' : 'key']; })
                    .on('keyup', function(d, i) {
                        d[i ? 'value' : 'key'] = this.value;
                        update();
                    });

                row.append('td').attr('class', 'tag-help').append('a')
                    .text('?')
                    .attr('target', '_blank')
                    .attr('tabindex', -1)
                    .attr('href', function(d) {
                        return 'http://taginfo.openstreetmap.org/keys/' + d.key;
                    });
            }

            function update() {
                var grabbed = {};
                function grab(d) { grabbed[d.key] = d.value; }
                tbody.selectAll('td').each(grab);
                if (!grabbed['']) {
                    grabbed[''] = '';
                    draw(grabbed);
                }
                draw(grabbed);
                return grabbed;
            }

            var data = _.clone(entity.tags);
            draw(data);
            update();

            selection.append('button')
                .attr('class', 'save').text('Save')
                .on('click', function() {
                    event.changeTags(entity, update());
                });

            selection.append('button')
                .attr('class', 'cancel').text('Cancel')
                .on('click', function() { event.close(entity); });

            selection.append('button')
                .attr('class', 'delete').text('Delete')
                .on('click', function() { event.remove(entity); });
        });
    }


    return d3.rebind(inspector, event, 'on');
};
