module.exports = exists;

module.exports.allExist = allExist;

function exists (v) {
  return v !== null && v !== undefined;
}

function allExist (/* vals */) {
  var vals = Array.prototype.slice.call(arguments);
  return vals.every(exists);
}