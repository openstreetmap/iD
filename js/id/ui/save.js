iD.ui.save = function() {

    var map, controller;

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
                var l = iD.ui.loading('Uploading changes to OpenStreetMap.', true);
                connection.putChangeset(history.changes(), e.comment, history.imagery_used(), function(err, changeset_id) {
                    l.remove();
                    history.reset();
                    map.flush().redraw();
                    if (err) {
                        var desc = iD.ui.confirm()
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

            if (history.hasChanges()) {
                connection.authenticate(function(err) {
                    var modal = iD.ui.modal();
                    var changes = history.changes();
                    changes.connection = connection;
                    modal.select('.content')
                        .classed('commit-modal', true)
                        .datum(changes)
                        .call(iD.ui.commit(map)
                            .on('cancel', function() {
                                modal.remove();
                            })
                            .on('fix', function(d) {
                                map.extent(d.entity.extent(map.history().graph()));
                                if (map.zoom() > 19) map.zoom(19);
                                controller.enter(iD.modes.Select(d.entity));
                                modal.remove();
                            })
                            .on('save', commit));
                });
            } else {
                iD.ui.confirm().select('.description')
                    .append('h3').text('You don\'t have any changes to save.');
            }

        });

        selection.append('span')
            .attr('class', 'count');

        history.on('change.save-button', function() {
            var hasChanges = history.hasChanges();

            selection
                .property('disabled', !hasChanges)
                .classed('has-count', hasChanges)
                .select('span.count')
                    .text(history.numChanges());
        });

    }

    save.map = function(_) {
        if (!arguments.length) return map;
        map = _;
        return save;
    };

    save.controller = function(_) {
        if (!arguments.length) return controller;
        controller = _;
        return save;
    };

    return save;
};
