
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
    console.log(`     ${pad}${icon || wpPlugin.figures.color.info}${msg ? " " + wpPlugin.figures.withColor(msg, wpPlugin.figures.colors.grey) : ""}`);


const figures =
{
    colors,
    error: "✘",
    info: "ℹ",
    success: "✔",
    warning: "⚠",
    withColor,
    color:
    {
        success: withColor("✔", colors.green),
        successBlue: withColor("✔", colors.blue),
        info: withColor("ℹ", colors.magenta),
        infoTask: withColor("ℹ", colors.blue),
        warning: withColor("⚠", colors.yellow),
        warningTests: withColor("⚠", colors.blue),
        error: withColor("✘", colors.red),
        errorTests: withColor("✘", colors.blue)
    }
};

const wpConsole = {
    colors,
    figures,
    write: withColor,
    writeInfo: consoleWrite
};

module.exports = wpConsole;
