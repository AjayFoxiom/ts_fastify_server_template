function parse(_str, _options) {
  return {};
}

function serialize(name, val, _options) {
  return `${name}=${encodeURIComponent(val)}`;
}

function stringifySetCookie(cookie) {
  return `${cookie.name}=${encodeURIComponent(cookie.value)}`;
}

module.exports = {
  parse,
  serialize,
  stringifySetCookie,
  default: { parse, serialize, stringifySetCookie },
};
