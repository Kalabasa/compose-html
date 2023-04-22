import { HTMLBeautifyOptions } from "js-beautify";
type BuildOptions = {
    inputDir?: string;
    outputDir?: string;
    rootDir?: string;
    exclude?: string[];
    beautify?: HTMLBeautifyOptions | false;
};
export declare function build(options?: BuildOptions): Promise<void>;
export {};
