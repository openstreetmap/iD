iD.modes.Save = function(context) {
    var ui = iD.ui.Commit(context)
        .on('cancel', cancel)
        .on('save', save);

    function choice(text, actions) {
        return {
            text: text,
            action: function() { context.perform.apply(this, actions); }
        };
    }

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
            errors = [],
            confirm;

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
                            msg: t('save.status_gone', { id: id, type: type, name: name }),
                            details: [ t('save.status_code', { code: err.status }) ],
                            choices: [
                                choice(t('save.conflict.restore'),
                                    [ iD.actions.Noop() /*FIXME*/, t('save.conflict.annotation.restore', {id: id}) ]),
                                choice(t('save.conflict.delete'),
                                    [ iD.actions.DeleteMultiple([id]), t('save.conflict.annotation.delete', {id: id}) ])
                            ]
                        });
                    } else {
                        errors.push({
                            id: id,
                            msg: err.responseText,
                            details: [ t('save.status_code', { code: err.status }) ]
                        });
                    }

                } else {
                    _.each(result.data, function(entity) { altGraph.replace(entity); });

                    var remote = altGraph.entity(id);
                    if (local.version !== remote.version) {
                        var merge = iD.actions.MergeRemoteChanges,
                            safe = merge(id, graph, altGraph),
                            diff = context.perform(safe),
                            details = safe.conflicts();

                        if (diff.length()) {
                            didMerge = true;
                        } else {
                            var forceLocal = merge(id, graph, altGraph).withOption('force_local'),
                                forceRemote = merge(id, graph, altGraph).withOption('force_remote');

                            conflicts.push({
                                id: id,
                                msg: t('save.conflict.message', { id: id, type: type, name: name }),
                                details: details,
                                choices: [
                                    choice(t('save.conflict.keep_local'),
                                        [ forceLocal, t('save.conflict.annotation.keep_local', {id: id}) ]),
                                    choice(t('save.conflict.keep_remote'),
                                        [ forceRemote, t('save.conflict.annotation.keep_remote', {id: id}) ])
                                ]
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
                context.perform(iD.actions.Noop(), t('save.conflict.annotation.safe'));
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
            confirm = iD.ui.confirm(context.container());
            loading.close();

            confirm
                .select('.modal-section.header')
                .append('h3')
                .text(t('save.conflict.header'));

            confirm
                .select('.modal-section.message-text')
                .append('div')
                .attr('class', 'conflicts-help')
                .text(t('save.conflict.help'));

            addItems(confirm, conflicts);


            var buttons = confirm
                .select('.modal-section.buttons');

            buttons
                .append('button')
                .attr('class', 'action col3')
                .on('click.try_again', function() {
                    confirm.remove();
                    save(e);
                })
                .text(t('save.conflict.try_again'));

            buttons
                .append('button')
                .attr('class', 'action col3')
                .on('click.cancel', function() {
                    confirm.remove();
                })
                .text(t('confirm.cancel'));

            buttons
                .append('button')
                .attr('class', 'action col3')
                .on('click.download', function() {
                    var diff = iD.actions.DiscardTags(history.difference()),
                        changes = history.changes(diff),
                        data = JXON.stringify(context.connection().osmChangeJXON('CHANGEME', changes)),
                        win = window.open('data:text/xml,' + encodeURIComponent(data), '_blank');

                    win.focus();
                    confirm.remove();
                })
                .text(t('save.conflict.download_changes'));
        }

        function showErrors() {
            confirm = iD.ui.confirm(context.container());
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
                .selectAll('.error-container')
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
                        detail = d3.select(this.nextElementSibling),
                        exp = error.classed('expanded');

                    detail.style('display', exp ? 'none' : 'block');
                    error.classed('expanded', !exp);

                    d3.event.preventDefault();
                });

            var details = enter
                .append('div')
                .attr('class', 'error-detail-container')
                .style('display', 'none');

            details
                .append('ul')
                .attr('class', 'error-detail-list')
                .selectAll('li')
                .data(function(d) { return d.details || []; })
                .enter()
                .append('li')
                .attr('class', 'error-detail-item')
                .text(function(d) { return d; });

            details
                .append('div')
                .attr('class', 'error-choices cf')
                .selectAll('button')
                .data(function(d) { return d.choices || []; })
                .enter()
                .append('button')
                .attr('class', 'error-choice action col2')
                .text(function(d) { return d.text; })
                .on('click', function(d) {
                    d.action();
                    d3.event.preventDefault();
                    d3.select(this.parentElement.parentElement.parentElement)
                        .transition()
                        .style('opacity', 0)
                        .remove();
                });

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
