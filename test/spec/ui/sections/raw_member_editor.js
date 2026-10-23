import { select as d3_select, selectAll as d3_selectAll } from 'd3-selection';

describe('iD.uiSectionRawMemberEditor', function() {
    var memberEditor, element, relation, way1, way2, way3, context;

    function render() {
        memberEditor = iD.uiSectionRawMemberEditor(context)
            .entityIDs([relation.id]);

        element = d3_select('body')
            .append('div')
            .attr('class', 'ui-wrap')
            .call(memberEditor.render);
    }

    beforeEach(function () {
        way1 = new iD.osmWay({ id: 'w1', tags: { highway: 'residential' } });
        way2 = new iD.osmWay({ id: 'w2', tags: { highway: 'residential' } });
        way3 = new iD.osmWay({ id: 'w3', tags: { highway: 'residential' } });
        relation = new iD.osmRelation({
            id: 'r1',
            tags: { type: 'route', route: 'bus' },
            members: [
                { id: 'w1', type: 'way', role: 'forward' },
                { id: 'w2', type: 'way', role: 'backward' },
                { id: 'w3', type: 'way', role: '' }
            ]
        });

        context = iD.coreContext().assetPath('../dist/').init();
        context.history().merge([way1, way2, way3, relation]);
        render();
    });

    afterEach(function () {
        d3_selectAll('.ui-wrap')
            .remove();
    });

    it('creates list elements for each relation member', function () {
        expect(element.selectAll('.member-list li.member-row').size()).toEqual(3);
    });

    it('preserves existing DOM nodes when moving a member', function () {
        var initialNodes = element.selectAll('.member-list li.member-row').nodes();
        expect(initialNodes.length).toEqual(3);

        // Move member 0 to index 1 (way1 from index 0 to index 1)
        context.perform(iD.actionMoveMember(relation.id, 0, 1));
        memberEditor.reRender();

        var updatedNodes = element.selectAll('.member-list li.member-row').nodes();
        expect(updatedNodes.length).toEqual(3);

        // The node for way1 (previously at index 0) should now be at index 1
        expect(updatedNodes[1]).toBe(initialNodes[0]);
        // The node for way2 (previously at index 1) should now be at index 0
        expect(updatedNodes[0]).toBe(initialNodes[1]);
        // The node for way3 should remain unchanged
        expect(updatedNodes[2]).toBe(initialNodes[2]);
    });

    it('preserves other DOM nodes when deleting a member', function () {
        var initialNodes = element.selectAll('.member-list li.member-row').nodes();
        expect(initialNodes.length).toEqual(3);

        // Delete member at index 1 (way2)
        context.perform(iD.actionDeleteMember(relation.id, 1));
        memberEditor.reRender();

        var updatedNodes = element.selectAll('.member-list li.member-row').nodes();
        expect(updatedNodes.length).toEqual(2);

        // Remaining nodes should be way1 and way3 (exact same DOM nodes)
        expect(updatedNodes[0]).toBe(initialNodes[0]);
        expect(updatedNodes[1]).toBe(initialNodes[2]);
    });
});
