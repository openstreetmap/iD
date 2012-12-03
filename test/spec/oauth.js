describe('OAuth', function() {
    var o;
    beforeEach(function() {
        o = iD.OAuth();
    });
    describe('#logout', function() {
        it('can log out and will no longer be authenticated', function() {
            expect(o.logout()).toEqual(o);
            expect(o.authenticated()).toBeFalsy();
        });
    });
    describe('#api', function() {
        it('gets and sets url', function() {
            expect(o.api('foo')).toEqual(o);
            expect(o.api()).toBe('foo');
        });
    });

});
