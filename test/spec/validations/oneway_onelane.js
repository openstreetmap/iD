describe('iD.validations.oneway_onelane', () => {
    let context;

    beforeEach(() => {
        context = iD.coreContext().init();
    });


    function createWay(tags) {
        const n1 = iD.osmNode({ id: 'n-1', loc: [4,4] });
        const n2 = iD.osmNode({ id: 'n-2', loc: [4,5] });
        const w1 = iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );
    }


    function validate(validator) {
        const changes = context.history().changes();
        const entities = changes.modified.concat(changes.created);
        return entities.flatMap((entity) => validator(entity, context.graph()));
    }

    it('has no errors on init', (done) => {
        const validator = iD.validationOneLaneWithNoOneway();
        window.setTimeout(() => {   // async, so data will be available
            const issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('has no errors for properly tagged one-lane roads', (done) => {
        createWay({ lanes: '1', 'oneway': 'yes' });
        const validator = iD.validationOneLaneWithNoOneway();
        window.setTimeout(() => {   // async, so data will be available
            const issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('has no errors for multi-lane roads', (done) => {
        createWay({ lanes: '2' });
        const validator = iD.validationOneLaneWithNoOneway();
        window.setTimeout(() => {   // async, so data will be available
            const issues = validate(validator);
            expect(issues).to.have.lengthOf(0);
            done();
        }, 20);
    });

    it('flags roads with lanes=1 + oneway=no', (done) => {
        createWay({ lanes: '1', 'oneway': 'no' });
        const validator = iD.validationOneLaneWithNoOneway();
        window.setTimeout(() => {   // async, so data will be available
            const issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            const issue = issues[0];
            expect(issue.type).to.eql('oneway_onelane');
            expect(issue.subtype).to.eql('oneway_onelane');
            expect(issue.severity).to.eql('warning');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });

    it('flags roads with lanes=1 no oneway tag', (done) => {
        createWay({ lanes: '1' });
        const validator = iD.validationOneLaneWithNoOneway();
        window.setTimeout(() => {   // async, so data will be available
            const issues = validate(validator);
            expect(issues).to.have.lengthOf(1);
            const issue = issues[0];
            expect(issue.type).to.eql('oneway_onelane');
            expect(issue.subtype).to.eql('oneway_onelane');
            expect(issue.severity).to.eql('warning');
            expect(issue.entityIds).to.have.lengthOf(1);
            expect(issue.entityIds[0]).to.eql('w-1');
            done();
        }, 20);
    });
});
