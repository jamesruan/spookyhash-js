# spookyhash-js
Javascript version of SpookyHash V2
----

[SpookyHash: a 128-bit noncryptographic hash](http://burtleburtle.net/bob/hash/spooky.html)

The reference added has some modification to allow it to compile under Linux.

----
Usage:

    const Spooky = require('spookyhash-js')
    const str = "some test string"
    const buf = Buffer.from(str)
    const hash = Spooky.hash128(buf)
    console.log(hash.toString())
    // 9503b082b3b227449e6cb7e7fbacb8c6

