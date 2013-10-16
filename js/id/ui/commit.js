iD.ui.Commit = function(context) {
    var event = d3.dispatch('cancel', 'save'),
        presets = context.presets();

    function commit(selection) {
        var changes = context.history().changes();

        function changesLength(d) { return changes[d].length; }

        function zoomToEntity(entity) {
            context.map().zoomTo(entity);
            context.enter(iD.modes.Select(context, [entity.id]));
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

        var warnings = body.selectAll('div.warning-section')
            .data(iD.validate(changes, context.graph()))
            .enter()
            .append('div')
            .attr('class', 'modal-section warning-section fillL2');

        warnings.append('h3')
            .text(t('commit.warnings'));

        var warningLi = warnings.append('ul')
            .attr('class', 'changeset-list')
            .selectAll('li')
            .data(function(d) { return d; })
            .enter()
            .append('li');

        // only show the fix icon when an entity is given
        warningLi.filter(function(d) { return d.entity; })
            .append('button')
            .attr('class', 'minor')
            .on('click', function(d) {
                zoomToEntity(d.entity);
            })
            .append('span')
            .attr('class', 'icon warning');

        warningLi.append('strong').text(function(d) {
            return d.message;
        });

        var section = body.selectAll('div.commit-section')
            .data(['modified', 'deleted', 'created'].filter(changesLength))
            .enter()
            .append('div')
            .attr('class', 'commit-section modal-section fillL2');

        section.append('h3')
            .text(function(d) { return t('commit.' + d); })
            .append('small')
            .attr('class', 'count')
            .text(changesLength);

        var li = section.append('ul')
            .attr('class', 'changeset-list')
            .selectAll('li')
            .data(function(d) { return iD.util.relevantChanges(context.graph(), changes[d]); })
            .enter()
            .append('li');

        li.append('strong')
            .text(function(entity) {
                return entity.geometry(context.graph()) + ' ';
            });

        li.append('span')
            .text(function(entity) { return iD.util.displayName(entity); });

        li.append('button')
            .attr('class', 'minor')
            .on('click', zoomToEntity)
            .append('span')
            .attr('class', 'icon warning');
    }

    return d3.rebind(commit, event, 'on');
};
