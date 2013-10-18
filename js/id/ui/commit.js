iD.ui.Commit = function(context) {
    var event = d3.dispatch('cancel', 'save'),
        presets = context.presets();

    function commit(selection) {
        var changes = context.history().changes();

        function zoomToEntity(change) {
            var entity = change.entity;
            if (change.changeType !== 'deleted') {
                context.map().zoomTo(entity);
                context.enter(iD.modes.Select(context, [entity.id]));
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
            .attr('class', 'action col3 button')
            .on('click.save', function() {
                event.save({
                    comment: commentField.node().value
                });
            });

        saveButton.append('span')
            .attr('class', 'label')
            .text(t('commit.save'));

        // Warnings
        var warningList = body.append('div')
            .attr('class', 'feature-list cf');

        var warning = warningList.selectAll('.feature-list-item')
            .data(iD.validate(changes, context.graph()));

        var warningEnter = warning.enter().append('button')
            .attr('class', 'feature-list-item')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', warningClick);

        var label = warningEnter.append('div')
            .attr('class', 'label');

        label.append('span')
            .attr('class', 'alert icon icon-pre-text');

        label.append('span')
            .attr('class', 'entity-type strong')
            .text(function(d) { return d.message; });

        // Entities
        var entityList = body.append('div')
            .attr('class', 'feature-list cf');

        var entity = entityList.selectAll('.feature-list-item')
            .data(function() {
                return iD.util.relevantChanges(context.graph(), changes, context.history().base());
            });

        var entityEnter = entity.enter().append('button')
            .attr('class', 'feature-list-item')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', zoomToEntity);

        label = entityEnter.append('div')
            .attr('class', 'label');

        label.append('span')
            .attr('class', function(d) {
                return d.entity.geometry(context.graph()) + ' icon icon-pre-text';
        });

        label.append('span')
            .attr('class', 'entity-change-type')
            .text(function(d) {
                // need to determine if we're doing some kind of changetype icon or text
                // + or - icon? red/green/yellow tinted geometry type icons?
                // for deleted: maybe cross out (like no smoking signs) the same geometry icon
                return d.changeType + ' ';
            });

        label.append('span')
            .attr('class', 'entity-type')
            .text(function(d) {
                return context.presets().match(d.entity, context.graph()).name();
            });

        label.append('span')
            .attr('class', 'entity-name')
            .text(function(d) { return iD.util.displayName(d.entity) || ''; });

        entityEnter.style('opacity', 0)
            .transition()
            .style('opacity', 1);

        warningEnter.style('opacity', 0)
            .transition()
            .style('opacity', 1);

        function mouseover(d) {
            if (d.entity) {
                context.surface().selectAll(iD.util.entityOrMemberSelector([d.entity.id], context.graph()))
                    .classed('hover', true);
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

// TODO:
// indicate changetype
// indicate changed geo/tags
// check for and indicate if entity is a member of a multipolygon
    // there's probably something somewhere for doing that
