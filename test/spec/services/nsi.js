import { setTimeout } from 'node:timers/promises';

describe('iD.serviceNsi', function () {
    beforeAll(function () {
        iD.services.nsi = iD.serviceNsi;

        // Provide cached datasets so the test does not download NSI data.
        iD.fileFetcher.cache().nsi_presets = { presets: {} };
        iD.fileFetcher.cache().nsi_features = {
            type: 'FeatureCollection',
            features: []
        };
        iD.fileFetcher.cache().nsi_dissolved = { dissolved: {} };
        iD.fileFetcher.cache().nsi_replacements = { replacements: {} };
        iD.fileFetcher.cache().nsi_generics = { genericWords: [] };
        iD.fileFetcher.cache().nsi_wikidata = {
            wikidata: {}
        };

        iD.fileFetcher.cache().nsi_trees = {
            trees: {
                transit: {
                    mainTag: 'network:wikidata'
                }
            }
        };

        iD.fileFetcher.cache().nsi_data = {
            nsi: {
                'transit/railway/station': {
                    properties: {
                        path: 'transit/railway/station'
                    },
                    items: [
                        {
                            id: 'london-elizabeth-line',
                            locationSet: {
                                include: ['Q2']
                            },
                            tags: {
                                railway: 'station',
                                public_transport: 'station',
                                network: 'Elizabeth line',
                                'network:wikidata': 'Q111297173',
                                operator: 'Transport for London',
                                'operator:wikidata': 'Q682520'
                            }
                        }
                    ]
                }
            }
        };

        iD.fileFetcher.cache().preset_presets = {};
    });

    afterAll(function () {
        delete iD.services.nsi;
    });

    beforeEach(function () {
        iD.coreContext().assetPath('../dist/').init();
    });

    async function waitForNsi() {
        for (let i = 0; i < 500; i++) {
            const status = iD.serviceNsi.status();

            if (status === 'ok') return;
            if (status === 'failed') {
                throw new Error('NSI initialization failed');
            }


            await setTimeout(10);
        }

        throw new Error('Timed out waiting for NSI initialization');
    }

    it('does not replace an existing transit network based only on a shared operator', async function () {
        await waitForNsi();

        const originalTags = {
            railway: 'station',
            public_transport: 'station',
            station: 'subway',
            network: 'London Underground',
            operator: 'Transport for London'
        };

        const upgradedTags = iD.serviceNsi.upgradeTags(originalTags);

        expect(upgradedTags).to.equal(null);
    });

    it('can still match a transit network using its operator when network is absent', async function () {
        await waitForNsi();

        const originalTags = {
            railway: 'station',
            public_transport: 'station',
            operator: 'Transport for London'
        };

        const upgradedTags = iD.serviceNsi.upgradeTags(originalTags);

        expect(upgradedTags.newTags.network).to.equal('Elizabeth line');
        expect(upgradedTags.matched.id).to.equal('london-elizabeth-line');
    });
});
