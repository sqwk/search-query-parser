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
    offsets: boolean;
    alwaysArray: boolean;
    tokenize: boolean;
};

type TextOffset = {
    text: string;
};

type KeywordOffset = {
    keyword: string;
    value: string;
};

type RangeOffset = {
    keyword: string;
    from: string;
    to?: string;
};

type Offset = (TextOffset | KeywordOffset | RangeOffset) & {
    offsetStart: number;
    offsetEnd: number;
    exclude: boolean;
};

type TextValue = string;

type KeywordValue = string;

type RangeValue = {
    from: string;
    to?: string;
};

type Result<K extends KeywordName, R extends RangeName> = {
    options: Options<K, R>,
    offsets?: Offset[];
    exclude?: ResultData<K, R>;
} & ResultData<K, R>;

type ResultData<K extends KeywordName, R extends RangeName> = {
    text?: TextValue | TextValue[];
} & {
    [L in K]?: KeywordValue | KeywordValue[];
} & {
    [S in R]?: RangeValue | RangeValue[];
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
 * Parse a range, split it into parts seperated by a dash
 */
function parseRange(term: string): RangeValue|null {

    let rangeValues = term.split('-');

    // When two ends of the range are specified
    if (rangeValues.length === 2) {
        return {
            from: rangeValues[0],
            to: rangeValues[1]
        };

    // When pairs of ranges are specified
    // keyword:XXXX-YYYY,AAAA-BBBB
    } else if (rangeValues.length % 2 === 0) {
        console.error(`Cannot parse multiple pairs of ranges as of now '${JSON.stringify(rangeValues)}'`);
        return null;

    // When only getting a single value,
    // or an odd number of values
    } else {
        return {
            from: rangeValues[0],
            to: undefined
        };
    }
}

/**
 * Parses a string to return a processed SearchParserResult
 */
export function parse<K extends KeywordName, R extends RangeName>(str = '', userOptions?: Partial<Options<K, R>>) {

    // Merge options with default options
    const defaultOptions: Options<K, R> = {
        keywords: [],
        ranges: [],
        tokenize: false,
        alwaysArray: false,
        offsets: true
    };
    const options = Object.assign(defaultOptions, userOptions);

    // When only a simple string is passed, return it
    if (options.tokenize == false && str.indexOf(':') === -1) {
        return str;

    // When no keywords or ranges set, treat as a simple string
    } else if (options.tokenize == false
           && (options.keywords == null || options.keywords.length === 0)
           && (options.ranges == null || options.ranges.length === 0)) {
                return str;

    // Otherwise parse the advanced query syntax
    } else {

        // Init object to store the query object
        let parseResult = {
            options: options
        } as Result<K, R>;

        // Temporary storage of terms while processing the input string
        let terms: Offset[] = [];

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

                // Make sure that keywords and ranges are defined

                // Divide into keyword, range or non-configured keyword/range (=text)
                if (options.keywords.indexOf(key as K) !== -1) {
                    terms.push({
                        keyword: key,
                        value: val,
                        offsetStart: match.index,
                        offsetEnd: match.index + term.length,
                        exclude: isExcludedKey
                    });
                } else if (options.ranges.indexOf(key as R) !== -1) {
                    terms.push({
                        keyword: key,
                        from: val,
                        to: undefined,
                        offsetStart: match.index,
                        offsetEnd: match.index + term.length,
                        exclude: isExcludedKey
                    });
                } else {
                    terms.push({
                        text: term,
                        offsetStart: match.index,
                        offsetEnd: match.index + term.length,
                        exclude: isExcludedKey
                    });
                }

            // Term is not a key:value pair, must be text
            } else {

                const isExcludedTerm = term[0] === '-' ? true : false;

                if (isExcludedTerm === true) {
                    term = term.slice(1);
                }

                term = stripSurroundingQuotes(term);
                term = stripBackslashes(term);

                terms.push({
                    text: term,
                    offsetStart: match.index,
                    offsetEnd: match.index + term.length,
                    exclude: isExcludedTerm
                });

            }

        }

        // Secondary looop
        // Do some more processing of the search terms
        terms.forEach((term) => {

            // When just a simple term
            if ('text' in term) {

                // Make sure text is a thing
                if (term.text.length) {


                    if (term.exclude === true) {

                        if (parseResult.exclude == null) {
                            parseResult.exclude = {};
                        }

                        // Push text onto existing array or create new array
                        if (parseResult.exclude.text != null) {
                            (parseResult.exclude.text as TextValue[]).push(term.text);
                        } else {
                            parseResult.exclude.text = [term.text];
                        }

                    // Not an exclusion
                    } else {

                        // Push text onto existing array or create new array
                        if (parseResult.text != null) {
                            (parseResult.text as TextValue[]).push(term.text);
                        } else {
                            parseResult.text = [term.text];
                        }
                    }

                    // When offsets is true, we also add it to the offsets array
                    if (options.offsets === true) {
                        if (parseResult.offsets == null) {
                            parseResult.offsets = [];
                        }
                        parseResult.offsets.push(term);
                    }
                }

            // Keyword
            } else if ('value' in term) {

                // Make sure value is a thing
                if (term.value.length) {

                    // Get an array of values when several are there
                    // or turn into array if it's only one value anyway
                    let values = term.value.split(',');

                    if (term.exclude === true) {

                        if (parseResult.exclude == null) {
                            parseResult.exclude = {};
                        }

                        // Push values onto existing array or create new array
                        if (parseResult.exclude[term.keyword as K] != null) {
                            (parseResult.exclude[term.keyword as K] as KeywordValue[]).push(...values);
                        } else {
                            (parseResult.exclude[term.keyword as K] as KeywordValue[]) = values;
                        }

                    // Not an exclusion
                    } else {

                        // Push values onto existing array or create new array
                        if (parseResult[term.keyword as K] != null) {
                            (parseResult[term.keyword as K] as KeywordValue[]).push(...values);
                        } else {
                            (parseResult[term.keyword as K] as KeywordValue[]) = values;
                        }
                    }

                    // When offsets is true, we also add it to the offsets array
                    if (options.offsets === true) {
                        if (parseResult.offsets == null) {
                            parseResult.offsets = [];
                        }
                        parseResult.offsets.push(term);
                    }

                }

            // Range
            } else if ('from' in term) {

                // Make sure from is a thing
                if (term.from.length) {

                    const parsedRange = parseRange(term.from);

                    if (parsedRange != null) {

                        if (term.exclude === true) {

                            if (parseResult.exclude == null) {
                                parseResult.exclude = {};
                            }

                            // Push values onto existing array or create new array
                            if (parseResult.exclude[term.keyword as R] != null) {
                                (parseResult.exclude[term.keyword as R] as RangeValue[]).push(parsedRange);
                            } else {
                                (parseResult.exclude[term.keyword as R] as RangeValue[]) = [parsedRange];
                            }

                        // Not an exclusion
                        } else {

                            // Push values onto existing array or create new array
                            if (parseResult[term.keyword as R] != null) {
                                (parseResult[term.keyword as R] as RangeValue[]).push(parsedRange);
                            } else {
                                (parseResult[term.keyword as R] as RangeValue[]) = [parsedRange];
                            }
                        }

                        // When offsets is true, we also add it to the offsets array
                        if (options.offsets === true) {
                            if (parseResult.offsets == null) {
                                parseResult.offsets = [];
                            }
                            parseResult.offsets.push({
                                ...term,
                                ...parsedRange // overrides term.from & term.to
                            });
                        }

                    }

                }

            }

        });

        // If tokenize is false, concatenate text terms
        if (options.tokenize === false) {
            if (Array.isArray(parseResult.text)) {
                parseResult.text = parseResult.text.join(' ').trim();
            }
            if (parseResult.exclude != null && Array.isArray(parseResult.exclude.text)) {
                parseResult.exclude.text = parseResult.exclude.text.join(' ').trim();
            }
        }

        // If alwaysArray is false, flatten out non-text (keyword and array) arrays if there is only one occurence
        if (options.alwaysArray === false) {
            for (let excludeKey in parseResult.exclude) {
                if (excludeKey !== 'text'
                 && Array.isArray(parseResult.exclude[excludeKey as K|R])
                 && (parseResult.exclude[excludeKey as K|R] as (KeywordValue|RangeValue)[]).length === 1) {
                    (parseResult.exclude[excludeKey as K|R] as KeywordValue|RangeValue) = (parseResult.exclude[excludeKey] as (KeywordValue|RangeValue)[])[0];
                }
            }
            for (let key in parseResult) {
                if (key !== 'text' && key !== 'exclude' && key !== 'offsets'
                 && Array.isArray(parseResult[key as K|R])
                 && (parseResult[key as K|R] as (KeywordValue|RangeValue)[]).length === 1) {
                    (parseResult[key as K|R] as KeywordValue|RangeValue) = (parseResult[key as K|R] as (KeywordValue|RangeValue)[])[0];
                }
            }
        }

        return parseResult;
    }

}

/**
 * Turns a previous parseResult back into a string.
 * This requires that the original `parse()` method used `options.offsets: true` in order to respect its sort order.
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

    let parts: string[] = [];

    // If the parseResult has an offsets array use that to keep the original sort order
    if (parseResult.offsets != null) {
        parseResult.offsets.forEach((offset) => {

            // TextOffset
            if ('text' in offset) {
                parts.push((offset.exclude === true ? '-' : '') + addQuotes(offset.text));

            // KeywordOffset
            } else if ('value' in offset) {
                parts.push((offset.exclude === true ? '-' : '') + offset.keyword + ':' + addQuotes(offset.value));

            // RangeOffset
            } else if ('from' in offset) {
                parts.push((offset.exclude === true ? '-' : '') + offset.keyword + ':' + addQuotes(offset.from) + (offset.to != null ? ('-' + addQuotes(offset.to)) : ''));
            }
        });

    } else {

        // Otherwise start by stringifying the positive text, keyword and ranges
        parts = stringifyResultData(parseResult, parseResult.options, '');

        // Add in excluded text keywords and ranges
        if (parseResult.exclude) {
            if (Object.keys(parseResult.exclude).length > 0) {
                parts.push(...stringifyResultData(parseResult.exclude, parseResult.options, '-'));
            }
        }
    }

    return parts.join(' ');

}

function stringifyResultData<K extends KeywordName, R extends RangeName>(parseResultData: ResultData<K, R>, options: Options<K, R>, prefix: string) {

    // Keep track of all single stringified parts in this array
    let parts: string[] = [];

    // Text
    if (parseResultData.text) {
        let value: string[] = [];
        if (typeof parseResultData.text === 'string') {
            value.push(parseResultData.text);
        } else {
            value.push.apply(value, parseResultData.text);
        }

        if (value.length > 0) {
            parts.push(value.map(addQuotes).map(val => prefix + val).join(' '));
        }
    }


    // Keywords
    if (options.keywords) {
        options.keywords.forEach((keyword) => {
            if (!parseResultData[keyword]) {
                return;
            }

            let value: KeywordValue[]= [];
            if (typeof parseResultData[keyword] === 'string') {
                value.push(parseResultData[keyword] as KeywordValue);
            } else {
                value.push.apply(value, parseResultData[keyword] as KeywordValue[]);
            }

            if (value.length > 0) {
                parts.push(prefix + keyword + ':' + value.map(addQuotes).join(','));
            }
        });
    }

    // Ranges
    if (options.ranges) {
        options.ranges.forEach((range) => {
            if (!parseResultData[range]) {
                return;
            }

            let value = (parseResultData[range] as RangeValue).from;
            let to = (parseResultData[range] as RangeValue).to;
            if (to) {
                value = value + '-' + to;
            }

            if (value) {
                parts.push(prefix + range + ':' + value);
            }
        });
    }

    return parts;
}

