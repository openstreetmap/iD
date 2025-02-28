import { setTimeout } from 'node:timers/promises';

describe('iD.validations.mutually_exclusive_tags', function () {
    let context;

    beforeEach(function() {
        context = iD.coreContext().init();
    });

    function createNode(tags) {
        context.perform(
            iD.actionAddEntity({id: 'n-1', loc: [4,4], tags: tags})
        );
    }

    function validate(validator) {
        const changes = context.history().changes();
        const entities = changes.modified.concat(changes.created);
        let issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }


    it('has no errors on init', async () => {
        const validator = iD.validationMutuallyExclusiveTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('has no errors on good tags', async () => {
        createNode({'name': 'Trader Joe', 'not:name': 'Trader Jane'});
        const validator = iD.validationMutuallyExclusiveTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('flags mutually exclusive tags', async () => {
        createNode({'name': 'Trader Joe', 'noname': 'yes'});
        const validator = iD.validationMutuallyExclusiveTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        const issue = issues[0];
        expect(issue.type).to.eql('mutually_exclusive_tags');
        expect(issue.subtype).to.eql('default');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('n-1');
    });

    it('flags feature with a mutually exclusive `not:name` value', async () => {
        createNode({ shop: 'supermarket', name: 'Lous', 'not:name': 'Lous' });
        const validator = iD.validationMutuallyExclusiveTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        const issue = issues[0];
        expect(issue.type).to.eql('mutually_exclusive_tags');
        expect(issue.subtype).to.eql('same_value');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('n-1');
    });


    it('flags feature with a mutually exclusive semicolon-separated `not:name` value', async () => {
        createNode({ shop: 'supermarket', name: 'Lous', 'not:name': 'Louis\';Lous;Louis\'s' });
        const validator = iD.validationMutuallyExclusiveTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        const issue = issues[0];
        expect(issue.type).to.eql('mutually_exclusive_tags');
        expect(issue.subtype).to.eql('same_value');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('n-1');
    });
});
