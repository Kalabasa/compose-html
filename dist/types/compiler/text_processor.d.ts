export declare class TextProcessor {
    private totalScannedLength;
    private currentNodeIndex;
    private currentNodeTextOffset;
    private readonly sourceNodes;
    constructor(sourceNode: Node);
    readUntil(targetIndex: number): (string | Node)[];
}
