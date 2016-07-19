describe('iD', function() {
    var assets = {
        'iD/img/loader.gif': '/assets/iD/img/loader-b66184b5c4afbccc25f.gif'
    };

    describe('#assetPath', function() {
        it('sets and gets assetPath', function() {
            var context = iD.Context(window);
            expect(context.assetPath()).to.eql('');

            context.assetPath('iD/');
            expect(context.assetPath()).to.eql('iD/');
        });
    });

    describe('#assetMap', function() {
        it('sets and gets assetMap', function() {
            var context = iD.Context(window);
            expect(context.assetMap()).to.eql({});

            context.assetMap(assets);
            expect(context.assetMap()).to.eql(assets);
        });
    });

    describe('#asset', function() {
        var context;
        beforeEach(function() {
            context = iD.Context(window).assetPath('iD/').assetMap(assets);
        });

        it('looks first in assetMap', function() {
            expect(context.asset('img/loader.gif')).to.eql('/assets/iD/img/loader-b66184b5c4afbccc25f.gif');
        });
        it('falls back to prepending assetPath', function() {
            expect(context.asset('img/spinner.gif')).to.eql('iD/img/spinner.gif');
        });
    });

    describe('#imagePath', function() {
        var context;
        beforeEach(function() {
            context = iD.Context(window).assetPath('iD/').assetMap(assets);
        });

        it('looks first in assetMap', function() {
            expect(context.imagePath('loader.gif')).to.eql('/assets/iD/img/loader-b66184b5c4afbccc25f.gif');
        });
        it('falls back to prepending assetPath', function() {
            expect(context.imagePath('spinner.gif')).to.eql('iD/img/spinner.gif');
        });
    });

    describe('#presets', function() {
        it('supports custom presets', function() {
            var presetsCollection = {
                presets: {
                    'mines': {
                        geometry: ['point', 'area'],
                        name: 'Mining Concession',
                        tags: { 'concession': 'mining' }
                    },
                    'area': {
                        'name': 'Area',
                        'tags': {},
                        'geometry': ['area']
                    },
                    'point': {
                        'name': 'Point',
                        'tags': {},
                        'geometry': ['point']
                    },
                    'line': {
                        'name': 'Line',
                        'tags': {},
                        'geometry': ['line']
                    },
                    'vertex': {
                        'name': 'Other',
                        'tags': {},
                        'geometry': ['vertex']
                    }
                },
                fields: {
                    'name': {
                        'key': 'name',
                        'type': 'localized',
                        'label': 'Name',
                        'placeholder': 'Common name (if any)'
                    }
                }
            };

            var context = iD.Context(window).presets(presetsCollection),
                way = iD.Way({tags: {concession: 'mining', area: 'yes'}}),
                graph = iD.Graph([way]);

            expect(context.presets().match(way, graph).id).to.eql('mines');
        });
    });

    describe('#debug', function() {
        it('sets and gets debug flags', function() {
            var context = iD.Context(window),
                flags = {
                    tile: false,
                    collision: false,
                    imagery: false,
                    imperial: false,
                    driveLeft: false
                };

            expect(context.debugFlags()).to.eql(flags);

            context.setDebug('tile', true);
            expect(context.getDebug('tile')).to.be.true;

            context.setDebug('collision');
            expect(context.getDebug('collision')).to.be.true;

            context.setDebug('tile', false);
            expect(context.getDebug('tile')).to.be.false;
        });
    });

});
