require('buffer')
var Spooky = require('./main.js')

var str = "The quick brown fox jumps over the lazy dog"
var input, buffer
input = Buffer.from(str)
console.log(Spooky)
buffer = Spooky.hash128(input)
console.log(buffer.toString())
