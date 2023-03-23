export default {};
// export const hash = (id: number) =>
// {
//     if ((!id && id !== 0) || typeof id !== "number") {
//         return 0;
//     }
//     const arr = new ArrayBuffer(8);
//     //
//     // Create view to array buffer
//     //
//     const dv = new DataView(arr);
//     //
//     // Set manipulated number to buffer as 64 bit float
//     //
//     dv.setFloat64(0, (id * 2.777 + (id / 2.33 * 1.27) + 4.6) + (id / 424.6) * 2.92);
//     //
//     // Now get first 32 bit from array and convert it to integer from offset 0
//     //
//     const c = dv.getInt32(0);
//     //
//     // Now get next 32 bit from array and convert it to integer from offset 4
//     //
//     const d = dv.getInt32(4);
//     //
//     // XOR first end second integer numbers
//     //
//     const hash = Math.abs(c ^ d);
//     return hash;
// };
