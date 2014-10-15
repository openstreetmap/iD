iD.modes.Save = function(context) {
    var ui = iD.ui.Commit(context)
        .on('cancel', cancel)
        .on('save', save);

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    function save(e) {
        var loading = iD.ui.Loading(context)
            .message(t('save.uploading'))
            .blocking(true);

        context.container()
            .call(loading);

        context.connection().putChangeset(
            context.history().changes(iD.actions.DiscardTags(context.history().difference())),
            e.comment,
            context.history().imageryUsed(),
            function(err, changeset_id) {
                loading.close();
                if (err) {
                    var confirm = iD.ui.confirm(context.container());
                    var detailedErrorMessage;
                    if (typeof err.responseText === 'undefined') {
                        detailedErrorMessage = t('save.unknown_error_details');
                    } else {
                        detailedErrorMessage = err.responseText;
                    }

                    confirm
                        .select('.modal-section.header')
                        .append('h3')
                        .text(t('save.error'));
                    confirm
                        .select('.modal-section.message-text')
                        .append('p')
                        .text(detailedErrorMessage);
                } else {
                    context.flush();
                    success(e, changeset_id);
                }
            });
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
