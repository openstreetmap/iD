describe('iD.Features', function() {
    var context, features;

    beforeEach(function() {
        context = iD();
        features = context.features();
    });

    it('returns feature keys', function() {
        var keys = features.keys();
        expect(keys).to.have.members([
            'points', 'major_roads', 'minor_roads', 'paths',
            'buildings', 'landuse', 'boundaries', 'water', 'rail',
            'power', 'past_future', 'others'
        ]);
    });

    it('disables and enables features', function() {
        var enabled, disabled;

        features.disable('water');
        features.disable('rail');
        enabled = features.enabled();
        disabled = features.disabled();

        expect(enabled).to.not.have.members(['water', 'rail']);
        expect(disabled).to.have.members(['water', 'rail']);

        features.enable('water');
        enabled = features.enabled();
        disabled = features.disabled();

        expect(enabled).to.include('water');
        expect(enabled).to.not.include('rail');
        expect(disabled).to.include('rail');
        expect(disabled).to.not.include('water');
    });

});
