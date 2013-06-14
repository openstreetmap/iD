iD.ui.Commit = function(context) {
    var event = d3.dispatch('cancel', 'save', 'fix'),
        presets = context.presets();

    function zipSame(d) {
        var c = [], n = -1;
        for (var i = 0; i < d.length; i++) {
            var desc = {
                name: d[i].tags.name || presets.match(d[i], context.graph()).name(),
                geometry: d[i].geometry(context.graph()),
                count: 1,
                tagText: iD.util.tagText(d[i])
            };
            if (c[n] &&
                c[n].name == desc.name &&
                c[n].tagText == desc.tagText) {
                c[n].count++;
            } else {
                c[++n] = desc;
            }
        }
        return c;
    }

    function commit(selection) {
        var changes = context.history().changes();

        function changesLength(d) { return changes[d].length; }

        var header = selection.append('div')
            .attr('class', 'header fillL');

        header.append('button')
            .attr('class', 'fr')
            .append('span')
            .attr('class', 'icon close')
            .on('click', event.cancel);

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
            .property('value', context.storage('comment') || '');

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
                var comment = commentField.node().value;
                localStorage.comment = comment;
                event.save({
                    comment: comment
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
            .on('click', event.fix)
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
            .data(function(d) { return zipSame(changes[d]); })
            .enter()
            .append('li');

        li.append('strong')
            .text(function(d) {
                return d.geometry + ' ';
            });

        li.append('span')
            .text(function(d) { return d.name; })
            .attr('title', function(d) { return d.tagText; });

        li.filter(function(d) { return d.count > 1; })
            .append('span')
            .attr('class', 'count')
            .text(function(d) { return d.count; });
    }

    return d3.rebind(commit, event, 'on');
};
