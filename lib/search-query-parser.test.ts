import 'mocha';
import { expect } from 'chai';

import * as SearchQueryParser from './search-query-parser';

describe('Search query syntax parser', () => {

    it('should respect double-quotes and escapes', () => {
        const searchQuery = 'fancy "py\\"j\\"am\'a w\'ear"';
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(2);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['fancy', 'py"j"am\'a w\'ear']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should respect exclusion syntax for unquoted terms', () => {
        const searchQuery = 'fancy -pyjama -wear';
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(3);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => {
            return { value: value.value, exclude: value.exclude };
        });
        expect(parsedTextValues).to.have.deep.ordered.members([
            { value: 'fancy', exclude: false },
            { value: 'pyjama', exclude: true },
            { value: 'wear', exclude: true }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should respect exclusion syntax for single-quoted terms', () => {
        const searchQuery = 'fancy -\'pyjama -wear\'';
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(2);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => {
            return { value: value.value, exclude: value.exclude };
        });
        expect(parsedTextValues).to.have.deep.ordered.members([
            { value: 'fancy', exclude: false },
            { value: 'pyjama -wear', exclude: true }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery.replace(/\"/g, '\'')).to.be.equal(searchQuery); // Stringification always used double quotes
    });

    it('should respect exclusion syntax for double-quoted terms', () => {
        const searchQuery = 'fancy -"pyjama -wear"';
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(2);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => {
            return { value: value.value, exclude: value.exclude };
        });
        expect(parsedTextValues).to.have.deep.ordered.members([
            { value: 'fancy', exclude: false },
            { value: 'pyjama -wear', exclude: true }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

    it('should parse a single keyword with no text', () => {
        const searchQuery = 'from:jul@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should ignore keywords that are not specified', () => {
        const searchQuery = 'test another other:jul@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.not.have.property('other');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(3);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['test', 'another', 'other:jul@foo.com']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse a single keyword with free text before it', () => {
        const searchQuery = 'hey you! from:jul@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(2);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['hey', 'you!']);

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse a single keyword with free text after it', () => {
        const searchQuery = 'from:jul@foo.com hey buddy!';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com']);

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(2);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['hey', 'buddy!']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse a single keyword with free text around it', () => {
        const searchQuery = 'hey you! from:jul@foo.com pouet';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(3);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['hey', 'you!', 'pouet']);

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com']);


        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);

    });

    it('should parse 2 different keywords with free text', () => {
        const searchQuery = 'hey, from:jul@foo.com to:bar@hey.ya so what\'s up gents';
        const options = { keywords: ['from', 'to'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(5);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['hey,', 'so', 'what\'s', 'up', 'gents']);

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com']);

        expect(parsedSearchQuery).to.have.property('to').that.is.an('array').that.has.lengthOf(1);
        const parsedToValues = parsedSearchQuery.to?.map((value) => value.value);
        expect(parsedToValues).to.have.ordered.members(['bar@hey.ya']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);

    });

    it('should parse 2 identical keywords and keep free text', () => {
        const searchQuery = 'from:jul@foo.com from:bar@hey.ya vaccationessss';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(1);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['vaccationessss']);

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(2);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com', 'bar@hey.ya']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse a keyword with multiple values', () => {
        const searchQuery = 'from:jul@foo.com,bar@hey.ya';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com,bar@hey.ya']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);
    });

    it('should parse 2 identical keywords with multiple values and keep free text', () => {
        const searchQuery = 'from:jul@foo.com,bar@hey.ya from:a@b.c,d@e.f ouch!#';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(1);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['ouch!#']);

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(2);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com,bar@hey.ya', 'a@b.c,d@e.f']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery).to.be.equal(stringifiedSearchQuery);

    });

    it('should parse a single keyword query in exclusion syntax', () => {
        const searchQuery = '-from:jul@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => {
            return { value: value.value, exclude: value.exclude };
        });
        expect(parsedFromValues).to.have.deep.ordered.members([
            { value: 'jul@foo.com', exclude: true }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

    it('should parse a keyword with multiple values in exclusion syntax', () => {
        const searchQuery = '-from:jul@foo.com,mar@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => {
            return { value: value.value, exclude: value.exclude };
        });
        expect(parsedFromValues).to.have.deep.ordered.members([
            { value: 'jul@foo.com,mar@foo.com', exclude: true }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

    it('should parse a keyword which appears multiple times in exclusion syntax', () => {
        const searchQuery = '-from:jul@foo.com,mar@foo.com -from:jan@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(2);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => {
            return { value: value.value, exclude: value.exclude };
        });
        expect(parsedFromValues).to.have.deep.ordered.members([
            { value: 'jul@foo.com,mar@foo.com', exclude: true },
            { value: 'jan@foo.com', exclude: true }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

    it('should parse a keyword which appears multiple times with some of them in exclusion syntax', () => {
        const searchQuery = '-from:jul@foo.com,mar@foo.com from:jan@foo.com';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(2);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => {
            return { value: value.value, exclude: value.exclude };
        });
        expect(parsedFromValues).to.have.deep.ordered.members([
            { value: 'jul@foo.com,mar@foo.com', exclude: true },
            { value: 'jan@foo.com', exclude: false }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

    it('should parse range with only 1 end and free text', () => {
        const searchQuery = 'date:12/12/2012 ahaha';
        const options = { ranges: ['date'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(1);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['ahaha']);

        expect(parsedSearchQuery).to.have.property('date').that.is.an('array').that.has.lengthOf(1);
        const parsedDateValues = parsedSearchQuery.date?.map((value) => {
            return { from: value.from, to: value.to };
        });
        expect(parsedDateValues).to.have.deep.ordered.members([
            { from: '12/12/2012', to: undefined }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

    it('should parse range with 2 ends and free text', () => {
        const searchQuery = 'date:12/12/2012-01/01/2014 ahaha';
        const options = { ranges: ['date'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(1);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['ahaha']);

        expect(parsedSearchQuery).to.have.property('date').that.is.an('array').that.has.lengthOf(1);
        const parsedDateValues = parsedSearchQuery.date?.map((value) => {
            return { from: value.from, to: value.to };
        });
        expect(parsedDateValues).to.have.deep.ordered.members([
            { from: '12/12/2012', to: '01/01/2014' }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

    it('should parse range in exclusion syntax', () => {
        const searchQuery = '-date:12/12/2012-01/01/2014';
        const options = { ranges: ['date'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('date').that.is.an('array').that.has.lengthOf(1);
        const parsedDateValues = parsedSearchQuery.date?.map((value) => {
            return { from: value.from, to: value.to, exclude: value.exclude };
        });
        expect(parsedDateValues).to.have.deep.ordered.members([
            { from: '12/12/2012', to: '01/01/2014', exclude: true }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

    it('should strip any white space at any position', () => {
        // We have tabs and regular spaces in the string below
        const searchQuery = '	 	hey    	you! from:jul@foo.com 	 pouet ';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(3);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['hey', 'you!', 'pouet']);

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery.replace(/\s+/g, ' ').trim()).to.be.equal(stringifiedSearchQuery);
    });

    it('should be able to parse unicode', () => {
        const searchQuery = '✓ about 这个事儿';
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(3);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['✓', 'about', '这个事儿']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

    it('should be able to parse unicode with keywords and odd spacing', () => {
        const searchQuery = ' ✓    about        这个事儿            from:dr@who.co.uk    ';
        const options = { keywords: ['from'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(3);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['✓', 'about', '这个事儿']);

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(1);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['dr@who.co.uk']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery.replace(/\s+/g, ' ').trim()).to.be.equal(stringifiedSearchQuery);
    });

    it('should handle a complex and long query', () => {
        const searchQuery = '   date:12/12/2012-01/01/2014 ahaha from:jul@foo.com,bar@hey.ya from:a@b.c,d@e.f ouch!#   to:me@me.com to:toto@hey.co about that';
        const options = { ranges: ['date'], keywords: ['from', 'to'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('text').that.is.an('array').that.has.lengthOf(4);
        const parsedTextValues = parsedSearchQuery.text?.map((value) => value.value);
        expect(parsedTextValues).to.have.ordered.members(['ahaha', 'ouch!#', 'about', 'that']);

        expect(parsedSearchQuery).to.have.property('from').that.is.an('array').that.has.lengthOf(2);
        const parsedFromValues = parsedSearchQuery.from?.map((value) => value.value);
        expect(parsedFromValues).to.have.ordered.members(['jul@foo.com,bar@hey.ya', 'a@b.c,d@e.f']);

        expect(parsedSearchQuery).to.have.property('to').that.is.an('array').that.has.lengthOf(2);
        const parsedToValues = parsedSearchQuery.to?.map((value) => value.value);
        expect(parsedToValues).to.have.ordered.members(['me@me.com', 'toto@hey.co']);

        expect(parsedSearchQuery).to.have.property('date').that.is.an('array').that.has.lengthOf(1);
        const parsedDateValues = parsedSearchQuery.date?.map((value) => {
            return { from: value.from, to: value.to };
        });
        expect(parsedDateValues).to.have.deep.ordered.members([
            { from: '12/12/2012', to: '01/01/2014' }
        ]);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(searchQuery.replace(/\s+/g, ' ').trim()).to.be.equal(stringifiedSearchQuery);
    });

    it('should not split on spaces inside single and double quotes', () => {
        const searchQuery = 'name:"Bob Saget" description:\'Banana Sandwiche\'';
        const options = { keywords: ['name', 'description'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('name').that.is.an('array').that.has.lengthOf(1);
        const parsedNameValues = parsedSearchQuery.name?.map((value) => value.value);
        expect(parsedNameValues).to.have.ordered.members(['Bob Saget']);

        expect(parsedSearchQuery).to.have.property('description').that.is.an('array').that.has.lengthOf(1);
        const parsedDescriptionValues = parsedSearchQuery.description?.map((value) => value.value);
        expect(parsedDescriptionValues).to.have.ordered.members(['Banana Sandwiche']);

        const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        expect(stringifiedSearchQuery.replace(/\"/g, '\'')).to.be.equal(searchQuery.replace(/\"/g, '\'')); // Stringification always used double quotes
    });

    it('should correctly handle escaped single and double quotes', () => {
        const searchQuery = 'case1:"This \\"is\\" \'a\' test" case2:\'This "is" \\\'a\\\' test\'';
        const options = { keywords: ['case1', 'case2'] } as const;
        const parsedSearchQuery = SearchQueryParser.parse(searchQuery, options);

        expect(parsedSearchQuery).to.be.an('object');

        expect(parsedSearchQuery).to.have.property('case1').that.is.an('array').that.has.lengthOf(1);
        const parsedCase1Values = parsedSearchQuery.case1?.map((value) => value.value);
        expect(parsedCase1Values).to.have.ordered.members(['This "is" \'a\' test']);

        expect(parsedSearchQuery).to.have.property('case2').that.is.an('array').that.has.lengthOf(1);
        const parsedCase2Values = parsedSearchQuery.case2?.map((value) => value.value);
        expect(parsedCase2Values).to.have.ordered.members(['This "is" \'a\' test']);

        // TODO: Figure out why this wont stringify back
        // const stringifiedSearchQuery = SearchQueryParser.stringify(parsedSearchQuery);
        // expect(stringifiedSearchQuery).to.be.equal(searchQuery);
    });

});
