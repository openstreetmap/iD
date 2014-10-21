describe('iD', function() {
    describe("#presets", function() {
        it("supports custom presets", function() {
            var presetsCollection = {
                presets: {
                    'mines': {
                        geometry: ['point', 'area'],
                        name: 'Mining Concession',
                        tags: {
                            'concession': 'mining'
                        }
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

            var context = iD().presets(presetsCollection),
                way = iD.Way({tags: {concession: 'mining', area: 'yes'}}),
                graph = iD.Graph([way]);

            expect(context.presets().match(way, graph).id).to.eql('mines');
        });
    });
});
