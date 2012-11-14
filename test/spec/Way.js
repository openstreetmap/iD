describe('Way', function() {
  var way;

  beforeEach(function() {
      way = { type: 'way', nodes: [{id: 'n1'}, {id: 'n2'}] };
  });


  describe('#isClosed', function() {
      it('is not closed with two distinct nodes ', function() {
          expect(iD.Way.isClosed(way)).toEqual(false);
      });
  });
});
