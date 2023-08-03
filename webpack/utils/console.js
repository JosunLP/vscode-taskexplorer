/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const { globalEnv } = require("./global");

/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */

/**
 * @module wpbuild.utils.console
 */

class WpBuildConsoleLogger
{
    /**
     * @member
     * @private
     */
    basePad = "";

    /**
     * @member
     * @private
     * @type {WpBuildEnvironment}
     */
    env;

    /**
     * @class WpBuildConsoleLogger
     * @param {WpBuildEnvironment} env
     */
    constructor(env) { this.env = env; }

    /** @type {Record<string, [number, number]>} */
    colors = {
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
     * @function
     * @param {string} msg
     * @param {[ number, number ]} color color value
     * @returns {string}
     */
    withColor = (msg, color) => "\x1B[" + color[0] + "m" + msg + "\x1B[" + color[1] + "m";


    /**
     * @function
     * @param {string} msg
     * @param {[ number, number ] | undefined | null} [bracketColor] surrounding bracket color value
     * @param {[ number, number ] | undefined | null} [msgColor] msg color value
     * @returns {string}
     */
    tagColor = (msg, bracketColor, msgColor) => this.withColor("[", bracketColor || this.colors.blue) +
                                                this.withColor(msg, msgColor || this.colors.grey)  +
                                                this.withColor("]", bracketColor || this.colors.blue);

    /**
     * @param {[ number, number ]} color color value
     * @param {string} [msg] message to include in length calculation
     * @returns {number}
     */
    withColorLength = (color, msg) => (2 + color[0].toString().length + 1 + (msg ? msg.length : 0) + 2 + color[1].toString().length + 1);


    /**
     * @function
     * @param {string} msg
     * @param {WpBuildEnvironment | null} [env]
     * @param {boolean} [verbose]
     * @param {string} [icon]
     * @param {string} [pad]
     * @returns {void}
     */
    write = (msg, env, verbose, icon, pad = "") =>
    {
        if (!verbose || globalEnv.verbose)
        {
            let envTag = "";
            env = env || this.env;
            const envIsInitialized = env && env.app && env.logger;
            if (envIsInitialized)
            {
                let envTagClr = env ? this.colors[env.app.colors.buildBracket] : this.colors.cyan;
                const envTagMsgClr = env ? this.colors[env.app.colors.buildText] : this.colors.white;
                if (icon) {
                    if (icon.includes(this.withColor(this.figures.info, this.colors.yellow))) {
                        envTagClr = this.colors.yellow;
                    }
                }
                envTag = (this.withColor("[", envTagClr) + env.build + this.withColor("][", envTagClr) +
                         this.withColor(env.target.toString(), envTagMsgClr) + this.withColor("]", envTagClr))
                        .padEnd(env.app.logPad.envTag + this.withColorLength(envTagMsgClr) + (this.withColorLength(envTagClr) * 3) - 1);
            }
            // const envMsgClr = env ? colors[env.app.colors.default] : colors.grey;
            console.log(`${this.basePad}${pad}${icon || this.figures.color.info}${envTag ? " " + envTag : ""}${msg ? " " + msg : ""}`);
        }
    };


    /**
     * @function
     * @param {string} msg
     * @param {WpBuildEnvironment | null} [env]
     * @param {boolean} [verbose]
     * @param {string} [icon]
     * @param {string} [pad]
     * @returns {void}
     */
    writeInfo = (msg, env, verbose, icon, pad = "") =>
    {
        if (!verbose || globalEnv.verbose)
        {
            let envTag = "";
            env = env || this.env;
            const envIsInitialized = env && env.app && env.logger;
            if (envIsInitialized)
            {
                const colors = this.colors;
                let envTagClr = env ? colors[env.app.colors.buildBracket] : colors.cyan;
                const envTagMsgClr = env ? colors[env.app.colors.buildText] : colors.white;
                if (icon) {
                    if (icon.includes(this.withColor(this.figures.info, colors.yellow))) {
                        envTagClr = colors.yellow;
                    }
                }
                envTag = (this.withColor("[", envTagClr) + env.build + this.withColor("][", envTagClr) +
                         this.withColor(env.target.toString(), envTagMsgClr) + this.withColor("]", envTagClr))
                        .padEnd(env.app.logPad.envTag + this.withColorLength(envTagMsgClr) + (this.withColorLength(envTagClr) * 3) - 1);
            }
            const envMsgClr = envIsInitialized ? this.colors[env.app.colors.default] : this.colors.grey;
            console.log(`${this.basePad}${pad}${icon || this.figures.color.info}${envTag ? " " + envTag : ""}${msg ? " " + this.withColor(msg, envMsgClr) : ""}`);
        }
    };

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

    /**
     * @type {Readonly<Record<string, any>>}
     */
    figures =
    {
        colors: this.colors,
        bullet: "●",
        error: "✘",
        info: "ℹ",
        star: "★",
        start: "▶",
        success: "✔",
        up: "△",
        warning: "⚠",
        withColor: this.withColor,
        /** @type {Readonly<Record<string, any>>} */
        blue:
        {
            info: this.withColor("ℹ", this.colors.blue),
            success: this.withColor("✔", this.colors.blue),
            warning: this.withColor("⚠", this.colors.blue),
            error: this.withColor("✘", this.colors.blue)
        },
        /** @type {Readonly<Record<string, any>>} */
        color:
        {
            bullet: this.withColor("●", this.colors.white),
            info: this.withColor("ℹ", this.colors.magenta),
            star: this.withColor("★", this.colors.yellow),
            start: this.withColor("▶", this.colors.green),
            success: this.withColor("✔", this.colors.green),
            successTag: `[${this.withColor("SUCCESS", this.colors.green)}]`,
            up: this.withColor("△", this.colors.white),
            warning: this.withColor("⚠", this.colors.yellow),
            error: this.withColor("✘", this.colors.red)
        }
    };

}


module.exports = WpBuildConsoleLogger;
