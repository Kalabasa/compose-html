type FoundDelimiters = Array<{
    index: number;
    levelInside: number;
    type: string;
}>;
export declare function findDelimiters(open: string, close: string, node: Node): FoundDelimiters;
export {};
