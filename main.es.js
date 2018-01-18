import 'buffer';
import Long from 'long';

const sc_const = new Long(0xdeadbeef, 0xdeadbeef, true);
const sc_numVars = 12;
const sc_blockSize = sc_numVars * 8;
const sc_bufSize = sc_blockSize * 2;

const rot64 = (x, n) => {
	return x.shl(n).or(x.shru(64 - n));
};

const mix_stage = (data, s, i, b) => {
	const ip1 = (i + 1) % 12;
	const ip2 = (i + 2) % 12;
	const im1 = (i + 11) % 12;
	const im2 = (i + 10) % 12;
	s[i] = s[i].add(data[i]);
	s[ip2] = s[ip2].xor(s[im2]);
	s[im1] = s[im1].xor(s[i]);
	s[i] = rot64(s[i], b);
	s[im1] = s[im1].add(s[ip1]);
};

const mix = (data, s) => {
	mix_stage(data, s, 0, 11);
	mix_stage(data, s, 1, 32);
	mix_stage(data, s, 2, 43);
	mix_stage(data, s, 3, 31);
	mix_stage(data, s, 4, 17);
	mix_stage(data, s, 5, 28);
	mix_stage(data, s, 6, 39);
	mix_stage(data, s, 7, 57);
	mix_stage(data, s, 8, 55);
	mix_stage(data, s, 9, 54);
	mix_stage(data, s, 10, 22);
	mix_stage(data, s, 11, 46);
};

const end_partial_stage = (h, i, b) => {
	const ip1 = (i + 1) % 12;
	const ip2 = (i + 2) % 12;
	const im1 = (i + 11) % 12;
	h[im1] = h[im1].add(h[ip1]);
	h[ip2] = h[ip2].xor(h[im1]);
	h[ip1] = rot64(h[ip1], b);
};

const end_partial = h => {
	end_partial_stage(h, 0, 44);
	end_partial_stage(h, 1, 15);
	end_partial_stage(h, 2, 34);
	end_partial_stage(h, 3, 21);
	end_partial_stage(h, 4, 38);
	end_partial_stage(h, 5, 33);
	end_partial_stage(h, 6, 10);
	end_partial_stage(h, 7, 13);
	end_partial_stage(h, 8, 38);
	end_partial_stage(h, 9, 53);
	end_partial_stage(h, 10, 42);
	end_partial_stage(h, 11, 54);
};

const end = (data, h) => {
	h.forEach((e, i) => {
		h[i] = h[i].add(data[i]);
	});
	end_partial(h);
	end_partial(h);
	end_partial(h);
};

const short_mix_stage = (h, i, b) => {
	const ip2 = (i + 2) % 4;
	const im1 = (i + 3) % 4;
	h[ip2] = rot64(h[ip2], b);
	h[ip2] = h[ip2].add(h[im1]);
	h[i] = h[i].xor(h[ip2]);
};

const short_mix = h => {
	short_mix_stage(h, 0, 50);
	short_mix_stage(h, 1, 52);
	short_mix_stage(h, 2, 30);
	short_mix_stage(h, 3, 41);
	short_mix_stage(h, 0, 54);
	short_mix_stage(h, 1, 48);
	short_mix_stage(h, 2, 38);
	short_mix_stage(h, 3, 37);
	short_mix_stage(h, 0, 62);
	short_mix_stage(h, 1, 34);
	short_mix_stage(h, 2, 5);
	short_mix_stage(h, 3, 36);
};

const short_end_stage = (h, i, b) => {
	const ip2 = (i + 2) % 4;
	const im1 = (i + 3) % 4;
	h[im1] = h[im1].xor(h[ip2]);
	h[ip2] = rot64(h[ip2], b);
	h[im1] = h[im1].add(h[ip2]);
};

const short_end = h => {
	short_end_stage(h, 0, 15);
	short_end_stage(h, 1, 52);
	short_end_stage(h, 2, 26);
	short_end_stage(h, 3, 51);
	short_end_stage(h, 0, 28);
	short_end_stage(h, 1, 9);
	short_end_stage(h, 2, 47);
	short_end_stage(h, 3, 54);
	short_end_stage(h, 0, 32);
	short_end_stage(h, 1, 25);
	short_end_stage(h, 2, 63);
};

const short_hash = (msg, seed1, seed2) => {
	let remainder = msg.length % 32;
	const h = [seed1, seed2, sc_const, sc_const];

	let offset = 0;
	let low, high;

	if (msg.length > 15) {
		const loop_max = msg.length >> 5;
		// read 4 * 64bit = 32byte and mix
		// until less than 32byte left
		for (let i = 0; i < loop_max; i++) {
			low = msg.readUIntLE(offset, 4);
			offset += 4;
			high = msg.readUIntLE(offset, 4);
			offset += 4;
			h[2] = h[2].add(new Long(low, high));

			low = msg.readUIntLE(offset, 4);
			offset += 4;
			high = msg.readUIntLE(offset, 4);
			offset += 4;
			h[3] = h[3].add(new Long(low, high));

			short_mix(h);

			low = msg.readUIntLE(offset, 4);
			offset += 4;
			high = msg.readUIntLE(offset, 4);
			offset += 4;
			h[0] = h[0].add(new Long(low, high));

			low = msg.readUIntLE(offset, 4);
			offset += 4;
			high = msg.readUIntLE(offset, 4);
			offset += 4;
			h[1] = h[1].add(new Long(low, high));
		}

		// if remaining is 16 bytes or more
		if (remainder > 15) {
			low = msg.readUIntLE(offset, 4);
			offset += 4;
			high = msg.readUIntLE(offset, 4);
			offset += 4;
			h[2] = h[2].add(new Long(low, high));

			low = msg.readUIntLE(offset, 4);
			offset += 4;
			high = msg.readUIntLE(offset, 4);
			offset += 4;
			h[3] = h[3].add(new Long(low, high));

			short_mix(h);

			remainder -= 16;
		}
	}

	const base = msg.length - remainder;
	// remainder is less than 16
	// handle length
	high = msg.length << 24;
	low = 0;
	h[3] = h[3].add(new Long(low, high));
	high = 0;
	// handle remaining
	switch (remainder) {
		case 15:
			offset = base + 14;
			high = msg.readUIntLE(offset, 1) << 16;
			h[3] = h[3].add(new Long(0, high));
		/* falls through */
		case 14:
			offset = base + 13;
			high = msg.readUIntLE(offset, 1) << 8;
			h[3] = h[3].add(new Long(0, high));
		/* falls through */
		case 13:
			offset = base + 12;
			high = msg.readUIntLE(offset, 1);
			h[3] = h[3].add(new Long(0, high));
		/* falls through */
		case 12:
			offset = base + 8;
			low = msg.readUIntLE(offset, 4);
			h[3] = h[3].add(new Long(low, 0));
			low = msg.readUIntLE(base + 0, 4);
			high = msg.readUIntLE(base + 4, 4);
			h[2] = h[2].add(new Long(low, high));
			break;
		case 11:
			offset = base + 10;
			low = msg.readUIntLE(offset, 1) << 16;
			h[3] = h[3].add(new Long(low, 0));
		/* falls through */
		case 10:
			offset = base + 9;
			low = msg.readUIntLE(offset, 1) << 8;
			h[3] = h[3].add(new Long(low, 0));
		/* falls through */
		case 9:
			offset = base + 8;
			low = msg.readUIntLE(offset, 1);
			h[3] = h[3].add(new Long(low, 0));
		/* falls through */
		case 8:
			low = msg.readUIntLE(base + 0, 4);
			high = msg.readUIntLE(base + 4, 4);
			h[2] = h[2].add(new Long(low, high));
			break;
		case 7:
			offset = base + 6;
			high = msg.readUIntLE(offset, 1) << 16;
			h[2] = h[2].add(new Long(0, high));
		/* falls through */
		case 6:
			offset = base + 5;
			high = msg.readUIntLE(offset, 1) << 8;
			h[2] = h[2].add(new Long(0, high));
		/* falls through */
		case 5:
			offset = base + 4;
			high = msg.readUIntLE(offset, 1);
			h[2] = h[2].add(new Long(0, high));
		/* falls through */
		case 4:
			low = msg.readUIntLE(base + 0, 4);
			h[2] = h[2].add(new Long(low, 0));
			break;
		case 3:
			offset = base + 2;
			low = msg.readUIntLE(offset, 1) << 16;
			h[2] = h[2].add(new Long(low, 0));
		/* falls through */
		case 2:
			offset = base + 1;
			low = msg.readUIntLE(offset, 1) << 8;
			h[2] = h[2].add(new Long(low, 0));
		/* falls through */
		case 1:
			offset = base + 0;
			low = msg.readUIntLE(offset, 1);
			h[2] = h[2].add(new Long(low, 0));
			break;
		case 0:
			h[2] = h[2].add(sc_const);
			h[3] = h[3].add(sc_const);
			break;
	}
	short_end(h);

	return Buffer.from(h[0].toBytes().concat(h[1].toBytes()));
};

const hash128 = (msg, seed1, seed2) => {
	if (seed1 == null) {
		seed1 = new Long(0, 0, true);
	} else {
		console.assert(Long.isLong(seed1), 'seed1 need to be Long');
	}
	if (seed2 == null) {
		seed2 = new Long(0, 0, true);
	} else {
		console.assert(Long.isLong(seed1), 'seed1 need to be Long');
	}
	console.assert(Buffer.isBuffer(msg), 'msg need to be a Buffer');
	if (msg.length < sc_bufSize) {
		return short_hash(msg, seed1, seed2);
	}

	const buf = [];
	buf[0] = buf[3] = buf[6] = buf[9] = seed1;
	buf[1] = buf[4] = buf[7] = buf[10] = seed2;
	buf[2] = buf[5] = buf[8] = buf[11] = sc_const;
	const data = [];

	const loop_max = msg.length / sc_blockSize | 0;
	const remainder = msg.length - loop_max * sc_blockSize;
	let offset = 0;
	let i;
	let piece;
	let low, high;
	while (offset / sc_blockSize < loop_max) {
		// read 64*12 = 96 bytes once
		piece = msg.slice(offset, offset + sc_blockSize);
		for (i = 0; i < sc_numVars; i++) {
			low = piece.readUIntLE(i * 8, 4);
			high = piece.readUIntLE(i * 8 + 4, 4);
			data[i] = new Long(low, high);
		}
		mix(data, buf);
		offset += sc_blockSize;
	}
	//handle remaining less than 96 bytes
	piece = Buffer.alloc(sc_blockSize);
	msg.copy(piece, 0, offset);
	piece.writeUInt8(remainder, sc_blockSize - 1);
	for (i = 0; i < sc_numVars; i++) {
		low = piece.readUIntLE(i * 8, 4);
		high = piece.readUIntLE(i * 8 + 4, 4);
		data[i] = new Long(low, high);
	}
	end(data, buf);

	return Buffer.from(buf[0].toBytes().concat(buf[1].toBytes()));
};

const hash96 = (msg, seed1, seed2) => {
	const buf = hash128(msg, seed1, seed2);
	return Buffer.from(buf.slice(0, 12));
};

const hash64 = (msg, seed1, seed2) => {
	const buf = hash128(msg, seed1, seed2);
	return Buffer.from(buf.slice(0, 8));
};

const hash32 = (msg, seed1, seed2) => {
	const buf = hash128(msg, seed1, seed2);
	return Buffer.from(buf.slice(0, 4));
};

export { hash128, hash96, hash64, hash32 };
