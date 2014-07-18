// standard modules
var path = require('path');

// exports
module.exports = {
  paths: {
    src: path.resolve(__dirname, 'src/'),
    dist: path.resolve(__dirname, 'dist/')
  },
  // for a  3:4 aspect ratio
  height: 300,
  width: 225
};
