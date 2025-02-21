describe('iD.coreValidator', function() {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createInvalidWay() {
        var n1 = iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var w = iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'] });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    it('has no issues on init', function() {
        var validator = new iD.coreValidator(context);
        validator.init();
        var issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);
    });

    it('validate returns a promise, fulfilled when the validation has completed', async () => {
        createInvalidWay();
        var validator = new iD.coreValidator(context);
        validator.init();
        var issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);

        var prom = validator.validate();
        await prom;
        issues = validator.getIssues();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('missing_tag');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('removes validation issue when highway is no longer disconnected', async () => {
        // Add a way which is disconnected from the rest of the map
        var n1 = iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var w = iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'highway': 'unclassified' } });
        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
        var validator = new iD.coreValidator(context);
        validator.init();
        await validator.validate();
        // Should produce disconnected way error
        let issues = validator.getIssues();
        expect(issues).to.have.lengthOf(1);

        // Add new node with entrance node to simulate connection with rest of map
        var n3 = iD.osmNode({ id: 'n-3', loc: [4, 6], tags: { 'entrance': 'yes' } });
        var w2 = iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: { 'highway': 'unclassified' } });
        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w2)
        );
        await validator.validate();
        // Should be no errors
        issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);
    });

    it('add validation issue when highway becomes disconnected', async () => {
        // Add a way which is connected to another way with an entrance node to simulate connection with rest of map
        var n1 = iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var w = iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'highway': 'unclassified' } });
        var n3 = iD.osmNode({ id: 'n-3', loc: [4, 6], tags: { 'entrance': 'yes' } });
        var w2 = iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: { 'highway': 'unclassified' } });
        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w2)
        );
        var validator = new iD.coreValidator(context);
        validator.init();
        await validator.validate();
        // Should be no errors
        let issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);

        // delete second way -> first way becomes disconnected form the rest of the network
        context.perform(
            iD.actionDeleteWay(w2.id)
        );

        await validator.validate();
        // Should produce disconnected way error
        issues = validator.getIssues();
        expect(issues).to.have.lengthOf(1);
    });

    it('removes validation issue when untagged way is becomes part of a boundary relation', async () => {
        var n1 = iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var n3 = iD.osmNode({ id: 'n-3', loc: [4, 6] });
        var w1 = iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'note': 'foo' } });
        var w2 = iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: {} });
        var r = iD.osmRelation({ id: 'r-1', members: [{ id: 'w-2' }], tags: { 'type': 'boundary' } });
        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w1),
            iD.actionAddEntity(w2),
            iD.actionAddEntity(r)
        );
        var validator = new iD.coreValidator(context);
        validator.init();
        await validator.validate();
        // There should be a validation error about the untagged way
        let issues = validator.getIssues();
        expect(issues).to.have.lengthOf(1);

        // add way to relation
        context.perform(
            iD.actionAddMember(r.id, { id: w1.id })
        );

        await validator.validate();
        // Validation error should be fixed
        issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);
    });

    it('add validation issue when untagged way is removed from boundary relation', async () => {
        // A way is "untagged", but part of a larger (boundary) relation
        var n1 = iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var w1 = iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'note': 'foo' } });
        var r = iD.osmRelation({ id: 'r-1', members: [{ id: 'w-1' }], tags: { 'type': 'boundary' } });
        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1),
            iD.actionAddEntity(r)
        );
        var validator = new iD.coreValidator(context);
        validator.init();
        await validator.validate();
        // Should be no errors
        let issues = validator.getIssues();
        expect(issues).to.have.lengthOf(0);

        // delete relation
        context.perform(
            iD.actionDeleteRelation(r.id)
        );

        await validator.validate();
        // Should produce untagged feature error
        issues = validator.getIssues();
        expect(issues).to.have.lengthOf(1);
    });
});
