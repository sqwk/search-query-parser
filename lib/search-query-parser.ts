/*!
 * search-query-parser.js
 * Copyright(c) 2014-2020
 * MIT Licensed
 */

type KeywordName = string;

type RangeName = string;

type Options<K extends KeywordName, R extends RangeName > = {
    keywords: readonly K[];
    ranges: readonly R[];
};

type Result<K extends KeywordName, R extends RangeName> = {
    [L in K | 'text']?: KeywordValue[];
} & {
    [S in R]?: RangeValue[];
};

type KeywordValue = ResultMeta & {
    value: string;
};

type RangeValue = ResultMeta & {
    from: string;
    to?: string;
};

type ResultMeta = {
    offsetStart: number;
    offsetEnd: number;
    exclude: boolean;
};

/**
 * Strips surrounding quotes
 */
function stripSurroundingQuotes(val: string): string {
    return val.replace(/^\"|\"$|^\'|\'$/g, '');
}

// Adds quotes around multiple words
function addQuotes(val: string) {
    return val.indexOf(' ') > - 1 ? JSON.stringify(val) : val;
}

/**
 * Strips backslashes respecting escapes
 */
function stripBackslashes(val: string): string {
    return val.replace(/\\(.?)/g, (_s, n1) => {
        switch (n1) {
            case '\\':
                return '\\';
            case '0':
                return '\u0000';
            case '':
                return '';
            default:
                return n1;
        }
    });
}

/**
 * Further process a range value (split from and to)
 */
function processRangeValue(rangeValue: RangeValue): RangeValue|null {

    let fromToValues = rangeValue.from.split('-');

    // When two ends of the range are specified
    if (fromToValues.length === 2) {
        rangeValue.from = fromToValues[0];
        rangeValue.to = fromToValues[1];
        return rangeValue;

    // When pairs of ranges are specified
    // keyword:XXXX-YYYY,AAAA-BBBB
    } else if (fromToValues.length % 2 === 0) {
        console.error(`Cannot parse multiple pairs of ranges as of now '${JSON.stringify(fromToValues)}'`);
        return null;

    // When only getting a single value,
    // or an odd number of values
    } else {
        return rangeValue;
    }
}

/**
 * Parses a string to return a processed SearchParserResult
 */
export function parse<K extends KeywordName, R extends RangeName>(str = '', userOptions?: Partial<Options<K, R>>) {

    // Merge options with default options
    const defaultOptions: Options<K, R> = {
        keywords: [],
        ranges: []
    };
    const options = Object.assign(defaultOptions, userOptions);

    // Init object to store the query object
    let parseResult = {} as Result<K, R>;

    // Temporary storage of result data while processing the input string
    let tempResultData = {} as Result<K, R>;

    const regex = /(\S+:'(?:[^'\\]|\\.)*')|(\S+:"(?:[^"\\]|\\.)*")|(-?"(?:[^"\\]|\\.)*")|(-?'(?:[^'\\]|\\.)*')|\S+|\S+:\S+/g;

    // Primary loop to split apart individual search terms and key/value pairs
    let match;
    while ((match = regex.exec(str)) !== null) {
        let term = match[0];
        let sepIndex = term.indexOf(':');

        // Term is a key:value pair of some kind
        if (sepIndex !== -1) {

            // Seperate key and value
            let key = term.slice(0, sepIndex);
            let val = term.slice(sepIndex + 1);

            const isExcludedKey = key[0] === '-' ? true : false;

            if (isExcludedKey === true) {
                key = key.slice(1);
            }

            val = stripSurroundingQuotes(val);
            val = stripBackslashes(val);

            // Divide into keyword, range or non-configured keyword/range (=text)
            if (options.keywords.indexOf(key as K) !== -1) {
                let keywordValue: KeywordValue = {
                    value: val,
                    offsetStart: match.index,
                    offsetEnd: match.index + term.length,
                    exclude: isExcludedKey
                };

                if (tempResultData[key as K] == null) {
                    (tempResultData[key as K] as KeywordValue[]) = [keywordValue];
                } else {
                    (tempResultData[key as K] as KeywordValue[]).push(keywordValue);
                }

            } else if (options.ranges.indexOf(key as R) !== -1) {
                let rangeValue: RangeValue = {
                    from: val,
                    to: undefined,
                    offsetStart: match.index,
                    offsetEnd: match.index + term.length,
                    exclude: isExcludedKey
                };

                if (tempResultData[key as R] == null) {
                    (tempResultData[key as R] as RangeValue[]) = [rangeValue];
                } else {
                    (tempResultData[key as R] as RangeValue[]).push(rangeValue);
                }

            } else {
                let keywordValue: KeywordValue = {
                    value: term,
                    offsetStart: match.index,
                    offsetEnd: match.index + term.length,
                    exclude: isExcludedKey
                };

                if (tempResultData['text'] == null) {
                    tempResultData['text'] = [keywordValue];
                } else {
                    (tempResultData['text'] as KeywordValue[]).push(keywordValue);
                }
            }

        // Term is not a key:value pair, must be text
        } else {

            const isExcludedTerm = term[0] === '-' ? true : false;

            if (isExcludedTerm === true) {
                term = term.slice(1);
            }

            term = stripSurroundingQuotes(term);
            term = stripBackslashes(term);

            let keywordValue: KeywordValue = {
                value: term,
                offsetStart: match.index,
                offsetEnd: match.index + term.length,
                exclude: isExcludedTerm
            };

            if (tempResultData['text'] == null) {
                tempResultData['text'] = [keywordValue];
            } else {
                (tempResultData['text'] as KeywordValue[]).push(keywordValue);
            }

        }

    }

    // Secondary looop
    // Assign to parseResult or do some more processing of resultData
    for (let key in tempResultData) {

        // Keyword terms (includes text) do not need further processing
        if ('value' in (tempResultData[key as K|'text'] as KeywordValue[])[0]) {
            (parseResult[key as K|'text'] as KeywordValue[]) = (tempResultData[key as K|'text'] as KeywordValue[]);

        // Range values need to be seperated into 'from' and 'to'
        } else if ('from' in (tempResultData[key as R] as RangeValue[])[0]) {

            (tempResultData[key as R] as RangeValue[]).forEach((rangeValue) => {
                if (rangeValue.from.length) {
                    const parsedRangeValue = processRangeValue(rangeValue);
                    if (parsedRangeValue != null) {
                        if (parseResult['text'] == null) {
                            (parseResult[key as R] as RangeValue[]) = [parsedRangeValue];
                        } else {
                            (parseResult[key as R] as RangeValue[]).push(parsedRangeValue);
                        }
                    }
                }
            });
        }
    }

    return parseResult;

}

/**
 * Turns a previous parseResult back into a string.
 */
export function stringify<K extends KeywordName, R extends RangeName>(parseResult: Result<K, R> | string) {

    // If the query object is falsy we can just return an empty string
    if (!parseResult) {
        return '';
    }

    // If the query object is already a string, we can return it immediately
    if (typeof parseResult === 'string') {
        return parseResult;
    }

    // If the query object does not have any keys, we can return an empty string
    if (Object.keys(parseResult).length === 0) {
        return '';
    }

    let parts: { value: string, offsetStart: number }[] = [];

    for (let key in parseResult) {

        let parseResultItems = (parseResult[key as K|R] as KeywordValue[]|RangeValue[]);

        parseResultItems.forEach((parseResultItem: KeywordValue|RangeValue) => {

            // Keyword or text
            if ('value' in parseResultItem) {
                parts.push({
                    value: (parseResultItem.exclude === true ? '-' : '')
                         + (key !== 'text' ? key + ':' : '')
                         + addQuotes(parseResultItem.value),
                    offsetStart: parseResultItem.offsetStart
                });

            // Range
            } else if ('from' in parseResultItem) {
                parts.push({
                    value: (parseResultItem.exclude === true ? '-' : '')
                         + key
                         + ':'
                         + addQuotes(parseResultItem.from)
                         + (parseResultItem.to != null ? ('-' + addQuotes(parseResultItem.to)) : ''),
                    offsetStart: parseResultItem.offsetStart
                });
            }

        });
    }

    return parts.sort((a,b) => (a.offsetStart > b.offsetStart) ? 1 : ((b.offsetStart > a.offsetStart) ? -1 : 0))
                .map((part) => part.value)
                .join(' ');
}
