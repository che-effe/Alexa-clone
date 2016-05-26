var assert = require('chai').assert;

var words2nums = require('../index').words2nums;
var extractNumbers = require('../index').extractNumbers;
var numify = require('../index').numify;

describe('words2nums', function () {
  it('should return valid numbers', function () {
    assert.equal(words2nums('fourteen'), 14);
    assert.equal(words2nums('two thousand and one'), 2001);
    assert.equal(words2nums('two thousand, one'), 2001);
    assert.equal(words2nums('twenty-second'), 22);
    assert.equal(words2nums('15 billion, 6 million'), 15006000000);
    assert.equal(words2nums('three thousand four hundred ninety-nine'), 3499);
    assert.equal(words2nums('5 dozen'), 60);
    assert.equal(words2nums('four score and 7'), 87);
    assert.equal(words2nums('four thousand three hundred fifty two'), 4352);
  });
});

describe('extractNumbers', function () {
  it('should return info about numbers in the text', function () {
    assert.deepEqual(extractNumbers('he makes thirty five dollars an hour'), [ { text: 'thirty five', index: 9 } ]);
    assert.deepEqual(extractNumbers('the time is five past seven'), [ { text: 'five', index: 12 }, { text: 'seven', index: 22 }]);
    assert.deepEqual(extractNumbers('she is twelve and he is three years younger'), [ { text: 'twelve', index: 7 }, { text: 'three', index: 24 } ]);
  });
});

describe('numify', function () {
  it('should replace words with numbers', function () {
    assert.equal(numify('he makes thirty five dollars an hour'), 'he makes 35 dollars an hour');
    assert.equal(numify('the time is five past seven'), 'the time is 5 past 7');
    assert.equal(numify('she is twelve and he is three years younger'), 'she is 12 and he is 3 years younger');
  });
});
