iD.ui.Commit = function(context) {
    var event = d3.dispatch('cancel', 'save', 'fix');

    function zipSame(d) {
        var c = [], n = -1;
        for (var i = 0; i < d.length; i++) {
            var desc = {
                name: d[i].friendlyName(),
                type: d[i].type,
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

        function changesLength(d) { return changes[d].length; }

        var changes = selection.datum(),
            connection = changes.connection,
            user = connection.user(),
            header = selection.append('div').attr('class', 'header modal-section fillL'),
            body = selection.append('div').attr('class', 'body');

        header.append('h2')
            .text(t('commit.title'));

        var commentSection = body.append('div')
            .attr('class', 'modal-section fillD');

        var commentField = commentSection.append('textarea')
            .attr('class', 'changeset-comment')
            .attr('placeholder', t('commit.description_placeholder'))
            .property('value',  context.storage('comment') || '');

        commentField.node().select();

        var userLink = d3.select(document.createElement('div'));

        if (user.image_url) {
            userLink.append('img')
                .attr('src', user.image_url)
                .attr('class', 'icon icon-pre-text user-icon');
        }

        userLink.append('a')
            .attr('class','user-info')
            .text(user.display_name)
            .attr('href', connection.url() + '/user/' + user.display_name)
            .attr('target', '_blank');

        commentSection.append('p')
            .attr('class', 'commit-info')
            .html(t('commit.upload_explanation', {user: userLink.html()}));

        // Confirm / Cancel Buttons
        var buttonWrap = commentSection.append('div')
            .attr('class', 'buttons cf')
            .append('div')
            .attr('class', 'button-wrap joined col4');

        var saveButton = buttonWrap.append('button')
            .attr('class', 'save action col6 button')
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

        var cancelButton = buttonWrap.append('button')
            .attr('class', 'cancel col6 button')
            .on('click.cancel', function() {
                event.cancel();
            });

        cancelButton.append('span')
            .attr('class', 'label')
            .text(t('commit.cancel'));

        var warnings = body.selectAll('div.warning-section')
            .data(iD.validate(changes, context.graph()))
            .enter()
            .append('div')
            .attr('class', 'modal-section warning-section fillL');

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
                return (d.count > 1) ? d.type + 's ' : d.type + ' ';
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
