iD.modes.Save = function(context) {
    var ui = iD.ui.Commit(context)
        .on('cancel', cancel)
        .on('fix', fix)
        .on('save', save);

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    function fix(d) {
        context.map().zoomTo(d.entity);
        context.enter(iD.modes.Select(context, [d.entity.id]));
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
                    confirm
                        .select('.modal-section.header')
                        .append('h3')
                        .text(t('save.error'));
                    confirm
                        .select('.modal-section.message-text')
                        .append('p')
                        .text(err.responseText);
                } else {
                    context.flush();
                    success(e, changeset_id);
                }
            });
    }

    function success(e, changeset_id) {
        context.ui().sidebar.hide(ui);

        ui = iD.ui.Success(context)
            .changeset({
                id: changeset_id,
                comment: e.comment
            })
            .on('cancel', cancel);

        context.ui().sidebar.show(ui);
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

        context.connection().authenticate(function(err) {
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
