describe('iD.osmRelation', function () {
    if (iD.debug) {
        it('freezes nodes', function () {
            expect(Object.isFrozen(iD.osmRelation().members)).to.be.true;
        });
    }

    it('returns a relation', function () {
        expect(iD.osmRelation()).to.be.an.instanceOf(iD.osmRelation);
        expect(iD.osmRelation().type).to.equal('relation');
    });

    it('defaults members to an empty array', function () {
        expect(iD.osmRelation().members).to.eql([]);
    });

    it('sets members as specified', function () {
        expect(iD.osmRelation({members: ['n-1']}).members).to.eql(['n-1']);
    });

    it('defaults tags to an empty object', function () {
        expect(iD.osmRelation().tags).to.eql({});
    });

    it('sets tags as specified', function () {
        expect(iD.osmRelation({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe('#copy', function () {
        it('returns a new Relation', function () {
            const r = iD.osmRelation({id: 'r'});
            const result = r.copy(null, {});

            expect(result).to.be.an.instanceof(iD.osmRelation);
            expect(result).not.to.equal(r);
        });

        it('adds the new Relation to input object', function () {
            const r = iD.osmRelation({id: 'r'});
            const copies = {};
            const result = r.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.r).to.equal(result);
        });

        it('returns an existing copy in input object', function () {
            const r = iD.osmRelation({id: 'r'});
            const copies = {};
            const result1 = r.copy(null, copies);
            const result2 = r.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(result1).to.equal(result2);
        });

        it('deep copies members', function () {
            const a = iD.osmNode({id: 'a'});
            const b = iD.osmNode({id: 'b'});
            const c = iD.osmNode({id: 'c'});
            const w = iD.osmWay({id: 'w', nodes: ['a','b','c','a']});
            const r = iD.osmRelation({id: 'r', members: [{id: 'w', role: 'outer'}]});
            const graph = iD.coreGraph([a, b, c, w, r]);
            const copies = {};
            const result = r.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(5);
            expect(copies.w).to.be.an.instanceof(iD.osmWay);
            expect(copies.a).to.be.an.instanceof(iD.osmNode);
            expect(copies.b).to.be.an.instanceof(iD.osmNode);
            expect(copies.c).to.be.an.instanceof(iD.osmNode);
            expect(result.members[0].id).not.to.equal(r.members[0].id);
            expect(result.members[0].role).to.equal(r.members[0].role);
        });

        it('deep copies non-tree relation graphs without duplicating children', function () {
            const w = iD.osmWay({id: 'w'});
            const r1 = iD.osmRelation({id: 'r1', members: [{id: 'r2'}, {id: 'w'}]});
            const r2 = iD.osmRelation({id: 'r2', members: [{id: 'w'}]});
            const graph = iD.coreGraph([w, r1, r2]);
            const copies = {};
            r1.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(3);
            expect(copies.r1).to.be.an.instanceof(iD.osmRelation);
            expect(copies.r2).to.be.an.instanceof(iD.osmRelation);
            expect(copies.w).to.be.an.instanceof(iD.osmWay);
            expect(copies.r1.members[0].id).to.equal(copies.r2.id);
            expect(copies.r1.members[1].id).to.equal(copies.w.id);
            expect(copies.r2.members[0].id).to.equal(copies.w.id);
        });

        it('deep copies cyclical relation graphs without issue', function () {
            const r1 = iD.osmRelation({id: 'r1', members: [{id: 'r2'}]});
            const r2 = iD.osmRelation({id: 'r2', members: [{id: 'r1'}]});
            const graph = iD.coreGraph([r1, r2]);
            const copies = {};
            r1.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(2);
            expect(copies.r1.members[0].id).to.equal(copies.r2.id);
            expect(copies.r2.members[0].id).to.equal(copies.r1.id);
        });

        it('deep copies self-referencing relations without issue', function () {
            const r = iD.osmRelation({id: 'r', members: [{id: 'r'}]});
            const graph = iD.coreGraph([r]);
            const copies = {};
            r.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.r.members[0].id).to.equal(copies.r.id);
         });
    });

    describe('#extent', function () {
        it('returns the minimal extent containing the extents of all members', function () {
            const a = iD.osmNode({loc: [0, 0]});
            const b = iD.osmNode({loc: [5, 10]});
            const r = iD.osmRelation({members: [{id: a.id}, {id: b.id}]});
            const graph = iD.coreGraph([a, b, r]);

            expect(r.extent(graph).equals([[0, 0], [5, 10]])).to.be.ok;
        });

        it('returns the known extent of incomplete relations', function () {
            const a = iD.osmNode({loc: [0, 0]});
            const b = iD.osmNode({loc: [5, 10]});
            const r = iD.osmRelation({members: [{id: a.id}, {id: b.id}]});
            const graph = iD.coreGraph([a, r]);

            expect(r.extent(graph).equals([[0, 0], [0, 0]])).to.be.ok;
        });

        it('does not error on self-referencing relations', function () {
            let r = iD.osmRelation();
            r = r.addMember({id: r.id});
            expect(r.extent(iD.coreGraph([r]))).to.eql(iD.geoExtent());
        });
    });

    describe('#geometry', function () {
        it('returns \'area\' for multipolygons', function () {
            expect(iD.osmRelation({tags: {type: 'multipolygon'}}).geometry(iD.coreGraph())).to.equal('area');
        });

        it('returns \'relation\' for other relations', function () {
            expect(iD.osmRelation().geometry(iD.coreGraph())).to.equal('relation');
        });
    });

    describe('#isDegenerate', function () {
        it('returns true for a relation without members', function () {
            expect(iD.osmRelation().isDegenerate()).to.equal(true);
        });

        it('returns false for a relation with members', function () {
            expect(iD.osmRelation({members: [{id: 'a', role: 'inner'}]}).isDegenerate()).to.equal(false);
        });
    });

    describe('#memberByRole', function () {
        it('returns the first member with the given role', function () {
            const r = iD.osmRelation({members: [
                {id: 'a', role: 'inner'},
                {id: 'b', role: 'outer'},
                {id: 'c', role: 'outer'}]});
            expect(r.memberByRole('outer')).to.eql({id: 'b', role: 'outer', index: 1});
        });

        it('returns undefined if no members have the given role', function () {
            expect(iD.osmRelation().memberByRole('outer')).to.be.undefined;
        });
    });

    describe('#memberById', function () {
        it('returns the first member with the given id', function () {
            const r = iD.osmRelation({members: [
                {id: 'a', role: 'outer'},
                {id: 'b', role: 'outer'},
                {id: 'b', role: 'inner'}]});
            expect(r.memberById('b')).to.eql({id: 'b', role: 'outer', index: 1});
        });

        it('returns undefined if no members have the given role', function () {
            expect(iD.osmRelation().memberById('b')).to.be.undefined;
        });
    });

    describe('#hasFromViaTo', function () {
        it('returns true if there is a from, via, and to', function () {
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'manoeuvre' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' }
                ]
            });
            expect(r.hasFromViaTo()).to.be.true;
        });

        it('returns true if there are extra froms, vias, tos', function () {
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'manoeuvre' },
                members: [
                    { role: 'from', id: 'f1', type: 'way' },
                    { role: 'from', id: 'f2', type: 'way' },
                    { role: 'via', id: 'v1', type: 'node' },
                    { role: 'via', id: 'v2', type: 'node' },
                    { role: 'to', id: 't1', type: 'way' },
                    { role: 'to', id: 't2', type: 'way' }
                ]
            });
            expect(r.hasFromViaTo()).to.be.true;
        });

        it('returns false if from missing', function () {
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'manoeuvre' },
                members: [
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' }
                ]
            });
            expect(r.hasFromViaTo()).to.be.false;
        });

        it('returns false if via missing', function () {
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'manoeuvre' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'to', id: 't', type: 'way' }
                ]
            });
            expect(r.hasFromViaTo()).to.be.false;
        });

        it('returns false if to missing', function () {
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'manoeuvre' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' }
                ]
            });
            expect(r.hasFromViaTo()).to.be.false;
        });

        it('returns false if all missing', function () {
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'multipolygon' },
                members: [
                    { role: 'inner', id: 'i', type: 'way' },
                    { role: 'outer', id: 'o', type: 'way' }
                ]
            });
            expect(r.hasFromViaTo()).to.be.false;
        });

        it('returns true if the `intersection` role is used instead of `via` for destination signs', () => {
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'destination_sign' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'intersection', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            expect(r.hasFromViaTo()).to.be.true;
        });

        it('returns false if the `intersection` role is used on anything other than a destination sign', () => {
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'intersection', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            expect(r.hasFromViaTo()).to.be.false;
        });
    });

    describe('#isRestriction', function () {
        it('returns true for \'restriction\' type', function () {
            expect(iD.osmRelation({tags: {type: 'restriction'}}).isRestriction()).to.be.true;
        });

        it('returns true for \'restriction:type\' types', function () {
            expect(iD.osmRelation({tags: {type: 'restriction:bus'}}).isRestriction()).to.be.true;
        });

        it('returns false otherwise', function () {
            expect(iD.osmRelation().isRestriction()).to.be.false;
            expect(iD.osmRelation({tags: {type: 'multipolygon'}}).isRestriction()).to.be.false;
        });
    });

    describe('#isValidRestriction', function () {
        it('not a restriction', function () {
            const r = iD.osmRelation({ id: 'r', tags: { type: 'multipolygon' }});
            const graph = iD.coreGraph([r]);
            expect(r.isValidRestriction(graph)).to.be.false;
        });

        it('typical restriction (from way, via node, to way) is valid', function () {
            const f = iD.osmWay({id: 'f'});
            const v = iD.osmNode({id: 'v'});
            const t = iD.osmWay({id: 't'});
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            const graph = iD.coreGraph([f, v, t, r]);

            expect(r.isValidRestriction(graph)).to.be.true;
        });

        it('multiple froms, normal restriction is invalid', function () {
            const f1 = iD.osmWay({id: 'f1'});
            const f2 = iD.osmWay({id: 'f2'});
            const v = iD.osmNode({id: 'v'});
            const t = iD.osmWay({id: 't'});
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f1', type: 'way' },
                    { role: 'from', id: 'f2', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            const graph = iD.coreGraph([f1, f2, v, t, r]);

            expect(r.isValidRestriction(graph)).to.be.false;
        });

        it('multiple froms, no_entry restriction is valid', function () {
            const f1 = iD.osmWay({id: 'f1'});
            const f2 = iD.osmWay({id: 'f2'});
            const v = iD.osmNode({id: 'v'});
            const t = iD.osmWay({id: 't'});
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_entry' },
                members: [
                    { role: 'from', id: 'f1', type: 'way' },
                    { role: 'from', id: 'f2', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            const graph = iD.coreGraph([f1, f2, v, t, r]);

            expect(r.isValidRestriction(graph)).to.be.true;
        });

        it('multiple tos, normal restriction is invalid', function () {
            const f = iD.osmWay({id: 'f'});
            const v = iD.osmNode({id: 'v'});
            const t1 = iD.osmWay({id: 't1'});
            const t2 = iD.osmWay({id: 't2'});
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't1', type: 'way' },
                    { role: 'to', id: 't2', type: 'way' },
                ]
            });
            const graph = iD.coreGraph([f, v, t1, t2, r]);

            expect(r.isValidRestriction(graph)).to.be.false;
        });

        it('multiple tos, no_exit restriction is valid', function () {
            const f = iD.osmWay({id: 'f'});
            const v = iD.osmNode({id: 'v'});
            const t1 = iD.osmWay({id: 't1'});
            const t2 = iD.osmWay({id: 't2'});
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_exit' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't1', type: 'way' },
                    { role: 'to', id: 't2', type: 'way' },
                ]
            });
            const graph = iD.coreGraph([f, v, t1, t2, r]);

            expect(r.isValidRestriction(graph)).to.be.true;
        });

        it('multiple vias, with some as node is invalid', function () {
            const f = iD.osmWay({id: 'f'});
            const v1 = iD.osmNode({id: 'v1'});
            const v2 = iD.osmWay({id: 'v2'});
            const t = iD.osmWay({id: 't'});
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v1', type: 'node' },
                    { role: 'via', id: 'v2', type: 'way' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            const graph = iD.coreGraph([f, v1, v2, t, r]);

            expect(r.isValidRestriction(graph)).to.be.false;
        });

        it('multiple vias, with all as way is valid', function () {
            const f = iD.osmWay({id: 'f'});
            const v1 = iD.osmWay({id: 'v1'});
            const v2 = iD.osmWay({id: 'v2'});
            const t = iD.osmWay({id: 't'});
            const r = iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v1', type: 'way' },
                    { role: 'via', id: 'v2', type: 'way' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            const graph = iD.coreGraph([f, v1, v2, t, r]);

            expect(r.isValidRestriction(graph)).to.be.true;
        });
    });

    describe('#indexedMembers', function () {
        it('returns an array of members extended with indexes', function () {
            const r = iD.osmRelation({members: [{id: '1'}, {id: '3'}]});
            expect(r.indexedMembers()).to.eql([{id: '1', index: 0}, {id: '3', index: 1}]);
        });
    });

    describe('#addMember', function () {
        it('adds a member at the end of the relation', function () {
            const r = iD.osmRelation();
            expect(r.addMember({id: '1'}).members).to.eql([{id: '1'}]);
        });

        it('adds a member at index 0', function () {
            const r = iD.osmRelation({members: [{id: '1'}]});
            expect(r.addMember({id: '2'}, 0).members).to.eql([{id: '2'}, {id: '1'}]);
        });

        it('adds a member at a positive index', function () {
            const r = iD.osmRelation({members: [{id: '1'}, {id: '3'}]});
            expect(r.addMember({id: '2'}, 1).members).to.eql([{id: '1'}, {id: '2'}, {id: '3'}]);
        });

        it('adds a member at a negative index', function () {
            const r = iD.osmRelation({members: [{id: '1'}, {id: '3'}]});
            expect(r.addMember({id: '2'}, -1).members).to.eql([{id: '1'}, {id: '2'}, {id: '3'}]);
        });
    });

    describe('#updateMember', function () {
        it('updates the properties of the relation member at the specified index', function () {
            const r = iD.osmRelation({members: [{role: 'forward'}]});
            expect(r.updateMember({role: 'backward'}, 0).members).to.eql([{role: 'backward'}]);
        });
    });

    describe('#removeMember', function () {
        it('removes the member at the specified index', function () {
            const r = iD.osmRelation({members: [{id: 'a'}, {id: 'b'}, {id: 'c'}]});
            expect(r.removeMember(1).members).to.eql([{id: 'a'}, {id: 'c'}]);
        });
    });

    describe('#removeMembersWithID', function () {
        it('removes members with the given ID', function () {
            const r = iD.osmRelation({members: [{id: 'a'}, {id: 'b'}, {id: 'a'}]});
            expect(r.removeMembersWithID('a').members).to.eql([{id: 'b'}]);
        });
    });

    describe('#replaceMember', function () {
        it('returns self if self does not contain needle', function () {
            const r = iD.osmRelation({members: []});
            expect(r.replaceMember({id: 'a'}, {id: 'b'})).to.equal(r);
        });

        it('replaces a member which doesn\'t already exist', function () {
            const r = iD.osmRelation({members: [{id: 'a', role: 'a'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}).members)
                .to.eql([{id: 'b', role: 'a', type: 'node'}]);
        });

        it('preserves the existing role', function () {
            const r = iD.osmRelation({members: [{id: 'a', role: 'a', type: 'node'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}).members)
                .to.eql([{id: 'b', role: 'a', type: 'node'}]);
        });

        it('uses the replacement type', function () {
            const r = iD.osmRelation({members: [{id: 'a', role: 'a', type: 'node'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'way'}).members)
                .to.eql([{id: 'b', role: 'a', type: 'way'}]);
        });

        it('removes members if replacing them would produce duplicates', function () {
            const r = iD.osmRelation({members: [
                {id: 'a', role: 'b', type: 'node'},
                {id: 'b', role: 'b', type: 'node'}
            ]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}).members)
                .to.eql([{id: 'b', role: 'b', type: 'node'}]);
        });
        it('keeps duplicate members if `keepDuplicates = true`', function () {
            const r = iD.osmRelation({members: [
                {id: 'a', role: 'b', type: 'node'},
                {id: 'b', role: 'b', type: 'node'}
            ]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}, true).members)
                .to.eql([{id: 'b', role: 'b', type: 'node'}, {id: 'b', role: 'b', type: 'node'}]);
        });
    });

    describe('#asJXON', function () {
        it('converts a relation to jxon', function() {
            const relation = iD.osmRelation({id: 'r-1', members: [{id: 'w1', role: 'forward', type: 'way'}], tags: {type: 'route'}});
            expect(relation.asJXON()).to.eql({relation: {
                '@id': '-1',
                '@version': 0,
                member: [{keyAttributes: {ref: '1', role: 'forward', type: 'way'}}],
                tag: [{keyAttributes: {k: 'type', v: 'route'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(iD.osmRelation().asJXON('1234').relation['@changeset']).to.equal('1234');
        });
    });

    describe('#asGeoJSON', function () {
        it('converts a multipolygon to a GeoJSON MultiPolygon geometry', function() {
            const a = iD.osmNode({loc: [1, 1]});
            const b = iD.osmNode({loc: [3, 3]});
            const c = iD.osmNode({loc: [2, 2]});
            const w = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            const r = iD.osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]});
            const g = iD.coreGraph([a, b, c, w, r]);
            const json = r.asGeoJSON(g);

            expect(json.type).to.equal('MultiPolygon');
            expect(json.coordinates).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        it('forces clockwise winding order for outer multipolygon ways', function() {
            const a = iD.osmNode({loc: [0, 0]});
            const b = iD.osmNode({loc: [0, 1]});
            const c = iD.osmNode({loc: [1, 0]});
            const w = iD.osmWay({nodes: [a.id, c.id, b.id, a.id]});
            const r = iD.osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]});
            const g = iD.coreGraph([a, b, c, w, r]);
            const json = r.asGeoJSON(g);

            expect(json.coordinates[0][0]).to.eql([a.loc, b.loc, c.loc, a.loc]);
        });

        it('forces counterclockwise winding order for inner multipolygon ways', function() {
            const a = iD.osmNode({loc: [0, 0]});
            const b = iD.osmNode({loc: [0, 1]});
            const c = iD.osmNode({loc: [1, 0]});
            const d = iD.osmNode({loc: [0.1, 0.1]});
            const e = iD.osmNode({loc: [0.1, 0.2]});
            const f = iD.osmNode({loc: [0.2, 0.1]});
            const outer = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            const inner = iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            const r = iD.osmRelation({members: [{id: outer.id, type: 'way'}, {id: inner.id, role: 'inner', type: 'way'}]});
            const g = iD.coreGraph([a, b, c, d, e, f, outer, inner, r]);

            expect(r.multipolygon(g)[0][1]).to.eql([d.loc, f.loc, e.loc, d.loc]);
        });

        it('converts a relation to a GeoJSON FeatureCollection', function() {
            const a = iD.osmNode({loc: [1, 1]});
            const r = iD.osmRelation({tags: {type: 'type'}, members: [{id: a.id, role: 'role'}]});
            const g = iD.coreGraph([a, r]);
            const json = r.asGeoJSON(g);

            expect(json.type).to.equal('FeatureCollection');
            expect(json.properties).to.eql({type: 'type'});

            const nodejson = a.asGeoJSON(g);
            nodejson.role = 'role';
            expect(json.features).to.eql([nodejson]);
        });
    });

    describe('#multipolygon', function () {
        const specify = it;
        specify('single polygon consisting of a single way', function () {
            const a = iD.osmNode({loc: [1, 1]});
            const b = iD.osmNode({loc: [3, 3]});
            const c = iD.osmNode({loc: [2, 2]});
            const w = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            const r = iD.osmRelation({members: [{id: w.id, type: 'way'}]});
            const g = iD.coreGraph([a, b, c, w, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        specify('single polygon consisting of multiple ways', function () {
            const a = iD.osmNode({loc: [1, 1]});
            const b = iD.osmNode({loc: [3, 3]});
            const c = iD.osmNode({loc: [2, 2]});
            const w1 = iD.osmWay({nodes: [a.id, b.id]});
            const w2 = iD.osmWay({nodes: [b.id, c.id, a.id]});
            const r  = iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            const g  = iD.coreGraph([a, b, c, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        specify('single polygon consisting of multiple ways, one needing reversal', function () {
            const a  = iD.osmNode({loc: [1, 1]});
            const b  = iD.osmNode({loc: [3, 3]});
            const c  = iD.osmNode({loc: [2, 2]});
            const w1 = iD.osmWay({nodes: [a.id, b.id]});
            const w2 = iD.osmWay({nodes: [a.id, c.id, b.id]});
            const r  = iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            const g  = iD.coreGraph([a, b, c, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        specify('multiple polygons consisting of single ways', function () {
            const a  = iD.osmNode({loc: [1, 1]});
            const b  = iD.osmNode({loc: [3, 3]});
            const c  = iD.osmNode({loc: [2, 2]});
            const d  = iD.osmNode({loc: [4, 4]});
            const e  = iD.osmNode({loc: [6, 6]});
            const f  = iD.osmNode({loc: [5, 5]});
            const w1 = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            const w2 = iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            const r  = iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            const g  = iD.coreGraph([a, b, c, d, e, f, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]], [[d.loc, e.loc, f.loc, d.loc]]]);
        });

        specify('invalid geometry: unclosed ring consisting of a single way', function () {
            const a = iD.osmNode({loc: [1, 1]});
            const b = iD.osmNode({loc: [3, 3]});
            const c = iD.osmNode({loc: [2, 2]});
            const w = iD.osmWay({nodes: [a.id, b.id, c.id]});
            const r = iD.osmRelation({members: [{id: w.id, type: 'way'}]});
            const g = iD.coreGraph([a, b, c, w, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        specify('invalid geometry: unclosed ring consisting of multiple ways', function () {
            const a  = iD.osmNode({loc: [1, 1]});
            const b  = iD.osmNode({loc: [3, 3]});
            const c  = iD.osmNode({loc: [2, 2]});
            const w1 = iD.osmWay({nodes: [a.id, b.id]});
            const w2 = iD.osmWay({nodes: [b.id, c.id]});
            const r  = iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            const g  = iD.coreGraph([a, b, c, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        specify('invalid geometry: unclosed ring consisting of multiple ways, alternate order', function () {
            const a  = iD.osmNode({loc: [1, 1]});
            const b  = iD.osmNode({loc: [2, 2]});
            const c  = iD.osmNode({loc: [3, 3]});
            const d  = iD.osmNode({loc: [4, 4]});
            const w1 = iD.osmWay({nodes: [c.id, d.id]});
            const w2 = iD.osmWay({nodes: [a.id, b.id, c.id]});
            const r  = iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            const g  = iD.coreGraph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[d.loc, c.loc, b.loc, a.loc, d.loc]]]);
        });

        specify('invalid geometry: unclosed ring consisting of multiple ways, one needing reversal', function () {
            const a  = iD.osmNode({loc: [1, 1]});
            const b  = iD.osmNode({loc: [2, 2]});
            const c  = iD.osmNode({loc: [3, 3]});
            const d  = iD.osmNode({loc: [4, 4]});
            const w1 = iD.osmWay({nodes: [a.id, b.id, c.id]});
            const w2 = iD.osmWay({nodes: [d.id, c.id]});
            const r  = iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            const g  = iD.coreGraph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, d.loc, c.loc, b.loc, a.loc]]]);
        });

        specify('invalid geometry: unclosed ring consisting of multiple ways, one needing reversal, alternate order', function () {
            const a  = iD.osmNode({loc: [1, 1]});
            const b  = iD.osmNode({loc: [2, 2]});
            const c  = iD.osmNode({loc: [3, 3]});
            const d  = iD.osmNode({loc: [4, 4]});
            const w1 = iD.osmWay({nodes: [c.id, d.id]});
            const w2 = iD.osmWay({nodes: [c.id, b.id, a.id]});
            const r  = iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            const g  = iD.coreGraph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[d.loc, c.loc, b.loc, a.loc, d.loc]]]);
        });

        specify('single polygon with single single-way inner', function () {
            const a = iD.osmNode({loc: [0, 0]});
            const b = iD.osmNode({loc: [0, 1]});
            const c = iD.osmNode({loc: [1, 0]});
            const d = iD.osmNode({loc: [0.1, 0.1]});
            const e = iD.osmNode({loc: [0.2, 0.1]});
            const f = iD.osmNode({loc: [0.1, 0.2]});
            const outer = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            const inner = iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            const r = iD.osmRelation({members: [
                {id: outer.id, type: 'way'},
                {id: inner.id, role: 'inner', type: 'way'}
            ]});
            const g = iD.coreGraph([a, b, c, d, e, f, outer, inner, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc]]]);
        });

        specify('single polygon with single multi-way inner', function () {
            const a = iD.osmNode({loc: [0, 0]});
            const b = iD.osmNode({loc: [0, 1]});
            const c = iD.osmNode({loc: [1, 0]});
            const d = iD.osmNode({loc: [0.1, 0.1]});
            const e = iD.osmNode({loc: [0.2, 0.1]});
            const f = iD.osmNode({loc: [0.2, 0.1]});
            const outer = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            const inner1 = iD.osmWay({nodes: [d.id, e.id]});
            const inner2 = iD.osmWay({nodes: [e.id, f.id, d.id]});
            const r = iD.osmRelation({members: [
                {id: outer.id, type: 'way'},
                {id: inner1.id, role: 'inner', type: 'way'},
                {id: inner2.id, role: 'inner', type: 'way'}
            ]});
            const graph = iD.coreGraph([a, b, c, d, e, f, outer, inner1, inner2, r]);

            expect(r.multipolygon(graph)).to.eql([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc]]]);
        });

        specify('single polygon with multiple single-way inners', function () {
            const a = iD.osmNode({loc: [0, 0]});
            const b = iD.osmNode({loc: [0, 1]});
            const c = iD.osmNode({loc: [1, 0]});
            const d = iD.osmNode({loc: [0.1, 0.1]});
            const e = iD.osmNode({loc: [0.2, 0.1]});
            const f = iD.osmNode({loc: [0.1, 0.2]});
            const g = iD.osmNode({loc: [0.2, 0.2]});
            const h = iD.osmNode({loc: [0.3, 0.2]});
            const i = iD.osmNode({loc: [0.2, 0.3]});
            const outer = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            const inner1 = iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            const inner2 = iD.osmWay({nodes: [g.id, h.id, i.id, g.id]});
            const r = iD.osmRelation({members: [
                {id: outer.id, type: 'way'},
                {id: inner1.id, role: 'inner', type: 'way'},
                {id: inner2.id, role: 'inner', type: 'way'}
            ]});
            const graph = iD.coreGraph([a, b, c, d, e, f, g, h, i, outer, inner1, inner2, r]);

            expect(r.multipolygon(graph)).to.eql([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc], [g.loc, h.loc, i.loc, g.loc]]]);
        });

        specify('multiple polygons with single single-way inner', function () {
            const a = iD.osmNode({loc: [0, 0]});
            const b = iD.osmNode({loc: [0, 1]});
            const c = iD.osmNode({loc: [1, 0]});
            const d = iD.osmNode({loc: [0.1, 0.1]});
            const e = iD.osmNode({loc: [0.2, 0.1]});
            const f = iD.osmNode({loc: [0.1, 0.2]});
            const g = iD.osmNode({loc: [0, 0]});
            const h = iD.osmNode({loc: [0, -1]});
            const i = iD.osmNode({loc: [-1, 0]});
            const outer1 = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            const outer2 = iD.osmWay({nodes: [g.id, h.id, i.id, g.id]});
            const inner = iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            const r = iD.osmRelation({members: [
                {id: outer1.id, type: 'way'},
                {id: outer2.id, type: 'way'},
                {id: inner.id, role: 'inner', type: 'way'}
            ]});
            const graph = iD.coreGraph([a, b, c, d, e, f, g, h, i, outer1, outer2, inner, r]);

            expect(r.multipolygon(graph)).to.eql([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc]], [[g.loc, h.loc, i.loc, g.loc]]]);
        });

        specify('invalid geometry: unmatched inner', function () {
            const a = iD.osmNode({loc: [1, 1]});
            const b = iD.osmNode({loc: [2, 2]});
            const c = iD.osmNode({loc: [3, 3]});
            const w = iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            const r = iD.osmRelation({members: [{id: w.id, role: 'inner', type: 'way'}]});
            const g = iD.coreGraph([a, b, c, w, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        specify('incomplete relation', function () {
            const a = iD.osmNode({loc: [1, 1]});
            const b = iD.osmNode({loc: [2, 2]});
            const c = iD.osmNode({loc: [3, 3]});
            const w1 = iD.osmWay({nodes: [a.id, b.id, c.id]});
            const w2 = iD.osmWay();
            const r  = iD.osmRelation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]});
            const g  = iD.coreGraph([a, b, c, w1, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, c.loc, b.loc, a.loc]]]);
        });
    });

    describe('.creationOrder comparator', function () {
        const specify = it;
        specify('orders existing relations newest-first', function () {
            const a = iD.osmRelation({ id: 'r1' });
            const b = iD.osmRelation({ id: 'r2' });
            expect(iD.osmRelation.creationOrder(a, b)).to.be.above(0);
            expect(iD.osmRelation.creationOrder(b, a)).to.be.below(0);
        });

        specify('orders new relations newest-first', function () {
            const a = iD.osmRelation({ id: 'r-1' });
            const b = iD.osmRelation({ id: 'r-2' });
            expect(iD.osmRelation.creationOrder(a, b)).to.be.above(0);
            expect(iD.osmRelation.creationOrder(b, a)).to.be.below(0);
        });
    });
});
