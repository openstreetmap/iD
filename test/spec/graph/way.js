describe('Way', function() {
    describe('#isClosed', function() {
        it('is not closed with two distinct nodes', function() {
            var open_way = { type: 'way', nodes: [{id: 'n1'}, {id: 'n2'}] };
            expect(iD.Way.isClosed(open_way)).to.equal(false);
        });
        it('is not closed with a node loop', function() {
            var closed_way = { type: 'way', nodes: [{id: 'n1'}, {id: 'n2'}, {id: 'n1'}] };
            expect(iD.Way.isClosed(closed_way)).to.equal(true);
        });
    });

    describe('#isOneWay', function() {
        it('is not oneway without any tags', function() {
            expect(iD.Way.isOneWay(iD.Way())).to.eql(false);
        });
        it('is not oneway oneway=no', function() {
            expect(iD.Way.isOneWay(iD.Way({ tags: { oneway: 'no' } }))).to.eql(false);
        });
        it('is oneway oneway=yes', function() {
            expect(iD.Way.isOneWay(iD.Way({ tags: { oneway: 'yes' } }))).to.eql(true);
        });
    });
});
