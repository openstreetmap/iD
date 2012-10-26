iD.Inspector = function(selection) {
    var event = d3.dispatch('change', 'update');

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
                      d.entityType + '/' + d.id)
                .text('#' + d.id);

            var table = d3.select(this)
                .append('table')
                .attr('class', 'inspector');

            var tbody = table.append('tbody');

            table.append('thead').append('tr').selectAll('th')
                .data(['tag', 'value'])
                .enter()
                .append('th')
                    .text(String);

            var row = tbody.selectAll('tr')
                .data(d3.entries(d.tags))
                .enter()
                .append('tr');

            row.append('td').append('input')
                .property('value', function(d) { return d.key; })
                .on('change', function(row) {
                    row.key = this.key;
                    event.update(d, newtags());
                });

            row.append('td').append('input')
                .attr('class', 'tag-value')
                .property('value', function(d) { return d.value; })
                .on('change', function(row) {
                    row.value = this.value;
                    event.update(d, newtags());
                });

            // TODO: there must be a function for this
            function unentries(x) {
                var obj = {};
                for (var i = 0; i < x.length; i++) {
                    obj[x[i].key] = x[i].value;
                }
                return obj;
            }

            function newtags() {
                var inputs = table.selectAll('input.tag-value')
                    .data();
                return unentries(inputs);
            }

            var save = d3.select(this)
                .append('button')
                .text('Save')
                .on('click', function(d, i) {
                    event.change(d, newtags());
                });
        });
    }

    return d3.rebind(inspector, event, 'on');
};
