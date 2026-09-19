import { setTimeout } from 'node:timers/promises';
import { osmIdManager, type coreContext, type coreHistory, type coreUploader, type OsmEntity, type services } from '../../../modules';
import { ConflictChoiceType, type Conflict } from '../../../modules/core/uploader';
import type { OsmChange } from '../../../modules/osm/changeset';
import { osmChangeset } from '../../../modules/osm/changeset';
import { ApiError } from '../../../modules/util/error';

describe('iD.coreUploader', () => {
    let context: coreContext;
    let history: coreHistory;
    let uploader: coreUploader;
    let changeset: osmChangeset;

    // temporary hack since uploader.save is not await-able
    let isDone: Promise<void>;
    let uploaderEvents: [name: string, ...args: unknown[]][] = [];

    function spyOnEvents() {
        let _setIsDone: () => void;
        isDone = new Promise<void>((cb) => { _setIsDone = cb; });
        uploaderEvents = [];

        // spy on all events from the uploader
        const events = [
            'saveStarted',
            'saveEnded',
            'willAttemptUpload',
            'progressChanged',
            'resultNoChanges',
            'resultErrors',
            'resultConflicts',
            'resultSuccess',
        ] as const;
        for (const event of events) {
            // eslint-disable-next-line no-loop-func -- false positive
            uploader.on(event, (...args) => {
                uploaderEvents.push([event, ...args]);
                if (event === 'saveEnded') _setIsDone();
            });
        }
    }

    beforeEach(() => {
        context = iD.coreContext().assetPath('../dist/').init();
        changeset = new osmChangeset();
        context.changeset = changeset;
        history = context.history();
        uploader = context.uploader();
        spyOnEvents();
    });

    describe('merge conflicts', () => {
        /**
         * mock implementation of the OSM API, for basic uploading & downloading
         * copied from https://github.com/osmlab/osm-api-js/blob/db5276e3/src/api/changesets/__tests__/uploadChangeset.test.ts
         *
         * @param remoteEntities - what we will re-download when trying to upload the changeset
         */
        function mockMergeConflict(remoteEntities: OsmEntity[]) {
            let db = remoteEntities;

            const partial: Partial<typeof services.osm> = {
                authenticated: () => true,
                isDataLoaded: () => true,
                maxWayNodes: () => Infinity,
                updateChangesetTags: vi.fn(),
                loadMultiple: vi.fn(async (ids: string[], callback: Callback<{ data: OsmEntity[] }>) => {
                    await setTimeout(0);
                    try {
                        const data = ids.map(id => {
                            const match = db.find((x) => x.id === id);
                            if (!match) throw new ApiError(`Not Found ${id}`, 404);
                            return match;
                        });
                        callback(null, { data });
                    } catch (ex) {
                        callback(ex as Error);
                    }
                }),
                putChangeset: vi.fn((changeset: osmChangeset, osmChange: OsmChange, callback: Callback<osmChangeset>) => {
                    const newDB = [...db];
                    try {
                        // create is easy. just need to allocate a new ID
                        newDB.push(
                            ...osmChange.created.map((feature) => {
                                return feature.update({
                                    id: osmIdManager.newId(feature.type),
                                    version: 1,
                                });
                            }),
                        );

                        // modify & delete needs to check for conflicts
                        for (const type of <const>['modified', 'deleted']) {
                            for (let local of osmChange[type]) {
                                const remoteIndex = newDB.findIndex((f) => f.id === local.id);
                                const remote = newDB[remoteIndex];

                                const diffId = `${local.id}@(${local.version}…${remote?.version || ''})`;

                                if (!remote) throw new ApiError(`Not Found ${local.type}/${local.id}`, 404);
                                if (remote.version !== local.version) {
                                    throw Object.assign(new ApiError(`Conflicts ${diffId}`, 409));
                                }

                                if (type === 'deleted') {
                                    newDB.splice(remoteIndex, 1);
                                } else {
                                    newDB[remoteIndex] = local.update({ version: local.version! + 1 });
                                }
                            }
                        }
                        db = newDB; // commit changes

                        callback(null, changeset);
                    } catch (ex) {
                        callback(ex as never, changeset);
                    }
                }),
            };
            context.connection = () => partial as typeof services.osm;
        }

        /** simulates clicking the "use mine" or "use theirs" buttons, and then rëuploading */
        async function makeConflictChoice(decisions: ConflictChoiceType[]) {
            const event = uploaderEvents.find(([name]) => name === 'resultConflicts')!;
            const changeset = event[1] as osmChangeset;
            const conflicts = event[2] as Conflict[];

            expect(decisions).toHaveLength(conflicts.length); // sanity check

            for (let i = 0; i < conflicts.length; i++) {
                conflicts[i].chosen = decisions[i];
                const choice = conflicts[i].choices.find(c => c.choiceType === decisions[i])!;
                choice.action();
            }

            spyOnEvents();
            uploader.processResolvedConflicts(changeset);
            await isDone;
        }

        it('handles local_edit vs remote_edit (same edit -> auto resolved)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            mockMergeConflict([
                // someone else made the exact same edit as us
                new iD.osmNode({ id: 'n1', version: 2, tags: { name: 'SAME edit' } }),
            ]);
            history.perform(iD.actionChangeTags('n1', { name: 'SAME edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 1],
                ['progressChanged', 1, 1],
                // no resultConflicts, because conflicts were automatically resolved
                ['willAttemptUpload'],
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'automatically' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
        });

        it('allows uploading if there is no conflict', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            mockMergeConflict([
                // no conflicts, node is unchanged.
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            // and we also changed the name:
            history.perform(iD.actionChangeTags('n1', { name: 'OUR edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['resultSuccess', changeset],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);
        });

        it('handles local_edit vs remote_edit (accept remote -> noop)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            mockMergeConflict([
                // someone else changed the name
                new iD.osmNode({ id: 'n1', version: 2, tags: { name: 'THEIR edit' } }),
            ]);
            // and we also changed the name:
            history.perform(iD.actionChangeTags('n1', { name: 'OUR edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 1],
                ['progressChanged', 1, 1],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' }}),
                    [
                        {
                            choices: [
                                {
                                    choiceType: ConflictChoiceType.KEEP_LOCAL,
                                    id: 'n1',
                                    text: 'Keep mine',
                                    action: expect.any(Function),
                                },
                                {
                                    choiceType: ConflictChoiceType.KEEP_REMOTE,
                                    id: 'n1',
                                    text: 'Use theirs',
                                    action: expect.any(Function),
                                },
                            ],
                            chosen: ConflictChoiceType.KEEP_LOCAL,
                            details: [expect.any(Function)],
                            id: 'n1',
                            name: 'OUR edit',
                        },
                    ],
                    {
                        created: [],
                        modified: [context.graph().entity('n1')],
                        deleted: [],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_REMOTE]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['resultNoChanges'], // our changeset is now a no-op, so nothing to upload
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);
        });

        it('handles local_edit vs remote_edit (accept remote -> partial noop, partial reupload)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
                new iD.osmNode({ id: 'n2', version: 1, tags: { name: 'original 2' } }),
            ]);
            mockMergeConflict([
                // someone else changed the name
                new iD.osmNode({ id: 'n1', version: 2, tags: { name: 'THEIR edit' } }),
                // no change to n2
                new iD.osmNode({ id: 'n2', version: 1, tags: { name: 'original 2' } }),
            ]);
            // we modified both nodes:
            history.perform(iD.actionChangeTags('n1', { name: 'OUR edit' }));
            history.perform(iD.actionChangeTags('n2', { name: 'OUR edit 2' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 2],
                ['progressChanged', 2, 2],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' }}),
                    [expect.objectContaining({ id: 'n1' })], // n2 has no conflicts
                    {
                        created: [],
                        modified: [context.graph().entity('n1'), context.graph().entity('n2')],
                        deleted: [],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_REMOTE]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'], // uploading n1 and n2
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
        });

        it('handles local_edit vs remote_edit (accept local)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            mockMergeConflict([
                // someone else changed the name
                new iD.osmNode({ id: 'n1', version: 2, tags: { name: 'THEIR edit' } }),
            ]);
            // and we also changed the name:
            history.perform(iD.actionChangeTags('n1', { name: 'OUR edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 1],
                ['progressChanged', 1, 1],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' }}),
                    [expect.objectContaining({ id: 'n1' })],
                    {
                        created: [],
                        modified: [context.graph().entity('n1')],
                        deleted: [],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_LOCAL]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
        });

        it('handles local_edit vs remote_delete (accept local)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            mockMergeConflict([
                // someone else deleted the node
                new iD.osmNode({ id: 'n1', version: 2, visible: false }),
            ]);
            // and we changed the name:
            history.perform(iD.actionChangeTags('n1', { name: 'OUR edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 1],
                ['progressChanged', 1, 1],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' }}),
                    [expect.objectContaining({ id: 'n1' })],
                    {
                        created: [],
                        modified: [context.graph().entity('n1')],
                        deleted: [],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_LOCAL]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
        });

        it('handles local_edit vs remote_delete (accept remote -> noop)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            mockMergeConflict([
                // someone else deleted the node
                new iD.osmNode({ id: 'n1', version: 2, visible: false }),
            ]);
            // and we changed the name:
            history.perform(iD.actionChangeTags('n1', { name: 'OUR edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 1],
                ['progressChanged', 1, 1],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                    [expect.objectContaining({ id: 'n1' })],
                    {
                        created: [],
                        modified: [context.graph().entity('n1')],
                        deleted: [],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_REMOTE]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['resultNoChanges'], // we accepted their deletion, so nothing to upload
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);
        });

        it('handles local_edit vs remote_delete (accept remote -> reupload)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
                new iD.osmNode({ id: 'n2', version: 1, tags: { name: 'unrelated' } }),
            ]);
            mockMergeConflict([
                // someone else deleted n1, but nobody touched n2
                new iD.osmNode({ id: 'n1', version: 2, visible: false }),
                new iD.osmNode({ id: 'n2', version: 1, tags: { name: 'unrelated' } }),
            ]);
            // and we changed both:
            history.perform(iD.actionChangeTags('n1', { name: 'OUR edit' }));
            history.perform(iD.actionChangeTags('n2', { name: 'OUR unrelated edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 2],
                ['progressChanged', 2, 2],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                    [expect.objectContaining({ id: 'n1' })],
                    {
                        created: [],
                        modified: [context.graph().entity('n1'), context.graph().entity('n2')],
                        deleted: [],
                    }
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_REMOTE]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'], // n2 is unaffected, so it still gets uploaded
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
        });

        it('handles local_delete vs remote_edit (accept local)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            mockMergeConflict([
                // someone else changed the name
                new iD.osmNode({ id: 'n1', version: 2, tags: { name: 'THEIR edit' } }),
            ]);
            // and we deleted the node:
            history.perform(iD.actionDeleteNode('n1'));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'], // fist time we're trying to delete v1
                ['progressChanged', 0, 1],
                ['progressChanged', 1, 1],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                    [expect.objectContaining({ id: 'n1' })],
                    {
                        created: [],
                        modified: [],
                        deleted: [expect.objectContaining({ id: 'n1', version: 1 })],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_LOCAL]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'], // now we're trying to delete v2
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
        });

        it('handles local_delete vs remote_edit (accept remote -> noop)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            mockMergeConflict([
                // someone else changed the name
                new iD.osmNode({ id: 'n1', version: 2, tags: { name: 'THEIR edit' } }),
            ]);
            // and we deleted n1:
            history.perform(iD.actionDeleteNode('n1'));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 1],
                ['progressChanged', 1, 1],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                    [expect.objectContaining({ id: 'n1' })],
                    {
                        created: [],
                        modified: [],
                        deleted: [expect.objectContaining({ id: 'n1', version: 1 })],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_REMOTE]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['resultNoChanges'], // we undid our deletion, so nothing to upload
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);
        });

        it('handles local_delete vs remote_edit (accept remote -> reupload)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
                new iD.osmNode({ id: 'n2', version: 1, tags: { name: 'unrelated' } }),
            ]);
            mockMergeConflict([
                // someone else changed the name
                new iD.osmNode({ id: 'n1', version: 2, tags: { name: 'THEIR edit' } }),
                new iD.osmNode({ id: 'n2', version: 1, tags: { name: 'unrelated' } }),
            ]);
            // and we deleted n1:
            history.perform(iD.actionDeleteNode('n1'));
            // and we changed the unrelated n2:
            history.perform(iD.actionChangeTags('n2', { name: 'OUR unrelated edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 2],
                ['progressChanged', 2, 2],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                    [expect.objectContaining({ id: 'n1' })], // n2 has no conflicts
                    {
                        created: [],
                        modified: [context.graph().entity('n2')],
                        deleted: [expect.objectContaining({ id: 'n1', version: 1 })],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_REMOTE]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'], // n2 is unaffected, so it still gets uploaded
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
        });

        it('handles local_delete vs remote_delete (auto resolved -> noop)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
            ]);
            mockMergeConflict([
                // someone else deleted the node
                new iD.osmNode({ id: 'n1', version: 2, visible: false }),
            ]);
            // and we also deleted it:
            history.perform(iD.actionDeleteNode('n1'));

            uploader.save(changeset);
            await isDone;

            // there is nothing for the user to decide, we both wanted it gone
            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 1],
                ['progressChanged', 1, 1],
                ['resultNoChanges'],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);
            // nothing to upload
        });

        it('handles local_delete vs remote_delete (auto resolved -> reupload)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original' } }),
                new iD.osmNode({ id: 'n2', version: 1, tags: { name: 'unrelated' } }),
            ]);
            mockMergeConflict([
                // someone else deleted the node
                new iD.osmNode({ id: 'n1', version: 2, visible: false }),
                new iD.osmNode({ id: 'n2', version: 1, tags: { name: 'unrelated' } }),
            ]);
            // and we deleted n1:
            history.perform(iD.actionDeleteNode('n1'));
            // and we changed the unrelated n2:
            history.perform(iD.actionChangeTags('n2', { name: 'OUR unrelated edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 2],
                ['progressChanged', 2, 2],
                ['willAttemptUpload'], // only n2 is left to upload
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'automatically' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
        });

        it('handles local_delete vs remote_edit FOR A WAY (accept local)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, loc: [0, 0] }),
                new iD.osmNode({ id: 'n2', version: 1, loc: [1, 1] }),
                new iD.osmWay({ id: 'w1', version: 1, nodes: ['n1', 'n2'], tags: { highway: 'residential' } }),
            ]);
            mockMergeConflict([
                new iD.osmNode({ id: 'n1', version: 1, loc: [0, 0] }),
                new iD.osmNode({ id: 'n2', version: 1, loc: [1, 1] }),
                // someone else changed the tags of the way
                new iD.osmWay({ id: 'w1', version: 2, nodes: ['n1', 'n2'], tags: { highway: 'primary' } }),
            ]);
            // and we deleted the way, which also deletes its untagged child nodes:
            history.perform(iD.actionDeleteWay('w1'));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'], // v1 of w1
                ['progressChanged', 0, 3],
                ['progressChanged', 3, 3],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                    [expect.objectContaining({ id: 'w1' })],
                    {
                        created: [],
                        modified: [],
                        deleted: [
                            expect.objectContaining({ id: 'w1', version: 1 }),
                            expect.objectContaining({ id: 'n1', version: 1 }),
                            expect.objectContaining({ id: 'n2', version: 1 }),
                        ],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);
            expect(context.connection().putChangeset).toHaveBeenNthCalledWith(
                1,
                changeset,
                {
                    created: [],
                    modified: [],
                    deleted: [
                        expect.objectContaining({ id: 'w1', version: 1 }), // v1 this attempt
                        expect.objectContaining({ id: 'n1', version: 1 }),
                        expect.objectContaining({ id: 'n2', version: 1 }),
                    ],
                },
                expect.any(Function)
            );

            await makeConflictChoice([ConflictChoiceType.KEEP_LOCAL]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'], // v2 of w1
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })],
                ['saveEnded'],
            ]);

            // check that the child nodes are being deleted too
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
            expect(context.connection().putChangeset).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                {
                    created: [],
                    modified: [],
                    deleted: [
                        expect.objectContaining({ id: 'w1', version: 2 }), // v2 this attempt
                        expect.objectContaining({ id: 'n1', version: 1 }),
                        expect.objectContaining({ id: 'n2', version: 1 }),
                    ],
                },
                expect.any(Function)
            );
        });

        it('handles a massive mess of conflicts (auto & manual, and every combination of local/remote <-> edit/delete)', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original 1' } }),
                new iD.osmNode({ id: 'n2', version: 1, tags: { name: 'original 2' } }),
                new iD.osmNode({ id: 'n3', version: 1, tags: { name: 'original 3' } }),
                new iD.osmNode({ id: 'n4', version: 1, tags: { name: 'original 4' } }),
                new iD.osmNode({ id: 'n5', version: 1, tags: { name: 'original 5' } }),
                new iD.osmNode({ id: 'n6', version: 1, tags: { name: 'original 6' } }),
                new iD.osmNode({ id: 'n7', version: 1, tags: { name: 'original 7' } }),
                new iD.osmNode({ id: 'n8', version: 1, tags: { name: 'original 8' } }),
                new iD.osmNode({ id: 'n9', version: 1, tags: { name: 'original 9' } }),
            ]);
            mockMergeConflict([
                // n1: local_edit + remote_unchanged (no conflicts)
                new iD.osmNode({ id: 'n1', version: 1, tags: { name: 'original 1' } }),
                // n2: local_edit + remote_edit (both edits are the same, auto resolved)
                new iD.osmNode({ id: 'n2', version: 2, tags: { name: 'SAME edit' } }),
                // n3: local_delete + remote_delete
                new iD.osmNode({ id: 'n3', version: 2, visible: false }),
                // n4+n7: local_edit + remote_edit
                new iD.osmNode({ id: 'n4', version: 2, tags: { name: 'THEIR edit' } }),
                new iD.osmNode({ id: 'n7', version: 2, tags: { name: 'THEIR edit' } }),
                // n5+n8: local_edit + remote_delete
                new iD.osmNode({ id: 'n5', version: 2, visible: false }),
                new iD.osmNode({ id: 'n8', version: 2, visible: false }),
                // n6+n9: local_delete + remote_edit
                new iD.osmNode({ id: 'n6', version: 2, tags: { name: 'THEIR edit' } }),
                new iD.osmNode({ id: 'n9', version: 2, tags: { name: 'THEIR edit' } }),
            ]);
            history.perform(iD.actionChangeTags('n1', { name: 'OUR edit 1' }));
            history.perform(iD.actionChangeTags('n2', { name: 'SAME edit' }));
            history.perform(iD.actionDeleteNode('n3'));
            history.perform(iD.actionChangeTags('n4', { name: 'OUR edit 4' }));
            history.perform(iD.actionChangeTags('n5', { name: 'OUR edit 5' }));
            history.perform(iD.actionDeleteNode('n6'));
            history.perform(iD.actionChangeTags('n7', { name: 'OUR edit 7' }));
            history.perform(iD.actionChangeTags('n8', { name: 'OUR edit 8' }));
            history.perform(iD.actionDeleteNode('n9'));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 9],
                ['progressChanged', 9, 9],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                    [
                        expect.objectContaining({ id: 'n9' }),
                        expect.objectContaining({ id: 'n8' }),
                        expect.objectContaining({ id: 'n7' }),
                        expect.objectContaining({ id: 'n6' }),
                        expect.objectContaining({ id: 'n5' }),
                        expect.objectContaining({ id: 'n4' }),
                        // n3 was auto-resolved
                        // n2 was auto-resolved
                        // n1 has no conflicts
                    ],
                    {
                        created: [],
                        modified: [
                            context.graph().entity('n1'), // keep ours
                            expect.objectContaining({ id: 'n2', version: 1 }), // TODO: why is it different?
                            context.graph().entity('n4'), // keep ours
                            context.graph().entity('n5'), // keep ours
                            context.graph().entity('n7'), // keep ours
                            context.graph().entity('n8'), // keep ours
                        ],
                        deleted: [
                            expect.objectContaining({ id: 'n3', version: 1 }),
                            expect.objectContaining({ id: 'n6', version: 1 }),
                            expect.objectContaining({ id: 'n9', version: 1 }),
                        ],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([
                ConflictChoiceType.KEEP_REMOTE, // n9: undo our deletion, keep their edit
                ConflictChoiceType.KEEP_LOCAL,  // n8: keep our edit, undo their deletion
                ConflictChoiceType.KEEP_REMOTE, // n7: undo our edit, keep their edit
                ConflictChoiceType.KEEP_LOCAL,  // n6: keep our delete, undo their edit
                ConflictChoiceType.KEEP_REMOTE, // n5: undo our edit, keep their delete
                ConflictChoiceType.KEEP_LOCAL,  // n4: keep our edit, undo their edit
            ]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'], // rëupload n1,n2,n4,n6,n8 only (but not n3 and not n5,n7,n9)
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })], // TODO: should this be automatically;manually ?
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
            expect(context.connection().putChangeset).toHaveBeenNthCalledWith(
                2,
                expect.any(osmChangeset),
                {
                    created: [],
                    modified: [
                        expect.objectContaining({ id: 'n1', version: 1, tags: { name: 'OUR edit 1' } }),
                        expect.objectContaining({ id: 'n2', version: 2, tags: { name: 'SAME edit' } }),
                        expect.objectContaining({ id: 'n4', version: 2, tags: { name: 'OUR edit 4' } }),
                        expect.objectContaining({ id: 'n8', version: 2, tags: { name: 'OUR edit 8' } }),
                    ],
                    deleted: [expect.objectContaining({ id: 'n6', version: 2 })],
                },
                expect.any(Function),
            );
            expect(context.connection().updateChangesetTags).toHaveBeenCalledTimes(1); // not called again
        });

        it('handles local_delete of a way vs remote_edit of its child node', async () => {
            history.merge([
                new iD.osmNode({ id: 'n1', version: 1, loc: [0, 0] }),
                new iD.osmNode({ id: 'n2', version: 1, loc: [1, 1] }),
                new iD.osmWay({ id: 'w1', version: 1, nodes: ['n1', 'n2'] }),
            ]);
            mockMergeConflict([
                // someone else moved n1, but did not touch the way
                new iD.osmNode({ id: 'n1', version: 2, loc: [9, 9] }),
                new iD.osmNode({ id: 'n2', version: 1, loc: [1, 1] }),
                new iD.osmWay({ id: 'w1', version: 1, nodes: ['n1', 'n2'] }),
            ]);
            history.perform(iD.actionDeleteWay('w1'));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 3],
                ['progressChanged', 3, 3],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                    [expect.objectContaining({ id: 'n1' })],
                    {
                        created: [],
                        modified: [],
                        deleted: [
                            expect.objectContaining({ id: 'w1', version: 1 }),
                            expect.objectContaining({ id: 'n1', version: 1 }), // trying to delete v1, not v2
                            expect.objectContaining({ id: 'n2', version: 1 }),
                        ],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);
            expect(context.connection().putChangeset).toHaveBeenNthCalledWith(
                1,
                changeset,
                {
                    created: [],
                    modified: [],
                    deleted: [
                        expect.objectContaining({ id: 'w1', version: 1 }),
                        expect.objectContaining({ id: 'n1', version: 1 }),// v1 this attempt
                        expect.objectContaining({ id: 'n2', version: 1 }),
                    ],
                },
                expect.any(Function)
            );

            await makeConflictChoice([ConflictChoiceType.KEEP_LOCAL]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
            expect(context.connection().putChangeset).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                {
                    created: [],
                    modified: [],
                    deleted: [
                        expect.objectContaining({ id: 'w1', version: 1 }),
                        expect.objectContaining({ id: 'n1', version: 2 }), // v2 this attempt
                        expect.objectContaining({ id: 'n2', version: 1 }),
                    ],
                },
                expect.any(Function)
            );
        });

        it('does not produce a conflict for local_delete (parent way), and remote_edit of a child node', async () => {
            history.merge([
                // café as a vertex of a building
                new iD.osmNode({ id: 'n1', version: 1, loc: [0, 0] }),
                new iD.osmNode({ id: 'n2', version: 1, loc: [1, 1], tags: { amenity: 'cafe', name: 'original' } }),
                new iD.osmWay({ id: 'w1', version: 1, nodes: ['n1', 'n2'], tags: { building: 'yes' } }),
            ]);
            mockMergeConflict([
                new iD.osmNode({ id: 'n1', version: 1, loc: [0, 0] }),
                // someone else renamed the café vertex (n2)
                new iD.osmNode({ id: 'n2', version: 2, loc: [1, 1], tags: { amenity: 'cafe', name: 'THEIR edit' } }),
                new iD.osmWay({ id: 'w1', version: 1, nodes: ['n1', 'n2'], tags: { building: 'yes' } }),
            ]);
            // and we also renamed the café vertex (n2), and deleted the building (w1 + n1)
            history.perform(iD.actionDeleteWay('w1'));
            history.perform(iD.actionChangeTags('n2', { amenity: 'cafe', name: 'OUR edit' }));

            uploader.save(changeset);
            await isDone;

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['progressChanged', 0, 3],
                ['progressChanged', 3, 3],
                [
                    'resultConflicts',
                    expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                    [expect.objectContaining({ id: 'n2' })],  // conflict on n2 only, not on w1
                    {
                        created: [],
                        modified: [context.graph().entity('n2')],
                        deleted: [
                            expect.objectContaining({ id: 'w1', version: 1 }),
                            expect.objectContaining({ id: 'n1', version: 1 }),
                        ],
                    },
                ],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(1);

            await makeConflictChoice([ConflictChoiceType.KEEP_REMOTE]);

            expect(uploaderEvents).toStrictEqual([
                ['saveStarted'],
                ['willAttemptUpload'],
                ['resultSuccess', expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } })],
                ['saveEnded'],
            ]);
            expect(context.connection().putChangeset).toHaveBeenCalledTimes(2);
            expect(context.connection().putChangeset).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ tags: { merge_conflict_resolved: 'manually' } }),
                {
                    created: [],
                    modified: [], // no n2
                    deleted: [
                        expect.objectContaining({ id: 'w1', version: 1 }),
                        expect.objectContaining({ id: 'n1', version: 1 }),
                    ],
                },
                expect.any(Function)
            );
        });
    });
});
