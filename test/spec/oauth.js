describe('OAuth', function() {
    var o;
    beforeEach(function() {
        o = iD.OAuth();
    });
    describe('#logout', function() {
        it('can log out and will no longer be authenticated', function() {
            expect(o.logout()).to.equal(o);
            expect(o.authenticated()).not.to.be.ok;
        });
    });
    describe('#api', function() {
        it('gets and sets url', function() {
            expect(o.api('foo')).to.equal(o);
            expect(o.api()).to.equal('foo');
        });
    });

});
