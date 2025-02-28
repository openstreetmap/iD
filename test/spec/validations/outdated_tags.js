import { setTimeout } from 'node:timers/promises';

describe('iD.validations.outdated_tags', function () {
    let context;

    before(function() {
        iD.fileFetcher.cache().deprecated = [
          { old: { highway: 'no' } },
          { old: { highway: 'ford' }, replace: { ford: '*' } }
        ];
    });

    after(function() {
        iD.fileFetcher.cache().deprecated = [];
    });

    beforeEach(function() {
        context = iD.coreContext().init();
    });


    function createWay(tags) {
        const n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        const n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        const w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    function createRelation(wayTags, relationTags) {
        const n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        const n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        const n3 = iD.osmNode({id: 'n-3', loc: [5,5]});
        const w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-1'], tags: wayTags});
        const r = iD.osmRelation({id: 'r-1', members: [{id: 'w-1'}], tags: relationTags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(r)
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
        const validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('has no errors on good tags', async () => {
        createWay({'highway': 'unclassified'});
        const validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('flags deprecated tag with replacement', async () => {
        createWay({'highway': 'ford'});
        const validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        const issue = issues[0];
        expect(issue.type).to.eql('outdated_tags');
        expect(issue.subtype).to.eql('deprecated_tags');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags deprecated tag with no replacement', async () => {
        createWay({'highway': 'no'});
        const validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        const issue = issues[0];
        expect(issue.type).to.eql('outdated_tags');
        expect(issue.subtype).to.eql('deprecated_tags');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('ignores way with no relations', async () => {
        createWay({});
        const validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores multipolygon tagged on the relation', async () => {
        createRelation({}, { type: 'multipolygon', building: 'yes' });
        const validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        const issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });
});
