describe('iD.uiSectionChanges', function() {
    var context, element;

    function render() {
        var section = iD.uiSectionChanges(context).expandedByDefault(true);
        element.call(section.render);
    }

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
        element = d3.select('body')
            .append('div')
            .attr('class', 'ui-wrap');
    });

    afterEach(function() {
        d3.selectAll('.ui-wrap').remove();
    });

    it('shows split notice and grouped change lists for multi-changeset uploads', function() {
        var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
        var n2 = iD.osmNode({ id: 'n2', loc: [100, 50] });

        context.history().perform(iD.actionAddEntity(n1), iD.actionAddEntity(n2), 'add distant nodes');
        render();

        expect(element.select('.changeset-multi-message').classed('hide')).to.equal(false);
        expect(element.select('.changeset-multi-message').text()).to.contain('too far apart');
        expect(element.selectAll('.changeset-group').size()).to.equal(2);

        var listCounts = element.selectAll('.changeset-group .changeset-list')
            .nodes()
            .map(function(node) { return node.querySelectorAll('li').length; });

        expect(listCounts).to.eql([1, 1]);
    });

    it('hides split notice and keeps a single changes list when not splitting', function() {
        var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
        var n2 = iD.osmNode({ id: 'n2', loc: [0.001, 0.001] });

        context.history().perform(iD.actionAddEntity(n1), iD.actionAddEntity(n2), 'add nearby nodes');
        render();

        expect(element.select('.changeset-multi-message').classed('hide')).to.equal(true);
        expect(element.selectAll('.changeset-group').size()).to.equal(1);
        expect(element.selectAll('.changeset-group .changeset-list li').size()).to.equal(2);
    });
});
