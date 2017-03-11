describe('iD.osmChangeset', function () {
    it('returns a changeset', function () {
        expect(iD.osmChangeset()).to.be.an.instanceOf(iD.osmChangeset);
        expect(iD.osmChangeset().type).to.equal('changeset');
    });

    it('defaults tags to an empty object', function () {
        expect(iD.osmChangeset().tags).to.eql({});
    });

    it('sets tags as specified', function () {
        expect(iD.osmChangeset({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe('#asJXON', function () {
        it('converts a node to jxon', function() {
            var node = iD.osmChangeset({tags: {'comment': 'hello'}});
            expect(node.asJXON()).to.eql({
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
});
