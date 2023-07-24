
const colors = {
	white: [ 37, 39 ],
	grey: [ 90, 39 ],
	blue: [ 34, 39 ],
	cyan: [ 36, 39 ],
	green: [ 32, 39 ],
	magenta: [ 35, 39 ],
	red: [ 31, 39 ],
	yellow: [ 33, 39 ]
};

/**
 * @param {String} msg
 * @param {Number[]} color Webpack config object
 */
const withColor = (msg, color) => "\x1B[" + color[0] + "m" + msg + "\x1B[" + color[1] + "m";


const consoleWrite = (msg, icon, pad = "") =>
    console.log(`     ${pad}${icon || figures.color.info}${msg ? " " + msg : ""}`);


const consoleWriteInfo = (msg, icon, pad = "") =>
    console.log(`     ${pad}${icon || figures.color.info}${msg ? " " + figures.withColor(msg, figures.colors.grey) : ""}`);


const figures =
{
    colors,
    error: "✘",
    info: "ℹ",
    star: "★",
    start: "▶",
    success: "✔",
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
        info: withColor("ℹ", colors.magenta),
        star: withColor("★", colors.yellow),
        start: withColor("▶", colors.green),
        success: withColor("✔", colors.green),
        warning: withColor("⚠", colors.yellow),
        error: withColor("✘", colors.red)
    }
};

const wpConsole = {
    colors,
    figures,
    withColor,
    write: consoleWrite,
    writeInfo: consoleWriteInfo
};

module.exports = wpConsole;
