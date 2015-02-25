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
            origChanges = history.changes(iD.actions.DiscardTags(history.difference())),
            localGraph = context.graph(),
            remoteGraph = iD.Graph(history.base(), true),
            modified = _.filter(history.difference().summary(), {changeType: 'modified'}),
            toCheck = _.pluck(_.pluck(modified, 'entity'), 'id'),
            deletedIds = [],
            conflicts = [],
            errors = [];

        history.perform(iD.actions.Noop());  // checkpoint
        context.container().call(loading);

        if (toCheck.length) {
            // Reload modified entities into an alternate graph and check for conflicts..
            _.each(toCheck, loadAndCheck);
        } else {
            finalize();
        }


        function loadAndCheck(id) {
            context.connection().loadEntity(id, function(err, result) {
                toCheck = _.without(toCheck, id);

                if (err) {
                    if (err.status === 410) {   // Status: Gone (contains no responseText)
                        addDeleteConflict(id, err);
                    } else {
                        errors.push({
                            id: id,
                            msg: err.responseText,
                            details: [ t('save.status_code', { code: err.status }) ]
                        });
                    }

                } else {
                    _.each(result.data, function(entity) { remoteGraph.replace(entity); });
                    checkConflicts(id);
                }

                if (!toCheck.length) {
                    finalize();
                }
            });
        }


        function addDeleteConflict(id, err) {
            if (deletedIds.indexOf(id) !== -1) return;
            else deletedIds.push(id);

            function undelete(id) {
                return function(graph) {
                    var entity = context.entity(id),
                        target = iD.Entity(entity, { version: +entity.version + 1 });
                    return graph.replace(target);
                };
            }

            var local = context.graph().entity(id);

            conflicts.push({
                id: id,
                msg: t('save.status_gone', { name: entityName(local) }),
                details: [ t('save.status_code', { code: err.status }) ],
                choices: [
                    choice(id, t('save.conflict.restore'), undelete(id)),
                    choice(id, t('save.conflict.delete'), iD.actions.DeleteMultiple([id]))
                ]
            });
        }


        function checkConflicts(id) {
            var graph = context.graph(),
                local = graph.entity(id),
                remote = remoteGraph.entity(id);

            if (local.version !== remote.version) {
                var action = iD.actions.MergeRemoteChanges,
                    merge = action(id, localGraph, remoteGraph, formatUser),
                    diff = history.replace(merge);

                if (diff.length()) return;  // merged safely

                var forceLocal = action(id, localGraph, remoteGraph, formatUser).withOption('force_local'),
                    forceRemote = action(id, localGraph, remoteGraph, formatUser).withOption('force_remote');

                conflicts.push({
                    id: id,
                    msg: t('save.conflict.message', { name: entityName(local) }),
                    details: merge.conflicts(),
                    choices: [
                        choice(id, t('save.conflict.keep_local'), forceLocal),
                        choice(id, t('save.conflict.keep_remote'), forceRemote)
                    ]
                });
            }
        }


        function finalize() {
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
            var selection = context.container()
                .select('#sidebar')
                .append('div')
                    .attr('class','sidebar-component');

            loading.close();

            var header = selection.append('div')
                .attr('class', 'header fillL');

            header.append('button')
                .attr('class', 'fr')
                .on('click', function() {
                    history.pop();
                    selection.remove();
                })
                .append('span')
                .attr('class', 'icon close');

            header.append('h3')
                .text(t('save.conflict.header'));

            var body = selection.append('div')
                .attr('class', 'body fillL');

            body.append('div')
                .attr('class', 'conflicts-help')
                    .text(t('save.conflict.help'))
                    .append('a')
                        .attr('class', 'conflicts-download')
                        .on('click.download', function() {
                            var data = JXON.stringify(context.connection().osmChangeJXON('CHANGEME', origChanges)),
                                win = window.open('data:text/xml,' + encodeURIComponent(data), '_blank');
                            win.focus();
                        })
                        .text(t('save.conflict.download_changes'));

            body.append('div')
                .attr('class','message-text conflicts-message-text');

            addConflicts(selection, conflicts);

            var buttons = body
                .append('div')
                .attr('class','buttons col12 joined conflicts-buttons');

            buttons
                .append('button')
                .attr('disabled', true)
                .attr('class', 'action conflicts-button col6')
                .on('click.try_again', function() {
                    selection.remove();
                    save(e);
                })
                .text(t('save.title'));

            buttons
                .append('button')
                .attr('class', 'secondary-action conflicts-button col6')
                .on('click.cancel', function() {
                    history.pop();
                    selection.remove();
                })
                .text(t('confirm.cancel'));
        }


        function addConflicts(selection, data) {
            var message = selection
                .select('.message-text');

            var items = message
                .selectAll('.conflict-container')
                .data(data);

            var enter = items.enter()
                .append('div')
                .attr('class', 'conflict-container')
                .classed('expanded', function(d, i) {
                    return i === 0;
                })
                .each(function(d,i) {
                    if (i === 0) zoomToEntity(d);
                });

            enter
                .append('h4')
                .style('display', function(d, i) {
                    return (i === 0) ? 'block': 'none';
                })
                .text(function(d, i) {
                    return t('save.conflict.count', { num: i+1, total: data.length });
                });

            enter
                .append('a')
                .attr('class', 'conflict-description')
                .attr('href', '#')
                .text(function(d) { return d.msg || t('save.unknown_error_details'); })
                .on('click', function(d) {
                    toggleExpanded(this.parentElement, d);
                    d3.event.preventDefault();
                });

            var details = enter
                .append('div')
                .attr('class', 'conflict-detail-container')
                .style('display', function(d, i) { return i === 0 ? 'block' : 'none'; });

            details
                .append('ul')
                .attr('class', 'conflict-detail-list');

            details
                .selectAll('li')
                .data(function(d) { return d.details || []; })
                .enter()
                .append('li')
                .attr('class', 'conflict-detail-item')
                .html(function(d) { return d; });

            details
                .each(addChoices);

            // var choices = details
            //     .append('ul')
            //     .attr('class', 'layer-list')
            //     .selectAll('li')
            //     .data(function(d) { return d.choices || []; })
            //     .enter();

            // choices
            //     .append('li')
            //     .attr('class', 'layer')
            //     .append('label')
            //     .append('input')
            //     .attr('type', 'radio')
            //     .on('change', function(d) {
            //         d.action();
            //         d3.event.preventDefault();
            //     })
            //     .append('span')
            //     .text(function(d) { return d.text; });

            // details
            //     .append('div')
            //     .attr('class', 'conflict-choice-buttons joined cf')
            //     .selectAll('button')
            //     .data(function(d) { return d.choices || []; })
            //     .enter()
            //     .append('button')
            //     .attr('class', 'conflict-choice-button action col6')
            //     .text(function(d) { return d.text; })
            //     .on('click', function(d) {
            //         d.action();
            //         d3.event.preventDefault();
            //     });

            details
                .append('div')
                .attr('class', 'conflict-choice-buttons joined cf')
                .append('button')
                .attr('class', 'conflict-choice-button action col4')
                .text(t('confirm.okay'))
                .on('click', function(d) {
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

                    d3.event.preventDefault();
                });

            items.exit()
                .remove();


            function toggleExpanded(el, d) {
                var error = d3.select(el),
                    detail = d3.select(el.getElementsByTagName('div')[0]),
                    count = d3.select(el.getElementsByTagName('h4')[0]),
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

                count
                    .style('opacity', exp ? 1 : 0)
                    .transition()
                    .style('opacity', exp ? 0 : 1)
                    .style('display', exp ? 'none' : 'block');

                zoomToEntity(d);

                error.classed('expanded', !exp);
            }

        }

        function addChoices(datum) {
            var selection = d3.select(this)
                .append('ul')
                .attr('class', 'layer-list');

            var choices = selection
                .selectAll('li')
                .data(function(d) { return d.choices || []; });

            // enter
            var enter = choices.enter()
                .append('li')
                .attr('class', 'layer');

            var label = enter
                .append('label');

            label
                .append('input')
                .attr('type', 'radio')
                .attr('name', datum.id)
                .on('change', function(d) { choose(this, d); });

            label
                .append('span')
                .text(function(d) { return d.text; });

            // update
            choices
                .selectAll('input')
                .each(function(d, i) { if (i === 0) choose(this, d); });

            // exit
            choices.exit()
                .remove();
        }

        function choose(el, datum) {
            if (d3.event) d3.event.preventDefault();

            d3.select(el.parentElement.parentElement.parentElement)
                .selectAll('li')
                .classed('active', function(d) { return d === datum; })
                .selectAll('input')
                .property('checked', function(d) { return d === datum; });

            datum.action();
        }


        function showErrors() {
            var selection = iD.ui.confirm(context.container());

            history.pop();
            loading.close();

            selection
                .select('.modal-section.header')
                .append('h3')
                .text(t('save.error'));

            addErrors(selection, errors);
            selection.okButton();
        }


        function addErrors(selection, data) {
            var message = selection
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

            items.exit()
                .remove();
        }


        function formatUser(d) {
            return '<a href="' + context.connection().userURL(d) + '" target="_blank">' + d + '</a>';
        }

        function entityName(entity) {
            return iD.util.displayName(entity) || (iD.util.displayType(entity.id) + ' ' + entity.id);
        }

        function choice(id, text, action) {
            return {
                id: id,
                text: text,
                action: function() { history.replace(action); }
            };
        }

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
