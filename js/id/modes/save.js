iD.modes.Save = function(context) {
    var undeletions = [],
        ui = iD.ui.Commit(context)
            .on('cancel', cancel)
            .on('save', save);

    function undelete(id) {
        return function(graph) {
            var entity = context.entity(id),
                target = iD.Entity(entity, { version: +entity.version + 1 });
            undeletions.push(id);
            return graph.replace(target);
        };
    }

    function choice(text, actions, id) {
        return {
            text: text,
            action: function() { context.perform.apply(this, actions) },
            id: id
        };
    }

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    function save(e) {
        var loading = iD.ui.Loading(context).message(t('save.uploading')).blocking(true),
            history = context.history(),
            altGraph = iD.Graph(history.base(), true),
            modified = _.pluck(history.changes().modified, 'id'),
            toCheck = _.clone(modified),
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
                    name = iD.util.displayName(local) || (type + ' ' + id);

                toCheck = _.without(toCheck, id);

                if (err) {
                    if (err.status === 410) {   // Status: Gone (contains no responseText)
                        if (undeletions.indexOf(id) === -1) {  // skip if we have already undeleted it..
                            if (local.type === 'node') {
                                checkParents(local);
                            }

                            conflicts.push({
                                id: id,
                                msg: t('save.status_gone', { name: name }),
                                details: [ t('save.status_code', { code: err.status }) ],
                                choices: [
                                    choice(t('save.conflict.restore'),
                                        [ undelete(id), t('save.conflict.annotation.restore', {id: id})], id),
                                    choice(t('save.conflict.delete'),
                                        [ iD.actions.DeleteMultiple([id]), t('save.conflict.annotation.delete', {id: id})], id)
                                ]
                            });
                        }
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
                                msg: t('save.conflict.message', { name: name }),
                                details: details,
                                choices: [
                                    choice(t('save.conflict.keep_local'),
                                        [ forceLocal, t('save.conflict.annotation.keep_local', {id: id})], id),
                                    choice(t('save.conflict.keep_remote'),
                                        [ forceRemote, t('save.conflict.annotation.keep_remote', {id: id})], id)
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

        function checkParents(entity) {
            var ids = _.pluck(context.graph().parentWays(entity), 'id');

            for (var i = 0; i < ids.length; i++) {
                if (modified.indexOf(ids[i]) === -1) {
                    modified.push(ids[i]);
                    toCheck.push(ids[i]);
                    check(ids[i]);
                }
            }
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
            confirm = context.container()
                .select('#sidebar')
                .append('div')
                    .attr('class','sidebar-component');

            loading.close();

            var header = confirm.append('div')
                .attr('class', 'header fillL');

            header.append('button')
                .attr('class', 'fr')
                .on('click', function() {
                    confirm.remove();
                })
                .append('span')
                .attr('class', 'icon close');

            header.append('h3')
                .text(t('save.conflict.header'));

            var body = confirm.append('div')
                .attr('class', 'body fillL');

            body.append('div')
                .attr('class', 'conflicts-help')
                    .text(t('save.conflict.help'))
                    .append('a')
                        .attr('class', 'conflicts-download')
                        .on('click.download', function() {
                            var diff = iD.actions.DiscardTags(history.difference()),
                                changes = history.changes(diff),
                                data = JXON.stringify(context.connection().osmChangeJXON('CHANGEME', changes)),
                                win = window.open('data:text/xml,' + encodeURIComponent(data), '_blank');

                            win.focus();
                            confirm.remove();
                        })
                        .text(t('save.conflict.download_changes'));

            var message = body.append('div')
                .attr('class','message-text conflicts-message-text');

            addItems(confirm, conflicts);

            var buttons = body
                .append('div')
                .attr('class','buttons col12 joined conflicts-buttons');

            buttons
                .append('button')
                .attr('disabled', true)
                .attr('class', 'action conflicts-button col6')
                .on('click.try_again', function() {
                    confirm.remove();
                    save(e);
                })
                .text(t('save.title'));

            buttons
                .append('button')
                .attr('class', 'secondary-action conflicts-button col6')
                .on('click.cancel', function() {
                    confirm.remove();
                })
                .text(t('confirm.cancel'));

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
                .select('.message-text');

            var items = message
                .selectAll('.error-container')
                .data(data);

            var enter = items.enter()
                .append('div')
                .attr('class', 'error-container')
                .classed('expanded', function(d, i) {
                    return i === 0;
                })
                .each(function(d,i) {
                    if (i === 0) zoomToEntity(d);
                });

            enter
                .append('a')
                .attr('class', 'error-description')
                .attr('href', '#')
                .text(function(d) { return d.msg || t('save.unknown_error_details'); })
                .on('click', function(d) {
                    toggleExpanded(this.parentElement, d);
                    d3.event.preventDefault();
                });

            var details = enter
                .append('div')
                .attr('class', 'error-detail-container')
                .style('display', function(d,i) {
                    return i === 0 ? 'block' : 'none';
                });

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
                .attr('class', 'error-choice-buttons joined cf')
                .selectAll('button')
                .data(function(d) { return d.choices || []; })
                .enter()
                .append('button')
                .attr('class', 'error-choice-button action col6')
                .text(function(d) { return d.text; })
                .on('click', function(d) {
                    d.action();
                    d3.event.preventDefault();
                    var container = this.parentElement.parentElement.parentElement;
                    var next = container.parentElement.firstElementChild.classList.contains('expanded') ? container.nextElementSibling : container.parentElement.firstElementChild;

                    window.setTimeout(function() {
                        if (next) {
                            toggleExpanded(next, d);
                        } else {
                            d3.select(container.parentElement).append('div')
                                .attr('class','conflicts-done')
                                .text(t('save.conflict.done'));

                            d3.select('.conflicts-button')
                                .attr('disabled', null);
                        }
                    }, 250);

                    d3.select(container)
                        .transition()
                        .style('opacity', 0)
                        .remove();
                });

            items.exit()
                .remove();

            function toggleExpanded(el, d) {

                var error = d3.select(el),
                    detail = d3.select(el.getElementsByTagName('div')[0]),
                    exp = error.classed('expanded');

                // Clear old expanded
                enter.classed('expanded', false);
                details.style('display', 'none');

                // Set new
                detail
                    .style('opacity', exp ? 1 : 0)
                    .transition()
                    .style('opacity', exp ? 0 : 1)
                    .style('display', exp ? 'none' : 'block');

                zoomToEntity(d);

                error.classed('expanded', !exp);
            };

            function zoomToEntity(d) {
                var entity = context.graph().entity(d.id);

                if (entity) {
                    context.map().zoomTo(entity);
                    context.surface().selectAll(
                        iD.util.entityOrMemberSelector([entity.id], context.graph()))
                        .classed('hover', true);
                }
            }

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
