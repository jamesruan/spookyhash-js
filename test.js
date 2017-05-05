require('buffer')
var Spooky = require('./main.js')

var str = "The quick brown fox jumps over the lazy dog"
var input, buffer
input = Buffer.from(str)
buffer = Spooky.hash128(input)
console.log(str.length, buffer.toString())

str = "The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog"
input = Buffer.from(str)
buffer = Spooky.hash128(input)
console.log(str.length, buffer.toString())
