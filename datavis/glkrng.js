// glkrng.js: GLK's minimalist seedable pseudo-random numbers
// Copyright (C)  2024 University of Chicago. All rights reserved.
/*
This is only for students and instructors in the 2024 CMSC 23900 ("DataVis") class, for use in
that class. It is not licensed for open-source or any other kind of re-distribution. Do not
allow this file to be copied or downloaded by anyone outside the 2024 DataVis class.
*/
'use strict';

/* Unlike Math.random(), this is a *seedable* pseudo-random number generator: from a given
integer seed value, it can be run and re-run to reproduce the same sequence of values. It is
minimalist, with no cryptographic guarantees, using the integer value generation from:
http://burtleburtle.net/bob/rand/smallprng.html. GLK first learned about this from Prof.
Melissa E. O'Neill's informative writings:
https://www.pcg-random.org/posts/bob-jenkins-small-prng-passes-practrand.html

Usage examples:
  import { glkrng } from './glkrng.js' // in code
  // or in console: const glkrng = await import('./glkrng.js').then(m => m.glkrng)
  const rng = new glkrng(42); // here the given seed is 42
  // NOTE: you *must* use "new" to create a new generator
  rng.uint()   // random 32-bit unsigned int
  rng.uint(10) // random int in 0, 1, ..., 9
  rng.uint(2)  // random 0 or 1
  rng.float()  // random number in [0,1)
  rng.double() // random number in [0,1), with more bits of randomness

These functions can also be used as a source for d3's functions that use random numbers:
  shuffle = d3.shuffler(rng.float)
  shuffle([0,1,2,3,4])
  nrnd = d3.randomNormal.source(rng.float)(0,1)
  [...Array(8)].map(x => nrnd())
*/
export function glkrng(seed = 239) {
  // 239 is the default seed
  // the core function to permute bits from http://burtleburtle.net/bob/rand/smallprng.html
  // modified to operate on a length 5 array of uint32s "x"
  function gen(x) {
    x[4] = x[0] - ((x[1] << 27) | (x[1] >>> 5));
    x[0] = x[1] ^ ((x[2] << 17) | (x[2] >>> 15));
    x[1] = x[2] + x[3];
    x[2] = x[3] + x[4];
    x[3] = x[4] + x[0];
    return x[3];
  }

  // resetter method, and initializer
  this.reset = () => {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array
    this.buff = Uint32Array.of(0xf1ea5eed, seed, seed, seed, 0);
    // run generator 20 times, discarding output
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < 20; i++) gen(this.buff);
  };
  // constructor: initialize internal buffer based on given seed
  this.seed = seed;
  this.reset();

  // uint() and uint(0) return a 32-bit unsigned int
  // uint(N) with N > 0 returns an uint in {0, 1, ... N-1}
  // e.g. uint(2) returns a single 0 or 1
  this.uint = (N = 0) => {
    if (N <= 0) {
      // return full 32-bit unsigned int
      return gen(this.buff);
    }
    // else got N > 0 (including N=1, which always returns 0)
    // set cap to biggest multiple of N that fits in a uint32
    let cap = 0xffffffff;
    cap -= cap % N;
    // uniformly sample the remainders mod N by generating uints until less than cap
    let val = null;
    do {
      val = gen(this.buff);
    } while (val >= cap);
    // return result mod N
    return val % N;
  };

  /*
  The technique of 32-bit float sampling in [0,1) here is based on the idea in:

  David B. Thomas, Wayne Luk, Philip H.W. Leong, and John D. Villasenor.
  Gaussian random number generators.
  ACM Comput. Surv. 39, 4, Article 11 (November 2007).
  DOI=http://dx.doi.org/10.1145/1287620.1287622

  which is also the same basic idea as Taylor Campbell describes here:

  http://mumble.net/~campbell/2014/04/28/uniform-random-float
  http://mumble.net/~campbell/2014/04/28/random_real.c

  Essentially: the probability of returning a float X should be proportional to the width of
  the interval containing all the reals closer to X than any other float, which is nearly
  always simply ulp(X) (the increment from X to the next representable value), and ulp(2^N)
  is proportional to 2^N. Thus, starting with 2^pow with pow=-1 for floats in [0.5,1), pow is
  decremented once for every consecutive 0 in a string of random bits.

  floatAndPow returns [val,pow] where val is in [0,1), and was formed as (2^pow)*(1 + something);
  knowing pow may be helpful for modifications to val such as done by double(), below.
  */
  this.floatAndPow = () => {
    let expo = 126; // one less than bias=127 => values in [0.5,1)
    let rr = gen(this.buff);
    while (!rr && expo > 32) {
      // got 32 bits of zeros and can decrement expo by 32; try again
      expo -= 32;
      rr = gen(this.buff);
    }
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
    const nz = Math.clz32(rr);
    /* either we saw a 1 before expo hits zero, or not, in which case
       we're into the denormals (expo == 0), which is fine */
    expo = nz > expo ? 0 : expo - nz;
    /* # zero bits has determined expo; now determine frac */
    if (nz > 8) {
      /* there are less then 32 - 1 - 8 = 23 random bits remaining (the
         first 1 after the leading 0s does not get to be in fraction)
         so need to get more random bits for fraction */
      rr = gen(this.buff);
    }
    // create floating-point output as 32-bit IEEE 754
    const ret = 2 ** (expo - 127) * (1 + (rr & 0x7fffff) / 2 ** 23);
    return [ret, expo - 127];
  };

  // float() returns a number, with 31-bits of randomness, in range [0,1)
  this.float = () => this.floatAndPow()[0];

  /*
  double() returns a 64-bit random number in [0,1). It first gets a 32-bit value, which,
  upon assignment to a 64-bit double, leaves the least significant bits zero. So we get
  more randomness, scale it appropriately, and add it to the initial value. 60 bits of
  the 64-bit output are randomnly set.

  A very-likely-negligible drawback is that this method doesn't sample some values near zero
  as densely as it should. The float() function can in principle generate (32-bit) normalized
  values down to 2^(-126) ~= 1.17549435e-38, as well as the denormalized values uniformly in
  [0, 2^(-126)). 64-bit normalized values, however, go down to 2^(-1022), with denormals below
  that. There are many 64-bit values (normalized and not) below 2^(-126) that this double()
  function cannot generate. But the chances of this being an issue are roughly 1 in 2^126 (!).

  A better approach would be to copy the technique of float() but operate on 64-bit uints.
  The types available in JavaScript (and the absence of C unions) make that annoying to code.
  */
  this.double = () => {
    const [val, pow] = this.floatAndPow();
    // 32-bit float has random 23 bits in mantissa; need 52-23 = 29 more bits
    const nudge = gen(this.buff) >>> 3; // get 32 bits and lose 3
    // val was formed as 2^pow * (1 + frac/2^23) , as a 32-bit float, so
    // we want to add in 2^pow * (0 + nudge/2^52) = nudge * 2^(pow - 52)
    return val + nudge * 2 ** (pow - 52);
  };
}
