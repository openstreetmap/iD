import type { Preset, Presets } from '@openstreetmap/id-tagging-schema';
import { utilGetRelationSchema, utilGetValidRelationRoles } from '../../../modules/util/relation_schema';
import type { PresetRelationDefinitions } from '../../../modules/presets/preset';

describe('relation schema', () => {
    let _savedPresets: Presets | undefined;

    const restrictionPreset: Preset = {
        tags: { type: 'restriction' },
        geometry: ['relation'],
        name: 'Restriction',
        relation: {
            reference: 'restriction',
            allowDuplicateMembers: false,
            role_labels: { from: 'von', via: 'über', to: 'nach' },
            members: [
                { role: 'from', geometry: ['line'], matchTags: [{ highway: '*' }] },
                { role: 'via', geometry: ['vertex', 'line'] },
                { role: 'to', geometry: ['line'], matchTags: [{ highway: '*' }] },
            ],
        },
    };

    beforeAll(async () => {
        const cached = iD.fileFetcher.cache();
        _savedPresets = cached.preset_presets;
        cached.preset_presets = {
            'type/restriction': restrictionPreset,
            'type/restriction/no_left_turn': {
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                geometry: ['relation'],
                name: 'No Left Turn',
            },
        };
        await iD.presetManager.ensureLoaded(true);
    });

    afterAll(async () => {
        const cached = iD.fileFetcher.cache();
        cached.preset_presets = _savedPresets;
        await iD.presetManager.ensureLoaded(true);
    });

    describe('utilGetRelationSchema', () => {
        it('returns the label and member definition for each role', () => {
            const r1 = new iD.osmRelation({ tags: { type: 'restriction' } });
            const r2 = new iD.osmRelation({ tags: { type: 'restriction', restriction: 'no_left_turn' } });
            const r3 = new iD.osmRelation({ tags: { type: 'something' } });
            // @ts-expect-error -- blocked by one of the TS PRs
            const graph = new iD.coreGraph([r1, r2, r3]);

            const expected = {
                from: {
                    label: expect.any(String),
                    member: restrictionPreset.relation?.members[0],
                },
                via: {
                    label: expect.any(String),
                    member: restrictionPreset.relation?.members[1],
                },
                to: {
                    label: expect.any(String),
                    member: restrictionPreset.relation?.members[2],
                },
            };

            // direct relation:
            expect(utilGetRelationSchema(r1, graph)).toStrictEqual(expected);
            // indirect (obtrained from parent relation):
            expect(utilGetRelationSchema(r2, graph)).toStrictEqual(expected);
            // no defintion:
            expect(utilGetRelationSchema(r3, graph)).toStrictEqual({});
        });
    });

    describe('utilGetValidRelationRoles', () => {
        const schema: PresetRelationDefinitions = {
            from: { label: 'From', member: restrictionPreset.relation!.members[0] },
            via: { label: 'Via', member: restrictionPreset.relation!.members[1] },
            to: { label: 'To', member: restrictionPreset.relation!.members[2] },
        };

        it.each`
            geometryFilter | tagsFilter                | matches
            ${undefined}   | ${undefined}              | ${['from', 'via', 'to']}
            ${'vertex'}    | ${undefined}              | ${['via']}
            ${'line'}      | ${undefined}              | ${['from', 'via', 'to']}
            ${undefined}   | ${{ highway: 'service' }} | ${['from', 'via', 'to']}
            ${undefined}   | ${{ amenity: 'park' }}    | ${['via']}
        `('returns $matches given geom=$geometryFilter + tags=$tagsFilter', ({ geometryFilter, tagsFilter, matches }) => {
            const result = utilGetValidRelationRoles(schema, geometryFilter, tagsFilter);
            expect(Object.keys(result)).toStrictEqual(matches);
        });
    });
});
