# Search Query Syntax Parser

> A simple parser for advanced search query syntax.

[![Build Status](https://travis-ci.org/nepsilon/search-query-parser.svg?branch=master)](https://travis-ci.org/nepsilon/search-query-parser)

It parses a string like this:
```
from:hi@retrace.io,foo@gmail.com to:me subject:vacations date:1/10/2013-15/04/2014 photos
```

And turns it into an object like this:

```javascript
{
  from: ['hi@retrace.io', 'foo@gmail.com'],
  to: 'me',
  subject: 'vacations',
  date: {
    from: '1/10/2013',
    to: '15/04/2014'
  },
  text: 'photos',
  offsets: [
    { keyword: 'from', value: 'hi@retrace.io,foo@gmail.com', offsetStart: 0, offsetEnd: 32 },
    { keyword: 'to', value: 'me', offsetStart: 33, offsetEnd: 38, exclude: false},
    { keyword: 'subject', value: 'vacations', offsetStart: 39, offsetEnd: 56, , exclude: false },
    { keyword: 'date', value: '1/10/2013-15/04/2014', offsetStart: 57, offsetEnd: 82, , exclude: false },
    { text: 'photos', offsetStart: 83, offsetEnd: 89, exclude: false }
  ]
}
```

## Installation

```shell
$ npm install search-query-parser
```

## Usage

```typescript
import * as SearchQueryParser from 'search-query-parser';

let query = 'from:hi@retrace.io,foo@gmail.com to:me subject:vacations date:1/10/2013-15/04/2014 photos';
let options = { keywords: ['from', 'to', 'subject'], ranges: ['date'] } as const;

let searchQueryObj = SearchQueryParser.parse(query, options);
```

You can configure what keywords and ranges the parser should accept with the `options` argument.

It accepts 5 values:

* `keywords`, that can be separated by commas (,). Accepts an array of strings. Default is an empty array.
* `ranges`, that can be separated by a hyphen (-). Accepts an array of strings. Default is an empty array.
* [`tokenize`](#tokenize), a boolean that controls how **non-matched** keywords/ranges are returned. These are collected in the `text` and `exclude.text` property, respectivly. If set to `true`, they are returned as an array of strings where each term in the array is a whitespace-separated word, or a multi-word term surrounded by single- or double-quotes. If set to `false` they are returned as a single string. Defaults to `false`.
* [`alwaysArray`](#alwaysArray), a boolean that controls how **matched** keywords/ranges are returned. If set to `true`, all matched keywords will always be arrays instead of strings. If set to `false` they will be strings or arrays depending on whether a single or multiple values are matched. Defaults to `false`.
* [`offsets`](#offsets), a boolean that controls whether to return the offsets object. Note that the offsets object is needed if you want to stringify the returned object to a string again later in the correct order. Defaults to `true`.

### tokenize

If no keywords or ranges are specified, or if none are present in the given search query, then `SearchQueryParser.parse()` will return a the original input string if `tokenize` is false, or an array of strings under the key `text` if `tokenize` is true.

```typescript
let query = 'a query with "just text"';
let parsedQuery = SearchQueryParser.parse(query);
// parsedQuery is now 'a query with "just text"'

let options = { keywords: ['unused'] };
let parsedQueryWithOptions = SearchQueryParser.parse(query, options);
// parsedQueryWithOptions is now 'a query with "just text"'

let options2 = { tokenize: true };
let parsedQueryWithTokens = SearchQueryParser.parse(query, options2);
// parsedQueryWithTokens is now: ['a', 'query', 'with', 'just text']
```

### alwaysArray

Sometimes checking against whether a keyword holds string or not can be excessive and prone to errors; it's often easier to simply expect everything is an array even if it means doing 1-iteration loops often.

```javascript
let query = 'test:helloworld fun:yay,happy';
let options = { keywords: ['test', 'fun'] } as const;
let parsedQueryWithOptions = SearchQueryParser.parse(query, options);
// parsedQueryWithOptions is now:
// {
//   test: 'helloworld',
//   fun: ['yay', 'happy']
// }

let optionsAlwaysArray = { keywords: ['test', 'fun'], alwaysArray: true } as const;
let parsedQueryWithOptions = SearchQueryParser.parse(query, options);
// parsedQueryWithOptions is now:
// {
//   test: ['helloworld'], // No need to check whether test is a string or not!
//   fun: ['yay', 'happy']
// }
```

### offsets

The offsets object could become pretty huge with long search queries which could be an unnecessary use of space if no functionality depends on it. It can simply be turned off using the option `offsets: false`.


### Exclusion

Text, keywords or ranges can be excluded by prefixing them with a `-`. They are collected in the `exclude` object and marked as excluded in the offsets array:

```typescript
let query = '-from:hi@retrace.io';
let options = { keywords: ['from'] } as const;
let parsedQueryWithOptions = SearchQueryParser.parse(query, options);

// parsedQueryWithOptions is now:
// {
//   exclude: {
//     from: 'hi@retrace.io'
//   },
//   {
//     keyword: 'from',
//     value: 'jul@foo.com',
//     offsetStart: 0,
//     offsetEnd: 19,
//     exclude: true
//   }
// }
```

### Modyfing the results object and turning it back into a string

Anytime, you can go back and stringify the parsed search query. This could be handy if you would like to manipulate the parsed search query object.

If `offsets` is enabled, the stringification process will use the offsets data and keep the original order of the input string.  If `offsets` is not enabled, the order may differ.

```typescript
let query = 'from:hi@retrace.io,foo@gmail.com to:me subject:vacations date:1/10/2013-15/04/2014 photos';
let options = { keywords: ['from', 'to', 'subject'], ranges: ['date'] } as const;

let searchQueryObj = SearchQueryParser.parse(query, options);

let newQuery = SearchQueryParser.stringify(searchQueryObj);
// newQuery is now: from:hi@retrace.io,foo@gmail.com to:me subject:vacations date:1/10/2013-15/04/2014 photos
```

**TODO** Modifying any top-level properties of the results object will automatically keep `offsets` and `exclude` in sync.


## Typescript

This library is written in typescript and can be imported like so

```typescript
import * as SearchQueryParser from 'search-query-parser';
```

Typehinting for the returned object properties is available, if you cast your options as a `const`:

```typescript
let options = { keywords: ['from'], ranges: ['date'] } as const;
let searchQueryObj = SearchQueryParser.parse('someQuery', options);

// searchQueryObj.from will now be hinted as string?
```

## Testing

Tests are written using the BDD / TDD testing framework `chai`, and run with `mocha`.

Run tests with `npm run test`.

## License

The MIT License (MIT)

Copyright (c) 2014

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
