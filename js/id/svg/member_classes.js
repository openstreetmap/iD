iD.svg.MemberClasses = function(graph) {
    var tagClassRe = /^member-?/;

    return function memberClassesSelection(selection) {
        selection.each(function memberClassesEach(d, i) {
            var classes, value = this.className;

            if (value.baseVal !== undefined) value = value.baseVal;

            classes = value.trim().split(/\s+/).filter(function(name) {
                return name.length && !tagClassRe.test(name);
            }).join(' ');

            var relations = graph.parentRelations(d);

            if (relations.length) {
                classes += ' member';
            }

            relations.forEach(function (relation) {
                classes += ' member-type-' + relation.tags.type;
                classes += ' member-role-' + _.find(relation.members, function (member) { return member.id == d.id; }).role;
            });

            classes = classes.trim();

            if (classes !== value) {
                d3.select(this).attr('class', classes);
            }
        });
    };
};
