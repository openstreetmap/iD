describe('iD.BackgroundSource', function() {
    it('does not error with blank template', function() {
        var source = iD.BackgroundSource({ template: '' });
        expect(source.url([0,1,2])).to.equal('');
    });

    it('generates a tile-generating source', function() {
        var source = iD.BackgroundSource({ template: '{z}/{x}/{y}' });
        expect(source.url([0,1,2])).to.equal('2/0/1');
    });

    it('supports subdomains', function() {
        var source = iD.BackgroundSource({ template: '{switch:a,b}/{z}/{x}/{y}'});
        expect(source.url([0,1,2])).to.equal('b/2/0/1');
    });

    it('distributes requests between subdomains', function() {
        var source = iD.BackgroundSource({ template: '{switch:a,b}/{z}/{x}/{y}' });
        expect(source.url([0,1,1])).to.equal('b/1/0/1');
        expect(source.url([0,2,1])).to.equal('a/1/0/2');
    });
});
