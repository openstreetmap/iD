import { select as d3_select } from 'd3-selection';

describe('iD.uiSectionLifecycleEditor', function () {
    let lifecycleEditor, element, context, entity, presets;

    function render(tags, presets) {
        lifecycleEditor = iD.uiSectionLifecycleEditor(context)
            .entityIDs([entity.id])
            .tags(tags)
            .presets(presets)
            .expandedByDefault(true);

        element = d3_select('body')
            .append('div')
            .attr('class', 'ui-wrap')
            .call(lifecycleEditor.render);
    }

    beforeEach(function () {
        entity = iD.osmNode({id: 'n12345'});
        presets = [
            {
                icon: 'iD-highway-secondary',
                geometry: [
                    'line'
                ],
                tags: {
                    'highway': 'secondary'
                },
                fields : () =>
                [
                    {
                        key: 'name',
                        type: 'localized',
                        universal: true,
                        id: 'name',
                        safeid: 'name',
                        originalTerms: ''
                    }
                ],
                moreFields : () =>
                [
                    {
                        key: 'maxspeed',
                        type: 'roadspeed',
                        id: 'maxspeed',
                        safeid: 'maxspeed',
                        originalTerms: ''
                    }
                ],
                id: 'highway/secondary',
                safeid: 'highway_secondary',
                originalTerms: '',
                originalName: '',
                originalAliases: '',
                originalScore: 1,
                originalReference: {},
                originalFields: [
                    '{highway/primary}'
                ],
                originalMoreFields: [
                    '{highway/primary}'
                ],
                lifecycle: 'functional',
                addTags: {
                    highway: 'secondary'
                },
                removeTags: {
                    highway: 'secondary'
                }
            }
        ];
        context = iD.coreContext().assetPath('../dist/').init();
        context.history().merge([entity]);
        render({highway: 'residential'}, presets);
    });

    afterEach(function () {
        d3_select('.ui-wrap').remove();
    });

    it('renders the lifecycle editor section', function () {
        expect(element.select('.lifecycle-main').empty()).to.be.false;
        expect(element.select('.lifecycle-extra').empty()).to.be.false;
    });

    it('displays the correct lifecycle options', function () {
        const options = element.selectAll('.lifecycle-radio-row');
        expect(options.nodes().length).to.be.greaterThan(0);
        const functionOption = element.selectAll('.lifecycle-radio-functional');
        expect(functionOption.nodes().some(option => option.value === 'functional')).to.be.true;
    });

    it('updates lifecycle and restores functional lifecycle', async () => {
        const firstChange = new Promise(resolve => {
            lifecycleEditor.on('change', (_, tags) => resolve(tags));
        });

        const radio = element.select('input[value=construction]').node();
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));

        const tags = await firstChange;
        expect(tags).to.eql({ highway: 'construction', construction: 'residential', 'functional': undefined,
         'functional:highway': undefined});

        const secondChange = new Promise(resolve => {
            lifecycleEditor.on('change', (_, tags) => resolve(tags));
        });

        const button = element.select('#make-functional.remove-icon').node();
        button.dispatchEvent(new Event('click', { bubbles: true }));

        const tags2 = await secondChange;
        expect(tags2).to.eql({ highway: 'residential', 'functional': undefined,
        'functional:highway': undefined});
    });

    it('adds extra lifecycle tags when clicking the add button and removes it', () => {
        iD.utilTriggerEvent(element.selectAll('.add-lifecycle'), 'mousedown', { button: 0 });
        expect(element.selectAll('.lifecycle-extra-new-prefix').nodes().length).to.be.greaterThan(0);
        iD.utilTriggerEvent(element.selectAll('.lifecycle-extra-delete'), 'mousedown', { button: 0 });
        expect(element.selectAll('.extra-lifecycle-row').nodes().length).to.equal(0);
    });

});