iD.ui.RawMemberEditor = function(context, entity) {
    var list, disclosure;

    var rawMemberEditor = function(selection) {
        function toggled(expanded) {
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }

        disclosure = iD.ui.Disclosure()
            .title(t('inspector.all_members'))
            .expanded(true)
            .on('toggled', toggled)
            .content(content);

        selection.call(disclosure);
    };

    rawMemberEditor.change = function() {
        drawMembers();
    };

    function content(wrap) {
        list = wrap.append('ul')
            .attr('class', 'member-list');

        drawMembers();
    }

    function selectMember(d) {
        context.enter(iD.modes.Select(context, [d.member.id]));
    }

    function changeRole(d) {
        var role = d3.select(this).property('value');
        context.perform(
            iD.actions.ChangeMember(entity.id, _.extend({}, d.member, {role: role}), d.index),
            t('operations.change_role.annotation'));
    }

    function deleteMember(d) {
        context.perform(
            iD.actions.DeleteMember(entity.id, d.index),
            t('operations.delete_member.annotation.' + context.geometry(d.member.id)));
    }

    function drawMembers() {
        var memberships = [];

        entity = context.hasEntity(entity.id);
        if (!entity) return;

        entity.members.forEach(function(member, index) {
            memberships.push({member: member, index: index, entity: context.hasEntity(member.id)});
        });

        disclosure.title(t('inspector.all_members') + ' (' + memberships.length + ')');

        var li = list.selectAll('li')
            .data(memberships, function(d) { return iD.Entity.key(entity) + ',' + d.index; });

        var row = li.enter().append('li')
            .attr('class', 'member-row form-field');

        row.each(function(d) {
            if (d.entity) {
                var member = d3.select(this).append('label')
                    .attr('class', 'form-label')
                    .append('a')
                    .attr('href', '#')
                    .on('click', selectMember);

                member.append('span')
                    .attr('class', 'member-entity-type')
                    .text(function(d) { return context.presets().match(d.entity, context.graph()).name(); });

                member.append('span')
                    .attr('class', 'member-entity-name')
                    .text(function(d) { return iD.util.localeName(d.entity); });

            } else {
                d3.select(this).append('label')
                    .attr('class', 'form-label member-incomplete')
                    .text(t('inspector.incomplete'));
            }
        });

        row.append('input')
            .attr('class', 'member-role')
            .property('type', 'text')
            .attr('maxlength', 255)
            .attr('placeholder', t('inspector.role'))
            .property('value', function(d) { return d.member.role; })
            .on('change', changeRole);

        row.append('button')
            .attr('tabindex', -1)
            .attr('class', 'remove button-input-action member-delete minor')
            .on('click', deleteMember)
            .append('span')
            .attr('class', 'icon delete');

        li.exit()
            .remove();
    }

    return rawMemberEditor;
};
