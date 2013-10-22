iD.ui.Commit = function(context) {
    var event = d3.dispatch('cancel', 'save'),
        presets = context.presets();

    function commit(selection) {
        var changes = context.history().changes(),
            base = context.history().base(),
            relevantChanges = iD.util.relevantChanges(
                context.graph(),
                changes,
                base
            );

        function zoomToEntity(change) {
            var entity = change.entity;
            if (change.changeType !== 'deleted' &&
                context.graph().entity(entity.id).geometry(context.graph()) !== 'vertex') {
                context.map().zoomTo(entity);
                context.surface().selectAll(
                    iD.util.entityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }

        var header = selection.append('div')
            .attr('class', 'header fillL');

        header.append('button')
            .attr('class', 'fr')
            .on('click', event.cancel)
            .append('span')
            .attr('class', 'icon close');

        header.append('h3')
            .text(t('commit.title'));

        var body = selection.append('div')
            .attr('class', 'body');

        // Comment Section
        var commentSection = body.append('div')
            .attr('class', 'modal-section form-field commit-form');

        commentSection.append('label')
            .attr('class', 'form-label')
            .text(t('commit.message_label'));

        var commentField = commentSection.append('textarea')
            .attr('placeholder', t('commit.description_placeholder'))
            .property('value', context.storage('comment') || '')
            .on('blur.save', function () {
                context.storage('comment', this.value);
            });

        commentField.node().select();

        // Save Section
        var saveSection = body.append('div')
            .attr('class','modal-section fillL cf');

        var prose = saveSection.append('p')
            .attr('class', 'commit-info')
            .html(t('commit.upload_explanation'));

        context.connection().userDetails(function(err, user) {
            if (err) return;

            var userLink = d3.select(document.createElement('div'));

            if (user.image_url) {
                userLink.append('img')
                    .attr('src', user.image_url)
                    .attr('class', 'icon icon-pre-text user-icon');
            }

            userLink.append('a')
                .attr('class','user-info')
                .text(user.display_name)
                .attr('href', context.connection().userURL(user.display_name))
                .attr('tabindex', -1)
                .attr('target', '_blank');

            prose.html(t('commit.upload_explanation_with_user', {user: userLink.html()}));
        });

        // Confirm Button
        var saveButton = saveSection.append('button')
            .attr('class', 'action col4 button')
            .on('click.save', function() {
                event.save({
                    comment: commentField.node().value
                });
            });

        saveButton.append('span')
            .attr('class', 'label')
            .text(t('commit.save'));

        // Warnings
        var warnings = body.selectAll('div.warning-section')
            .data([iD.validate(changes, context.graph())])
            .enter()
            .append('div')
            .attr('class', 'modal-section warning-section fillL2')
            .style('display', function(d) { return _.isEmpty(d) ? 'none' : null; });

        warnings.append('h3')
            .text(t('commit.warnings'));

        var warningLi = warnings.append('ul')
            .attr('class', 'changeset-list')
            .selectAll('li')
            .data(function(d) { return d; })
            .enter()
            .append('li')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', warningClick);

        warningLi.append('span')
            .attr('class', 'alert icon icon-pre-text');

        warningLi.append('strong').text(function(d) {
            return d.message;
        });

        var changeSection = body.selectAll('div.commit-section')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'commit-section modal-section fillL2');

        changeSection.append('h3')
            .text('Changes')
            .append('small')
            .attr('class', 'count')
            .text(relevantChanges.length);

        var li = changeSection.append('ul')
            .attr('class', 'changeset-list')
            .selectAll('li')
            .data(function(d) {
                return relevantChanges;
            })
            .enter()
            .append('li')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', zoomToEntity);

        li.append('span')
            .attr('class', function(d) {
                var graph = d.changeType === 'deleted' ? base : context.graph();
                return graph.entity(d.entity.id).geometry(graph) + ' icon icon-pre-text';
            });

        li.append('span')
            .attr('class', 'change-type')
            .text(function(d) {
                return d.changeType + ' ';
            });

        li.append('strong')
            .attr('class', 'entity-type')
            .text(function(d) {
                var graph = d.changeType === 'deleted' ? base : context.graph();
                return context.presets().match(d.entity, graph).name();
            });

        li.append('span')
            .attr('class', 'entity-name')
            .text(function(d) {
                return ' ' + (iD.util.displayName(d.entity) || '');
            });

        li.style('opacity', 0)
            .transition()
            .style('opacity', 1);

        li.style('opacity', 0)
            .transition()
            .style('opacity', 1);

        function mouseover(d) {
            if (d.entity) {
                context.surface().selectAll(
                    iD.util.entityOrMemberSelector([d.entity.id], context.graph())
                ).classed('hover', true);
            }
        }

        function mouseout() {
            context.surface().selectAll('.hover')
                .classed('hover', false);
        }

        function warningClick(d) {
            if (d.entity) context.enter(iD.modes.Select(context, [d.entity.id]));
        }
    }

    return d3.rebind(commit, event, 'on');
};
