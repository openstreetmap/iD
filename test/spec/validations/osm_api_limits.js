describe('iD.validations.osm_api_limits', function () {
    var context;

    beforeEach(function() {
        iD.services.osm = { maxWayNodes: function() { return 10; } };
        context = iD.coreContext().assetPath('../dist/').init();
        context.surface = () => d3.select('#nop'); // mock with NOP
    });

    function createWay(numNodes) {
        var nodes = [];
        for (var i = 0; i < numNodes; i++) {
            nodes.push(iD.osmNode({ id: 'n-' + i, loc: [i, i]}));
        }
        var w = iD.osmWay({id: 'w-1', tags: {},
            nodes: nodes.map(function(n) { return n.id; }) });

        context.perform.apply(null, nodes
            .map(function(n) { return iD.actionAddEntity(n); })
            .concat(iD.actionAddEntity(w))
        );
    }

    function validate() {
        var validator = iD.validationOsmApiLimits(context);
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

    it('flags way with more than the maximum number of allowed nodes', function() {
        createWay(12);
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('osm_api_limits');
        expect(issue.subtype).to.eql('exceededMaxWayNodes');
        expect(issue.severity).to.eql('error');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');

        var fixes = issue.fixes(context);
        expect(fixes).to.have.lengthOf(1);
        fixes[0].onClick(context);
        issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('can fix an extreme case', function() {
        createWay(33);
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];

        var fixes = issue.fixes(context);
        expect(fixes).to.have.lengthOf(1);
        fixes[0].onClick(context);
        issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('fix a simple case at an intersection vertex', function() {
        createWay(12);

        var n2 = iD.osmNode({id: 'n-0', loc: [0,0]});
        var n1 = iD.osmNode({id: 'n-8', loc: [8,8]});
        var w = iD.osmWay({id: 'w-2', nodes: ['n-0', 'n-8'], tags: {}});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );

        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];

        var fixes = issue.fixes(context);
        expect(fixes).to.have.lengthOf(1);
        fixes[0].onClick(context);
        issues = validate();
        expect(issues).to.have.lengthOf(0);

        context.graph().entity('w-1').nodes.length === 8;
    });
});
