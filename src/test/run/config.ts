
import NycConfig from "./nycConfig";
import Nyc from "./nyc";
import Mocha from "./mocha";

export default async(testsRoot: string) =>
{
    const xArgs = JSON.parse(process.env.xArgs || "[]"),
          cover = !xArgs.includes("--no-coverage");
    return {
        nyc: cover ? await Nyc(NycConfig()) : undefined,
        mocha: Mocha(testsRoot)
    };
};
