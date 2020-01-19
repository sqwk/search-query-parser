# Search Query Syntax Parser

A simple parser for advanced search query syntax.

It parses a string like this:
```
from:hi@retrace.io,foo@gmail.com to:me subject:vacations date:1/10/2013-15/04/2014 photos
```

And turns it into an object like this:

```javascript
{
    from: [ { value: 'hi@retrace.io,foo@gmail.com', offsetStart: 0, offsetEnd: 32, exclude: false } ],
    to: [ { value: 'me', offsetStart: 33, offsetEnd: 38, exclude: false } ],
    subject: [ { value: 'vacations', offsetStart: 39, offsetEnd: 56, , exclude: false } ],
    date: [ { from: '1/10/2013', to: '15/04/2014', offsetStart: 57, offsetEnd: 82, , exclude: false  } ],
    text: { value: 'photos', offsetStart: 83, offsetEnd: 89, exclude: false }
}
```

## Usage

```typescript
import * as SearchQueryParser from 'search-query-parser';

let query = 'from:hi@retrace.io,foo@gmail.com to:me subject:vacations date:1/10/2013-15/04/2014 photos';
let options = { keywords: ['from', 'to', 'subject'], ranges: ['date'] } as const;

let searchQueryObj = SearchQueryParser.parse(query, options);
```

You can configure what keywords and ranges the parser should accept with the `options` argument.

It accepts 2 values:

* `keywords`, that can be separated by commas (,). Accepts an array of strings. Default is an empty array.
* `ranges`, that can be separated by a hyphen (-). Accepts an array of strings. Default is an empty array.

### Exclusion

Text, keywords or ranges can be excluded by prefixing them with a `-`.

```typescript
let query = '-from:hi@retrace.io';
let options = { keywords: ['from'] } as const;
let parsedQueryWithOptions = SearchQueryParser.parse(query, options);

// parsedQueryWithOptions is now:
// {
//     from: [
//         {
//             value: 'jul@foo.com',
//             offsetStart: 0,
//             offsetEnd: 19,
//             exclude: true
//         }
//     ]
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

## Todo

* Add offset numbers to tests
* Check `should correctly handle escaped single and double quotes` test
* Add test for stringification after the parsed object has been modified manually

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
