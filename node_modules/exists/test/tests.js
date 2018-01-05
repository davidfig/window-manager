var exists = require('../index');
var allExist = exists.allExist;

describe('exists', function() {
  it('should return false for null', function() {
    exists(null).should.equal(false);
  });
  it('should return false for undefined', function() {
    exists(undefined).should.equal(false);
  });
  it('should return true for everything else', function () {
    exists({}).should.equal(true);
    exists([]).should.equal(true);
    exists('').should.equal(true);
    exists(false).should.equal(true);
  });
});

describe('allExist', function() {
  it('should return true if all not null or undefined', function() {
    allExist({}, [], '', false, true, fn).should.equal(true);
  });
  it('should return false if one is null or undefined', function() {
    allExist({}, [], '', false, true, fn, null).should.equal(false);
    allExist({}, [], '', false, true, fn, undefined).should.equal(false);
  });
});

function fn () {}