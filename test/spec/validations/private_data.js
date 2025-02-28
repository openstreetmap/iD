describe('iD.validations.private_data', function () {
    let context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createWay(tags) {
        const n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        const n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        const n3 = iD.osmNode({id: 'n-3', loc: [5,5]});
        const w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w)
        );
    }

    function validate() {
        const validator = iD.validationPrivateData(context);
        const changes = context.history().changes();
        const entities = changes.modified.concat(changes.created);
        let issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it('has no errors on init', function() {
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores way with no tags', function() {
        createWay({});
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores way with phone tag', function() {
        createWay({ phone: '123-456-7890' });
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores generic building with phone tag', function() {
        createWay({ building: 'yes', phone: '123-456-7890' });
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores guest house with phone tag', function() {
        createWay({ building: 'house', phone: '123-456-7890', tourism: 'guest_house' });
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags house with phone tag', function() {
        createWay({ building: 'house', phone: '123-456-7890' });
        const issues = validate();
        expect(issues).to.have.lengthOf(1);
        const issue = issues[0];
        expect(issue.type).to.eql('private_data');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

});
