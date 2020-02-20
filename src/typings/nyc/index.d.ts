


declare module 'nyc' 
{
    export class NYC 
    {
      constructor(options?: any);
      createTempDirectory(): Promise<void>;
      writeCoverageFile(): Promise<void>;
      instrumenter(): any
    }
    
    export const libHook: any;

    export default NYC;
}

/*
declare namespace nyc2 
{
    interface NYC {
        new (options?: any): NYC;
        Collector: Collector;
        config: Config;
        ContentWriter: ContentWriter;
        FileWriter: FileWriter;
        hook: Hook;
        Instrumenter: Instrumenter;
        Report: Report;
        Reporter: Reporter;
        Store: Store;
        utils: ObjectUtils;
        VERSION: string;
        Writer: Writer;
        createTempDirectory(): Promise<void>;
        writeCoverageFile(): Promise<void>;
        instrumenter(): any
    }

    interface Collector {
        new (options?: any): Collector;
        add(coverage: any, testName?: string): void;
        getFinalCoverage(): any;
    }

    interface Config {
    }

    interface ContentWriter {
    }

    interface FileWriter {
    }

    interface Hook {
    }

    interface Instrumenter {
        //new (options?: any): Instrumenter;
        //instrumentSync(code: string, filename: string): string;
    }

    interface Report {
    }

    interface Configuration {
        //new (obj: any, overrides: any): Configuration;
    }

    interface Reporter {
        //new (cfg?: Configuration, dir?: string): Reporter;
        //add(fmt: string): void;
        //addAll(fmts: Array<string>): void;
        //write(collector: Collector, sync: boolean, callback: Function): void;
    }

    interface Store {
    }

    interface ObjectUtils {
    }

    interface Writer {
    }
}

declare var nyc: nyc.NYC;

export = nyc;
*/
