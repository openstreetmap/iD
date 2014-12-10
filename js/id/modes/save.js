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
            toCheck = _.pluck(history.changes().modified, 'id'),
            errors = [];

        context.container()
            .call(loading);

        // check for version conflicts.. reload modified entities into an alternate graph.
        context.altGraph(iD.Graph(history.base(), true));
        _.each(toCheck, check);

        function check(id) {
            context.connection().loadEntity(id, function(err) {
                toCheck = _.without(toCheck, id);

                if (err) {
                    errors.push(err.responseText);
                }
                else {
                    var graph = context.graph(),
                        altGraph = context.altGraph(),
                        local = graph.entity(id),
                        remote = altGraph.entity(id);

                    if (local.version !== remote.version) {
                        var diff = history.perform(iD.actions.MergeRemoteChanges(id, graph, altGraph));
                        if (!diff.length) {
                            errors.push('Version mismatch for ' + id + ': local=' + local.version + ', remote=' + remote.version);
                        }
                    }
                }

                if (!toCheck.length) {
                    finalize();
                }
            });
        }

        function finalize() {
            if (errors.length) {
                showErrors();
            } else {
                context.connection().putChangeset(
                    history.changes(iD.actions.DiscardTags(history.difference())),
                    e.comment,
                    history.imageryUsed(),
                    function(err, changeset_id) {
                        if (err) {
                            errors.push(err.responseText);
                            showErrors();
                        } else {
                            loading.close();
                            context.flush();
                            success(e, changeset_id);
                        }
                    });
            }
        }

        function showErrors() {
            var confirm = iD.ui.confirm(context.container());

            context.altGraph(undefined);
            loading.close();

            confirm
                .select('.modal-section.header')
                .append('h3')
                .text(t('save.error'));
            confirm
                .select('.modal-section.message-text')
                .append('p')
                .text(errors.join('<br/>') || t('save.unknown_error_details'));
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
