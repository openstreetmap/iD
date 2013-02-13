iD.ui.Save = function(context) {
    var map = context.map(),
        history = context.history(),
        connection = context.connection(),
        key = iD.ui.cmd('⌘S'),
        modal;

    function save() {
        d3.event.preventDefault();

        if (!history.hasChanges()) return;

        connection.authenticate(function(err) {
            var modal = iD.ui.modal(context.container());
            var changes = history.changes();
            changes.connection = connection;
            modal.select('.content')
                .classed('commit-modal', true)
                .datum(changes)
                .call(iD.ui.Commit(context)
                    .on('cancel', function() {
                        modal.remove();
                    })
                    .on('fix', clickFix)
                    .on('save', commit));
        });
    }

    function commit(e) {
        context.container().select('.shaded')
            .remove();

        var loading = iD.ui.loading(context.container(), t('save.uploading'), true);

        connection.putChangeset(
            history.changes(),
            e.comment,
            history.imagery_used(),
            function(err, changeset_id) {
                loading.remove();
                history.reset();
                map.flush().redraw();
                if (err) {
                    var desc = iD.ui.confirm()
                        .select('.description');
                    desc.append('h2')
                        .text(t('save.error'));
                    desc.append('p').text(err.responseText);
                } else {
                    success(e, changeset_id);
                }
            });
    }

    function success(e, changeset_id) {
        modal = iD.ui.modal(context.container());
        modal.select('.content')
            .classed('success-modal', true)
            .datum({
                id: changeset_id,
                comment: e.comment
            })
            .call(iD.ui.Success(connection)
                .on('cancel', function() {
                    modal.remove();
                }));
    }

    function clickFix(d) {
        map.extent(d.entity.extent(context.graph()));
        if (map.zoom() > 19) map.zoom(19);
        context.enter(iD.modes.Select(context, [d.entity.id]));
        modal.remove();
    }

    return function(selection) {
        var button = selection.append('button')
            .attr('class', 'save col12 disabled')
            .attr('tabindex', -1)
            .on('click', save)
            .call(bootstrap.tooltip()
                .placement('bottom')
                .html(true)
                .title(iD.ui.tooltipHtml(t('save.help'), key)));

        button.append('span')
            .attr('class', 'label')
            .text(t('save.title'));

        button.append('span')
            .attr('class', 'count');

        var keybinding = d3.keybinding('undo-redo')
            .on(key, save);

        d3.select(document)
            .call(keybinding);

        context.history().on('change.save', function() {
            var hasChanges = history.hasChanges();

            button
                .classed('disabled', !hasChanges)
                .classed('has-count', hasChanges);

            button.select('span.count')
                .text(history.numChanges());
        });
    };
};
