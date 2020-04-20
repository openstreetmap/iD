describe('iD.util', function() {

    describe('utilGetAllNodes', function() {
        it('gets all descendant nodes of a way', function() {
            var a = iD.osmNode({ id: 'a' });
            var b = iD.osmNode({ id: 'b' });
            var w = iD.osmWay({ id: 'w', nodes: ['a','b','a'] });
            var graph = iD.coreGraph([a, b, w]);
            var result = iD.utilGetAllNodes(['w'], graph);

            expect(result).to.have.members([a, b]);
            expect(result).to.have.lengthOf(2);
        });

        it('gets all descendant nodes of a relation', function() {
            var a = iD.osmNode({ id: 'a' });
            var b = iD.osmNode({ id: 'b' });
            var c = iD.osmNode({ id: 'c' });
            var w = iD.osmWay({ id: 'w', nodes: ['a','b','a'] });
            var r = iD.osmRelation({ id: 'r', members: [{id: 'w'}, {id: 'c'}] });
            var graph = iD.coreGraph([a, b, c, w, r]);
            var result = iD.utilGetAllNodes(['r'], graph);

            expect(result).to.have.members([a, b, c]);
            expect(result).to.have.lengthOf(3);
        });

        it('gets all descendant nodes of multiple ids', function() {
            var a = iD.osmNode({ id: 'a' });
            var b = iD.osmNode({ id: 'b' });
            var c = iD.osmNode({ id: 'c' });
            var d = iD.osmNode({ id: 'd' });
            var e = iD.osmNode({ id: 'e' });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['a','b','a'] });
            var w2 = iD.osmWay({ id: 'w2', nodes: ['c','b','a','c'] });
            var r = iD.osmRelation({ id: 'r', members: [{id: 'w1'}, {id: 'd'}] });
            var graph = iD.coreGraph([a, b, c, d, e, w1, w2, r]);
            var result = iD.utilGetAllNodes(['r', 'w2', 'e'], graph);

            expect(result).to.have.members([a, b, c, d, e]);
            expect(result).to.have.lengthOf(5);
        });

        it('handles recursive relations', function() {
            var a = iD.osmNode({ id: 'a' });
            var r1 = iD.osmRelation({ id: 'r1', members: [{id: 'r2'}] });
            var r2 = iD.osmRelation({ id: 'r2', members: [{id: 'r1'}, {id: 'a'}] });
            var graph = iD.coreGraph([a, r1, r2]);
            var result = iD.utilGetAllNodes(['r1'], graph);

            expect(result).to.have.members([a]);
            expect(result).to.have.lengthOf(1);
        });
    });

    it('utilTagDiff', function() {
        var oldTags = { a: 'one', b: 'two', c: 'three' };
        var newTags = { a: 'one', b: 'three', d: 'four' };
        var diff = iD.utilTagDiff(oldTags, newTags);
        expect(diff).to.have.length(4);
        expect(diff[0]).to.eql({
            type: '-', key: 'b', oldVal: 'two', newVal: 'three', display: '- b=two'        // delete-modify
        });
        expect(diff[1]).to.eql({
            type: '+', key: 'b', oldVal: 'two', newVal: 'three', display: '+ b=three'      // insert-modify
        });
        expect(diff[2]).to.eql({
            type: '-', key: 'c', oldVal: 'three', newVal: undefined, display: '- c=three'  // delete
        });
        expect(diff[3]).to.eql({
            type: '+', key: 'd', oldVal: undefined, newVal: 'four', display: '+ d=four'    // insert
        });
    });

    it('utilTagText', function() {
        expect(iD.utilTagText({})).to.eql('');
        expect(iD.utilTagText({tags:{foo:'bar'}})).to.eql('foo=bar');
        expect(iD.utilTagText({tags:{foo:'bar',two:'three'}})).to.eql('foo=bar, two=three');
    });

    it('utilStringQs', function() {
        it('splits a parameter string into k=v pairs', function() {
            expect(iD.utilStringQs('foo=bar')).to.eql({foo: 'bar'});
            expect(iD.utilStringQs('foo=bar&one=2')).to.eql({foo: 'bar', one: '2' });
            expect(iD.utilStringQs('')).to.eql({});
        });
        it('trims leading # if present', function() {
            expect(iD.utilStringQs('#foo=bar')).to.eql({foo: 'bar'});
            expect(iD.utilStringQs('#foo=bar&one=2')).to.eql({foo: 'bar', one: '2' });
            expect(iD.utilStringQs('#')).to.eql({});
        });
        it('trims leading ? if present', function() {
            expect(iD.utilStringQs('?foo=bar')).to.eql({foo: 'bar'});
            expect(iD.utilStringQs('?foo=bar&one=2')).to.eql({foo: 'bar', one: '2' });
            expect(iD.utilStringQs('?')).to.eql({});
        });
        it('trims leading #? if present', function() {
            expect(iD.utilStringQs('#?foo=bar')).to.eql({foo: 'bar'});
            expect(iD.utilStringQs('#?foo=bar&one=2')).to.eql({foo: 'bar', one: '2' });
            expect(iD.utilStringQs('#?')).to.eql({});
        });
    });

    it('utilQsString', function() {
        expect(iD.utilQsString({ foo: 'bar' })).to.eql('foo=bar');
        expect(iD.utilQsString({ foo: 'bar', one: 2 })).to.eql('foo=bar&one=2');
        expect(iD.utilQsString({})).to.eql('');
    });

    describe('utilEditDistance', function() {
        it('returns zero for same strings', function() {
            expect(iD.utilEditDistance('foo', 'foo')).to.eql(0);
        });

        it('reports an insertion of 1', function() {
            expect(iD.utilEditDistance('foo', 'fooa')).to.eql(1);
        });

        it('reports a replacement of 1', function() {
            expect(iD.utilEditDistance('foob', 'fooa')).to.eql(1);
        });

        it('does not fail on empty input', function() {
            expect(iD.utilEditDistance('', '')).to.eql(0);
        });
    });

    describe('utilAsyncMap', function() {
        it('handles correct replies', function() {
            iD.utilAsyncMap([1, 2, 3],
                function(d, c) { c(null, d * 2); },
                function(err, res) {
                    expect(err).to.eql([null, null, null]);
                    expect(res).to.eql([2, 4, 6]);
                });
        });
        it('handles errors', function() {
            iD.utilAsyncMap([1, 2, 3],
                function(d, c) { c('whoops ' + d, null); },
                function(err, res) {
                    expect(err).to.eql(['whoops 1', 'whoops 2', 'whoops 3']);
                    expect(res).to.eql([null, null, null]);
                });
        });
    });
});
