describe('iD.utilArray', function() {
    it('utilArrayDifference returns difference of two Arrays', function() {
        var a = [1, 2, 3];
        var b = [4, 3, 2];
        expect(iD.utilArrayDifference([], [])).to.eql([]);
        expect(iD.utilArrayDifference([], a)).to.eql([]);
        expect(iD.utilArrayDifference(a, [])).to.have.members([1, 2, 3]);
        expect(iD.utilArrayDifference(a, b)).to.have.members([1]);
        expect(iD.utilArrayDifference(b, a)).to.have.members([4]);
    });

    it('utilArrayIntersection returns intersection of two Arrays', function() {
        var a = [1, 2, 3];
        var b = [4, 3, 2];
        expect(iD.utilArrayIntersection([], [])).to.eql([]);
        expect(iD.utilArrayIntersection([], a)).to.eql([]);
        expect(iD.utilArrayIntersection(a, [])).to.eql([]);
        expect(iD.utilArrayIntersection(a, b)).to.have.members([2, 3]);
        expect(iD.utilArrayIntersection(b, a)).to.have.members([2, 3]);
    });

    it('utilArrayUnion returns union of two Arrays', function() {
        var a = [1, 2, 3];
        var b = [4, 3, 2];
        expect(iD.utilArrayUnion([], [])).to.eql([]);
        expect(iD.utilArrayUnion([], a)).to.have.members([1, 2, 3]);
        expect(iD.utilArrayUnion(a, [])).to.have.members([1, 2, 3]);
        expect(iD.utilArrayUnion(a, b)).to.have.members([1, 2, 3, 4]);
        expect(iD.utilArrayUnion(b, a)).to.have.members([1, 2, 3, 4]);
    });

    it('utilArrayUniq returns unique values in an Array', function() {
        var a = [1, 1, 2, 3, 3];
        expect(iD.utilArrayUniq([])).to.eql([]);
        expect(iD.utilArrayUniq(a)).to.have.members([1, 2, 3]);
    });

    it('utilArrayChunk returns array split into given sized chunks', function() {
        var a = [1, 2, 3, 4, 5, 6, 7];
        // bad chunkSizes, just copy whole array into a single chunk
        expect(iD.utilArrayChunk(a)).to.eql([[1, 2, 3, 4, 5, 6, 7]]);
        expect(iD.utilArrayChunk(a), -1).to.eql([[1, 2, 3, 4, 5, 6, 7]]);
        expect(iD.utilArrayChunk(a), 0).to.eql([[1, 2, 3, 4, 5, 6, 7]]);
        // good chunkSizes
        expect(iD.utilArrayChunk(a, 2)).to.eql([[1, 2], [3, 4], [5, 6], [7]]);
        expect(iD.utilArrayChunk(a, 3)).to.eql([[1, 2, 3], [4, 5, 6], [7]]);
        expect(iD.utilArrayChunk(a, 4)).to.eql([[1, 2, 3, 4], [5, 6, 7]]);
    });

    it('utilArrayFlatten returns two level array as single level', function() {
        var a = [[1, 2, 3], [4, 5, 6], [7]];
        expect(iD.utilArrayFlatten(a)).to.eql([1, 2, 3, 4, 5, 6, 7]);
    });

    describe('utilArrayGroupBy', function() {
        var pets = [
            { type: 'Dog', name: 'Spot' },
            { type: 'Cat', name: 'Tiger' },
            { type: 'Dog', name: 'Rover' },
            { type: 'Cat', name: 'Leo' }
        ];

        it('groups by key property', function() {
            var expected = {
                'Dog': [{type: 'Dog', name: 'Spot'}, {type: 'Dog', name: 'Rover'}],
                'Cat': [{type: 'Cat', name: 'Tiger'}, {type: 'Cat', name: 'Leo'}]
            };
            expect(iD.utilArrayGroupBy(pets, 'type')).to.eql(expected);
        });

        it('groups by key function', function() {
            var expected = {
                3: [{type: 'Cat', name: 'Leo'}],
                4: [{type: 'Dog', name: 'Spot'}],
                5: [{type: 'Cat', name: 'Tiger'}, {type: 'Dog', name: 'Rover'}]
            };
            var keyFn = function(item) { return item.name.length; };
            expect(iD.utilArrayGroupBy(pets, keyFn)).to.eql(expected);
        });

        it('undefined key function', function() {
            var expected = {
                undefined: pets
            };
            expect(iD.utilArrayGroupBy(pets)).to.eql(expected);
        });
    });

    describe('utilArrayUniqBy', function() {
        var pets = [
            { type: 'Dog', name: 'Spot' },
            { type: 'Cat', name: 'Tiger' },
            { type: 'Dog', name: 'Rover' },
            { type: 'Cat', name: 'Leo' }
        ];

        it('groups by key property', function() {
            var expected = [
                { type: 'Dog', name: 'Spot' },
                { type: 'Cat', name: 'Tiger' }
                //{ type: 'Dog', name: 'Rover' },   // not unique by type
                //{ type: 'Cat', name: 'Leo' }      // not unique by type
            ];
            expect(iD.utilArrayUniqBy(pets, 'type')).to.eql(expected);
        });

        it('groups by key function', function() {
            var expected = [
                { type: 'Dog', name: 'Spot' },
                { type: 'Cat', name: 'Tiger' },
                //{ type: 'Dog', name: 'Rover' },   // not unique by name length
                { type: 'Cat', name: 'Leo' }
            ];
            var keyFn = function(item) { return item.name.length; };
            expect(iD.utilArrayUniqBy(pets, keyFn)).to.eql(expected);
        });

        it('undefined key function', function() {
            expect(iD.utilArrayUniqBy(pets)).to.eql([]);
        });
    });

});
