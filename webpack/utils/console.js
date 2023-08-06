/* eslint-disable jsdoc/require-property-description */
/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check

const { isString, isObject, isPrimitive } = require("./utils");

/** @typedef {[ number, number ]} WpBuildLogColorMapping */
/** @typedef {import("../types").WpBuildLogIcon} WpBuildLogIcon */
/** @typedef {import("../types").WebpackLogLevel} WebpackLogLevel */
/** @typedef {import("../types").WpBuildLogColor} WpBuildLogColor */
/** @typedef {import("../types").WpBuildLogLevel}  WpBuildLogLevel */
/** @typedef {import("../types").WpBuildLogIconSet}  WpBuildLogIconSet */
/** @typedef {import("../types").WpBuildEnvironment} WpBuildEnvironment */
/** @typedef {import("../types").WpBuildLogTrueColor} WpBuildLogTrueColor */

/**
 * @module wpbuild.utils.console
 */


class WpBuildConsoleLogger
{
    /**
     * @member
     * Can be used to adjust the leftmost character that console output should start at.  For example,
     * a logger implemented in a `Mocha` test would need to use a base pad of 6 characters to align
     * itself with Mocha's output.
     * @private
     */
    basePad = "";

    /**
     * @member
     * The build environment that owns the WpBuildConsoleLogger instance
     * @private
     * @type {WpBuildEnvironment}
     */
    env;

    // /**
    //  * @member
    //  * @private
    //  * @type {WebpackLogLevel[]}
    //  */
    // levelMap = [ "none", "error", "warn", "info", "log", "verbose" ];


    /**
     * @class WpBuildConsoleLogger
     * @param {WpBuildEnvironment} env
     */
    constructor(env)
    {
        this.env = env;
        this.env.disposables?.push(this);
        if (env.app?.colors.default)
        {
            Object.keys(this.colors).filter(c => this.colors[c][1] === this.colors.system).forEach((c) =>
            {
                this.colors[c][1] = this.colorMap[env.app.colors.default];
            });
        }
    }


    dispose = () => console.log(this.withColor("", this.colors.system, true));

    /**
     * @member
     * @private
     * @type {Record<WpBuildLogTrueColor, number>}
     */
    colorMap = {
        blue: 34,
        black: 0,
        cyan: 36,
        green: 32,
        grey: 90,
        magenta: 35,
        red: 31,
        system: 39,
        white: 37,
        yellow: 33
    };


    /** @type {Record<WpBuildLogColor, WpBuildLogColorMapping>} */
    colors = {
        black: [ this.colorMap.black, this.colorMap.system ],
        blue: [ this.colorMap.blue, this.colorMap.system ],
        bold: [ 1, 22 ],
        cyan: [ this.colorMap.cyan, this.colorMap.system ],
        green: [ this.colorMap.green, this.colorMap.system ],
        grey: [ this.colorMap.grey, this.colorMap.system ],
        inverse: [ 7, 27 ],
        italic: [ 3, 23 ],
        magenta: [ this.colorMap.magenta, this.colorMap.system ],
        red: [ this.colorMap.red, this.colorMap.system ],
        system: [ this.colorMap.system, this.colorMap.system ],
        underline: [ 4, 24 ],
        white: [ this.colorMap.white, this.colorMap.system ],
        yellow: [ this.colorMap.yellow, this.colorMap.system ]
    };


    /**
     * @type {WpBuildLogIconSet}
     */
    icons =
    {
        bullet: "●",
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
            starCyan: this.withColor("★", this.colors.cyan),
            start: this.withColor("▶", this.colors.green),
            success: this.withColor("✔", this.colors.green),
            successTag: `[${this.withColor("SUCCESS", this.colors.green)}]`,
            up: this.withColor("△", this.colors.white),
            warning: this.withColor("⚠", this.colors.yellow),
            error: this.withColor("✘", this.colors.red)
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
                sMsg = msg.message.trim();
                if (msg.stack) {
                    sMsg += `\n${msg.stack.trim()}`;
                }
            }
            else if (isObject<{}>(msg))
            {
                sMsg = "";
                if (msg.message) {
                    sMsg = msg.message;
                }
                if (msg.messageX) {
                    sMsg += `\n${msg.messageX}`;
                }
                sMsg = sMsg || msg.toString();
            }
            else if (!isString(msg))
            {
                sMsg = msg.toString();
            }
            this.write(sMsg, undefined, pad, this.icons.color.error);
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
                msg = msg.replace(new RegExp(`${cKey}\\((.*?)\\)`, "g"), (_, g1) => this.withColor(g1, this.colors[cKey]));
            }
            return " " + msg;
        }
        return "";
    };


    /**
     * @function
     * @param {string | undefined | null | 0 | false} icon
     * @returns {WpBuildLogColorMapping}
     */
    getIconColorMapping = (icon) =>
    {
        const env = this.env,
              colors = this.colors;
        let envTagClr = env ? colors[env.app.colors.buildBracket] : colors.cyan;
        if (icon) {
            if (icon.includes(this.withColor(this.icons.info, colors.yellow))) {
                envTagClr = colors.yellow;
            }
            else if (icon.includes(this.withColor(this.icons.warning, colors.yellow))) {
                envTagClr = colors.red;
            }
            else if (icon.includes(this.withColor(this.icons.error, colors.red))) {
                envTagClr = colors.red;
            }
        }
        return envTagClr;
    };


    /**
     * @function
     * @param {string} icon
     * @param {WpBuildLogColorMapping} color color value
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
     * @param {WpBuildLogColorMapping | undefined | null} [bracketColor] surrounding bracket color value
     * @param {WpBuildLogColorMapping | undefined | null} [msgColor] msg color value
     * @returns {string}
     */
    tagColor(msg, bracketColor, msgColor) { return msg ? (this.withColor("[", bracketColor || this.colors[this.env.app.colors.tagBracket] || this.colors.blue) +
                                                   this.withColor(msg, msgColor || this.colors.grey)  +
                                                   this.withColor("]", bracketColor || this.colors.blue)) : ""; }

    /**
     * @function
     * @param {string | undefined} msg
     * @param {WpBuildLogColorMapping} color color value
     * @param {boolean} [sticky]
     * @returns {string}
     */
    withColor(msg, color, sticky) { return ("\x1B[" + color[0] + "m" + msg + (!sticky ? "\x1B[" + color[1] + "m" : "")); }


    /**
     * @param {WpBuildLogColorMapping} color color value
     * @param {string} [msg] message to include in length calculation
     * @returns {number}
     */
    withColorLength(color, msg) { return (2 + color[0].toString().length + 1 + (msg ? msg.length : 0) + 2 + color[1].toString().length + 1); }


    /**
     * @function Write / log a message to the console
     * @param {string} msg
     * @param {number} [level]
     * @param {string} [pad]
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {WpBuildLogColorMapping} [color]
     */
    write = (msg, level, pad = "", icon, color) =>
    {
        if (level === undefined || level <= this.env.logLevel)
        {
            let envTag = "";
            const env = this.env,
                  envIsInitialized = env && env.app && env.logger;
            if (envIsInitialized)
            {
                const envTagClr = this.getIconColorMapping(icon),
                      envTagMsgClr = env ? this.colors[env.app.colors.buildText] : this.colors.white;
                envTag = (
                    " " + this.withColor("[", envTagClr) + env.build + this.withColor("][", envTagClr) +
                    this.withColor(env.target.toString(), envTagMsgClr) + this.withColor("]", envTagClr)
                )
                .padEnd(env.app.log.pad.envTag + this.withColorLength(envTagMsgClr) + (this.withColorLength(envTagClr) * 3));
            }
            const envMsgClr = color || (envIsInitialized ? this.colors[env.app.colors.default] : this.colors.grey),
                  envMsg = color || !(/\x1B\[/).test(msg) || envMsgClr[0] !== this.colorMap.system ? this.withColor(this.format(msg), envMsgClr) : this.format(msg);
            console.log(`${this.basePad}${pad}${isString(icon) ? icon : this.icons.color.info}${envTag}${envMsg}`);
        }
    };

    /**
     * @function
     * Write / log a message to the console.  This funvtion is just a wrapper for {@link write()} that
     * satisfies the javascript `console` interface.
     * @inheritdoc
     */
    log = this.write;


    /**
     * @function
     * Write / log a message and an aligned value to the console.  The message pad space is defined
     * by .wpbuildrc.`log.pad.value` (defaults to 45)
     * @param {string} msg
     * @param {any} val
     * @param {number} [level]
     * @param {string} [pad] Message pre-padding
     * @param {string | undefined | null | 0 | false} [icon]
     * @param {WpBuildLogColorMapping} [color]
     */
    value = (msg, val, level, pad, icon, color) =>
    {
        if (level === undefined || level <= this.env.logLevel)
        {
            let vMsg = (msg || ""),/** @type {RegExpExecArray | null} */
                match, colorSpace = 0;
            const rgx = /\x1B\[[0-9]{1,2}m(.*?)\x1B\[[0-9]{1,2}m/gi;
            while ((match = rgx.exec(vMsg)) !== null) {
                colorSpace += match[0].length - match[1].length;
            }
            vMsg = vMsg.padEnd(this.env.app.log.pad.value + colorSpace - (pad || "").length);
            if (val || isPrimitive(val))
            {
                vMsg += (!isString(val) || !(/\x1B\[[0-9]{1,2}m/).test(val) ? ": " : "") + val;
            }
            else if (val === undefined) {
                vMsg += ": undefined";
            }
            else {
                vMsg += ": null";
            }
            this.write(vMsg, level, pad, icon, color);
        }
    };

    /**
     * @function
     * @param {string} hookMsg
     * @param {string} hookDsc
     * @param {number} [level]
     * @param {string} [pad] Message pre-padding
     * @param {WpBuildLogColorMapping} [iconColor]
     * @param {WpBuildLogColorMapping} [msgColor]
     */
    valuestar = (hookMsg, hookDsc, level, pad, iconColor, msgColor) =>
    {
        const icon = this.withColor(
            this.icons.star,
            iconColor ||
            (this.env.app.colors.valueStar ? this.colors[this.env.app.colors.valueStar] : null) ||
            this.colors.cyan
        );
        if (this.env.app.colors.valueStarText && this.env.app.colors.valueStarText !== "white")
        {
            this.value(hookMsg, `${icon} ${this.withColor(hookDsc, this.colors[this.env.app.colors.valueStarText])} ${icon}`, level, pad, 0, msgColor);
        }
        else {
            this.value(hookMsg, `${icon} ${hookDsc} ${icon}`, level, pad, undefined, msgColor);
        }
    };


    /**
     * @function
     * @param {any} msg
     * @param {string} [pad]
     */
    warning = (msg, pad = "") => this.write(msg, undefined, pad, this.icons.color.warning);

}


module.exports = WpBuildConsoleLogger;
