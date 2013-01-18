iD.ui.save = function() {

    var map;

    function save(selection) {

        var history = map.history(),
            connection = map.connection();

        selection.html("<span class='label'>Save</span><small id='as-username'></small>")
            .attr('title', 'Save changes to OpenStreetMap, making them visible to other users')
            .property('disabled', true)
            .call(bootstrap.tooltip()
                .placement('bottom'))
            .on('click', function() {

                function commit(e) {
                    d3.select('.shaded').remove();
                    var l = iD.ui.loading('Uploading changes to OpenStreetMap.');
                    connection.putChangeset(history.changes(), e.comment, history.imagery_used(), function(err, changeset_id) {
                        l.remove();
                        history.reset();
                        map.flush().redraw();
                        if (err) {
                            var desc = iD.confirm()
                                .select('.description');
                            desc.append('h2')
                                .text('An error occurred while trying to save');
                            desc.append('p').text(err.responseText);
                        } else {
                            var modal = iD.ui.modal();
                            modal.select('.content')
                                .classed('success-modal', true)
                                .datum({
                                    id: changeset_id,
                                    comment: e.comment
                                })
                                .call(iD.ui.success()
                                    .on('cancel', function() {
                                        modal.remove();
                                    }));
                        }
                    });
                }
                var changes = history.changes();
                var has_changes = d3.sum(d3.values(changes).map(function(c) {
                    return c.length;
                })) > 0;

                if (has_changes) {
                    connection.authenticate(function(err) {
                        var modal = iD.ui.modal();
                        var changes = history.changes();
                        changes.connection = connection;
                        modal.select('.content')
                            .classed('commit-modal', true)
                            .datum(changes)
                            .call(iD.ui.commit()
                                .on('cancel', function() {
                                    modal.remove();
                                })
                                .on('save', commit));
                    });
                } else {
                    iD.confirm().select('.description')
                        .append('h3').text('You don\'t have any changes to save.');
                }
            });

        selection.append('span')
            .attr('class', 'count');

        history.on('change.save-button', function() {
            var changes = history.changes(),
                num_changes = d3.sum(d3.values(changes).map(function(c) {
                    return c.length;
                }));

            selection
                .property('disabled', num_changes === 0)
                .classed('has-count', num_changes > 0)
                .select('span.count')
                    .text(num_changes);
        });

    }

    save.map = function(_) {
        if (!arguments.length) return map;
        map = _;
        return save;
    };

    return save;
};
