/* eslint-disable jsdoc/require-property-description */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const { isString, isObject } = require("./utils");

/** @typedef {import("../types").WebpackLogLevel} WebpackLogLevel */
/** @typedef {import("../types").WpBuildLogColor} WpBuildLogColor */
/** @typedef {import("../types").WpBuildLogLevel}  WpBuildLogLevel */
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
     * @member
     * @private
     * @type {WpBuildLogLevel}
     */
    level;

    /**
     * @member
     * @private
     * @type {WebpackLogLevel[]}
     */
    levelMap = [ "none", "error", "warn", "info", "log", "verbose" ];


    /**
     * @class WpBuildConsoleLogger
     * @param {WpBuildEnvironment} env
     */
    constructor(env) { this.env = env; }

    /**
     * @typedef {[number, number]} WpBuildLogColorMapping
     */
    /** @type {Record<WpBuildLogColor, WpBuildLogColorMapping>} */
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
     * @typedef {object} WpBuildLogIconSet
     * @property {string} bullet
     * @property {string} error
     * @property {string} info
     * @property {string} star
     * @property {string} start
     * @property {string} success
     * @property {string} up
     * @property {string} warning
     */
    /**
     * @typedef {object} WpBuildLogColorIconSet
     * @property {string} successTag
     */
    /**
     * @typedef {object & WpBuildLogIconSet} WpBuildLogIcons
     * @property {Pick<WpBuildLogIconSet, "error"|"info"|"success"|"warning">} blue
     * @property {WpBuildLogIconSet & WpBuildLogColorIconSet} color
     */
    /**
     * @type {WpBuildLogIcons}
     */
    icons =
    {
        bullet: "●}",
        error: "✘",
        info: "ℹ",
        star: "★",
        start: "▶",
        success: "✔",
        up: "△",
        warning: "⚠",
        blue:
        {
            error: this.withColor("✘", this.colors.blue),
            info: this.withColor("ℹ", this.colors.blue),
            success: this.withColor("✔", this.colors.blue),
            warning: this.withColor("⚠", this.colors.blue)
        },
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


    /**
     * @function Performs inline text coloring e.g. a message can contain ""..finished italic(main module) in 2.3s"
     * @param {string | undefined} msg
     * @returns {string}
     */
    format = (msg) =>
    {
        if (isString(msg, true))
        {
            for (const cKey of Object.keys(this.colors))
            {
                msg = msg.replace(new RegExp(`${cKey}\\((.*?)\\)`, "g"), (_, g1) => this.withColor(g1, this.colors.italic));
            }
            return " " + msg;
        }
        return "";
    };


    /**
     * @function
     * @param {string} icon
     * @param {[ number, number ]} color color value
     * @returns {string}
     */
    iconColor(icon, color) { return this.withColor(icon, color); }


    /**
     * @function
     * @param {WpBuildLogColor} color
     * @returns {WpBuildLogColorMapping}
     */
    str2clr = (color) => this.colors[color];


    /**
     * @function
     * @param {string | undefined} msg
     * @param {[ number, number ]} color color value
     * @returns {string}
     */
    withColor(msg, color) { return msg ? "\x1B[" + color[0] + "m" + msg + "\x1B[" + color[1] + "m" : ""; }


    /**
     * @function
     * @param {string | undefined} msg
     * @param {[ number, number ] | undefined | null} [bracketColor] surrounding bracket color value
     * @param {[ number, number ] | undefined | null} [msgColor] msg color value
     * @returns {string}
     */
    tagColor(msg, bracketColor, msgColor) { return msg ? (this.withColor("[", bracketColor || this.colors.blue) +
                                                this.withColor(msg, msgColor || this.colors.grey)  +
                                                this.withColor("]", bracketColor || this.colors.blue)) : ""; }

    /**
     * @param {[ number, number ]} color color value
     * @param {string} [msg] message to include in length calculation
     * @returns {number}
     */
    withColorLength(color, msg) { return (2 + color[0].toString().length + 1 + (msg ? msg.length : 0) + 2 + color[1].toString().length + 1); }


    /**
     * @function
     * @param {string} msg
     * @param {WpBuildLogLevel} [level]
     * @param {string} [pad]
     * @param {string} [icon]
     */
    write = (msg, level, pad = "", icon) =>
    {
        // if (level === undefined || globalEnv.verbose)
        if (level === undefined || level <= this.level)
        {
            let envTag = "";
            const env = this.env,
                  envIsInitialized = env && env.app && env.logger;
            if (envIsInitialized)
            {
                const colors = this.colors,
                      envTagMsgClr = env ? colors[env.app.colors.buildText] : colors.white;
                let envTagClr = env ? colors[env.app.colors.buildBracket] : colors.cyan;
                if (icon) {
                    if (icon.includes(this.withColor(this.icons.info, colors.yellow))) {
                        envTagClr = colors.yellow;
                    }
                    else if (icon.includes(this.withColor(this.icons.error, colors.red))) {
                        envTagClr = colors.red;
                    }
                }
                envTag = (
                    " " + this.withColor("[", envTagClr) + env.build + this.withColor("][", envTagClr) +
                    this.withColor(env.target.toString(), envTagMsgClr) + this.withColor("]", envTagClr)
                )
                .padEnd(env.app.log.pad.envTag + this.withColorLength(envTagMsgClr) + (this.withColorLength(envTagClr) * 3));
            }
            console.log(`${this.basePad}${pad}${icon || this.icons.color.info}${envTag}${this.format(msg)}`);
        }
    };


    /**
     * @function
     * @param {any} msg
     * @param {string} [pad]
     */
    error = (msg, pad) =>
    {
        let sMsg = msg;
        if (msg)
        {
            if (isString(msg))
            {
                sMsg = msg;
            }
            else if (msg instanceof Error)
            {
                sMsg = msg.message;
            }
            else if (isObject<{}>(msg))
            {
                sMsg = "";
                if (msg.message) {
                    sMsg = msg.message;
                }
                if (msg.messageX) {
                    sMsg += ("\n" + msg.messageX);
                }
                sMsg = sMsg || msg.toString();
            }
            else if (!isString(msg))
            {
                sMsg = msg.toString();
            }
            this.writeInfo(sMsg, undefined, pad, this.icons.color.error);
        }
    };


    /**
     * @function
     * @param {string} msg
     * @param {number} [level]
     * @param {string} [pad]
     * @param {string} [icon]
     */
    writeInfo = (msg, level, pad = "", icon) =>
    {
        if (level === undefined || level <= this.level)
        {
            let envTag = "";
            const env = this.env,
                  envIsInitialized = env && env.app && env.logger;
            if (envIsInitialized)
            {
                const colors = this.colors,
                      envTagMsgClr = env ? colors[env.app.colors.buildText] : colors.white;
                let envTagClr = env ? colors[env.app.colors.buildBracket] : colors.cyan;
                if (icon) {
                    if (icon.includes(this.withColor(this.icons.info, colors.yellow))) {
                        envTagClr = colors.yellow;
                    }
                    else if (icon.includes(this.withColor(this.icons.error, colors.red))) {
                        envTagClr = colors.red;
                    }
                }
                envTag = (
                    " " + this.withColor("[", envTagClr) + env.build + this.withColor("][", envTagClr) +
                    this.withColor(env.target.toString(), envTagMsgClr) + this.withColor("]", envTagClr)
                )
                .padEnd(env.app.log.pad.envTag + this.withColorLength(envTagMsgClr) + (this.withColorLength(envTagClr) * 3));
            }
            const envMsgClr = envIsInitialized ? this.colors[env.app.colors.default] : this.colors.grey;
            console.log(`${this.basePad}${pad}${icon || this.icons.color.info}${envTag}${this.withColor(this.format(msg), envMsgClr)}`);
        }
    };


    /**
     * @param {string} msg
     * @param {any} val
     * @param {number} [level]
     * @param {string} [pad] Message pre-padding
     * @param {string} [icon]
     */
    value = (msg, val, level, pad, icon) =>
    {
        if (level === undefined || level <= this.level)
        {
            let vMsg = msg || "";
            vMsg.padEnd(this.env.app.log.pad.value - (pad || "").length);
            if (val || val === 0 || val === "" || val === false)
            {
                vMsg += ": ";
                vMsg += val.toString();
            }
            else if (val === undefined) {
                vMsg += ": undefined";
            }
            else {
                vMsg += ": null";
            }
            this.writeInfo(vMsg, level, pad, icon);
        }
    };


    /**
     * @function
     * @param {any} msg
     * @param {string} [pad]
     */
    warning = (msg, pad = "") => void this.writeInfo(msg, undefined, pad, this.icons.color.warning);

}


module.exports = WpBuildConsoleLogger;
