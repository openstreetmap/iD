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
            modal = iD.ui.modal(context.container());
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

        var loading = iD.ui.Loading(context)
            .message(t('save.uploading'))
            .blocking(true);

        context.container()
            .call(loading);

        connection.putChangeset(
            history.changes(iD.actions.DiscardTags(history.difference())),
            e.comment,
            history.imagery_used(),
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
                    history.reset();
                    map.flush().redraw();
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
        var extent = d.entity.extent(context.graph());
        map.centerZoom(extent.center(), Math.min(19, map.extentZoom(extent)));
        context.enter(iD.modes.Select(context, [d.entity.id]));
        modal.remove();
    }

    return function(selection) {
        var button = selection.append('button')
            .attr('class', 'save col12 disabled')
            .attr('tabindex', -1)
            .on('click', save)
            .attr('data-original-title',
                iD.ui.tooltipHtml(t('save.no_changes'), key))
            .call(bootstrap.tooltip()
                .placement('bottom')
                .html(true));

        button.append('span')
            .attr('class', 'label')
            .text(t('save.title'));

        button.append('span')
            .attr('class', 'count')
            .text('0');

        var keybinding = d3.keybinding('undo-redo')
            .on(key, save);

        d3.select(document)
            .call(keybinding);

        var numChanges = 0;

        context.history().on('change.save', function() {
            var _ = history.numChanges();
            if (_ === numChanges)
                return;
            numChanges = _;

            button
                .attr('data-original-title',
                    iD.ui.tooltipHtml(t(numChanges > 0 ?
                        'save.help' : 'save.no_changes'), key));

            button
                .classed('disabled', numChanges === 0)
                .classed('has-count', numChanges > 0);

            button.select('span.count')
                .text(numChanges);
        });
    };
};
