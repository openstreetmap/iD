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
        var source = iD.BackgroundSource({ template: '{t}/{z}/{x}/{y}', subdomains: ['apples', 'oranges'] });
        expect(source.url([0,1,2])).to.equal('oranges/2/0/1');
    });

    it('distributes requests between subdomains', function() {
        var source = iD.BackgroundSource({ template: '{t}/{z}/{x}/{y}', subdomains: ['apples', 'oranges'] });
        expect(source.url([0,1,1])).to.equal('oranges/1/0/1');
        expect(source.url([0,2,1])).to.equal('apples/1/0/2');
    });

    it('supports josm style templates', function() {
        var source = iD.BackgroundSource({ template: '{switch:foo,bar}/{zoom}/{x}/{y}' });
        expect(source.url([0,1,1])).to.equal('bar/1/0/1');
    });
});
