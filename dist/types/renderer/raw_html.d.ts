export declare const rawHTMLSymbol: unique symbol;
export type RawHTML = {
    [rawHTMLSymbol]: true;
    html: string;
};
export declare function isRawHTML(thing: any): thing is RawHTML;
export declare function rawHTML(html: string): RawHTML;
export declare function rawHTMLTag(segments: string[], ...expressions: any[]): Promise<RawHTML>;
