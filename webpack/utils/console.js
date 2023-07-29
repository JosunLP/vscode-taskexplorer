// @ts-check

/** @type {Record<string, [number, number]>} */
const colors = {
    black: [ 0, 39 ],
	blue: [ 34, 39 ],
    bold: [ 1, 22 ],
	cyan: [ 36, 39 ],
	green: [ 32, 39 ],
	grey: [ 90, 39 ],
    inverse: [ 7, 27 ],
    italic: [ 3, 23 ],
	magenta: [ 35, 39 ],
	red: [ 31, 39 ],
    underline: [ 4, 24 ],
	white: [ 37, 39 ],
	yellow: [ 33, 39 ]
};

/**
 * @param {string} msg
 * @param {[ number, number ]} color color value
 */
const withColor = (msg, color) => "\x1B[" + color[0] + "m" + msg + "\x1B[" + color[1] + "m";


/**
 * @param {[ number, number ]} color color value
 * @param {string} [msg] message to include in length calculation
 * @returns {number}
 */
const withColorLength = (color, msg) => (2 + color[0].toString().length + 1 + (msg ? msg.length : 0) + 2 + color[1].toString().length + 1);


const write = (msg, icon, pad = "") =>
    console.log(`     ${pad}${icon || figures.color.info}${msg ? " " + msg : ""}`);


const writeInfo = (msg, icon, pad = "") =>
    console.log(`     ${pad}${icon || figures.color.info}${msg ? " " + figures.withColor(msg, figures.colors.grey) : ""}`);

/*
const consoleWriteInfo = (msg, icon, forceGrey = true, pad = "") =>
{
    if (!msg) {
        console.log(`     ${pad}${icon || figures.color.info}`);
    }
    else if (forceGrey === false || !msg.includes("\x1B")) {
        console.log(`     ${pad}${icon || figures.color.info} ${figures.withColor(msg, figures.colors.grey)}`);
    }
    else {
        const msgParts = [];
        let idx = msg.indexOf("\x1B");
        while (idx !== -1)
        {
            const idx2 = msg.indexOf("\x1B", idx + 1) + 5;
            msgParts.push(msg.substring(idx, idx2));
            idx = msg.indexOf("\x1B", idx2);
        }
        const sIdx = msg.indexOf("\x1B"), // msg.indexOf("\x1B", msg.indexOf("\x1B") + 1,) + 5,
              eIdx = msg.lastIndexOf("\x1B") + 5,
              msg0 = msg.substring(0, sIdx),
              msg1 = msg.substring(0, eIdx),
              msg2 = msg.substring(eIdx);
        console.log(`     ${pad}${icon || figures.color.info} ${msg1}${figures.withColor(msg2, figures.colors.grey)}`);
    }
};
*/

const figures =
{
    colors,
    bullet: "●",
    error: "✘",
    info: "ℹ",
    star: "★",
    start: "▶",
    success: "✔",
    up: "△",
    warning: "⚠",
    withColor,
    blue:
    {
        info: withColor("ℹ", colors.blue),
        success: withColor("✔", colors.blue),
        warning: withColor("⚠", colors.blue),
        error: withColor("✘", colors.blue)
    },
    color:
    {
        bullet: withColor("●", colors.white),
        info: withColor("ℹ", colors.magenta),
        star: withColor("★", colors.yellow),
        start: withColor("▶", colors.green),
        success: withColor("✔", colors.green),
        successTag: `[${withColor("SUCCESS", colors.green)}]`,
        up: withColor("△", colors.white),
        warning: withColor("⚠", colors.yellow),
        error: withColor("✘", colors.red)
    }
};


module.exports = {
    colors,
    figures,
    withColor,
    withColorLength,
    write,
    writeInfo
};
