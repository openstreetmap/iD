describe('iD.locale', function() {
    var t = iD.t;

    describe('t', function() {
        it('translates an unpluralized string', function() {
            expect(t('commit.cancel', 'en')).to.equal('Cancel');
        });
    });

    describe('t', function() {
        it('translates a pluralized string', function() {
            expect(t('commit.changes', { count: 0 }, 'en')).to.equal('0 Changes');
            expect(t('commit.changes', { count: 1 }, 'en')).to.equal('1 Change');
            expect(t('commit.changes', { count: 2 }, 'en')).to.equal('2 Changes');
        });
        it('translates a pluralized string with non-numeric tokens', function() {
            expect(t('contributors.truncated_list', { users: 'DaveHansenTiger', count: 0 }, 'en')).to.equal('Edits by DaveHansenTiger and 0 others');
            expect(t('contributors.truncated_list', { users: 'DaveHansenTiger', count: 1 }, 'en')).to.equal('Edits by DaveHansenTiger and someone else');
            expect(t('contributors.truncated_list', { users: 'DaveHansenTiger', count: 2 }, 'en')).to.equal('Edits by DaveHansenTiger and 2 others');
        });
    });
});
