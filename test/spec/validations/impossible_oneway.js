describe('iD.validations.impossible_oneway', function() {
    let context;

    beforeEach(() => {
        iD.services.osm = iD.serviceOsm;
        iD.services.osm.isDataLoaded = () => true;
    });

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    afterEach(() => {
        delete iD.services.osm;
    });

    function validate() {
        const validator = iD.validationImpossibleOneway(context);
        const changes = context.history().changes();
        const entities = changes.modified.concat(changes.created);
        const issues = entities.flatMap(entity =>
            validator(entity, context.graph()));
        return issues;
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    describe('highways', function() {
        it('does not flag properly connecting oneway roads', function() {
            context.perform(...[
                new iD.osmNode({ id: 'n-0', loc: [2, 1] }),
                new iD.osmNode({ id: 'n-1', loc: [1, 0] }),
                new iD.osmNode({ id: 'n-2', loc: [2, 0] }),
                new iD.osmNode({ id: 'n-3', loc: [3, 0] }),
                new iD.osmWay({ id: 'w-0', nodes: ['n-1', 'n-0', 'n-3'], tags: {
                    'highway': 'unclassified'
                }}),
                new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: {
                    'highway': 'unclassified',
                    'oneway' : 'yes'
                }}),
                new iD.osmWay({ id: 'w-2', nodes: ['n-2', 'n-3'], tags: {
                    'highway': 'unclassified',
                    'oneway' : 'yes'
                }})
            ].map(iD.actionAddEntity));

            const issues = validate();
            expect(issues).to.have.lengthOf(0);
        });

        it('flags dangling oneway end', function() {
            context.perform(...[
                new iD.osmNode({ id: 'n-0', loc: [0, 0] }),
                new iD.osmNode({ id: 'n-1', loc: [1, 0] }),
                new iD.osmNode({ id: 'n-2', loc: [2, 0] }),
                new iD.osmWay({ id: 'w-0', nodes: ['n-0', 'n-1'], tags: {
                    'highway': 'unclassified'
                }}),
                new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: {
                    'highway': 'unclassified',
                    'oneway' : 'yes'
                }})
            ].map(iD.actionAddEntity));

            const issues = validate();
            expect(issues).to.have.lengthOf(1);
            const issue1 = issues[0];
            expect(issue1.type).to.eql('impossible_oneway');
            expect(issue1.subtype).to.eql('highway');
            expect(issue1.severity).to.eql('warning');
            expect(issue1.entityIds).to.eql(['w-1', 'n-2']);
        });

        it('flags unconnected oneway start', function() {
            context.perform(...[
                new iD.osmNode({ id: 'n-0', loc: [0, 0] }),
                new iD.osmNode({ id: 'n-1', loc: [1, 0] }),
                new iD.osmNode({ id: 'n-2', loc: [2, 0] }),
                new iD.osmWay({ id: 'w-0', nodes: ['n-0', 'n-1'], tags: {
                    'highway': 'unclassified'
                }}),
                new iD.osmWay({ id: 'w-1', nodes: ['n-2', 'n-1'], tags: {
                    'highway': 'unclassified',
                    'oneway' : 'yes'
                }})
            ].map(iD.actionAddEntity));

            const issues = validate();
            expect(issues).to.have.lengthOf(1);
            const issue1 = issues[0];
            expect(issue1.type).to.eql('impossible_oneway');
            expect(issue1.subtype).to.eql('highway');
            expect(issue1.severity).to.eql('warning');
            expect(issue1.entityIds).to.eql(['w-1', 'n-2']);
        });

        it('flags oneway pointing to each other', function() {
            context.perform(...[
                new iD.osmNode({ id: 'n-0', loc: [2, 1] }),
                new iD.osmNode({ id: 'n-1', loc: [1, 0] }),
                new iD.osmNode({ id: 'n-2', loc: [2, 0] }),
                new iD.osmNode({ id: 'n-3', loc: [3, 0] }),
                new iD.osmWay({ id: 'w-0', nodes: ['n-1', 'n-0', 'n-3'], tags: {
                    'highway': 'unclassified'
                }}),
                new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: {
                    'highway': 'unclassified',
                    'oneway' : 'yes'
                }}),
                new iD.osmWay({ id: 'w-2', nodes: ['n-3', 'n-2'], tags: {
                    'highway': 'unclassified',
                    'oneway' : 'yes'
                }})
            ].map(iD.actionAddEntity));

            const issues = validate();
            expect(issues).to.have.lengthOf(2);
            const issue1 = issues[0];
            expect(issue1.type).to.eql('impossible_oneway');
            expect(issue1.subtype).to.eql('highway');
            expect(issue1.severity).to.eql('warning');
            expect(issue1.entityIds).to.eql(['w-1', 'n-2']);
            const issue2 = issues[1];
            expect(issue2.type).to.eql('impossible_oneway');
            expect(issue2.entityIds).to.eql(['w-2', 'n-2']);
        });

        it('does not flags oneway with reverse "-1" oneway direction', function() {
            context.perform(...[
                new iD.osmNode({ id: 'n-0', loc: [2, 1] }),
                new iD.osmNode({ id: 'n-1', loc: [1, 0] }),
                new iD.osmNode({ id: 'n-2', loc: [2, 0] }),
                new iD.osmNode({ id: 'n-3', loc: [3, 0] }),
                new iD.osmWay({ id: 'w-0', nodes: ['n-1', 'n-0', 'n-3'], tags: {
                    'highway': 'unclassified'
                }}),
                new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: {
                    'highway': 'unclassified',
                    'oneway' : 'yes'
                }}),
                new iD.osmWay({ id: 'w-2', nodes: ['n-3', 'n-2'], tags: {
                    'highway': 'unclassified',
                    'oneway' : '-1'
                }})
            ].map(iD.actionAddEntity));

            const issues = validate();
            expect(issues).to.have.lengthOf(0);
        });

        it('does not flag non-oneway road with secondary tags implying oneway-ness', function() {
            context.perform(...[
                new iD.osmNode({ id: 'n-0', loc: [0, 0] }),
                new iD.osmNode({ id: 'n-1', loc: [1, 0] }),
                new iD.osmNode({ id: 'n-2', loc: [2, 0] }),
                new iD.osmWay({ id: 'w-0', nodes: ['n-0', 'n-1'], tags: {
                    'highway': 'unclassified',
                }}),
                new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: {
                    'highway': 'track',
                    'piste:type': 'downhill'
                }})
            ].map(iD.actionAddEntity));

            const issues = validate();
            expect(issues).to.have.lengthOf(0);
        });
    });

    describe('waterways', function() {
        it('does not flag unconnected start or end points', function() {
            context.perform(...[
                new iD.osmNode({ id: 'n-1', loc: [1, 0] }),
                new iD.osmNode({ id: 'n-2', loc: [2, 0] }),
                new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: {
                    'waterway': 'stream'
                }})
            ].map(iD.actionAddEntity));

            const issues = validate();
            expect(issues).to.have.lengthOf(0);
        });

        it('flags waterways pointing to each other', function() {
            context.perform(...[
                new iD.osmNode({ id: 'n-1', loc: [1, 0] }),
                new iD.osmNode({ id: 'n-2', loc: [2, 0] }),
                new iD.osmNode({ id: 'n-3', loc: [3, 0] }),
                new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: {
                    'waterway': 'stream'
                }}),
                new iD.osmWay({ id: 'w-2', nodes: ['n-3', 'n-2'], tags: {
                    'waterway': 'stream'
                }})
            ].map(iD.actionAddEntity));

            const issues = validate();
            expect(issues).to.have.lengthOf(2);
            const issue1 = issues[0];
            expect(issue1.type).to.eql('impossible_oneway');
            expect(issue1.subtype).to.eql('waterway');
            expect(issue1.severity).to.eql('warning');
            expect(issue1.entityIds).to.eql(['w-1', 'n-2']);
            const issue2 = issues[1];
            expect(issue2.type).to.eql('impossible_oneway');
            expect(issue2.entityIds).to.eql(['w-2', 'n-2']);
        });
    });
});
