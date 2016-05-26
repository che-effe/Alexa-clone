var debug = require('debug')('numstr');
var partial = require('lodash.partial');
var defaults = require('defaults');

// hash of funcs used to process number words
var nameFuncs = {
  naught: partial(num, 0),
  nought: partial(num, 0),
  zero: partial(num, 0),
  one: partial(num, 1),       first: partial(num, 1),
  two: partial(num, 2),       second: partial(num, 2),
  three: partial(num, 3),     third: partial(num, 3),
  four: partial(num, 4),      fourth: partial(num, 4),
  five: partial(num, 5),      fifth: partial(num, 5),
  six: partial(num, 6),
  seven: partial(num, 7),
  eight: partial(num, 8),     eighth: partial(num, 8),
  nine: partial(num, 9),      ninth: partial(num, 9),
  ten: partial(num, 10),
  eleven: partial(num, 11),
  twelve: partial(num, 12),   twelfth: partial(num, 12),
  thirteen: partial(num, 13),
  fifteen: partial(num, 15),
  eighteen: partial(num, 18),
  teen: partial(suffix, 10),
  twenty: partial(num, 20),   twentieth: partial(num, 20),
  thirty: partial(num, 30),   thirtieth: partial(num, 30),
  forty: partial(num, 40),    fortieth: partial(num, 40),
  fifty: partial(num, 50),    fiftieth: partial(num, 50),
  sixty: partial(num, 60),    sixtieth: partial(num, 60),
  seventy: partial(num, 70),  seventieth: partial(num, 70),
  eighty: partial(num, 80),   eightieth: partial(num, 80),
  ninety: partial(num, 90),   ninetieth: partial(num, 90),
  hundred: partial(multiplier, 100),
  thousand: partial(multiplier, 1000),
  million: partial(multiplier, Math.pow(10, 6)),
  milliard: partial(multiplier, Math.pow(10, 9)),
  billion: partial(powMultiplier, 2),
  billiard: partial(multiplier, Math.pow(10, 15)),
  trillion: partial(powMultiplier, 3),
  trilliard: partial(multiplier, Math.pow(10, 21)),
  quadrillion: partial(powMultiplier, 4),
  quadrilliard: partial(multiplier, Math.pow(10, 27)),
  quintillion: partial(powMultiplier, 5),
  quintilliard: partial(multiplier, Math.pow(10, 33)),
  sextillion: partial(powMultiplier, 6),
  sextilliard: partial(multiplier, Math.pow(10, 39)),
  septillion: partial(powMultiplier, 7),
  septilliard: partial(multiplier, Math.pow(10, 45)),
  octillion: partial(powMultiplier, 8),
  octilliard: partial(multiplier, Math.pow(10, 51)),
  nonillion: partial(powMultiplier, 9),
  nonilliard: partial(multiplier, Math.pow(10, 57)),
  decillion: partial(powMultiplier, 10),
  decilliard: partial(multiplier, Math.pow(10, 63)),
  centillion: partial(powMultiplier, 100),
  googol: googol,
  googolplex: googolplex,
  negative: invert,
  minus: invert,
  score: partial(multiplier, 20),
  gross: partial(multiplier, 12 * 12),
  dozen: partial(multiplier, 12),
  bakersdozen: partial(multiplier, 13),
  bakerdozen: partial(multiplier, 13),
  s: function () {},
  es: function () {},
  th: function () {}
};

// builds regexp based on supported words from the hash above
var numbers = Object.keys(nameFuncs).sort().reverse().join('|') + '|[0-9]+';
var okWords = '\\b(and|a|of)\\b';
var okThings = '[^A-Za-z0-9.]';
var okWordsRegExp = new RegExp(okWords, 'ig');
var okThingsRegExp = new RegExp(okThings, 'ig');
var numRegExp = new RegExp(numbers, 'ig');
var expandedNumRegExp = new RegExp('(\\b((' + numbers + ')((' + okWords + ')|(' + okThings + '))*)+\\b)', 'ig');

var state = {
  total: 0,
  mult: 0,
  lastMult: 0,
  isNewMult: 0,
  suffix: 0,
  val: 0
};


// processes a simple number word
function num (number, options) {
  debug('processing number: %s', number);
  state.val = number;
  if (state.suffix) {
    state.val += state.suffix;
    state.suffix = 0;
  }
  state.total += state.val * state.mult;
  state.isNewMult = 0;
}

// processes a multiplier like thousands, dozen, etc
function multiplier (mult, options) {
  debug('processing multiplier: %s', mult);
  if (mult > state.lastMult) {
    if (state.isNewMult) { state.total += state.mult; }
    state.mult = 1;
  }
  state.mult *= mult;
  state.lastMult = mult;
  state.isNewMult = 1;
}

// processes an exponential multiplier
function powMultiplier (pow, options) {
  if (options.scale === 'long') {
    multiplier(Math.pow(10, (pow * 6)));
  } else {
    multiplier(Math.pow(10, (pow + 1) * 3));
  }
}

// processes s number suffice like teen
function suffix(suff, options) {
  debug('processing suffix: %s', suff);
  state.suffix = suff;
}

// processes a googol multiplier
function googol (options) {
  multiplier(Math.pow(10, 100), options);
}

// processes a googolplex multiplier
function googolplex (options) {
  multiplier(Math.pow(10, Math.pow(10, 100)), options);
}

// inverts the current total
function invert(options) {
  debug('inverting');
  state.total *= -1;
}

// converts english words to numbers
function words2nums (words, options) {
  options = defaults(options, {
    scale: 'short'
  });
  var w = words.toLowerCase().trim();
  w = w.replace(',', '');
  if (/^[-+]?[.0-9\s]+$/.test(w)) {
    return w;
  }
  if (/^[-+0-9.]+$/.test(w) && w.length) {
    throw Error('+ or - not at beginning');
  }
  w = w.replace(okWordsRegExp, '', 'g');
  w = w.replace(okThingsRegExp, ' ', 'g');
  if (!w.length) {
    return Error('not a number');
  }

  debug('simplified input:', w);

  state.total = state.lastMult = state.suffix = state.isNewMult = 0;
  state.mult = 1;

  var match, name;
  match = w.match(numRegExp).reverse();
  debug('tokens found:', match);
  match.forEach(function (part) {
    var test;
    if ((test = /(\d+)(?:st|nd|rd|th)?$/.exec(part)) !== null) {
      num(test[0], options);
    } else if (part) {
      nameFuncs[part](options);
    } else {
      debug('no handler found for %s', part);
    }
    debug('state:', state);
  });
  if (state.isNewMult) { state.total += state.mult; }
  return state.total;
}

// returns instances of numbers in text
function extractNumbers(text) {
  var numbers = [], num, str, tmpStr;
  while ((num = expandedNumRegExp.exec(text)) !== null) {
    str = num[0].trim();
    while(str !== tmpStr) {
      tmpStr = str;
      str = tmpStr.replace(/[,]|\b(and|a|of|,)$/, '');
    }
    numbers.push({
      text: str.trim(),
      index: num.index
    });
  }
  return numbers;
}

// replaces instances of number words with numbers
function numify (text, options) {
  options = defaults(options, {
    scale: 'short'
  });
  var numbers = extractNumbers(text);
  var num, numLength, offset = 0;
  numbers.forEach(function (item) {
    num = words2nums(item.text, options);
    numLength = num.toString().length;
    text = text.substring(0, item.index - offset) + num + text.substring(item.index + item.text.length - offset);
    offset += item.text.length - numLength;
  });
  return text;
}

exports.words2nums = words2nums;
exports.extractNumbers = extractNumbers;
exports.numify = numify;
