function sum(a, b) {
    return a + b;
}

test('This one is different', () => {
    expect(sum(1, 2)).toBe(3);
});