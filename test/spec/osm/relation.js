describe('iD.osmRelation', function () {
    if (iD.debug) {
        it('freezes nodes', function () {
            expect(Object.isFrozen(new iD.osmRelation().members)).toBe(true);
        });
    }

    it('returns a relation', function () {
        expect(new iD.osmRelation()).toBeInstanceOf(iD.osmRelation);
        expect(new iD.osmRelation().type).to.equal('relation');
    });

    it('defaults members to an empty array', function () {
        expect(new iD.osmRelation().members).to.eql([]);
    });

    it('sets members as specified', function () {
        expect(new iD.osmRelation({members: ['n-1']}).members).to.eql(['n-1']);
    });

    it('defaults tags to an empty object', function () {
        expect(new iD.osmRelation().tags).to.eql({});
    });

    it('sets tags as specified', function () {
        expect(new iD.osmRelation({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe('#copy', function () {
        it('returns a new Relation', function () {
            var r = new iD.osmRelation({id: 'r'});
            var result = r.copy(null, {});

            expect(result).toBeInstanceOf(iD.osmRelation);
            expect(result).not.to.equal(r);
        });

        it('adds the new Relation to input object', function () {
            var r = new iD.osmRelation({id: 'r'});
            var copies = {};
            var result = r.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.r).to.equal(result);
        });

        it('returns an existing copy in input object', function () {
            var r = new iD.osmRelation({id: 'r'});
            var copies = {};
            var result1 = r.copy(null, copies);
            var result2 = r.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(result1).to.equal(result2);
        });

        it('deep copies members', function () {
            var a = new iD.osmNode({id: 'a'});
            var b = new iD.osmNode({id: 'b'});
            var c = new iD.osmNode({id: 'c'});
            var w = new iD.osmWay({id: 'w', nodes: ['a','b','c','a']});
            var r = new iD.osmRelation({id: 'r', members: [{id: 'w', role: 'outer'}]});
            var graph = new iD.coreGraph([a, b, c, w, r]);
            var copies = {};
            var result = r.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(5);
            expect(copies.w).toBeInstanceOf(iD.osmWay);
            expect(copies.a).toBeInstanceOf(iD.osmNode);
            expect(copies.b).toBeInstanceOf(iD.osmNode);
            expect(copies.c).toBeInstanceOf(iD.osmNode);
            expect(result.members[0].id).not.to.equal(r.members[0].id);
            expect(result.members[0].role).to.equal(r.members[0].role);
        });

        it('deep copies non-tree relation graphs without duplicating children', function () {
            var w = new iD.osmWay({id: 'w'});
            var r1 = new iD.osmRelation({id: 'r1', members: [{id: 'r2'}, {id: 'w'}]});
            var r2 = new iD.osmRelation({id: 'r2', members: [{id: 'w'}]});
            var graph = new iD.coreGraph([w, r1, r2]);
            var copies = {};
            r1.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(3);
            expect(copies.r1).toBeInstanceOf(iD.osmRelation);
            expect(copies.r2).toBeInstanceOf(iD.osmRelation);
            expect(copies.w).toBeInstanceOf(iD.osmWay);
            expect(copies.r1.members[0].id).to.equal(copies.r2.id);
            expect(copies.r1.members[1].id).to.equal(copies.w.id);
            expect(copies.r2.members[0].id).to.equal(copies.w.id);
        });

        it('deep copies cyclical relation graphs without issue', function () {
            var r1 = new iD.osmRelation({id: 'r1', members: [{id: 'r2'}]});
            var r2 = new iD.osmRelation({id: 'r2', members: [{id: 'r1'}]});
            var graph = new iD.coreGraph([r1, r2]);
            var copies = {};
            r1.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(2);
            expect(copies.r1.members[0].id).to.equal(copies.r2.id);
            expect(copies.r2.members[0].id).to.equal(copies.r1.id);
        });

        it('deep copies self-referencing relations without issue', function () {
            var r = new iD.osmRelation({id: 'r', members: [{id: 'r'}]});
            var graph = new iD.coreGraph([r]);
            var copies = {};
            r.copy(graph, copies);

            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.r.members[0].id).to.equal(copies.r.id);
         });
    });

    describe('#extent', function () {
        it('returns the minimal extent containing the extents of all members', function () {
            var a = new iD.osmNode({loc: [0, 0]});
            var b = new iD.osmNode({loc: [5, 10]});
            var r = new iD.osmRelation({members: [{id: a.id}, {id: b.id}]});
            var graph = new iD.coreGraph([a, b, r]);

            expect(r.extent(graph).equals([[0, 0], [5, 10]])).toBeTruthy();
        });

        it('returns the known extent of incomplete relations', function () {
            var a = new iD.osmNode({loc: [0, 0]});
            var b = new iD.osmNode({loc: [5, 10]});
            var r = new iD.osmRelation({members: [{id: a.id}, {id: b.id}]});
            var graph = new iD.coreGraph([a, r]);

            expect(r.extent(graph).equals([[0, 0], [0, 0]])).toBeTruthy();
        });

        it('does not error on self-referencing relations', function () {
            var r = new iD.osmRelation();
            r = r.addMember({id: r.id});
            expect(r.extent(new iD.coreGraph([r]))).to.eql(iD.geoExtent());
        });
    });

    describe('#geometry', function () {
        it('returns \'area\' for multipolygons', function () {
            expect(new iD.osmRelation({tags: {type: 'multipolygon'}}).geometry(new iD.coreGraph())).to.equal('area');
        });

        it('returns \'relation\' for other relations', function () {
            expect(new iD.osmRelation().geometry(new iD.coreGraph())).to.equal('relation');
        });
    });

    describe('#isDegenerate', function () {
        it('returns true for a relation without members', function () {
            expect(new iD.osmRelation().isDegenerate()).to.equal(true);
        });

        it('returns false for a relation with members', function () {
            expect(new iD.osmRelation({members: [{id: 'a', role: 'inner'}]}).isDegenerate()).to.equal(false);
        });
    });

    describe('#memberByRole', function () {
        it('returns the first member with the given role', function () {
            var r = new iD.osmRelation({members: [
                {id: 'a', role: 'inner'},
                {id: 'b', role: 'outer'},
                {id: 'c', role: 'outer'}]});
            expect(r.memberByRole('outer')).to.eql({id: 'b', role: 'outer', index: 1});
        });

        it('returns undefined if no members have the given role', function () {
            expect(new iD.osmRelation().memberByRole('outer')).toBeUndefined();
        });
    });

    describe('#memberById', function () {
        it('returns the first member with the given id', function () {
            var r = new iD.osmRelation({members: [
                {id: 'a', role: 'outer'},
                {id: 'b', role: 'outer'},
                {id: 'b', role: 'inner'}]});
            expect(r.memberById('b')).to.eql({id: 'b', role: 'outer', index: 1});
        });

        it('returns undefined if no members have the given role', function () {
            expect(new iD.osmRelation().memberById('b')).toBeUndefined();
        });
    });

    describe('#hasFromViaTo', function () {
        it('returns true if there is a from, via, and to', function () {
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'manoeuvre' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' }
                ]
            });
            expect(r.hasFromViaTo()).toBe(true);
        });

        it('returns true if there are extra froms, vias, tos', function () {
            var r = new iD.osmRelation({
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
            expect(r.hasFromViaTo()).toBe(true);
        });

        it('returns false if from missing', function () {
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'manoeuvre' },
                members: [
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' }
                ]
            });
            expect(r.hasFromViaTo()).toBe(false);
        });

        it('returns false if via missing', function () {
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'manoeuvre' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'to', id: 't', type: 'way' }
                ]
            });
            expect(r.hasFromViaTo()).toBe(false);
        });

        it('returns false if to missing', function () {
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'manoeuvre' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' }
                ]
            });
            expect(r.hasFromViaTo()).toBe(false);
        });

        it('returns false if all missing', function () {
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'multipolygon' },
                members: [
                    { role: 'inner', id: 'i', type: 'way' },
                    { role: 'outer', id: 'o', type: 'way' }
                ]
            });
            expect(r.hasFromViaTo()).toBe(false);
        });

        it('returns true if the `intersection` role is used instead of `via` for destination signs', () => {
            const r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'destination_sign' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'intersection', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            expect(r.hasFromViaTo()).toBe(true);
        });

        it('returns false if the `intersection` role is used on anything other than a destination sign', () => {
            const r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'intersection', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            expect(r.hasFromViaTo()).toBe(false);
        });
    });

    describe('#isRestriction', function () {
        it('returns true for \'restriction\' type', function () {
            expect(new iD.osmRelation({tags: {type: 'restriction'}}).isRestriction()).toBe(true);
        });

        it('returns true for \'restriction:type\' types', function () {
            expect(new iD.osmRelation({tags: {type: 'restriction:bus'}}).isRestriction()).toBe(true);
        });

        it('returns false otherwise', function () {
            expect(new iD.osmRelation().isRestriction()).toBe(false);
            expect(new iD.osmRelation({tags: {type: 'multipolygon'}}).isRestriction()).toBe(false);
        });
    });

    describe('#isValidRestriction', function () {
        it('not a restriction', function () {
            var r = new iD.osmRelation({ id: 'r', tags: { type: 'multipolygon' }});
            var graph = new iD.coreGraph([r]);
            expect(r.isValidRestriction(graph)).toBe(false);
        });

        it('typical restriction (from way, via node, to way) is valid', function () {
            var f = new iD.osmWay({id: 'f'});
            var v = new iD.osmNode({id: 'v'});
            var t = new iD.osmWay({id: 't'});
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            var graph = new iD.coreGraph([f, v, t, r]);

            expect(r.isValidRestriction(graph)).toBe(true);
        });

        it('multiple froms, normal restriction is invalid', function () {
            var f1 = new iD.osmWay({id: 'f1'});
            var f2 = new iD.osmWay({id: 'f2'});
            var v = new iD.osmNode({id: 'v'});
            var t = new iD.osmWay({id: 't'});
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f1', type: 'way' },
                    { role: 'from', id: 'f2', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            var graph = new iD.coreGraph([f1, f2, v, t, r]);

            expect(r.isValidRestriction(graph)).toBe(false);
        });

        it('multiple froms, no_entry restriction is valid', function () {
            var f1 = new iD.osmWay({id: 'f1'});
            var f2 = new iD.osmWay({id: 'f2'});
            var v = new iD.osmNode({id: 'v'});
            var t = new iD.osmWay({id: 't'});
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_entry' },
                members: [
                    { role: 'from', id: 'f1', type: 'way' },
                    { role: 'from', id: 'f2', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            var graph = new iD.coreGraph([f1, f2, v, t, r]);

            expect(r.isValidRestriction(graph)).toBe(true);
        });

        it('multiple tos, normal restriction is invalid', function () {
            var f = new iD.osmWay({id: 'f'});
            var v = new iD.osmNode({id: 'v'});
            var t1 = new iD.osmWay({id: 't1'});
            var t2 = new iD.osmWay({id: 't2'});
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't1', type: 'way' },
                    { role: 'to', id: 't2', type: 'way' },
                ]
            });
            var graph = new iD.coreGraph([f, v, t1, t2, r]);

            expect(r.isValidRestriction(graph)).toBe(false);
        });

        it('multiple tos, no_exit restriction is valid', function () {
            var f = new iD.osmWay({id: 'f'});
            var v = new iD.osmNode({id: 'v'});
            var t1 = new iD.osmWay({id: 't1'});
            var t2 = new iD.osmWay({id: 't2'});
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_exit' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v', type: 'node' },
                    { role: 'to', id: 't1', type: 'way' },
                    { role: 'to', id: 't2', type: 'way' },
                ]
            });
            var graph = new iD.coreGraph([f, v, t1, t2, r]);

            expect(r.isValidRestriction(graph)).toBe(true);
        });

        it('multiple vias, with some as node is invalid', function () {
            var f = new iD.osmWay({id: 'f'});
            var v1 = new iD.osmNode({id: 'v1'});
            var v2 = new iD.osmWay({id: 'v2'});
            var t = new iD.osmWay({id: 't'});
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v1', type: 'node' },
                    { role: 'via', id: 'v2', type: 'way' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            var graph = new iD.coreGraph([f, v1, v2, t, r]);

            expect(r.isValidRestriction(graph)).toBe(false);
        });

        it('multiple vias, with all as way is valid', function () {
            var f = new iD.osmWay({id: 'f'});
            var v1 = new iD.osmWay({id: 'v1'});
            var v2 = new iD.osmWay({id: 'v2'});
            var t = new iD.osmWay({id: 't'});
            var r = new iD.osmRelation({
                id: 'r',
                tags: { type: 'restriction', restriction: 'no_left_turn' },
                members: [
                    { role: 'from', id: 'f', type: 'way' },
                    { role: 'via', id: 'v1', type: 'way' },
                    { role: 'via', id: 'v2', type: 'way' },
                    { role: 'to', id: 't', type: 'way' },
                ]
            });
            var graph = new iD.coreGraph([f, v1, v2, t, r]);

            expect(r.isValidRestriction(graph)).toBe(true);
        });
    });

    describe('#indexedMembers', function () {
        it('returns an array of members extended with indexes', function () {
            var r = new iD.osmRelation({members: [{id: '1'}, {id: '3'}]});
            expect(r.indexedMembers()).to.eql([{id: '1', index: 0}, {id: '3', index: 1}]);
        });
    });

    describe('#addMember', function () {
        it('adds a member at the end of the relation', function () {
            var r = new iD.osmRelation();
            expect(r.addMember({id: '1'}).members).to.eql([{id: '1'}]);
        });

        it('adds a member at index 0', function () {
            var r = new iD.osmRelation({members: [{id: '1'}]});
            expect(r.addMember({id: '2'}, 0).members).to.eql([{id: '2'}, {id: '1'}]);
        });

        it('adds a member at a positive index', function () {
            var r = new iD.osmRelation({members: [{id: '1'}, {id: '3'}]});
            expect(r.addMember({id: '2'}, 1).members).to.eql([{id: '1'}, {id: '2'}, {id: '3'}]);
        });

        it('adds a member at a negative index', function () {
            var r = new iD.osmRelation({members: [{id: '1'}, {id: '3'}]});
            expect(r.addMember({id: '2'}, -1).members).to.eql([{id: '1'}, {id: '2'}, {id: '3'}]);
        });
    });

    describe('#updateMember', function () {
        it('updates the properties of the relation member at the specified index', function () {
            var r = new iD.osmRelation({members: [{role: 'forward'}]});
            expect(r.updateMember({role: 'backward'}, 0).members).to.eql([{role: 'backward'}]);
        });
    });

    describe('#removeMember', function () {
        it('removes the member at the specified index', function () {
            var r = new iD.osmRelation({members: [{id: 'a'}, {id: 'b'}, {id: 'c'}]});
            expect(r.removeMember(1).members).to.eql([{id: 'a'}, {id: 'c'}]);
        });
    });

    describe('#removeMembersWithID', function () {
        it('removes members with the given ID', function () {
            var r = new iD.osmRelation({members: [{id: 'a'}, {id: 'b'}, {id: 'a'}]});
            expect(r.removeMembersWithID('a').members).to.eql([{id: 'b'}]);
        });
    });

    describe('#replaceMember', function () {
        it('returns self if self does not contain needle', function () {
            var r = new iD.osmRelation({members: []});
            expect(r.replaceMember({id: 'a'}, {id: 'b'})).to.equal(r);
        });

        it('replaces a member which doesn\'t already exist', function () {
            var r = new iD.osmRelation({members: [{id: 'a', role: 'a'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}).members)
                .to.eql([{id: 'b', role: 'a', type: 'node'}]);
        });

        it('preserves the existing role', function () {
            var r = new iD.osmRelation({members: [{id: 'a', role: 'a', type: 'node'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}).members)
                .to.eql([{id: 'b', role: 'a', type: 'node'}]);
        });

        it('uses the replacement type', function () {
            var r = new iD.osmRelation({members: [{id: 'a', role: 'a', type: 'node'}]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'way'}).members)
                .to.eql([{id: 'b', role: 'a', type: 'way'}]);
        });

        it('removes members if replacing them would produce duplicates', function () {
            var r = new iD.osmRelation({members: [
                {id: 'a', role: 'b', type: 'node'},
                {id: 'b', role: 'b', type: 'node'}
            ]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}).members)
                .to.eql([{id: 'b', role: 'b', type: 'node'}]);
        });
        it('keeps duplicate members if `keepDuplicates = true`', function () {
            var r = new iD.osmRelation({members: [
                {id: 'a', role: 'b', type: 'node'},
                {id: 'b', role: 'b', type: 'node'}
            ]});
            expect(r.replaceMember({id: 'a'}, {id: 'b', type: 'node'}, true).members)
                .to.eql([{id: 'b', role: 'b', type: 'node'}, {id: 'b', role: 'b', type: 'node'}]);
        });
    });

    describe('#asJXON', function () {
        it('converts a relation to jxon', function() {
            var relation = new iD.osmRelation({id: 'r-1', members: [{id: 'w1', role: 'forward', type: 'way'}], tags: {type: 'route'}});
            expect(relation.asJXON()).to.eql({relation: {
                '@id': '-1',
                '@version': 0,
                member: [{keyAttributes: {ref: '1', role: 'forward', type: 'way'}}],
                tag: [{keyAttributes: {k: 'type', v: 'route'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(new iD.osmRelation().asJXON('1234').relation['@changeset']).to.equal('1234');
        });
    });

    describe('#asGeoJSON', function () {
        it('converts a multipolygon to a GeoJSON MultiPolygon geometry', function() {
            var a = new iD.osmNode({loc: [1, 1]});
            var b = new iD.osmNode({loc: [3, 3]});
            var c = new iD.osmNode({loc: [2, 2]});
            var w = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            var r = new iD.osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]});
            var g = new iD.coreGraph([a, b, c, w, r]);
            var json = r.asGeoJSON(g);

            expect(json.type).to.equal('MultiPolygon');
            expect(json.coordinates).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        it('forces clockwise winding order for outer multipolygon ways', function() {
            var a = new iD.osmNode({loc: [0, 0]});
            var b = new iD.osmNode({loc: [0, 1]});
            var c = new iD.osmNode({loc: [1, 0]});
            var w = new iD.osmWay({nodes: [a.id, c.id, b.id, a.id]});
            var r = new iD.osmRelation({tags: {type: 'multipolygon'}, members: [{id: w.id, type: 'way'}]});
            var g = new iD.coreGraph([a, b, c, w, r]);
            var json = r.asGeoJSON(g);

            expect(json.coordinates[0][0]).to.eql([a.loc, b.loc, c.loc, a.loc]);
        });

        it('forces counterclockwise winding order for inner multipolygon ways', function() {
            var a = new iD.osmNode({loc: [0, 0]});
            var b = new iD.osmNode({loc: [0, 1]});
            var c = new iD.osmNode({loc: [1, 0]});
            var d = new iD.osmNode({loc: [0.1, 0.1]});
            var e = new iD.osmNode({loc: [0.1, 0.2]});
            var f = new iD.osmNode({loc: [0.2, 0.1]});
            var outer = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            var inner = new iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            var r = new iD.osmRelation({members: [{id: outer.id, type: 'way'}, {id: inner.id, role: 'inner', type: 'way'}]});
            var g = new iD.coreGraph([a, b, c, d, e, f, outer, inner, r]);

            expect(r.multipolygon(g)[0][1]).to.eql([d.loc, f.loc, e.loc, d.loc]);
        });

        it('converts a relation to a GeoJSON FeatureCollection', function() {
            var a = new iD.osmNode({loc: [1, 1]});
            var r = new iD.osmRelation({tags: {type: 'type'}, members: [{id: a.id, role: 'role'}]});
            var g = new iD.coreGraph([a, r]);
            var json = r.asGeoJSON(g);

            expect(json.type).to.equal('FeatureCollection');
            expect(json.properties).to.eql({type: 'type'});

            var nodejson = a.asGeoJSON(g);
            nodejson.role = 'role';
            expect(json.features).to.eql([nodejson]);
        });
    });

    describe('#multipolygon', function () {
        test('single polygon consisting of a single way', function () {
            var a = new iD.osmNode({loc: [1, 1]});
            var b = new iD.osmNode({loc: [3, 3]});
            var c = new iD.osmNode({loc: [2, 2]});
            var w = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            var r = new iD.osmRelation({members: [{id: w.id, type: 'way'}]});
            var g = new iD.coreGraph([a, b, c, w, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        test('single polygon consisting of multiple ways', function () {
            var a = new iD.osmNode({loc: [1, 1]});
            var b = new iD.osmNode({loc: [3, 3]});
            var c = new iD.osmNode({loc: [2, 2]});
            var w1 = new iD.osmWay({nodes: [a.id, b.id]});
            var w2 = new iD.osmWay({nodes: [b.id, c.id, a.id]});
            var r  = new iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            var g  = new iD.coreGraph([a, b, c, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        test('single polygon consisting of multiple ways, one needing reversal', function () {
            var a  = new iD.osmNode({loc: [1, 1]});
            var b  = new iD.osmNode({loc: [3, 3]});
            var c  = new iD.osmNode({loc: [2, 2]});
            var w1 = new iD.osmWay({nodes: [a.id, b.id]});
            var w2 = new iD.osmWay({nodes: [a.id, c.id, b.id]});
            var r  = new iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            var g  = new iD.coreGraph([a, b, c, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        test('multiple polygons consisting of single ways', function () {
            var a  = new iD.osmNode({loc: [1, 1]});
            var b  = new iD.osmNode({loc: [3, 3]});
            var c  = new iD.osmNode({loc: [2, 2]});
            var d  = new iD.osmNode({loc: [4, 4]});
            var e  = new iD.osmNode({loc: [6, 6]});
            var f  = new iD.osmNode({loc: [5, 5]});
            var w1 = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            var w2 = new iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            var r  = new iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            var g  = new iD.coreGraph([a, b, c, d, e, f, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]], [[d.loc, e.loc, f.loc, d.loc]]]);
        });

        test('invalid geometry: unclosed ring consisting of a single way', function () {
            var a = new iD.osmNode({loc: [1, 1]});
            var b = new iD.osmNode({loc: [3, 3]});
            var c = new iD.osmNode({loc: [2, 2]});
            var w = new iD.osmWay({nodes: [a.id, b.id, c.id]});
            var r = new iD.osmRelation({members: [{id: w.id, type: 'way'}]});
            var g = new iD.coreGraph([a, b, c, w, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        test('invalid geometry: unclosed ring consisting of multiple ways', function () {
            var a  = new iD.osmNode({loc: [1, 1]});
            var b  = new iD.osmNode({loc: [3, 3]});
            var c  = new iD.osmNode({loc: [2, 2]});
            var w1 = new iD.osmWay({nodes: [a.id, b.id]});
            var w2 = new iD.osmWay({nodes: [b.id, c.id]});
            var r  = new iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            var g  = new iD.coreGraph([a, b, c, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        test('invalid geometry: unclosed ring consisting of multiple ways, alternate order', function () {
            var a  = new iD.osmNode({loc: [1, 1]});
            var b  = new iD.osmNode({loc: [2, 2]});
            var c  = new iD.osmNode({loc: [3, 3]});
            var d  = new iD.osmNode({loc: [4, 4]});
            var w1 = new iD.osmWay({nodes: [c.id, d.id]});
            var w2 = new iD.osmWay({nodes: [a.id, b.id, c.id]});
            var r  = new iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            var g  = new iD.coreGraph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[d.loc, c.loc, b.loc, a.loc, d.loc]]]);
        });

        test('invalid geometry: unclosed ring consisting of multiple ways, one needing reversal', function () {
            var a  = new iD.osmNode({loc: [1, 1]});
            var b  = new iD.osmNode({loc: [2, 2]});
            var c  = new iD.osmNode({loc: [3, 3]});
            var d  = new iD.osmNode({loc: [4, 4]});
            var w1 = new iD.osmWay({nodes: [a.id, b.id, c.id]});
            var w2 = new iD.osmWay({nodes: [d.id, c.id]});
            var r  = new iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            var g  = new iD.coreGraph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, d.loc, c.loc, b.loc, a.loc]]]);
        });

        test('invalid geometry: unclosed ring consisting of multiple ways, one needing reversal, alternate order', function () {
            var a  = new iD.osmNode({loc: [1, 1]});
            var b  = new iD.osmNode({loc: [2, 2]});
            var c  = new iD.osmNode({loc: [3, 3]});
            var d  = new iD.osmNode({loc: [4, 4]});
            var w1 = new iD.osmWay({nodes: [c.id, d.id]});
            var w2 = new iD.osmWay({nodes: [c.id, b.id, a.id]});
            var r  = new iD.osmRelation({members: [{id: w1.id, type: 'way'}, {id: w2.id, type: 'way'}]});
            var g  = new iD.coreGraph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[d.loc, c.loc, b.loc, a.loc, d.loc]]]);
        });

        test('single polygon with single single-way inner', function () {
            var a = new iD.osmNode({loc: [0, 0]});
            var b = new iD.osmNode({loc: [0, 1]});
            var c = new iD.osmNode({loc: [1, 0]});
            var d = new iD.osmNode({loc: [0.1, 0.1]});
            var e = new iD.osmNode({loc: [0.2, 0.1]});
            var f = new iD.osmNode({loc: [0.1, 0.2]});
            var outer = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            var inner = new iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            var r = new iD.osmRelation({members: [
                {id: outer.id, type: 'way'},
                {id: inner.id, role: 'inner', type: 'way'}
            ]});
            var g = new iD.coreGraph([a, b, c, d, e, f, outer, inner, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc]]]);
        });

        test('single polygon with single multi-way inner', function () {
            var a = new iD.osmNode({loc: [0, 0]});
            var b = new iD.osmNode({loc: [0, 1]});
            var c = new iD.osmNode({loc: [1, 0]});
            var d = new iD.osmNode({loc: [0.1, 0.1]});
            var e = new iD.osmNode({loc: [0.2, 0.1]});
            var f = new iD.osmNode({loc: [0.2, 0.1]});
            var outer = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            var inner1 = new iD.osmWay({nodes: [d.id, e.id]});
            var inner2 = new iD.osmWay({nodes: [e.id, f.id, d.id]});
            var r = new iD.osmRelation({members: [
                {id: outer.id, type: 'way'},
                {id: inner1.id, role: 'inner', type: 'way'},
                {id: inner2.id, role: 'inner', type: 'way'}
            ]});
            var graph = new iD.coreGraph([a, b, c, d, e, f, outer, inner1, inner2, r]);

            expect(r.multipolygon(graph)).to.eql([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc]]]);
        });

        test('single polygon with multiple single-way inners', function () {
            var a = new iD.osmNode({loc: [0, 0]});
            var b = new iD.osmNode({loc: [0, 1]});
            var c = new iD.osmNode({loc: [1, 0]});
            var d = new iD.osmNode({loc: [0.1, 0.1]});
            var e = new iD.osmNode({loc: [0.2, 0.1]});
            var f = new iD.osmNode({loc: [0.1, 0.2]});
            var g = new iD.osmNode({loc: [0.2, 0.2]});
            var h = new iD.osmNode({loc: [0.3, 0.2]});
            var i = new iD.osmNode({loc: [0.2, 0.3]});
            var outer = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            var inner1 = new iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            var inner2 = new iD.osmWay({nodes: [g.id, h.id, i.id, g.id]});
            var r = new iD.osmRelation({members: [
                {id: outer.id, type: 'way'},
                {id: inner1.id, role: 'inner', type: 'way'},
                {id: inner2.id, role: 'inner', type: 'way'}
            ]});
            var graph = new iD.coreGraph([a, b, c, d, e, f, g, h, i, outer, inner1, inner2, r]);

            expect(r.multipolygon(graph)).to.eql([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc], [g.loc, h.loc, i.loc, g.loc]]]);
        });

        test('multiple polygons with single single-way inner', function () {
            var a = new iD.osmNode({loc: [0, 0]});
            var b = new iD.osmNode({loc: [0, 1]});
            var c = new iD.osmNode({loc: [1, 0]});
            var d = new iD.osmNode({loc: [0.1, 0.1]});
            var e = new iD.osmNode({loc: [0.2, 0.1]});
            var f = new iD.osmNode({loc: [0.1, 0.2]});
            var g = new iD.osmNode({loc: [0, 0]});
            var h = new iD.osmNode({loc: [0, -1]});
            var i = new iD.osmNode({loc: [-1, 0]});
            var outer1 = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            var outer2 = new iD.osmWay({nodes: [g.id, h.id, i.id, g.id]});
            var inner = new iD.osmWay({nodes: [d.id, e.id, f.id, d.id]});
            var r = new iD.osmRelation({members: [
                {id: outer1.id, type: 'way'},
                {id: outer2.id, type: 'way'},
                {id: inner.id, role: 'inner', type: 'way'}
            ]});
            var graph = new iD.coreGraph([a, b, c, d, e, f, g, h, i, outer1, outer2, inner, r]);

            expect(r.multipolygon(graph)).to.eql([[[a.loc, b.loc, c.loc, a.loc], [d.loc, e.loc, f.loc, d.loc]], [[g.loc, h.loc, i.loc, g.loc]]]);
        });

        test('invalid geometry: unmatched inner', function () {
            var a = new iD.osmNode({loc: [1, 1]});
            var b = new iD.osmNode({loc: [2, 2]});
            var c = new iD.osmNode({loc: [3, 3]});
            var w = new iD.osmWay({nodes: [a.id, b.id, c.id, a.id]});
            var r = new iD.osmRelation({members: [{id: w.id, role: 'inner', type: 'way'}]});
            var g = new iD.coreGraph([a, b, c, w, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, b.loc, c.loc, a.loc]]]);
        });

        test('incomplete relation', function () {
            var a = new iD.osmNode({loc: [1, 1]});
            var b = new iD.osmNode({loc: [2, 2]});
            var c = new iD.osmNode({loc: [3, 3]});
            var w1 = new iD.osmWay({nodes: [a.id, b.id, c.id]});
            var w2 = new iD.osmWay();
            var r  = new iD.osmRelation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]});
            var g  = new iD.coreGraph([a, b, c, w1, r]);

            expect(r.multipolygon(g)).to.eql([[[a.loc, c.loc, b.loc, a.loc]]]);
        });
    });

    describe('.creationOrder comparator', function () {
        it('orders existing relations newest-first', function () {
            var a = new iD.osmRelation({ id: 'r1' });
            var b = new iD.osmRelation({ id: 'r2' });
            expect(iD.osmRelation.creationOrder(a, b)).to.be.above(0);
            expect(iD.osmRelation.creationOrder(b, a)).to.be.below(0);
        });

        it('orders new relations newest-first', function () {
            var a = new iD.osmRelation({ id: 'r-1' });
            var b = new iD.osmRelation({ id: 'r-2' });
            expect(iD.osmRelation.creationOrder(a, b)).to.be.above(0);
            expect(iD.osmRelation.creationOrder(b, a)).to.be.below(0);
        });
    });
});
