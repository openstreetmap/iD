iD.modes.Save = function(context) {
    var ui = iD.ui.Commit(context)
        .on('cancel', cancel)
        .on('save', save);

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    function save(e) {
        var altGraph = iD.Graph(context.history().base(), true),
            history = context.history(),
            connection = context.connection(),
            changes = history.changes(iD.actions.DiscardTags(history.difference())),
            loading = iD.ui.Loading(context).message(t('save.uploading')).blocking(true),
            toCheck = _.pluck(changes.modified, 'id'),
            toMerge = [];
            errors = [];

        context.container()
            .call(loading);

        // check for version conflicts.. reload modified entities into an alternate graph.
        context.altGraph(altGraph);
        _.each(toCheck, check);

        function check(id) {
            connection.loadEntity(id, function(err) {
                toCheck = _.without(toCheck, id);

                if (err) {
                    errors.push(err.responseText);
                }
                else {
                    var entity = context.graph().entity(id),
                        altEntity = context.altGraph().entity(id);

                    if (entity.version !== altEntity.version) {
                        toMerge.push(id);
                        errors.push('Version mismatch for ' + id + ': local=' + entity.version + ', server=' + altEntity.version);
                    }
                }

                if (!toCheck.length) {
                    finalize();
                }
            });
        }

        function merge() {
            var diff = context.history().difference(),
                altDiff = iD.Difference(context.history().base(), context.altGraph());

            // TODO
            debugger;
        }

        function finalize() {
            if (toMerge.length) merge();

            if (errors.length) {
                showErrors();
            } else {
                connection.putChangeset(
                    changes,
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
