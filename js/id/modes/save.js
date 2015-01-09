iD.modes.Save = function(context) {
    var ui = iD.ui.Commit(context)
        .on('cancel', cancel)
        .on('save', save);

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    function save(e) {
        var loading = iD.ui.Loading(context).message(t('save.uploading')).blocking(true),
            history = context.history(),
            altGraph = iD.Graph(history.base(), true),
            toCheck = _.pluck(history.changes().modified, 'id'),
            didMerge = false,
            conflicts = [],
            errors = [];

        context.container()
            .call(loading);

        if (toCheck.length) {
            // Reload modified entities into an alternate graph and check for conflicts..
            _.each(toCheck, check);
        } else {
            finalize();
        }

        function check(id) {
            context.connection().loadEntity(id, function(err, result) {
                var graph = context.graph(),
                    local = graph.entity(id),
                    type = iD.util.displayType(id),
                    name = iD.util.displayName(local) || '';

                toCheck = _.without(toCheck, id);

                if (err) {
                    if (err.status === 410) {   // Status: Gone (contains no responseText)
                        conflicts.push({
                            id: id,
                            msg: t('save.status_gone', {id: id, type: type, name: name}),
                            details: [ t('save.status_code', {code: err.status}) ]
                        });
                    } else {
                        errors.push({
                            id: id,
                            msg: err.responseText,
                            details: [ t('save.status_code', {code: err.status}) ]
                        });
                    }

                } else {
                    _.each(result.data, function(entity) { altGraph.replace(entity); });

                    var remote = altGraph.entity(id);
                    if (local.version !== remote.version) {
                        var action = iD.actions.MergeRemoteChanges(id, graph, altGraph),
                            diff = history.perform(action);

                        if (diff.length()) {
                            didMerge = true;
                        } else {
                            conflicts.push({
                                id: id,
                                msg: t('merge_remote_changes.conflict.general', {id: id, type: type, name: name}),
                                details: action.conflicts()
                            });
                        }
                    }
                }

                if (!toCheck.length) {
                    finalize();
                }
            });
        }

        function finalize() {
            if (didMerge) {  // set undo checkpoint..
                history.perform([iD.actions.Noop, t('merge_remote_changes.annotation')]);
            }

            if (conflicts.length) {
                showConflicts();
            } else if (errors.length) {
                showErrors();
            } else {
                context.connection().putChangeset(
                    history.changes(iD.actions.DiscardTags(history.difference())),
                    e.comment,
                    history.imageryUsed(),
                    function(err, changeset_id) {
                        if (err) {
                            errors.push({
                                msg: err.responseText,
                                details: [ t('save.status_code', {code: err.status}) ]
                            });
                            showErrors();
                        } else {
                            loading.close();
                            context.flush();
                            success(e, changeset_id);
                        }
                    });
            }
        }

        function showConflicts() {
            var confirm = iD.ui.confirm(context.container());
            loading.close();

            confirm
                .select('.modal-section.header')
                .append('h3')
                .text('Conflicts!');
                // .text(t('save.error'));

            addItems(confirm, conflicts);

            confirm
                .select('.modal-section.buttons')
                .append('button')
                .attr('class', 'col2 action')
                .on('click.confirm', function() {
                    confirm.remove();
                })
                .text('NOT Ok');
                // .text(t('confirm.okay'));
        }

        function showErrors() {
            var confirm = iD.ui.confirm(context.container());
            loading.close();

            confirm
                .select('.modal-section.header')
                .append('h3')
                .text(t('save.error'));

            addItems(confirm, errors);
            confirm.okButton();
        }

        function addItems(confirm, data) {
            var message = confirm
                .select('.modal-section.message-text');

            var items = message
                .selectAll('div')
                .data(data);

            var enter = items.enter()
                .append('div')
                .attr('class', 'error-container');

            enter
                .append('a')
                .attr('class', 'error-description')
                .attr('href', '#')
                .classed('hide-toggle', true)
                .text(function(d) { return d.msg || t('save.unknown_error_details'); })
                .on('click', function() {
                    var error = d3.select(this),
                        details = d3.select(this.nextElementSibling),
                        exp = error.classed('expanded');

                    details.style('display', exp ? 'none' : 'block');
                    error.classed('expanded', !exp);

                    d3.event.preventDefault();
                });

            enter
                .append('ul')
                .attr('class', 'error-detail-list')
                .style('display', 'none')
                .selectAll('li')
                .data(function(d) { return d.details; })
                .enter()
                .append('li')
                .attr('class', 'error-detail-item')
                .text(function(d) { return d;});

            items.exit()
                .remove();
        }
    }

    function success(e, changeset_id) {
        context.enter(iD.modes.Browse(context)
            .sidebar(iD.ui.Success(context)
                .changeset({
                    id: changeset_id,
                    comment: e.comment
                })
                .on('cancel', function(ui) {
                    context.ui().sidebar.hide(ui);
                })));
    }

    var mode = {
        id: 'save'
    };

    var behaviors = [
        iD.behavior.Hover(context),
        iD.behavior.Select(context),
        iD.behavior.Lasso(context),
        iD.modes.DragNode(context).behavior];

    mode.enter = function() {
        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        context.connection().authenticate(function() {
            context.ui().sidebar.show(ui);
        });
    };

    mode.exit = function() {
        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        context.ui().sidebar.hide(ui);
    };

    return mode;
};
