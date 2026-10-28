function contentDisposition(filename, _options) {
  return filename ? `attachment; filename="${filename}"` : "attachment";
}

contentDisposition.parse = function () {
  return { type: "attachment", parameters: {} };
};

module.exports = contentDisposition;
module.exports.default = contentDisposition;
