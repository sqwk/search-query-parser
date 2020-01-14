/*!
 * search-query-parser.js
 * Copyright(c) 2014-2020
 * MIT Licensed
 */
declare type KeywordName = string;
declare type RangeName = string;
declare type Options<K extends KeywordName, R extends RangeName> = {
    keywords: readonly K[];
    ranges: readonly R[];
    offsets: boolean;
    alwaysArray: boolean;
    tokenize: boolean;
};
declare type TextOffset = {
    text: string;
};
declare type KeywordOffset = {
    keyword: string;
    value: string;
};
declare type RangeOffset = {
    keyword: string;
    from: string;
    to?: string;
};
declare type Offset = (TextOffset | KeywordOffset | RangeOffset) & {
    offsetStart: number;
    offsetEnd: number;
    exclude: boolean;
};
declare type TextValue = string;
declare type KeywordValue = string;
declare type RangeValue = {
    from: string;
    to?: string;
};
declare type Result<K extends KeywordName, R extends RangeName> = {
    options: Options<K, R>;
    offsets?: Offset[];
    exclude?: ResultData<K, R>;
} & ResultData<K, R>;
declare type ResultData<K extends KeywordName, R extends RangeName> = {
    text?: TextValue | TextValue[];
} & {
    [L in K]?: KeywordValue | KeywordValue[];
} & {
    [S in R]?: RangeValue | RangeValue[];
};
export declare function parse<K extends KeywordName, R extends RangeName>(str?: string, userOptions?: Partial<Options<K, R>>): string | Result<K, R>;
export declare function stringify<K extends KeywordName, R extends RangeName>(parseResult: Result<K, R> | string): string;
export {};
