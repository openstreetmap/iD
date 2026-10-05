describe('utilRebind', () => {
    it('copies methods from source to target', () => {
        const target = { original: 123 };
        const source = new class {
            value = 456;
            method() {
                return this.value;
            }
        };

        const copied = iD.utilRebind(target, source, 'method');

        expect(copied).toStrictEqual({
            original: 123,
            method: expect.any(Function)
        });
        expect(copied.method()).toBe(456);
    });
});
