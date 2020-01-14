import 'mocha';
import { expect } from 'chai';

import * as SearchQueryParser from './search-query-parser';

describe('Search query syntax parser', () => {

    it('should return a simple string when no keywords are configured', () => {
        const searchQuery = 'fancy pyjama wear';
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery);

        expect(parsedSearchQuery).to.be.string(searchQuery);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should return a tokenized string when tokenize is true', () => {
        const searchQuery = 'fancy pyjama wear';
        const options = { tokenize: true } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(3).and.has.ordered.members(['fancy', 'pyjama', 'wear']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should return a tokenized string when tokenize is true, respecting double-quotes and escapes', () => {
        const searchQuery = 'fancy "py\\"j\\"am\'a w\'ear"';
        const options = { tokenize: true } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(2).and.has.ordered.members(['fancy', 'py"j"am\'a w\'ear']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should return a tokenized string when tokenize is true, respecting exclusion syntax for unquoted terms', () => {
        const searchQuery = 'fancy -pyjama -wear';
        const options = { tokenize: true, keywords: ['id']} as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(1).and.has.ordered.members(['fancy']);
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('text').that.has.lengthOf(2).and.has.ordered.members(['pyjama', 'wear']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should return a tokenized string when tokenize is true, respecting exclusion syntax for single-quoted terms', () => {
        const searchQuery = 'fancy -\'pyjama -wear\'';
        const options = { tokenize: true } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(1).and.has.ordered.members(['fancy']);
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('text').that.has.lengthOf(1).and.has.ordered.members(['pyjama -wear']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(stringifiedSearchQuery).to.be.equal('fancy -\"pyjama -wear\"'); // Stringified version creates double quotes instead of single quotes
    });

    it('should return a tokenized string when tokenize is true, respecting exclusion syntax for double-quoted terms', () => {
        const searchQuery = 'fancy -"pyjama -wear"';
        const options = { tokenize: true } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(1).and.has.ordered.members(['fancy']);
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('text').that.has.lengthOf(1).and.has.ordered.members(['pyjama -wear']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse a single keyword with no text', () => {
        const searchQuery = 'from:jul@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('from', 'jul@foo.com');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(1).and.has.deep.ordered.members([
            {
                keyword: 'from',
                value: 'jul@foo.com',
                offsetStart: 0,
                offsetEnd: 16,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should ignore keywords that are not specified', () => {
        const searchQuery = 'test another other:jul@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.not.have.property('other');
        expect(parsedSearchQuery).to.have.property('text', 'test another other:jul@foo.com');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(3).and.has.deep.ordered.members([
            {
                text: 'test',
                offsetStart: 0,
                offsetEnd: 4,
                exclude: false
            }, {
                text: 'another',
                offsetStart: 5,
                offsetEnd: 12,
                exclude: false
            }, {
                text: 'other:jul@foo.com',
                offsetStart: 13,
                offsetEnd: 30,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse a single keyword with free text before it', () => {
        const searchQuery = 'hey you! from:jul@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('from', 'jul@foo.com');
        expect(parsedSearchQuery).to.have.property('text', 'hey you!');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(3).and.has.deep.ordered.members([
            {
                text: 'hey',
                offsetStart: 0,
                offsetEnd: 3,
                exclude: false
            }, {
                text: 'you!',
                offsetStart: 4,
                offsetEnd: 8,
                exclude: false
            }, {
                keyword: 'from',
                value: 'jul@foo.com',
                offsetStart: 9,
                offsetEnd: 25,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse a single keyword with free text after it', () => {
        const searchQuery = 'from:jul@foo.com hey buddy!';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('from', 'jul@foo.com');
        expect(parsedSearchQuery).to.have.property('text', 'hey buddy!');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(3).and.has.deep.ordered.members([
            {
                keyword: 'from',
                value: 'jul@foo.com',
                offsetStart: 0,
                offsetEnd: 16,
                exclude: false
            },
            {
                text: 'hey',
                offsetStart: 17,
                offsetEnd: 20,
                exclude: false
            },
            {
                text: 'buddy!',
                offsetStart: 21,
                offsetEnd: 27,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse a single keyword with free text around it', () => {
        const searchQuery = 'hey you! from:jul@foo.com pouet';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('from', 'jul@foo.com');
        expect(parsedSearchQuery).to.have.property('text', 'hey you! pouet');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(4).and.has.deep.ordered.members([
            {
                text: 'hey',
                offsetStart: 0,
                offsetEnd: 3,
                exclude: false
            }, {
                text: 'you!',
                offsetStart: 4,
                offsetEnd: 8,
                exclude: false
            }, {
                keyword: 'from',
                value: 'jul@foo.com',
                offsetStart: 9,
                offsetEnd: 25,
                exclude: false
            }, {
                text: 'pouet',
                offsetStart: 26,
                offsetEnd: 31,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse 2 different keywords with free text', () => {
        const searchQuery = 'hey, from:jul@foo.com to:bar@hey.ya so what\'s up gents';
        const options = { keywords: ['from', 'to'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('from', 'jul@foo.com');
        expect(parsedSearchQuery).to.have.property('to', 'bar@hey.ya');
        expect(parsedSearchQuery).to.have.property('text', 'hey, so what\'s up gents');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(7).and.has.deep.ordered.members([
            {
                text: 'hey,',
                offsetStart: 0,
                offsetEnd: 4,
                exclude: false
            }, {
                keyword: 'from',
                value: 'jul@foo.com',
                offsetStart: 5,
                offsetEnd: 21,
                exclude: false
            }, {
                keyword: 'to',
                value: 'bar@hey.ya',
                offsetStart: 22,
                offsetEnd: 35,
                exclude: false
            }, {
                text: 'so',
                offsetStart: 36,
                offsetEnd: 38,
                exclude: false
            }, {
                text: 'what\'s',
                offsetStart: 39,
                offsetEnd: 45,
                exclude: false
            }, {
                text: 'up',
                offsetStart: 46,
                offsetEnd: 48,
                exclude: false
            }, {
                text: 'gents',
                offsetStart: 49,
                offsetEnd: 54,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should concatenate the values of 2 identical keywords and keep free text', () => {
        const searchQuery = 'from:jul@foo.com from:bar@hey.ya vaccationessss';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.is.lengthOf(2).and.has.ordered.members(['jul@foo.com', 'bar@hey.ya']);
        expect(parsedSearchQuery).to.have.property('text', 'vaccationessss');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(3).and.has.deep.ordered.members([
            {
                keyword: 'from',
                value: 'jul@foo.com',
                offsetStart: 0,
                offsetEnd: 16,
                exclude: false
            }, {
                keyword: 'from',
                value: 'bar@hey.ya',
                offsetStart: 17,
                offsetEnd: 32,
                exclude: false
            }, {
                text: 'vaccationessss',
                offsetStart: 33,
                offsetEnd: 47,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should concatenate a keyword with multiple values', () => {
        const searchQuery = 'from:jul@foo.com,bar@hey.ya';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.is.lengthOf(2).and.has.ordered.members(['jul@foo.com', 'bar@hey.ya']);
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(1).and.has.deep.ordered.members([
            {
                keyword: 'from',
                value: 'jul@foo.com,bar@hey.ya',
                offsetStart: 0,
                offsetEnd: 27,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should concatenate the values of 2 identical keywords with multiple values and keep free text', () => {
        const searchQuery = 'from:jul@foo.com,bar@hey.ya from:a@b.c,d@e.f ouch!#';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text').that.is.string('ouch!#');
        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.is.lengthOf(4).and.has.ordered.members(['jul@foo.com', 'bar@hey.ya', 'a@b.c', 'd@e.f']);
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(3).and.has.deep.ordered.members([
            {
                keyword: 'from',
                value: 'jul@foo.com,bar@hey.ya',
                offsetStart: 0,
                offsetEnd: 27,
                exclude: false
            }, {
                keyword: 'from',
                value: 'a@b.c,d@e.f',
                offsetStart: 28,
                offsetEnd: 44,
                exclude: false
            }, {
                text: 'ouch!#',
                offsetStart: 45,
                offsetEnd: 51,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse a single keyword query in exclusion syntax', () => {
        const searchQuery = '-from:jul@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('from', 'jul@foo.com');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(1).and.has.deep.ordered.members([
            {
                keyword: 'from',
                value: 'jul@foo.com',
                offsetStart: 0,
                offsetEnd: 17,
                exclude: true
            }
        ]);
    });

    it('should concatenate a keyword with multiple values in exclusion syntax', () => {
        const searchQuery = '-from:jul@foo.com,mar@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('from').that.is.an('array').that.has.lengthOf(2).and.has.deep.ordered.members(['jul@foo.com', 'mar@foo.com']);
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(1).and.has.deep.ordered.members([
            {
                keyword: 'from',
                value: 'jul@foo.com,mar@foo.com',
                offsetStart: 0,
                offsetEnd: 29,
                exclude: true
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should support keywords which appear multiple times in exclusion syntax', () => {
        const searchQuery = '-from:jul@foo.com,mar@foo.com -from:jan@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('from').that.is.an('array').that.has.lengthOf(3).and.has.deep.ordered.members(['jul@foo.com', 'mar@foo.com', 'jan@foo.com']);
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(2).and.has.deep.ordered.members([
            {
                keyword: 'from',
                value: 'jul@foo.com,mar@foo.com',
                offsetStart: 0,
                offsetEnd: 29,
                exclude: true
            }, {
                keyword: 'from',
                value: 'jan@foo.com',
                offsetStart: 30,
                offsetEnd: 47,
                exclude: true
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should always return an array if alwaysArray is set to true', () => {
        const searchQuery = 'from:jul@foo.com to:a@b.c -cc:you@foo.com ouch!#';

        const options = { keywords: ['from', 'to', 'cc'], alwaysArray: true } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text', 'ouch!#');
        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.is.lengthOf(1).and.has.ordered.members(['jul@foo.com']);
        expect(parsedSearchQuery).to.have.property('to').that.is.an('array').that.is.lengthOf(1).and.has.ordered.members(['a@b.c']);
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('cc').that.is.an('array').that.is.lengthOf(1).and.has.ordered.members(['you@foo.com']);
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(4).and.has.deep.ordered.members([
            {
                keyword: 'from',
                value: 'jul@foo.com',
                offsetStart: 0,
                offsetEnd: 16,
                exclude: false
            }, {
                keyword: 'to',
                value: 'a@b.c',
                offsetStart: 17,
                offsetEnd: 25,
                exclude: false
            }, {
                keyword: 'cc',
                value: 'you@foo.com',
                offsetStart: 26,
                offsetEnd: 41,
                exclude: true
            }, {
                text: 'ouch!#',
                offsetStart: 42,
                offsetEnd: 48,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse range with only 1 end and free text', () => {
        const searchQuery = 'date:12/12/2012 ahaha';
        const options = { ranges: ['date'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text', 'ahaha');
        expect(parsedSearchQuery).to.have.property('date').that.has.property('from', '12/12/2012');
        expect(parsedSearchQuery).to.have.property('date').that.has.property('to', undefined);
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(2).and.has.deep.ordered.members([
            {
                keyword: 'date',
                from: '12/12/2012',
                to: undefined,
                offsetStart: 0,
                offsetEnd: 15,
                exclude: false
            }, {
                text: 'ahaha',
                offsetStart: 16,
                offsetEnd: 21,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse range with 2 ends and free text', () => {
        const searchQuery = 'date:12/12/2012-01/01/2014 ahaha';
        const options = { ranges: ['date'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text', 'ahaha');
        expect(parsedSearchQuery).to.have.property('date').that.has.property('from', '12/12/2012');
        expect(parsedSearchQuery).to.have.property('date').that.has.property('to', '01/01/2014');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(2).and.has.deep.ordered.members([
            {
                keyword: 'date',
                from: '12/12/2012',
                to: '01/01/2014',
                offsetStart: 0,
                offsetEnd: 26,
                exclude: false
            }, {
                text: 'ahaha',
                offsetStart: 27,
                offsetEnd: 32,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse range in exclusion syntax', () => {
        const searchQuery = '-date:12/12/2012-01/01/2014';
        const options = { ranges: ['date'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('date').that.is.an('object').that.has.property('from', '12/12/2012');
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('date').that.is.an('object').that.has.property('to', '01/01/2014');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(1).and.has.deep.ordered.members([
            {
                keyword: 'date',
                from: '12/12/2012',
                to: '01/01/2014',
                offsetStart: 0,
                offsetEnd: 27,
                exclude: true
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should strip any white space at any position', () => {
        // We have tabs and regular spaces in the string below
        const searchQuery = '	 	hey    	you! from:jul@foo.com 	 pouet ';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('from', 'jul@foo.com');
        expect(parsedSearchQuery).to.have.property('text', 'hey you! pouet');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(4).and.has.deep.ordered.members([
            {
                text: 'hey',
                offsetStart: 3,
                offsetEnd: 6,
                exclude: false
            }, {
                text: 'you!',
                offsetStart: 11,
                offsetEnd: 15,
                exclude: false
            }, {
                keyword: 'from',
                value: 'jul@foo.com',
                offsetStart: 16,
                offsetEnd: 32,
                exclude: false
            }, {
                text: 'pouet',
                offsetStart: 35,
                offsetEnd: 40,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(stringifiedSearchQuery).to.be.equal('hey you! from:jul@foo.com pouet'); // White space is not recreated when stringifying
    });

    it('should be able to parse unicode', () => {
        const searchQuery = '✓ about 这个事儿';
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery);

        expect(parsedSearchQuery).to.be.string(searchQuery);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should be able to parse unicode with keywords and odd spacing', () => {
        const searchQuery = ' ✓    about        这个事儿            from:dr@who.co.uk    ';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text', '✓ about 这个事儿');
        expect(parsedSearchQuery).to.have.property('from', 'dr@who.co.uk');

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(stringifiedSearchQuery).to.be.equal('✓ about 这个事儿 from:dr@who.co.uk'); // White space is not recreated when stringifying
    });

    it('should handle a complex and long query', () => {
        const searchQuery = '   date:12/12/2012-01/01/2014 ahaha from:jul@foo.com,bar@hey.ya from:a@b.c,d@e.f ouch!#   to:me@me.com to:toto@hey.co about that';
        const options = { ranges: ['date'], keywords: ['from', 'to'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('text', 'ahaha ouch!# about that');
        expect(parsedSearchQuery).to.have.property('date').that.has.property('from', '12/12/2012');
        expect(parsedSearchQuery).to.have.property('date').that.has.property('to', '01/01/2014');
        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.is.lengthOf(4).and.has.ordered.members(['jul@foo.com', 'bar@hey.ya', 'a@b.c', 'd@e.f']);
        expect(parsedSearchQuery).to.have.property('to').that.is.an('array').that.is.lengthOf(2).and.has.ordered.members(['me@me.com', 'toto@hey.co']);
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(9).and.has.deep.ordered.members([
            {
                keyword: 'date',
                from: '12/12/2012',
                to: '01/01/2014',
                offsetStart: 3,
                offsetEnd: 29,
                exclude: false
            }, {
                text: 'ahaha',
                offsetStart: 30,
                offsetEnd: 35,
                exclude: false
            }, {
                keyword: 'from',
                value: 'jul@foo.com,bar@hey.ya',
                offsetStart: 36,
                offsetEnd: 63,
                exclude: false
            }, {
                keyword: 'from',
                value: 'a@b.c,d@e.f',
                offsetStart: 64,
                offsetEnd: 80,
                exclude: false
            }, {
                text: 'ouch!#',
                offsetStart: 81,
                offsetEnd: 87,
                exclude: false
            }, {
                keyword: 'to',
                value: 'me@me.com',
                offsetStart: 90,
                offsetEnd: 102,
                exclude: false
            }, {
                keyword: 'to',
                value: 'toto@hey.co',
                offsetStart: 103,
                offsetEnd: 117,
                exclude: false
            }, {
                text: 'about',
                offsetStart: 118,
                offsetEnd: 123,
                exclude: false
            }, {
                text: 'that',
                offsetStart: 124,
                offsetEnd: 128,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(stringifiedSearchQuery).to.be.equal('date:12/12/2012-01/01/2014 ahaha from:jul@foo.com,bar@hey.ya from:a@b.c,d@e.f ouch!# to:me@me.com to:toto@hey.co about that'); // White space is not recreated when stringifying
    });

    it('should not split on spaces inside single and double quotes', () => {
        const searchQuery = 'name:"Bob Saget" description:\'Banana Sandwiche\'';
        const options = { keywords: ['name', 'description'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('name', 'Bob Saget');
        expect(parsedSearchQuery).to.have.property('description', 'Banana Sandwiche');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(2).and.has.deep.ordered.members([
            {
                keyword: 'name',
                value: 'Bob Saget',
                offsetStart: 0,
                offsetEnd: 16,
                exclude: false
            }, {
                keyword: 'description',
                value: 'Banana Sandwiche',
                offsetStart: 17,
                offsetEnd: 47,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(stringifiedSearchQuery).to.be.equal('name:"Bob Saget" description:"Banana Sandwiche"'); // Stringified version creates double quotes instead of single quotes
    });

    it('should correctly handle escaped single and double quotes', () => {
        const searchQuery = 'case1:"This \\"is\\" \'a\' test" case2:\'This "is" \\\'a\\\' test\'';
        const options = { keywords: ['case1', 'case2'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.have.property('case1', 'This "is" \'a\' test');
        expect(parsedSearchQuery).to.have.property('case2', 'This "is" \'a\' test');
        expect(parsedSearchQuery).to.have.property('offsets').that.is.an('array').that.has.lengthOf(2).and.has.deep.ordered.members([
            {
                keyword: 'case1',
                value: 'This "is" \'a\' test',
                offsetStart: 0,
                offsetEnd: 28,
                exclude: false
            }, {
                keyword: 'case2',
                value: 'This "is" \'a\' test',
                offsetStart: 29,
                offsetEnd: 57,
                exclude: false
            }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);

        expect(stringifiedSearchQuery).to.be.equal('case1:"This \\"is\\" \'a\' test" case2:\"This \\"is\\" \'a\' test\"'); // Stringified version creates double quotes instead of single quotes
    });

    it('should not return offset when offsets option is set to false', () => {
        const searchQuery = '-from:jul@foo.com,mar@foo.com to:bar@hey.ya about date:12/12/2012';
        const options = { keywords: ['from', 'to'], ranges: ['date'], offsets: false } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');
        expect(parsedSearchQuery).to.not.have.property('offsets');
        expect(parsedSearchQuery).to.have.property('exclude').that.has.property('from').that.is.an('array').that.has.lengthOf(2).and.has.deep.ordered.members(['jul@foo.com', 'mar@foo.com']);
        expect(parsedSearchQuery).to.have.property('to', 'bar@hey.ya');
        expect(parsedSearchQuery).to.have.property('text', 'about');
        expect(parsedSearchQuery).to.have.property('date').that.is.an('object').that.has.property('from', '12/12/2012');

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        const parsedSearchQuery2 = SearchQueryParser.parse(stringifiedSearchQuery, options);

        // Cannot check order since the offsets parameter does not exist
        expect(parsedSearchQuery2).to.be.deep.equal(parsedSearchQuery);

    });

});
