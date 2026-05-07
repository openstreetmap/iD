describe('iD.osmChangeset', function () {
    it('returns a changeset', function () {
        expect(new iD.osmChangeset()).toBeInstanceOf(iD.osmChangeset);
        expect(new iD.osmChangeset().type).to.equal('changeset');
    });

    it('defaults tags to an empty object', function () {
        expect(new iD.osmChangeset().tags).toEqual({});
    });

    it('sets tags as specified', function () {
        expect(new iD.osmChangeset({tags: {foo: 'bar'}}).tags).toEqual({foo: 'bar'});
    });


    describe('#asJXON', function () {
        it('converts a node to jxon', function() {
            var node = new iD.osmChangeset({tags: {'comment': 'hello'}});
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
            var changeset = new iD.osmChangeset();
            var jxon = changeset.osmChangeJXON({ created: [], modified: [], deleted: [] });

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
            var n = new iD.osmNode({ loc: [0, 0] });
            var w = new iD.osmWay();
            var r = new iD.osmRelation();
            var c = new iD.osmChangeset({ id: '1234' });
            var changes = { created: [r, w, n], modified: [], deleted: [] };
            var jxon = c.osmChangeJXON(changes);

            var result = jxon.osmChange.create;
            expect(result.node).toEqual([n.asJXON('1234').node]);
            expect(result.way).toEqual([w.asJXON('1234').way]);
            expect(result.relation).toEqual([r.asJXON('1234').relation]);
        });

        it('includes creations ordered by dependencies', function() {
            var n = new iD.osmNode({ loc: [0, 0] });
            var w = new iD.osmWay({nodes: [n.id]});
            var r1 = new iD.osmRelation({ members: [{ id: w.id, type: 'way' }] });
            var r2 = new iD.osmRelation({ members: [{ id: r1.id, type: 'relation' }] });
            var c = new iD.osmChangeset({ id: '1234' });
            var changes = { created: [r2, r1, w, n], modified: [], deleted: [] };
            var jxon = c.osmChangeJXON(changes);

            var result = jxon.osmChange.create;
            expect(result.node).toEqual([n.asJXON('1234').node]);
            expect(result.way).toEqual([w.asJXON('1234').way]);
            expect(result.relation).toEqual([r1.asJXON('1234').relation, r2.asJXON('1234').relation]);
        });

        it('includes creations ignoring circular dependencies', function() {
            var r1 = new iD.osmRelation();
            var r2 = new iD.osmRelation();
            var c = new iD.osmChangeset({ id: '1234' });
            var changes, jxon;
            r1.addMember({ id: r2.id, type: 'relation' });
            r2.addMember({ id: r1.id, type: 'relation' });
            changes = { created: [r1,r2], modified: [], deleted: [] };
            jxon = c.osmChangeJXON(changes);

            var result = jxon.osmChange.create;
            expect(result.relation).toEqual([r1.asJXON('1234').relation, r2.asJXON('1234').relation]);
        });

        it('includes modifications', function() {
            var n = new iD.osmNode({ loc: [0, 0] });
            var w = new iD.osmWay();
            var r = new iD.osmRelation();
            var c = new iD.osmChangeset({ id: '1234' });
            var changes = { created: [], modified: [r, w, n], deleted: [] };
            var jxon = c.osmChangeJXON(changes);

            expect(jxon.osmChange.modify).toEqual({
                node: [n.asJXON('1234').node],
                way: [w.asJXON('1234').way],
                relation: [r.asJXON('1234').relation]
            });
        });

        it('includes deletions ordered by relations, ways, nodes', function() {
            var n = new iD.osmNode({ loc: [0, 0] });
            var w = new iD.osmWay();
            var r = new iD.osmRelation();
            var c = new iD.osmChangeset({ id: '1234' });
            var changes = { created: [], modified: [], deleted: [n, w, r] };
            var jxon = c.osmChangeJXON(changes);

            var result = jxon.osmChange.delete;
            expect(result.node).toEqual([n.asJXON('1234').node]);
            expect(result.way).toEqual([w.asJXON('1234').way]);
            expect(result.relation).toEqual([r.asJXON('1234').relation]);
            expect(result['@if-unused']).toEqual(true);
        });
    });

});
