describe('iD.OAuth', function() {
    var o;

    beforeEach(function() {
        context = iD();
        o = iD.OAuth(context);
    });

    describe('#logout', function() {
        it('can log out and will no longer be authenticated', function() {
            expect(o.logout()).to.equal(o);
            expect(o.authenticated()).not.to.be.ok;
        });
    });

    describe('#url', function() {
        it('gets and sets url', function() {
            expect(o.url('foo')).to.equal(o);
            expect(o.url()).to.equal('foo');
        });
    });
});
