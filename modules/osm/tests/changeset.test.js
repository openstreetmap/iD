import * as d3 from 'd3';

import { osmChangeset } from '../changeset';
import { osmNode } from '../node';
import { osmWay } from '../way';
import { osmRelation } from '../relation';

describe('osmChangeset', function () {
    it('returns a changeset', function () {
        expect(osmChangeset()).toBeInstanceOf(osmChangeset);
        expect(osmChangeset().type).toBe('changeset');
    });

    it('defaults tags to an empty object', function () {
        expect(osmChangeset().tags).toEqual({});
    });

    it('sets tags as specified', function () {
        expect(osmChangeset({tags: {foo: 'bar'}}).tags).toEqual({foo: 'bar'});
    });


    describe('#asJXON', function () {
        it('converts a node to jxon', function() {
            var node = osmChangeset({tags: {'comment': 'hello'}});
            expect(node.asJXON()).toEqual({
                osm: {
                    changeset: {
                        tag: [{ '@k': 'comment', '@v': 'hello' }],
                        '@version': 0.6,
                        '@generator': 'iD'
                    }
                }
            });
        });
    });


    describe('#osmChangeJXON', function() {
        it('converts change data to JXON', function() {
            var changeset = osmChangeset(),
                jxon = changeset.osmChangeJXON({ created: [], modified: [], deleted: [] });

            expect(jxon).toEqual({
                osmChange: {
                    '@version': 0.6,
                    '@generator': 'iD',
                    'create': {},
                    'modify': {},
                    'delete': { '@if-unused': true }
                }
            });
        });

        it('includes creations ordered by nodes, ways, relations', function() {
            var n = osmNode({ loc: [0, 0] }),
                w = osmWay(),
                r = osmRelation(),
                c = osmChangeset({ id: '1234' }),
                changes = { created: [r, w, n], modified: [], deleted: [] },
                jxon = c.osmChangeJXON(changes);

            expect(d3.entries(jxon.osmChange.create)).toEqual([
                { key: 'node', value: [n.asJXON('1234').node] },
                { key: 'way', value: [w.asJXON('1234').way] },
                { key: 'relation', value: [r.asJXON('1234').relation] }
            ]);
        });

        it('includes creations ordered by dependencies', function() {
            var n = osmNode({ loc: [0, 0] }),
                w = osmWay({nodes: [n.id]}),
                r1 = osmRelation({ members: [{ id: w.id, type: 'way' }] }),
                r2 = osmRelation({ members: [{ id: r1.id, type: 'relation' }] }),
                c = osmChangeset({ id: '1234' }),
                changes = { created: [r2, r1, w, n], modified: [], deleted: [] },
                jxon = c.osmChangeJXON(changes);

            expect(d3.entries(jxon.osmChange.create)).toEqual([
                { key: 'node', value: [n.asJXON('1234').node] },
                { key: 'way', value: [w.asJXON('1234').way] },
                { key: 'relation', value: [r1.asJXON('1234').relation, r2.asJXON('1234').relation] },
            ]);
        });

        it('includes creations ignoring circular dependencies', function() {
            var r1 = osmRelation(),
                r2 = osmRelation(),
                c = osmChangeset({ id: '1234' }),
                changes, jxon;
            r1.addMember({ id: r2.id, type: 'relation' });
            r2.addMember({ id: r1.id, type: 'relation' });
            changes = { created: [r1,r2], modified: [], deleted: [] };
            jxon = c.osmChangeJXON(changes);

            expect(d3.entries(jxon.osmChange.create)).toEqual([
                { key: 'relation', value: [r1.asJXON('1234').relation, r2.asJXON('1234').relation] },
            ]);
        });

        it('includes modifications', function() {
            var n = osmNode({ loc: [0, 0] }),
                w = osmWay(),
                r = osmRelation(),
                c = osmChangeset({ id: '1234' }),
                changes = { created: [], modified: [r, w, n], deleted: [] },
                jxon = c.osmChangeJXON(changes);

            expect(jxon.osmChange.modify).toEqual({
                node: [n.asJXON('1234').node],
                way: [w.asJXON('1234').way],
                relation: [r.asJXON('1234').relation]
            });
        });

        it('includes deletions ordered by relations, ways, nodes', function() {
            var n = osmNode({ loc: [0, 0] }),
                w = osmWay(),
                r = osmRelation(),
                c = osmChangeset({ id: '1234' }),
                changes = { created: [], modified: [], deleted: [n, w, r] },
                jxon = c.osmChangeJXON(changes);

            expect(d3.entries(jxon.osmChange.delete)).toEqual([
                { key: 'relation', value: [r.asJXON('1234').relation] },
                { key: 'way', value: [w.asJXON('1234').way] },
                { key: 'node', value: [n.asJXON('1234').node] },
                { key: '@if-unused', value: true }
            ]);
        });
    });

});
