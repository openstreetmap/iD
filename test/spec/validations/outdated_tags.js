import { setTimeout } from 'node:timers/promises';

describe('iD.validations.outdated_tags', function () {
    var context;

    before(function() {
        iD.fileFetcher.cache().deprecated = [
          { old: { building: 'roof' }, replace: { building: 'roof', layer: '1' } },
          { old: { highway: 'no' } },
          { old: { highway: 'ford' }, replace: { ford: '*' } }
        ];
        iD.services.nsi = {
            status: () => 'ok',
            upgradeTags: (tags) => {
                // mock implementation of NSI: All it does it suggest
                // adding `brand:wikidata` if there's a matching `brand`.
                const NSI = { 'Fish Bowl': 'Q110785465' };
                if (tags.brand && NSI[tags.brand] && tags['brand:wikidata'] !== NSI[tags.brand]) {
                    return {
                        matched: {},
                        newTags: { ...tags, 'brand:wikidata': NSI[tags.brand] }
                    };
                }
            },
        };
    });

    after(function() {
        iD.fileFetcher.cache().deprecated = [];
        delete iD.services.nsi;
    });

    beforeEach(function() {
        context = iD.coreContext().init();
    });


    function createWay(tags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    function createRelation(wayTags, relationTags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-1'], tags: wayTags});
        var r = iD.osmRelation({id: 'r-1', members: [{id: 'w-1'}], tags: relationTags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w),
            iD.actionAddEntity(r)
        );
    }

    function validate(validator) {
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it('has no errors on init', async () => {
        var validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('has no errors on good tags', async () => {
        createWay({'highway': 'unclassified'});
        var validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('flags deprecated tag with replacement', async () => {
        createWay({'highway': 'ford'});
        var validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('outdated_tags');
        expect(issue.subtype).to.eql('deprecated_tags');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags deprecated tag with no replacement', async () => {
        createWay({'highway': 'no'});
        var validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('outdated_tags');
        expect(issue.subtype).to.eql('deprecated_tags');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('ignores way with no relations', async () => {
        createWay({});
        var validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores multipolygon tagged on the relation', async () => {
        createRelation({}, { type: 'multipolygon', building: 'yes' });
        var validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        var issues = validate(validator);
        expect(issues).to.have.lengthOf(0);
    });

    it('flags suggestions from NSI', async () => {
        createWay({ amenity: 'fast_food', brand: 'Fish Bowl' });
        const validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        const issues = validate(validator);

        expect(issues).toHaveLength(1);
        expect(issues[0]).toMatchObject({
            type: 'outdated_tags',
            subtype: 'noncanonical_brand',
            severity: 'warning',
            entityIds: ['w-1'],
        });

        // click on "Upgrade Tags"
        issues[0].dynamicFixes()[0].onClick(context);
        expect(context.graph().entity('w-1').tags).toStrictEqual({
            amenity: 'fast_food',
            brand: 'Fish Bowl',
            'brand:wikidata': 'Q110785465', // added
        });
    });

    it('generates 2 separate issues for deprecated tags and NSI suggestions', async () => {
        createWay({ highway: 'ford', amenity: 'fast_food', brand: 'Fish Bowl' });
        const validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        const issues = validate(validator);

        expect(issues).toHaveLength(2);
        expect(issues[0]).toMatchObject({
            type: 'outdated_tags',
            subtype: 'deprecated_tags',
            severity: 'warning',
            entityIds: ['w-1'],
        });
        expect(issues[1]).toMatchObject({
            type: 'outdated_tags',
            subtype: 'noncanonical_brand',
            severity: 'warning',
            entityIds: ['w-1'],
        });

        // click on "Upgrade Tags" (to fix the deprecated issue)
        issues[0].dynamicFixes()[0].onClick(context);
        expect(context.graph().entity('w-1').tags).toStrictEqual({
            amenity: 'fast_food',
            brand: 'Fish Bowl',
            // brand:wikidata not added yet
            ford: 'yes' // tag upgraded
        });

        // click on "Upgrade Tags" (to fix the NSI suggestion)
        issues[1].dynamicFixes()[0].onClick(context);
        expect(context.graph().entity('w-1').tags).toStrictEqual({
            amenity: 'fast_food',
            brand: 'Fish Bowl',
            'brand:wikidata': 'Q110785465', // added
            ford: 'yes' // tag already added
        });
    });

    it('generates 2 separate issues for incomplete tags and NSI suggestions', async () => {
        createWay({ building: 'roof', amenity: 'fast_food', brand: 'Fish Bowl' });
        const validator = iD.validationOutdatedTags(context);
        await setTimeout(20);
        const issues = validate(validator);

        expect(issues).toHaveLength(2);
        expect(issues[0]).toMatchObject({
            type: 'outdated_tags',
            subtype: 'incomplete_tags',
            severity: 'warning',
            entityIds: ['w-1'],
        });
        expect(issues[1]).toMatchObject({
            type: 'outdated_tags',
            subtype: 'noncanonical_brand',
            severity: 'warning',
            entityIds: ['w-1'],
        });

        // click on "Upgrade Tags" (to fix the incomplete_tags issue)
        issues[0].dynamicFixes()[0].onClick(context);
        expect(context.graph().entity('w-1').tags).toStrictEqual({
            amenity: 'fast_food',
            brand: 'Fish Bowl',
            // brand:wikidata not added yet
            building: 'roof',
            layer: '1', // tag added
        });

        // click on "Upgrade Tags" (to fix the NSI suggestion)
        issues[1].dynamicFixes()[0].onClick(context);
        expect(context.graph().entity('w-1').tags).toStrictEqual({
            amenity: 'fast_food',
            brand: 'Fish Bowl',
            'brand:wikidata': 'Q110785465', // added
            building: 'roof',
            layer: '1', // tag already added
        });
    });
});
