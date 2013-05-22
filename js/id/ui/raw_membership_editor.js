iD.ui.RawMembershipEditor = function(context) {
    var id;

    function selectRelation(d) {
        context.enter(iD.modes.Select(context, [d.relation.id]));
    }

    function changeRole(d) {
        var role = d3.select(this).property('value');
        context.perform(
            iD.actions.ChangeMember(d.relation.id, _.extend({}, d.member, {role: role}), d.index),
            t('operations.change_role.annotation'));
    }

    function deleteMembership(d) {
        context.perform(
            iD.actions.DeleteMember(d.relation.id, d.index),
            t('operations.delete_member.annotation.' + context.geometry(d.member.id)));
    }

    function rawMembershipEditor(selection) {
        var entity = context.entity(id),
            memberships = [];

        context.graph().parentRelations(entity).forEach(function(relation) {
            relation.members.forEach(function(member, index) {
                if (member.id === entity.id) {
                    memberships.push({relation: relation, member: member, index: index});
                }
            })
        });

        selection.call(iD.ui.Disclosure()
            .title(t('inspector.all_relations') + ' (' + memberships.length + ')')
            .expanded(true)
            .on('toggled', toggled)
            .content(content));

        function toggled(expanded) {
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }

        function content($wrap) {
            var $list = $wrap.selectAll('.member-list')
                .data([0]);

            $list.enter().append('ul')
                .attr('class', 'member-list');

            var $items = $list.selectAll('li')
                .data(memberships, function(d) { return iD.Entity.key(d.relation) + ',' + d.index; });

            var $enter = $items.enter().append('li')
                .attr('class', 'member-row form-field');

            var $label = $enter.append('label')
                .attr('class', 'form-label')
                .append('a')
                .attr('href', '#')
                .on('click', selectRelation);

            $label.append('span')
                .attr('class','member-entity-type')
                .text(function(d) { return context.presets().match(d.relation, context.graph()).name(); });

            $label.append('span')
                .attr('class', 'member-entity-name')
                .text(function(d) { return iD.util.localeName(d.relation); });

            $enter.append('input')
                .attr('class', 'member-role')
                .property('type', 'text')
                .attr('maxlength', 255)
                .attr('placeholder', t('inspector.role'))
                .property('value', function(d) { return d.member.role; })
                .on('change', changeRole);

            $enter.append('button')
                .attr('tabindex', -1)
                .attr('class', 'remove button-input-action member-delete minor')
                .on('click', deleteMembership)
                .append('span')
                .attr('class', 'icon delete');

            $items.exit()
                .remove();
        }
    }

    rawMembershipEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return rawMembershipEditor;
    };

    return rawMembershipEditor;
};
