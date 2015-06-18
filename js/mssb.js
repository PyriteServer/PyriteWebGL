function mssb(x) {
    // Duplicate x among all the blocks.
    //x *= b('00 000001 000001 000001 000001 000001');
    x *= 0x1041041;

    // Compare to successive powers of 2 in parallel.
    //x |= b('00 100000 100000 100000 100000 100000');
    x |= 0x20820820;

    x -= b('00 010000 001000 000100 000010 000001');
    x &= b('00 100000 100000 100000 100000 100000');

    // Sum up the bits into the high 3 bits.
    x *= b('00 000001 000001 000001 000001 000001');

    // Shift down and subtract 1 to get the answer.
    return (x >>> 29) - 1;
}