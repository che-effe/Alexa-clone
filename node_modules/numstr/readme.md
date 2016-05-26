# numstr

Utility to identify english number words in text and to convert them to actual
numbers.

This library is based on the Perl libraries [Lingua-EN-FindNumber](http://search.cpan.org/~neilb/Lingua-EN-FindNumber-1.32/lib/Lingua/EN/FindNumber.pm) and
[Lingua-EN-Words2Nums](http://search.cpan.org/~joey/Lingua-EN-Words2Nums-0.18/Words2Nums.pm).

## Installation

```
npm install numstr
```

## Usage

### words2nums

Takes a number written in english and converts it to a number.

```javascript
var words2nums = require('numstr').words2nums;
console.log(words2nums('one thousand nine hundred seventy six')); // 1976
```

### extractNumbers

Identifies english numbers in a string and returns an array

```javascript
var extractNumbers = require('numstr').extractNumbers;
console.log(extractNumbers('He ate five pies')); // [{text: 'five', index: 8}]
```

### numify

Replaces english numbers with actual numbers in a string

```javascript
var numify = require('numstr').numify;
console.log(numify('I ran twenty six miles')); // I ran 26 miles
```

## Notes

Currently supports negative numbers and numbers up to decillions along with
common phrases like 'score', 'gross', 'dozen', 'bakersdozen' and more.

Does not currently support fractions or decimals
