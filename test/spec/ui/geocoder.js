describe("Geocoder", function () {
    it('can be instantiated', function () {
        var geocoder = iD.geocoder();
        expect(geocoder).to.be.ok;
    });
});
