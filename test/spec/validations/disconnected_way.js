describe('iD.validations.disconnected_way', function() {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createWay(tags) {
        var n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    function createConnectingWays(tags1, tags2) {
        var n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var n3 = new iD.osmNode({ id: 'n-3', loc: [5, 5] });
        var w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags1 });
        var w2 = new iD.osmWay({ id: 'w-2', nodes: ['n-1', 'n-3'], tags: tags2 });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(w2)
        );
    }

    function validate() {
        var validator = iD.validationDisconnectedWay(context);
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags disconnected highway', function() {
        createWay({ 'highway': 'unclassified' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('disconnected_way');
        expect(issue.subtype).to.eql('highway');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags highway connected only to service area', function() {
        createConnectingWays({ 'highway': 'unclassified' }, { 'highway': 'services' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('disconnected_way');
        expect(issue.subtype).to.eql('highway');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags disconnected highway multipolygon', function() {
        createWay({});
        const r = new iD.osmRelation({ id: 'r-1', members: [{
            type: 'way',
            id: 'w-1',
            role: 'outer'
        }], tags: {
            highway: 'pedestrian',
            type: 'multipolygon'
        } });

        context.perform(iD.actionAddEntity(r));
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('disconnected_way');
        expect(issue.subtype).to.eql('highway');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('r-1');
    });

    it('ignores highway with connected entrance vertex', function() {
        var n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4], tags: { 'entrance': 'yes' } });
        var n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var n3 = new iD.osmNode({ id: 'n-3', loc: [5, 5] });
        var w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'highway': 'unclassified' } });
        var w2 = new iD.osmWay({ id: 'w-2', nodes: ['n-1', 'n-3'] });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(w2)
        );

        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores disconnected golf walking path', function () {
        createWay({ 'highway': 'footway', 'golf': 'path' });
        expect(validate()).to.have.lengthOf(0);
    });

    it('ignores disconnected golf cartpath', function () {
        createWay({ 'highway': 'path', 'golf': 'cartpath' });
        expect(validate()).to.have.lengthOf(0);
    });

    it('considers golf path as routable when checking connectivity of other paths', function () {
        createWay();

        const n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4], tags: { 'entrance': 'yes' } });
        const n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        const n3 = new iD.osmNode({ id: 'n-3', loc: [5, 5] });
        const w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'highway': 'path', 'golf': 'cartpath' } });
        const w2 = new iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: { 'highway': 'unclassified' } });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(w2)
        );

        expect(validate()).to.have.lengthOf(0);
    });

    it('ignores disconnected aerialway', function () {
        createWay({ 'aerialway': 'gondola' });
        expect(validate()).to.have.lengthOf(0);
    });

    it('considers aerialway as routable when checking connectivity of other paths', function () {
        createWay();

        const n1 = new iD.osmNode({ id: 'n-1', loc: [4, 4], tags: { 'entrance': 'yes' } });
        const n2 = new iD.osmNode({ id: 'n-2', loc: [4, 5] });
        const n3 = new iD.osmNode({ id: 'n-3', loc: [5, 5] });
        const w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: { 'aerialway': ' 	gondola' } });
        const w2 = new iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: { 'highway': 'corridor' } });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(w2)
        );

        expect(validate()).to.have.lengthOf(0);
    });
});
