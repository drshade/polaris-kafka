!(function() {
  'use strict';
  function e(e, t, n, r, i, o, s) {
    try {
      var a = e[o](s),
        h = a.value;
    } catch (e) {
      return void n(e);
    }
    a.done ? t(h) : Promise.resolve(h).then(r, i);
  }
  function t(t) {
    return function() {
      var n = this,
        r = arguments;
      return new Promise(function(i, o) {
        var s = t.apply(n, r);
        function a(t) {
          e(s, i, o, a, h, 'next', t);
        }
        function h(t) {
          e(s, i, o, a, h, 'throw', t);
        }
        a(void 0);
      });
    };
  }
  const n = [ArrayBuffer, MessagePort],
    r = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
    i = Symbol('proxyValue'),
    o = Symbol('throw'),
    s = new Map([
      [
        'PROXY',
        {
          canHandle: (e) => e && e[i],
          serialize: (e) => {
            const { port1: t, port2: n } = new MessageChannel();
            return h(e, t), n;
          },
          deserialize: (e) =>
            (function(e, n) {
              g(e) && (e = l(e));
              if (!c(e))
                throw Error(
                  'endpoint does not have all of addEventListener, removeEventListener and postMessage defined'
                );
              return (
                d(e),
                (function e(t, n = [], r = function() {}) {
                  return new Proxy(r, {
                    construct: (e, r, i) => t({ type: 'CONSTRUCT', callPath: n, argumentsList: r }),
                    apply: (r, i, o) =>
                      'bind' === n[n.length - 1]
                        ? e(t, n.slice(0, -1))
                        : t({ type: 'APPLY', callPath: n, argumentsList: o }),
                    get(r, i, o) {
                      if ('then' === i && 0 === n.length) return { then: () => o };
                      if ('then' === i) {
                        const e = t({ type: 'GET', callPath: n });
                        return Promise.resolve(e).then.bind(e);
                      }
                      return e(t, n.concat(i), r[i]);
                    },
                    set: (e, r, i, o) => t({ type: 'SET', callPath: n, property: r, value: i })
                  });
                })(
                  ((i = t(function*(t) {
                    let n = [];
                    return (
                      ('APPLY' !== t.type && 'CONSTRUCT' !== t.type) || (n = t.argumentsList.map(w)),
                      f(
                        (yield (function(e, t, n) {
                          const i = `${r}-${a++}`;
                          return new Promise((r) => {
                            v(e, function t(n) {
                              n.data.id === i &&
                                ((function(e, t) {
                                  e.removeEventListener('message', t);
                                })(e, t),
                                r(n));
                            }),
                              (t = Object.assign({}, t, { id: i })),
                              e.postMessage(t, n);
                          });
                        })(e, Object.assign({}, t, { argumentsList: n }), p(n))).data.value
                      )
                    );
                  })),
                  function(e) {
                    return i.apply(this, arguments);
                  }),
                  [],
                  n
                )
              );
              var i;
            })(e)
        }
      ],
      [
        'THROW',
        {
          canHandle: (e) => e && e[o],
          serialize: (e) => e.toString() + '\n' + e.stack,
          deserialize: (e) => {
            throw Error(e);
          }
        }
      ]
    ]);
  let a = 0;
  function h(e, n) {
    if ((g(n) && (n = l(n)), !c(n)))
      throw Error('endpoint does not have all of addEventListener, removeEventListener and postMessage defined');
    d(n),
      v(
        n,
        (function() {
          var r = t(function*(t) {
            if (!t.data.id || !t.data.callPath) return;
            const r = t.data;
            let a = yield r.callPath.slice(0, -1).reduce((e, t) => e[t], e),
              h = yield r.callPath.reduce((e, t) => e[t], e),
              w = h,
              u = [];
            if ((('APPLY' !== r.type && 'CONSTRUCT' !== r.type) || (u = r.argumentsList.map(f)), 'APPLY' === r.type))
              try {
                w = yield h.apply(a, u);
              } catch (e) {
                (w = e)[o] = !0;
              }
            if ('CONSTRUCT' === r.type)
              try {
                w = (function(e) {
                  return (e[i] = !0), e;
                })((w = new h(...u)));
              } catch (e) {
                (w = e)[o] = !0;
              }
            return (
              'SET' === r.type && ((h[r.property] = r.value), (w = !0)),
              ((w = (function(e) {
                for (const [t, n] of s)
                  if (n.canHandle(e)) {
                    const r = n.serialize(e);
                    return { value: { type: t, value: r } };
                  }
                return { value: { type: 'RAW', value: e } };
              })(w)).id = r.id),
              n.postMessage(w, p([w]))
            );
          });
          return function(e) {
            return r.apply(this, arguments);
          };
        })()
      );
  }
  function w(e) {
    for (const [t, n] of s) if (n.canHandle(e)) return { type: t, value: n.serialize(e) };
    let t = [];
    for (const n of y(e))
      for (const [e, r] of s)
        r.canHandle(n.value) && t.push({ path: n.path, wrappedValue: { type: e, value: r.serialize(n.value) } });
    for (const n of t) {
      n.path.slice(0, -1).reduce((e, t) => e[t], e)[n.path[n.path.length - 1]] = null;
    }
    return { type: 'RAW', value: e, wrappedChildren: t };
  }
  function f(e) {
    if (s.has(e.type)) {
      return s.get(e.type).deserialize(e.value);
    }
    if (
      (function(e) {
        return 'RAW' === e.type;
      })(e)
    ) {
      for (const t of e.wrappedChildren || []) {
        if (!s.has(t.wrappedValue.type)) throw Error(`Unknown value type "${e.type}" at ${t.path.join('.')}`);
        const n = s.get(t.wrappedValue.type).deserialize(t.wrappedValue.value);
        u(e.value, t.path, n);
      }
      return e.value;
    }
    throw Error(`Unknown value type "${e.type}"`);
  }
  function u(e, t, n) {
    const r = t.slice(-1)[0];
    t.slice(0, -1).reduce((e, t) => e[t], e)[r] = n;
  }
  function l(e) {
    if ('Window' !== self.constructor.name) throw Error('self is not a window');
    return {
      addEventListener: self.addEventListener.bind(self),
      removeEventListener: self.removeEventListener.bind(self),
      postMessage: (t, n) => e.postMessage(t, '*', n)
    };
  }
  function c(e) {
    return 'addEventListener' in e && 'removeEventListener' in e && 'postMessage' in e;
  }
  function d(e) {
    (function(e) {
      return 'MessagePort' === e.constructor.name;
    })(e) && e.start();
  }
  function v(e, t) {
    e.addEventListener('message', t);
  }
  function g(e) {
    return ['window', 'length', 'location', 'parent', 'opener'].every((t) => t in e);
  }
  function m(e) {
    return n.some((t) => e instanceof t);
  }
  function* y(e, t = [], n = null) {
    if (!e) return;
    if ((n || (n = new WeakSet()), n.has(e))) return;
    if ('string' == typeof e) return;
    if (('object' == typeof e && n.add(e), ArrayBuffer.isView(e))) return;
    yield { value: e, path: t };
    const r = Object.keys(e);
    for (const i of r) yield* y(e[i], [...t, i], n);
  }
  function p(e) {
    const t = [];
    for (const n of y(e)) m(n.value) && t.push(n.value);
    return t;
  }
  function b(e) {
    (this.expTable = new Array(256)), (this.logTable = new Array(256));
    for (var t = 1, n = 0; n < 256; n++) (this.expTable[n] = t), (t <<= 1) >= 256 && (t ^= e);
    for (n = 0; n < 255; n++) this.logTable[this.expTable[n]] = n;
    var r = new Array(1);
    (r[0] = 0), (this.zero = new $(this, new Array(r)));
    var i = new Array(1);
    (i[0] = 1),
      (this.one = new $(this, new Array(i))),
      this.__defineGetter__('Zero', function() {
        return this.zero;
      }),
      this.__defineGetter__('One', function() {
        return this.one;
      }),
      (this.buildMonomial = function(e, t) {
        if (e < 0) throw new Error('System.ArgumentException');
        if (0 == t) return zero;
        for (var n = new Array(e + 1), r = 0; r < n.length; r++) n[r] = 0;
        return (n[0] = t), new $(this, n);
      }),
      (this.exp = function(e) {
        return this.expTable[e];
      }),
      (this.log = function(e) {
        if (0 == e) throw new Error('System.ArgumentException');
        return this.logTable[e];
      }),
      (this.inverse = function(e) {
        if (0 == e) throw new Error('System.ArithmeticException');
        return this.expTable[255 - this.logTable[e]];
      }),
      (this.multiply = function(e, t) {
        return 0 == e || 0 == t
          ? 0
          : 1 == e
          ? t
          : 1 == t
          ? e
          : this.expTable[(this.logTable[e] + this.logTable[t]) % 255];
      });
  }
  (b.QR_CODE_FIELD = new b(285)), (b.DATA_MATRIX_FIELD = new b(301));
  let C = new b(285);
  new b(301);
  b.addOrSubtract = function(e, t) {
    return e ^ t;
  };
  let A = {};
  function M(e, t) {
    return e >= 0 ? e >> t : (e >> t) + (2 << ~t);
  }
  function _(e, t, n) {
    (this.x = e),
      (this.y = t),
      (this.count = 1),
      (this.estimatedModuleSize = n),
      this.__defineGetter__('EstimatedModuleSize', function() {
        return this.estimatedModuleSize;
      }),
      this.__defineGetter__('Count', function() {
        return this.count;
      }),
      this.__defineGetter__('X', function() {
        return Math.floor(this.x);
      }),
      this.__defineGetter__('Y', function() {
        return Math.floor(this.y);
      }),
      (this.incrementCount = function() {
        this.count++;
      }),
      (this.aboutEquals = function(e, t, n) {
        if (Math.abs(t - this.y) <= e && Math.abs(n - this.x) <= e) {
          var r = Math.abs(e - this.estimatedModuleSize);
          return r <= 1 || r / this.estimatedModuleSize <= 1;
        }
        return !1;
      });
  }
  function E(e, t, n, r, i, o, s) {
    (this.image = e),
      (this.possibleCenters = new Array()),
      (this.startX = t),
      (this.startY = n),
      (this.width = r),
      (this.height = i),
      (this.moduleSize = o),
      (this.crossCheckStateCount = new Array(0, 0, 0)),
      (this.resultPointCallback = s),
      (this.centerFromEnd = function(e, t) {
        return t - e[2] - e[1] / 2;
      }),
      (this.foundPatternCross = function(e) {
        for (var t = this.moduleSize, n = t / 2, r = 0; r < 3; r++) if (Math.abs(t - e[r]) >= n) return !1;
        return !0;
      }),
      (this.crossCheckVertical = function(e, t, n, r) {
        var i = this.image,
          o = A.height,
          s = this.crossCheckStateCount;
        (s[0] = 0), (s[1] = 0), (s[2] = 0);
        for (var a = e; a >= 0 && i[t + a * A.width] && s[1] <= n; ) s[1]++, a--;
        if (a < 0 || s[1] > n) return NaN;
        for (; a >= 0 && !i[t + a * A.width] && s[0] <= n; ) s[0]++, a--;
        if (s[0] > n) return NaN;
        for (a = e + 1; a < o && i[t + a * A.width] && s[1] <= n; ) s[1]++, a++;
        if (a == o || s[1] > n) return NaN;
        for (; a < o && !i[t + a * A.width] && s[2] <= n; ) s[2]++, a++;
        if (s[2] > n) return NaN;
        var h = s[0] + s[1] + s[2];
        return 5 * Math.abs(h - r) >= 2 * r ? NaN : this.foundPatternCross(s) ? this.centerFromEnd(s, a) : NaN;
      }),
      (this.handlePossibleCenter = function(e, t, n) {
        var r = e[0] + e[1] + e[2],
          i = this.centerFromEnd(e, n),
          o = this.crossCheckVertical(t, Math.floor(i), 2 * e[1], r);
        if (!isNaN(o)) {
          for (var s = (e[0] + e[1] + e[2]) / 3, a = this.possibleCenters.length, h = 0; h < a; h++) {
            if (this.possibleCenters[h].aboutEquals(s, o, i)) return new _(i, o, s);
          }
          var w = new _(i, o, s);
          this.possibleCenters.push(w),
            null != this.resultPointCallback && this.resultPointCallback.foundPossibleResultPoint(w);
        }
        return null;
      }),
      (this.find = function() {
        for (
          var t = this.startX, i = this.height, o = t + r, s = n + (i >> 1), a = new Array(0, 0, 0), h = 0;
          h < i;
          h++
        ) {
          var w = s + (0 == (1 & h) ? (h + 1) >> 1 : -((h + 1) >> 1));
          (a[0] = 0), (a[1] = 0), (a[2] = 0);
          for (var f = t; f < o && !e[f + A.width * w]; ) f++;
          for (var u = 0; f < o; ) {
            if (e[f + w * A.width])
              if (1 == u) a[u]++;
              else if (2 == u) {
                var l;
                if (this.foundPatternCross(a)) if (null != (l = this.handlePossibleCenter(a, w, f))) return l;
                (a[0] = a[2]), (a[1] = 1), (a[2] = 0), (u = 1);
              } else a[++u]++;
            else 1 == u && u++, a[u]++;
            f++;
          }
          if (this.foundPatternCross(a)) if (null != (l = this.handlePossibleCenter(a, w, o))) return l;
        }
        if (0 != this.possibleCenters.length) return this.possibleCenters[0];
        throw new Error("Couldn't find enough alignment patterns");
      });
  }
  function k(e, t) {
    if ((t || (t = e), e < 1 || t < 1)) throw new Error('Both dimensions must be greater than 0');
    (this.width = e), (this.height = t);
    var n = e >> 5;
    0 != (31 & e) && n++, (this.rowSize = n), (this.bits = new Array(n * t));
    for (var r = 0; r < this.bits.length; r++) this.bits[r] = 0;
    this.__defineGetter__('Width', function() {
      return this.width;
    }),
      this.__defineGetter__('Height', function() {
        return this.height;
      }),
      this.__defineGetter__('Dimension', function() {
        if (this.width != this.height) throw new Error("Can't call getDimension() on a non-square matrix");
        return this.width;
      }),
      (this.get_Renamed = function(e, t) {
        var n = t * this.rowSize + (e >> 5);
        return 0 != (1 & M(this.bits[n], 31 & e));
      }),
      (this.set_Renamed = function(e, t) {
        var n = t * this.rowSize + (e >> 5);
        this.bits[n] |= 1 << (31 & e);
      }),
      (this.flip = function(e, t) {
        var n = t * this.rowSize + (e >> 5);
        this.bits[n] ^= 1 << (31 & e);
      }),
      (this.clear = function() {
        for (var e = this.bits.length, t = 0; t < e; t++) this.bits[t] = 0;
      }),
      (this.setRegion = function(e, t, n, r) {
        if (t < 0 || e < 0) throw new Error('Left and top must be nonnegative');
        if (r < 1 || n < 1) throw new Error('Height and width must be at least 1');
        var i = e + n,
          o = t + r;
        if (o > this.height || i > this.width) throw new Error('The region must fit inside the matrix');
        for (var s = t; s < o; s++)
          for (var a = s * this.rowSize, h = e; h < i; h++) this.bits[a + (h >> 5)] |= 1 << (31 & h);
      });
  }
  function P(e) {
    var t = e.Dimension;
    if (t < 21 || 1 != (3 & t)) throw new Error('Error BitMatrixParser');
    (this.bitMatrix = e),
      (this.parsedVersion = null),
      (this.parsedFormatInfo = null),
      (this.copyBit = function(e, t, n) {
        return this.bitMatrix.get_Renamed(e, t) ? (n << 1) | 1 : n << 1;
      }),
      (this.readFormatInformation = function() {
        if (null != this.parsedFormatInfo) return this.parsedFormatInfo;
        for (var e = 0, t = 0; t < 6; t++) e = this.copyBit(t, 8, e);
        (e = this.copyBit(7, 8, e)), (e = this.copyBit(8, 8, e)), (e = this.copyBit(8, 7, e));
        for (var n = 5; n >= 0; n--) e = this.copyBit(8, n, e);
        if (((this.parsedFormatInfo = Q.decodeFormatInformation(e)), null != this.parsedFormatInfo))
          return this.parsedFormatInfo;
        var r = this.bitMatrix.Dimension;
        e = 0;
        var i = r - 8;
        for (t = r - 1; t >= i; t--) e = this.copyBit(t, 8, e);
        for (n = r - 7; n < r; n++) e = this.copyBit(8, n, e);
        if (((this.parsedFormatInfo = Q.decodeFormatInformation(e)), null != this.parsedFormatInfo))
          return this.parsedFormatInfo;
        throw new Error('Error readFormatInformation');
      }),
      (this.readVersion = function() {
        if (null != this.parsedVersion) return this.parsedVersion;
        var e = this.bitMatrix.Dimension,
          t = (e - 17) >> 2;
        if (t <= 6) return te.getVersionForNumber(t);
        for (var n = 0, r = e - 11, i = 5; i >= 0; i--) for (var o = e - 9; o >= r; o--) n = this.copyBit(o, i, n);
        if (
          ((this.parsedVersion = te.decodeVersionInformation(n)),
          null != this.parsedVersion && this.parsedVersion.DimensionForVersion == e)
        )
          return this.parsedVersion;
        n = 0;
        for (o = 5; o >= 0; o--) for (i = e - 9; i >= r; i--) n = this.copyBit(o, i, n);
        if (
          ((this.parsedVersion = te.decodeVersionInformation(n)),
          null != this.parsedVersion && this.parsedVersion.DimensionForVersion == e)
        )
          return this.parsedVersion;
        throw new Error('Error readVersion');
      }),
      (this.readCodewords = function() {
        var e = this.readFormatInformation(),
          t = this.readVersion(),
          n = B.forReference(e.DataMask),
          r = this.bitMatrix.Dimension;
        n.unmaskBitMatrix(this.bitMatrix, r);
        for (
          var i = t.buildFunctionPattern(), o = !0, s = new Array(t.TotalCodewords), a = 0, h = 0, w = 0, f = r - 1;
          f > 0;
          f -= 2
        ) {
          6 == f && f--;
          for (var u = 0; u < r; u++)
            for (var l = o ? r - 1 - u : u, c = 0; c < 2; c++)
              i.get_Renamed(f - c, l) ||
                (w++,
                (h <<= 1),
                this.bitMatrix.get_Renamed(f - c, l) && (h |= 1),
                8 == w && ((s[a++] = h), (w = 0), (h = 0)));
          o ^= !0;
        }
        if (a != t.TotalCodewords) throw new Error('Error readCodewords');
        return s;
      });
  }
  function S(e, t) {
    (this.numDataCodewords = e),
      (this.codewords = t),
      this.__defineGetter__('NumDataCodewords', function() {
        return this.numDataCodewords;
      }),
      this.__defineGetter__('Codewords', function() {
        return this.codewords;
      });
  }
  function N(e, t, n) {
    (this.blockPointer = 0),
      (this.bitPointer = 7),
      (this.dataLength = 0),
      (this.blocks = e),
      (this.numErrorCorrectionCode = n),
      t <= 9
        ? (this.dataLengthMode = 0)
        : t >= 10 && t <= 26
        ? (this.dataLengthMode = 1)
        : t >= 27 && t <= 40 && (this.dataLengthMode = 2),
      (this.getNextBits = function(e) {
        var t = 0;
        if (e < this.bitPointer + 1) {
          for (var n = 0, r = 0; r < e; r++) n += 1 << r;
          return (
            (n <<= this.bitPointer - e + 1),
            (t = (this.blocks[this.blockPointer] & n) >> (this.bitPointer - e + 1)),
            (this.bitPointer -= e),
            t
          );
        }
        if (e < this.bitPointer + 1 + 8) {
          var i = 0;
          for (r = 0; r < this.bitPointer + 1; r++) i += 1 << r;
          return (
            (t = (this.blocks[this.blockPointer] & i) << (e - (this.bitPointer + 1))),
            this.blockPointer++,
            (t += this.blocks[this.blockPointer] >> (8 - (e - (this.bitPointer + 1)))),
            (this.bitPointer = this.bitPointer - (e % 8)),
            this.bitPointer < 0 && (this.bitPointer = 8 + this.bitPointer),
            t
          );
        }
        if (e < this.bitPointer + 1 + 16) {
          i = 0;
          var o = 0;
          for (r = 0; r < this.bitPointer + 1; r++) i += 1 << r;
          var s = (this.blocks[this.blockPointer] & i) << (e - (this.bitPointer + 1));
          this.blockPointer++;
          var a = this.blocks[this.blockPointer] << (e - (this.bitPointer + 1 + 8));
          this.blockPointer++;
          for (r = 0; r < e - (this.bitPointer + 1 + 8); r++) o += 1 << r;
          return (
            (o <<= 8 - (e - (this.bitPointer + 1 + 8))),
            (t = s + a + ((this.blocks[this.blockPointer] & o) >> (8 - (e - (this.bitPointer + 1 + 8))))),
            (this.bitPointer = this.bitPointer - ((e - 8) % 8)),
            this.bitPointer < 0 && (this.bitPointer = 8 + this.bitPointer),
            t
          );
        }
        return 0;
      }),
      (this.NextMode = function() {
        return this.blockPointer > this.blocks.length - this.numErrorCorrectionCode - 2 ? 0 : this.getNextBits(4);
      }),
      (this.getDataLength = function(e) {
        for (var t = 0; e >> t != 1; ) t++;
        return this.getNextBits(A.sizeOfDataLengthInfo[this.dataLengthMode][t]);
      }),
      (this.getRomanAndFigureString = function(e) {
        var t = e,
          n = 0,
          r = '',
          i = new Array(
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'I',
            'J',
            'K',
            'L',
            'M',
            'N',
            'O',
            'P',
            'Q',
            'R',
            'S',
            'T',
            'U',
            'V',
            'W',
            'X',
            'Y',
            'Z',
            ' ',
            '$',
            '%',
            '*',
            '+',
            '-',
            '.',
            '/',
            ':'
          );
        do {
          if (t > 1) {
            var o = (n = this.getNextBits(11)) % 45;
            (r += i[Math.floor(n / 45)]), (r += i[o]), (t -= 2);
          } else 1 == t && ((r += i[(n = this.getNextBits(6))]), (t -= 1));
        } while (t > 0);
        return r;
      }),
      (this.getFigureString = function(e) {
        var t = e,
          n = 0,
          r = '';
        do {
          t >= 3
            ? ((n = this.getNextBits(10)) < 100 && (r += '0'), n < 10 && (r += '0'), (t -= 3))
            : 2 == t
            ? ((n = this.getNextBits(7)) < 10 && (r += '0'), (t -= 2))
            : 1 == t && ((n = this.getNextBits(4)), (t -= 1)),
            (r += n);
        } while (t > 0);
        return r;
      }),
      (this.get8bitByteArray = function(e) {
        var t = e,
          n = 0,
          r = new Array();
        do {
          (n = this.getNextBits(8)), r.push(n), t--;
        } while (t > 0);
        return r;
      }),
      (this.getKanjiString = function(e) {
        var t = e,
          n = 0,
          r = '';
        do {
          var i = (((n = getNextBits(13)) / 192) << 8) + (n % 192),
            o = 0;
          (o = i + 33088 <= 40956 ? i + 33088 : i + 49472), (r += String.fromCharCode(o)), t--;
        } while (t > 0);
        return r;
      }),
      this.__defineGetter__('DataByte', function() {
        for (var e = new Array(); ; ) {
          var t = this.NextMode();
          if (0 == t) {
            if (e.length > 0) break;
            throw new Error('Empty data block');
          }
          if (1 != t && 2 != t && 4 != t && 8 != t) throw new Error($1);
          let s = this.getDataLength(t);
          if (s < 1) throw new Error('Invalid data length: ' + s);
          switch (t) {
            case 1:
              for (var n = this.getFigureString(s), r = new Array(n.length), i = 0; i < n.length; i++)
                r[i] = n.charCodeAt(i);
              e.push(r);
              break;
            case 2:
              for (n = this.getRomanAndFigureString(s), r = new Array(n.length), i = 0; i < n.length; i++)
                r[i] = n.charCodeAt(i);
              e.push(r);
              break;
            case 4:
              var o = this.get8bitByteArray(s);
              e.push(o);
              break;
            case 8:
              n = this.getKanjiString(s);
              e.push(n);
          }
        }
        return e;
      });
  }
  (A.imagedata = null),
    (A.width = 0),
    (A.height = 0),
    (A.qrCodeSymbol = null),
    (A.debug = !1),
    (A.maxImgSize = 1048576),
    (A.sizeOfDataLengthInfo = [[10, 9, 8, 8], [12, 11, 16, 10], [14, 13, 16, 12]]),
    (A.callback = null),
    (A.decode = function(e, t, n) {
      return (A.width = e), (A.height = t), (A.imagedata = n), A.process();
    }),
    (A.isUrl = function(e) {
      return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(e);
    }),
    (A.decode_url = function(e) {
      var t = '';
      try {
        t = escape(e);
      } catch (n) {
        console.log(n), (t = e);
      }
      var n = '';
      try {
        n = decodeURIComponent(t);
      } catch (e) {
        console.log(e), (n = t);
      }
      return n;
    }),
    (A.decode_utf8 = function(e) {
      return A.isUrl(e) ? A.decode_url(e) : e;
    }),
    (A.process = function() {
      for (
        var e = new R(A.grayScaleToBitmap(A.grayscale())).detect(), t = D.decode(e.bits).DataByte, n = '', r = 0;
        r < t.length;
        r++
      )
        for (var i = 0; i < t[r].length; i++) n += String.fromCharCode(t[r][i]);
      return A.decode_utf8(n);
    }),
    (A.getPixel = function(e, t) {
      if (A.width < e) throw new Error('point error');
      if (A.height < t) throw new Error('point error');
      let n = 4 * e + t * A.width * 4;
      return (33 * A.imagedata.data[n] + 34 * A.imagedata.data[n + 1] + 33 * A.imagedata.data[n + 2]) / 100;
    }),
    (A.binarize = function(e) {
      for (var t = new Array(A.width * A.height), n = 0; n < A.height; n++)
        for (var r = 0; r < A.width; r++) {
          var i = A.getPixel(r, n);
          t[r + n * A.width] = i <= e;
        }
      return t;
    }),
    (A.getMiddleBrightnessPerArea = function(e) {
      for (var t = Math.floor(A.width / 4), n = Math.floor(A.height / 4), r = new Array(4), i = 0; i < 4; i++) {
        r[i] = new Array(4);
        for (var o = 0; o < 4; o++) r[i][o] = new Array(0, 0);
      }
      for (var s = 0; s < 4; s++)
        for (var a = 0; a < 4; a++) {
          r[a][s][0] = 255;
          for (var h = 0; h < n; h++)
            for (var w = 0; w < t; w++) {
              var f = e[t * a + w + (n * s + h) * A.width];
              f < r[a][s][0] && (r[a][s][0] = f), f > r[a][s][1] && (r[a][s][1] = f);
            }
        }
      for (var u = new Array(4), l = 0; l < 4; l++) u[l] = new Array(4);
      for (s = 0; s < 4; s++) for (a = 0; a < 4; a++) u[a][s] = Math.floor((r[a][s][0] + r[a][s][1]) / 2);
      return u;
    }),
    (A.grayScaleToBitmap = function(e) {
      for (
        var t = A.getMiddleBrightnessPerArea(e),
          n = t.length,
          r = Math.floor(A.width / n),
          i = Math.floor(A.height / n),
          o = new Array(A.height * A.width),
          s = 0;
        s < n;
        s++
      )
        for (var a = 0; a < n; a++)
          for (var h = 0; h < i; h++)
            for (var w = 0; w < r; w++)
              o[r * a + w + (i * s + h) * A.width] = e[r * a + w + (i * s + h) * A.width] < t[a][s];
      return o;
    }),
    (A.grayscale = function() {
      for (var e = new Array(A.width * A.height), t = 0; t < A.height; t++)
        for (var n = 0; n < A.width; n++) {
          var r = A.getPixel(n, t);
          e[n + t * A.width] = r;
        }
      return e;
    }),
    (Array.prototype.remove = function(e, t) {
      var n = this.slice((t || e) + 1 || this.length);
      return (this.length = e < 0 ? this.length + e : e), this.push.apply(this, n);
    }),
    (S.getDataBlocks = function(e, t, n) {
      if (e.length != t.TotalCodewords) throw new Error('ArgumentException');
      for (var r = t.getECBlocksForLevel(n), i = 0, o = r.getECBlocks(), s = 0; s < o.length; s++) i += o[s].Count;
      for (var a = new Array(i), h = 0, w = 0; w < o.length; w++) {
        var f = o[w];
        for (s = 0; s < f.Count; s++) {
          var u = f.DataCodewords,
            l = r.ECCodewordsPerBlock + u;
          a[h++] = new S(u, new Array(l));
        }
      }
      for (var c = a[0].codewords.length, d = a.length - 1; d >= 0; ) {
        if (a[d].codewords.length == c) break;
        d--;
      }
      d++;
      var v = c - r.ECCodewordsPerBlock,
        g = 0;
      for (s = 0; s < v; s++) for (w = 0; w < h; w++) a[w].codewords[s] = e[g++];
      for (w = d; w < h; w++) a[w].codewords[v] = e[g++];
      var m = a[0].codewords.length;
      for (s = v; s < m; s++)
        for (w = 0; w < h; w++) {
          var y = w < d ? s : s + 1;
          a[w].codewords[y] = e[g++];
        }
      return a;
    });
  let B = {};
  (B.forReference = function(e) {
    if (e < 0 || e > 7) throw new Error('System.ArgumentException');
    return B.DATA_MASKS[e];
  }),
    (B.DATA_MASKS = new Array(
      new function() {
        (this.unmaskBitMatrix = function(e, t) {
          for (var n = 0; n < t; n++) for (var r = 0; r < t; r++) this.isMasked(n, r) && e.flip(r, n);
        }),
          (this.isMasked = function(e, t) {
            return 0 == ((e + t) & 1);
          });
      }(),
      new function() {
        (this.unmaskBitMatrix = function(e, t) {
          for (var n = 0; n < t; n++) for (var r = 0; r < t; r++) this.isMasked(n, r) && e.flip(r, n);
        }),
          (this.isMasked = function(e, t) {
            return 0 == (1 & e);
          });
      }(),
      new function() {
        (this.unmaskBitMatrix = function(e, t) {
          for (var n = 0; n < t; n++) for (var r = 0; r < t; r++) this.isMasked(n, r) && e.flip(r, n);
        }),
          (this.isMasked = function(e, t) {
            return t % 3 == 0;
          });
      }(),
      new function() {
        (this.unmaskBitMatrix = function(e, t) {
          for (var n = 0; n < t; n++) for (var r = 0; r < t; r++) this.isMasked(n, r) && e.flip(r, n);
        }),
          (this.isMasked = function(e, t) {
            return (e + t) % 3 == 0;
          });
      }(),
      new function() {
        (this.unmaskBitMatrix = function(e, t) {
          for (var n = 0; n < t; n++) for (var r = 0; r < t; r++) this.isMasked(n, r) && e.flip(r, n);
        }),
          (this.isMasked = function(e, t) {
            return 0 == ((M(e, 1) + t / 3) & 1);
          });
      }(),
      new function() {
        (this.unmaskBitMatrix = function(e, t) {
          for (var n = 0; n < t; n++) for (var r = 0; r < t; r++) this.isMasked(n, r) && e.flip(r, n);
        }),
          (this.isMasked = function(e, t) {
            var n = e * t;
            return (1 & n) + (n % 3) == 0;
          });
      }(),
      new function() {
        (this.unmaskBitMatrix = function(e, t) {
          for (var n = 0; n < t; n++) for (var r = 0; r < t; r++) this.isMasked(n, r) && e.flip(r, n);
        }),
          (this.isMasked = function(e, t) {
            var n = e * t;
            return 0 == (((1 & n) + (n % 3)) & 1);
          });
      }(),
      new function() {
        (this.unmaskBitMatrix = function(e, t) {
          for (var n = 0; n < t; n++) for (var r = 0; r < t; r++) this.isMasked(n, r) && e.flip(r, n);
        }),
          (this.isMasked = function(e, t) {
            return 0 == ((((e + t) & 1) + ((e * t) % 3)) & 1);
          });
      }()
    ));
  let D = {};
  function x(e, t, n, r, i, o, s, a, h) {
    (this.a11 = e),
      (this.a12 = r),
      (this.a13 = s),
      (this.a21 = t),
      (this.a22 = i),
      (this.a23 = a),
      (this.a31 = n),
      (this.a32 = o),
      (this.a33 = h),
      (this.transformPoints1 = function(e) {
        for (
          var t = e.length,
            n = this.a11,
            r = this.a12,
            i = this.a13,
            o = this.a21,
            s = this.a22,
            a = this.a23,
            h = this.a31,
            w = this.a32,
            f = this.a33,
            u = 0;
          u < t;
          u += 2
        ) {
          var l = e[u],
            c = e[u + 1],
            d = i * l + a * c + f;
          (e[u] = (n * l + o * c + h) / d), (e[u + 1] = (r * l + s * c + w) / d);
        }
      }),
      (this.transformPoints2 = function(e, t) {
        for (var n = e.length, r = 0; r < n; r++) {
          var i = e[r],
            o = t[r],
            s = this.a13 * i + this.a23 * o + this.a33;
          (e[r] = (this.a11 * i + this.a21 * o + this.a31) / s), (t[r] = (this.a12 * i + this.a22 * o + this.a32) / s);
        }
      }),
      (this.buildAdjoint = function() {
        return new x(
          this.a22 * this.a33 - this.a23 * this.a32,
          this.a23 * this.a31 - this.a21 * this.a33,
          this.a21 * this.a32 - this.a22 * this.a31,
          this.a13 * this.a32 - this.a12 * this.a33,
          this.a11 * this.a33 - this.a13 * this.a31,
          this.a12 * this.a31 - this.a11 * this.a32,
          this.a12 * this.a23 - this.a13 * this.a22,
          this.a13 * this.a21 - this.a11 * this.a23,
          this.a11 * this.a22 - this.a12 * this.a21
        );
      }),
      (this.times = function(e) {
        return new x(
          this.a11 * e.a11 + this.a21 * e.a12 + this.a31 * e.a13,
          this.a11 * e.a21 + this.a21 * e.a22 + this.a31 * e.a23,
          this.a11 * e.a31 + this.a21 * e.a32 + this.a31 * e.a33,
          this.a12 * e.a11 + this.a22 * e.a12 + this.a32 * e.a13,
          this.a12 * e.a21 + this.a22 * e.a22 + this.a32 * e.a23,
          this.a12 * e.a31 + this.a22 * e.a32 + this.a32 * e.a33,
          this.a13 * e.a11 + this.a23 * e.a12 + this.a33 * e.a13,
          this.a13 * e.a21 + this.a23 * e.a22 + this.a33 * e.a23,
          this.a13 * e.a31 + this.a23 * e.a32 + this.a33 * e.a33
        );
      });
  }
  function F(e, t) {
    (this.bits = e), (this.points = t);
  }
  function R(e) {
    (this.image = e),
      (this.resultPointCallback = null),
      (this.sizeOfBlackWhiteBlackRun = function(e, t, n, r) {
        var i = Math.abs(r - t) > Math.abs(n - e);
        if (i) {
          var o = e;
          (e = t), (t = o), (o = n), (n = r), (r = o);
        }
        for (
          var s = Math.abs(n - e),
            a = Math.abs(r - t),
            h = -s >> 1,
            w = t < r ? 1 : -1,
            f = e < n ? 1 : -1,
            u = 0,
            l = e,
            c = t;
          l != n;
          l += f
        ) {
          var d = i ? c : l,
            v = i ? l : c;
          if ((1 == u ? this.image[d + v * A.width] && u++ : this.image[d + v * A.width] || u++, 3 == u)) {
            var g = l - e,
              m = c - t;
            return Math.sqrt(g * g + m * m);
          }
          if ((h += a) > 0) {
            if (c == r) break;
            (c += w), (h -= s);
          }
        }
        var y = n - e,
          p = r - t;
        return Math.sqrt(y * y + p * p);
      }),
      (this.sizeOfBlackWhiteBlackRunBothWays = function(e, t, n, r) {
        var i = this.sizeOfBlackWhiteBlackRun(e, t, n, r),
          o = 1,
          s = e - (n - e);
        s < 0 ? ((o = e / (e - s)), (s = 0)) : s >= A.width && ((o = (A.width - 1 - e) / (s - e)), (s = A.width - 1));
        var a = Math.floor(t - (r - t) * o);
        return (
          (o = 1),
          a < 0
            ? ((o = t / (t - a)), (a = 0))
            : a >= A.height && ((o = (A.height - 1 - t) / (a - t)), (a = A.height - 1)),
          (s = Math.floor(e + (s - e) * o)),
          (i += this.sizeOfBlackWhiteBlackRun(e, t, s, a)) - 1
        );
      }),
      (this.calculateModuleSizeOneWay = function(e, t) {
        var n = this.sizeOfBlackWhiteBlackRunBothWays(
            Math.floor(e.X),
            Math.floor(e.Y),
            Math.floor(t.X),
            Math.floor(t.Y)
          ),
          r = this.sizeOfBlackWhiteBlackRunBothWays(Math.floor(t.X), Math.floor(t.Y), Math.floor(e.X), Math.floor(e.Y));
        return isNaN(n) ? r / 7 : isNaN(r) ? n / 7 : (n + r) / 14;
      }),
      (this.calculateModuleSize = function(e, t, n) {
        return (this.calculateModuleSizeOneWay(e, t) + this.calculateModuleSizeOneWay(e, n)) / 2;
      }),
      (this.distance = function(e, t) {
        let n = e.X - t.X,
          r = e.Y - t.Y;
        return Math.sqrt(n * n + r * r);
      }),
      (this.computeDimension = function(e, t, n, r) {
        var i = 7 + ((Math.round(this.distance(e, t) / r) + Math.round(this.distance(e, n) / r)) >> 1);
        switch (3 & i) {
          case 0:
            i++;
            break;
          case 2:
            i--;
            break;
          case 3:
            throw new Error('Error');
        }
        return i;
      }),
      (this.findAlignmentInRegion = function(e, t, n, r) {
        var i = Math.floor(r * e),
          o = Math.max(0, t - i),
          s = Math.min(A.width - 1, t + i);
        if (s - o < 3 * e) throw new Error('Error');
        var a = Math.max(0, n - i),
          h = Math.min(A.height - 1, n + i);
        return new E(this.image, o, a, s - o, h - a, e, this.resultPointCallback).find();
      }),
      (this.createTransform = function(e, t, n, r, i) {
        var o,
          s,
          a,
          h,
          w = i - 3.5;
        return (
          null != r
            ? ((o = r.X), (s = r.Y), (a = h = w - 3))
            : ((o = t.X - e.X + n.X), (s = t.Y - e.Y + n.Y), (a = h = w)),
          x.quadrilateralToQuadrilateral(3.5, 3.5, w, 3.5, a, h, 3.5, w, e.X, e.Y, t.X, t.Y, o, s, n.X, n.Y)
        );
      }),
      (this.sampleGrid = function(e, t, n) {
        return K.sampleGrid3(e, n, t);
      }),
      (this.processFinderPatternInfo = function(e) {
        var t = e.TopLeft,
          n = e.TopRight,
          r = e.BottomLeft,
          i = this.calculateModuleSize(t, n, r);
        if (i < 1) throw new Error('Error');
        var o = this.computeDimension(t, n, r, i),
          s = te.getProvisionalVersionForDimension(o),
          a = s.DimensionForVersion - 7,
          h = null;
        if (s.AlignmentPatternCenters.length > 0)
          for (
            var w = n.X - t.X + r.X,
              f = n.Y - t.Y + r.Y,
              u = 1 - 3 / a,
              l = Math.floor(t.X + u * (w - t.X)),
              c = Math.floor(t.Y + u * (f - t.Y)),
              d = 4;
            d <= 16;
            d <<= 1
          ) {
            h = this.findAlignmentInRegion(i, l, c, d);
            break;
          }
        var v = this.createTransform(t, n, r, h, o);
        return new F(this.sampleGrid(this.image, v, o), null == h ? new Array(r, t, n) : new Array(r, t, n, h));
      }),
      (this.detect = function() {
        var e = new H().findFinderPattern(this.image);
        return this.processFinderPatternInfo(e);
      });
  }
  function z(e, t, n) {
    (this.ordinal_Renamed_Field = e),
      (this.bits = t),
      (this.name = n),
      this.__defineGetter__('Bits', function() {
        return this.bits;
      }),
      this.__defineGetter__('Name', function() {
        return this.name;
      }),
      (this.ordinal = function() {
        return this.ordinal_Renamed_Field;
      });
  }
  (D.rsDecoder = new function(e) {
    (this.field = e),
      (this.decode = function(e, t) {
        for (var n = new $(this.field, e), r = new Array(t), i = 0; i < r.length; i++) r[i] = 0;
        for (var o = !0, i = 0; i < t; i++) {
          var s = n.evaluateAt(this.field.exp(i));
          (r[r.length - 1 - i] = s), 0 != s && (o = !1);
        }
        if (!o)
          for (
            var a = new $(this.field, r),
              h = this.runEuclideanAlgorithm(this.field.buildMonomial(t, 1), a, t),
              w = h[0],
              f = h[1],
              u = this.findErrorLocations(w),
              l = this.findErrorMagnitudes(f, u, !1),
              i = 0;
            i < u.length;
            i++
          ) {
            var c = e.length - 1 - this.field.log(u[i]);
            if (c < 0) throw new Error('ReedSolomonException Bad error location');
            e[c] = b.addOrSubtract(e[c], l[i]);
          }
      }),
      (this.runEuclideanAlgorithm = function(e, t, n) {
        if (e.Degree < t.Degree) {
          var r = e;
          (e = t), (t = r);
        }
        for (
          var i = e, o = t, s = this.field.One, a = this.field.Zero, h = this.field.Zero, w = this.field.One;
          o.Degree >= Math.floor(n / 2);

        ) {
          var f = i,
            u = s,
            l = h;
          if (((s = a), (h = w), (i = o).Zero)) throw new Error('r_{i-1} was zero');
          o = f;
          for (
            var c = this.field.Zero, d = i.getCoefficient(i.Degree), v = this.field.inverse(d);
            o.Degree >= i.Degree && !o.Zero;

          ) {
            var g = o.Degree - i.Degree,
              m = this.field.multiply(o.getCoefficient(o.Degree), v);
            (c = c.addOrSubtract(this.field.buildMonomial(g, m))), (o = o.addOrSubtract(i.multiplyByMonomial(g, m)));
          }
          (a = c.multiply1(s).addOrSubtract(u)), (w = c.multiply1(h).addOrSubtract(l));
        }
        var y = w.getCoefficient(0);
        if (0 == y) throw new Error('ReedSolomonException sigmaTilde(0) was zero');
        var p = this.field.inverse(y),
          b = w.multiply2(p),
          C = o.multiply2(p);
        return new Array(b, C);
      }),
      (this.findErrorLocations = function(e) {
        var t = e.Degree;
        if (1 == t) return new Array(e.getCoefficient(1));
        for (var n = new Array(t), r = 0, i = 1; i < 256 && r < t; i++)
          0 == e.evaluateAt(i) && ((n[r] = this.field.inverse(i)), r++);
        if (r != t) throw new Error('Error locator degree does not match number of roots');
        return n;
      }),
      (this.findErrorMagnitudes = function(e, t, n) {
        for (var r = t.length, i = new Array(r), o = 0; o < r; o++) {
          for (var s = this.field.inverse(t[o]), a = 1, h = 0; h < r; h++)
            o != h && (a = this.field.multiply(a, b.addOrSubtract(1, this.field.multiply(t[h], s))));
          (i[o] = this.field.multiply(e.evaluateAt(s), this.field.inverse(a))),
            n && (i[o] = this.field.multiply(i[o], s));
        }
        return i;
      });
  }(C)),
    (D.correctErrors = function(e, t) {
      for (var n = e.length, r = new Array(n), i = 0; i < n; i++) r[i] = 255 & e[i];
      var o = e.length - t;
      try {
        D.rsDecoder.decode(r, o);
      } catch (e) {
        throw e;
      }
      for (i = 0; i < t; i++) e[i] = r[i];
    }),
    (D.decode = function(e) {
      for (
        var t = new P(e),
          n = t.readVersion(),
          r = t.readFormatInformation().ErrorCorrectionLevel,
          i = t.readCodewords(),
          o = S.getDataBlocks(i, n, r),
          s = 0,
          a = 0;
        a < o.length;
        a++
      )
        s += o[a].NumDataCodewords;
      for (var h = new Array(s), w = 0, f = 0; f < o.length; f++) {
        var u = o[f],
          l = u.Codewords,
          c = u.NumDataCodewords;
        D.correctErrors(l, c);
        for (a = 0; a < c; a++) h[w++] = l[a];
      }
      return new N(h, n.VersionNumber, r.Bits);
    }),
    (x.quadrilateralToQuadrilateral = function(e, t, n, r, i, o, s, a, h, w, f, u, l, c, d, v) {
      var g = this.quadrilateralToSquare(e, t, n, r, i, o, s, a);
      return this.squareToQuadrilateral(h, w, f, u, l, c, d, v).times(g);
    }),
    (x.squareToQuadrilateral = function(e, t, n, r, i, o, s, a) {
      let h = a - o,
        w = t - r + o - a;
      if (0 == h && 0 == w) return new x(n - e, i - n, e, r - t, o - r, t, 0, 0, 1);
      {
        let f = n - i,
          u = s - i,
          l = e - n + i - s,
          c = r - o,
          d = f * h - u * c,
          v = (l * h - u * w) / d,
          g = (f * w - l * c) / d;
        return new x(n - e + v * n, s - e + g * s, e, r - t + v * r, a - t + g * a, t, v, g, 1);
      }
    }),
    (x.quadrilateralToSquare = function(e, t, n, r, i, o, s, a) {
      return this.squareToQuadrilateral(e, t, n, r, i, o, s, a).buildAdjoint();
    }),
    (z.forBits = function(e) {
      if (e < 0 || e >= O.length) throw new Error('ArgumentException');
      return O[e];
    });
  var L = new z(0, 1, 'L'),
    T = new z(1, 0, 'M'),
    G = new z(2, 3, 'Q'),
    V = new z(3, 2, 'H'),
    O = new Array(T, L, V, G),
    I = 3,
    Y = 57,
    X = 8,
    q = 2;
  function W(e, t, n) {
    (this.x = e),
      (this.y = t),
      (this.count = 1),
      (this.estimatedModuleSize = n),
      this.__defineGetter__('EstimatedModuleSize', function() {
        return this.estimatedModuleSize;
      }),
      this.__defineGetter__('Count', function() {
        return this.count;
      }),
      this.__defineGetter__('X', function() {
        return this.x;
      }),
      this.__defineGetter__('Y', function() {
        return this.y;
      }),
      (this.incrementCount = function() {
        this.count++;
      }),
      (this.aboutEquals = function(e, t, n) {
        if (Math.abs(t - this.y) <= e && Math.abs(n - this.x) <= e) {
          var r = Math.abs(e - this.estimatedModuleSize);
          return r <= 1 || r / this.estimatedModuleSize <= 1;
        }
        return !1;
      });
  }
  function Z(e) {
    (this.bottomLeft = e[0]),
      (this.topLeft = e[1]),
      (this.topRight = e[2]),
      this.__defineGetter__('BottomLeft', function() {
        return this.bottomLeft;
      }),
      this.__defineGetter__('TopLeft', function() {
        return this.topLeft;
      }),
      this.__defineGetter__('TopRight', function() {
        return this.topRight;
      });
  }
  function H() {
    (this.image = null),
      (this.possibleCenters = []),
      (this.hasSkipped = !1),
      (this.crossCheckStateCount = new Array(0, 0, 0, 0, 0)),
      (this.resultPointCallback = null),
      this.__defineGetter__('CrossCheckStateCount', function() {
        return (
          (this.crossCheckStateCount[0] = 0),
          (this.crossCheckStateCount[1] = 0),
          (this.crossCheckStateCount[2] = 0),
          (this.crossCheckStateCount[3] = 0),
          (this.crossCheckStateCount[4] = 0),
          this.crossCheckStateCount
        );
      }),
      (this.foundPatternCross = function(e) {
        for (var t = 0, n = 0; n < 5; n++) {
          var r = e[n];
          if (0 == r) return !1;
          t += r;
        }
        if (t < 7) return !1;
        var i = Math.floor((t << X) / 7),
          o = Math.floor(i / 2);
        return (
          Math.abs(i - (e[0] << X)) < o &&
          Math.abs(i - (e[1] << X)) < o &&
          Math.abs(3 * i - (e[2] << X)) < 3 * o &&
          Math.abs(i - (e[3] << X)) < o &&
          Math.abs(i - (e[4] << X)) < o
        );
      }),
      (this.centerFromEnd = function(e, t) {
        return t - e[4] - e[3] - e[2] / 2;
      }),
      (this.crossCheckVertical = function(e, t, n, r) {
        for (var i = this.image, o = A.height, s = this.CrossCheckStateCount, a = e; a >= 0 && i[t + a * A.width]; )
          s[2]++, a--;
        if (a < 0) return NaN;
        for (; a >= 0 && !i[t + a * A.width] && s[1] <= n; ) s[1]++, a--;
        if (a < 0 || s[1] > n) return NaN;
        for (; a >= 0 && i[t + a * A.width] && s[0] <= n; ) s[0]++, a--;
        if (s[0] > n) return NaN;
        for (a = e + 1; a < o && i[t + a * A.width]; ) s[2]++, a++;
        if (a == o) return NaN;
        for (; a < o && !i[t + a * A.width] && s[3] < n; ) s[3]++, a++;
        if (a == o || s[3] >= n) return NaN;
        for (; a < o && i[t + a * A.width] && s[4] < n; ) s[4]++, a++;
        if (s[4] >= n) return NaN;
        var h = s[0] + s[1] + s[2] + s[3] + s[4];
        return 5 * Math.abs(h - r) >= 2 * r ? NaN : this.foundPatternCross(s) ? this.centerFromEnd(s, a) : NaN;
      }),
      (this.crossCheckHorizontal = function(e, t, n, r) {
        for (var i = this.image, o = A.width, s = this.CrossCheckStateCount, a = e; a >= 0 && i[a + t * A.width]; )
          s[2]++, a--;
        if (a < 0) return NaN;
        for (; a >= 0 && !i[a + t * A.width] && s[1] <= n; ) s[1]++, a--;
        if (a < 0 || s[1] > n) return NaN;
        for (; a >= 0 && i[a + t * A.width] && s[0] <= n; ) s[0]++, a--;
        if (s[0] > n) return NaN;
        for (a = e + 1; a < o && i[a + t * A.width]; ) s[2]++, a++;
        if (a == o) return NaN;
        for (; a < o && !i[a + t * A.width] && s[3] < n; ) s[3]++, a++;
        if (a == o || s[3] >= n) return NaN;
        for (; a < o && i[a + t * A.width] && s[4] < n; ) s[4]++, a++;
        if (s[4] >= n) return NaN;
        var h = s[0] + s[1] + s[2] + s[3] + s[4];
        return 5 * Math.abs(h - r) >= r ? NaN : this.foundPatternCross(s) ? this.centerFromEnd(s, a) : NaN;
      }),
      (this.handlePossibleCenter = function(e, t, n) {
        var r = e[0] + e[1] + e[2] + e[3] + e[4],
          i = this.centerFromEnd(e, n),
          o = this.crossCheckVertical(t, Math.floor(i), e[2], r);
        if (!isNaN(o) && ((i = this.crossCheckHorizontal(Math.floor(i), Math.floor(o), e[2], r)), !isNaN(i))) {
          for (var s = r / 7, a = !1, h = this.possibleCenters.length, w = 0; w < h; w++) {
            var f = this.possibleCenters[w];
            if (f.aboutEquals(s, o, i)) {
              f.incrementCount(), (a = !0);
              break;
            }
          }
          if (!a) {
            var u = new W(i, o, s);
            this.possibleCenters.push(u),
              null != this.resultPointCallback && this.resultPointCallback.foundPossibleResultPoint(u);
          }
          return !0;
        }
        return !1;
      }),
      (this.selectBestPatterns = function() {
        var e = this.possibleCenters.length;
        if (e < 3) throw new Error("Couldn't find enough finder patterns");
        if (e > 3) {
          for (var t = 0, n = 0, r = 0; r < e; r++) {
            var i = this.possibleCenters[r].EstimatedModuleSize;
            (t += i), (n += i * i);
          }
          var o = t / e;
          this.possibleCenters.sort(function(e, t) {
            var n = Math.abs(t.EstimatedModuleSize - o),
              r = Math.abs(e.EstimatedModuleSize - o);
            return n < r ? -1 : n == r ? 0 : 1;
          });
          var s = Math.sqrt(n / e - o * o),
            a = Math.max(0.2 * o, s);
          for (r = 0; r < this.possibleCenters.length && this.possibleCenters.length > 3; r++) {
            var h = this.possibleCenters[r];
            Math.abs(h.EstimatedModuleSize - o) > a && (this.possibleCenters.remove(r), r--);
          }
        }
        return (
          this.possibleCenters.length > 3 &&
            this.possibleCenters.sort(function(e, t) {
              return e.count > t.count ? -1 : e.count < t.count ? 1 : 0;
            }),
          new Array(this.possibleCenters[0], this.possibleCenters[1], this.possibleCenters[2])
        );
      }),
      (this.findRowSkip = function() {
        var e = this.possibleCenters.length;
        if (e <= 1) return 0;
        for (var t = null, n = 0; n < e; n++) {
          var r = this.possibleCenters[n];
          if (r.Count >= q) {
            if (null != t) return (this.hasSkipped = !0), Math.floor((Math.abs(t.X - r.X) - Math.abs(t.Y - r.Y)) / 2);
            t = r;
          }
        }
        return 0;
      }),
      (this.haveMultiplyConfirmedCenters = function() {
        for (var e = 0, t = 0, n = this.possibleCenters.length, r = 0; r < n; r++) {
          var i = this.possibleCenters[r];
          i.Count >= q && (e++, (t += i.EstimatedModuleSize));
        }
        if (e < 3) return !1;
        var o = t / n,
          s = 0;
        for (r = 0; r < n; r++) (i = this.possibleCenters[r]), (s += Math.abs(i.EstimatedModuleSize - o));
        return s <= 0.05 * t;
      }),
      (this.findFinderPattern = function(e) {
        this.image = e;
        var t = A.height,
          n = A.width,
          r = Math.floor((3 * t) / (4 * Y));
        r < I && (r = I);
        for (var i = !1, o = new Array(5), s = r - 1; s < t && !i; s += r) {
          (o[0] = 0), (o[1] = 0), (o[2] = 0), (o[3] = 0), (o[4] = 0);
          for (var a = 0, h = 0; h < n; h++)
            if (e[h + s * A.width]) 1 == (1 & a) && a++, o[a]++;
            else if (0 == (1 & a))
              if (4 == a)
                if (this.foundPatternCross(o)) {
                  if (this.handlePossibleCenter(o, s, h))
                    if (((r = 2), this.hasSkipped)) i = this.haveMultiplyConfirmedCenters();
                    else {
                      var w = this.findRowSkip();
                      w > o[2] && ((s += w - o[2] - r), (h = n - 1));
                    }
                  else {
                    do {
                      h++;
                    } while (h < n && !e[h + s * A.width]);
                    h--;
                  }
                  (a = 0), (o[0] = 0), (o[1] = 0), (o[2] = 0), (o[3] = 0), (o[4] = 0);
                } else (o[0] = o[2]), (o[1] = o[3]), (o[2] = o[4]), (o[3] = 1), (o[4] = 0), (a = 3);
              else o[++a]++;
            else o[a]++;
          if (this.foundPatternCross(o))
            this.handlePossibleCenter(o, s, n) && ((r = o[0]), this.hasSkipped && (i = haveMultiplyConfirmedCenters()));
        }
        var f = this.selectBestPatterns();
        return A.orderBestPatterns(f), new Z(f);
      });
  }
  A.orderBestPatterns = function(e) {
    function t(e, t) {
      let n = e.X - t.X,
        r = e.Y - t.Y;
      return Math.sqrt(n * n + r * r);
    }
    var n,
      r,
      i,
      o = t(e[0], e[1]),
      s = t(e[1], e[2]),
      a = t(e[0], e[2]);
    if (
      (s >= o && s >= a
        ? ((r = e[0]), (n = e[1]), (i = e[2]))
        : a >= s && a >= o
        ? ((r = e[1]), (n = e[0]), (i = e[2]))
        : ((r = e[2]), (n = e[0]), (i = e[1])),
      (function(e, t, n) {
        var r = t.x,
          i = t.y;
        return (n.x - r) * (e.y - i) - (n.y - i) * (e.x - r);
      })(n, r, i) < 0)
    ) {
      var h = n;
      (n = i), (i = h);
    }
    (e[0] = n), (e[1] = r), (e[2] = i);
  };
  var U = new Array(
      new Array(21522, 0),
      new Array(20773, 1),
      new Array(24188, 2),
      new Array(23371, 3),
      new Array(17913, 4),
      new Array(16590, 5),
      new Array(20375, 6),
      new Array(19104, 7),
      new Array(30660, 8),
      new Array(29427, 9),
      new Array(32170, 10),
      new Array(30877, 11),
      new Array(26159, 12),
      new Array(25368, 13),
      new Array(27713, 14),
      new Array(26998, 15),
      new Array(5769, 16),
      new Array(5054, 17),
      new Array(7399, 18),
      new Array(6608, 19),
      new Array(1890, 20),
      new Array(597, 21),
      new Array(3340, 22),
      new Array(2107, 23),
      new Array(13663, 24),
      new Array(12392, 25),
      new Array(16177, 26),
      new Array(14854, 27),
      new Array(9396, 28),
      new Array(8579, 29),
      new Array(11994, 30),
      new Array(11245, 31)
    ),
    j = new Array(0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4);
  function Q(e) {
    (this.errorCorrectionLevel = z.forBits((e >> 3) & 3)),
      (this.dataMask = 7 & e),
      this.__defineGetter__('ErrorCorrectionLevel', function() {
        return this.errorCorrectionLevel;
      }),
      this.__defineGetter__('DataMask', function() {
        return this.dataMask;
      }),
      (this.GetHashCode = function() {
        return (this.errorCorrectionLevel.ordinal() << 3) | dataMask;
      }),
      (this.Equals = function(e) {
        var t = e;
        return this.errorCorrectionLevel == t.errorCorrectionLevel && this.dataMask == t.dataMask;
      });
  }
  function $(e, t) {
    if (null == t || 0 == t.length) throw new Error('System.ArgumentException');
    this.field = e;
    var n = t.length;
    if (n > 1 && 0 == t[0]) {
      for (var r = 1; r < n && 0 == t[r]; ) r++;
      if (r == n) this.coefficients = e.Zero.coefficients;
      else {
        this.coefficients = new Array(n - r);
        for (var i = 0; i < this.coefficients.length; i++) this.coefficients[i] = 0;
        for (var o = 0; o < this.coefficients.length; o++) this.coefficients[o] = t[r + o];
      }
    } else this.coefficients = t;
    this.__defineGetter__('Zero', function() {
      return 0 == this.coefficients[0];
    }),
      this.__defineGetter__('Degree', function() {
        return this.coefficients.length - 1;
      }),
      this.__defineGetter__('Coefficients', function() {
        return this.coefficients;
      }),
      (this.getCoefficient = function(e) {
        return this.coefficients[this.coefficients.length - 1 - e];
      }),
      (this.evaluateAt = function(e) {
        if (0 == e) return this.getCoefficient(0);
        var t = this.coefficients.length;
        if (1 == e) {
          for (var n = 0, r = 0; r < t; r++) n = b.addOrSubtract(n, this.coefficients[r]);
          return n;
        }
        var i = this.coefficients[0];
        for (r = 1; r < t; r++) i = b.addOrSubtract(this.field.multiply(e, i), this.coefficients[r]);
        return i;
      }),
      (this.addOrSubtract = function(t) {
        if (this.field != t.field) throw new Error('GF256Polys do not have same GF256 field');
        if (this.Zero) return t;
        if (t.Zero) return this;
        var n = this.coefficients,
          r = t.coefficients;
        if (n.length > r.length) {
          var i = n;
          (n = r), (r = i);
        }
        for (var o = new Array(r.length), s = r.length - n.length, a = 0; a < s; a++) o[a] = r[a];
        for (var h = s; h < r.length; h++) o[h] = b.addOrSubtract(n[h - s], r[h]);
        return new $(e, o);
      }),
      (this.multiply1 = function(e) {
        if (this.field != e.field) throw new Error('GF256Polys do not have same GF256 field');
        if (this.Zero || e.Zero) return this.field.Zero;
        for (
          var t = this.coefficients, n = t.length, r = e.coefficients, i = r.length, o = new Array(n + i - 1), s = 0;
          s < n;
          s++
        )
          for (var a = t[s], h = 0; h < i; h++) o[s + h] = b.addOrSubtract(o[s + h], this.field.multiply(a, r[h]));
        return new $(this.field, o);
      }),
      (this.multiply2 = function(e) {
        if (0 == e) return this.field.Zero;
        if (1 == e) return this;
        for (var t = this.coefficients.length, n = new Array(t), r = 0; r < t; r++)
          n[r] = this.field.multiply(this.coefficients[r], e);
        return new $(this.field, n);
      }),
      (this.multiplyByMonomial = function(e, t) {
        if (e < 0) throw new Error('System.ArgumentException');
        if (0 == t) return this.field.Zero;
        for (var n = this.coefficients.length, r = new Array(n + e), i = 0; i < r.length; i++) r[i] = 0;
        for (i = 0; i < n; i++) r[i] = this.field.multiply(this.coefficients[i], t);
        return new $(this.field, r);
      }),
      (this.divide = function(e) {
        if (this.field != e.field) throw new Error('GF256Polys do not have same GF256 field');
        if (e.Zero) throw new Error('Divide by 0');
        for (
          var t = this.field.Zero, n = this, r = e.getCoefficient(e.Degree), i = this.field.inverse(r);
          n.Degree >= e.Degree && !n.Zero;

        ) {
          var o = n.Degree - e.Degree,
            s = this.field.multiply(n.getCoefficient(n.Degree), i),
            a = e.multiplyByMonomial(o, s),
            h = this.field.buildMonomial(o, s);
          (t = t.addOrSubtract(h)), (n = n.addOrSubtract(a));
        }
        return new Array(t, n);
      });
  }
  (Q.numBitsDiffering = function(e, t) {
    return (
      j[15 & (e ^= t)] +
      j[15 & M(e, 4)] +
      j[15 & M(e, 8)] +
      j[15 & M(e, 12)] +
      j[15 & M(e, 16)] +
      j[15 & M(e, 20)] +
      j[15 & M(e, 24)] +
      j[15 & M(e, 28)]
    );
  }),
    (Q.decodeFormatInformation = function(e) {
      var t = Q.doDecodeFormatInformation(e);
      return null != t ? t : Q.doDecodeFormatInformation(21522 ^ e);
    }),
    (Q.doDecodeFormatInformation = function(e) {
      for (var t = 4294967295, n = 0, r = 0; r < U.length; r++) {
        var i = U[r],
          o = i[0];
        if (o == e) return new Q(i[1]);
        var s = this.numBitsDiffering(e, o);
        s < t && ((n = i[1]), (t = s));
      }
      return t <= 3 ? new Q(n) : null;
    });
  let K = {};
  function J(e, t) {
    (this.count = e),
      (this.dataCodewords = t),
      this.__defineGetter__('Count', function() {
        return this.count;
      }),
      this.__defineGetter__('DataCodewords', function() {
        return this.dataCodewords;
      });
  }
  function ee(e, t, n) {
    (this.ecCodewordsPerBlock = e),
      (this.ecBlocks = n ? new Array(t, n) : new Array(t)),
      this.__defineGetter__('ECCodewordsPerBlock', function() {
        return this.ecCodewordsPerBlock;
      }),
      this.__defineGetter__('TotalECCodewords', function() {
        return this.ecCodewordsPerBlock * this.NumBlocks;
      }),
      this.__defineGetter__('NumBlocks', function() {
        for (var e = 0, t = 0; t < this.ecBlocks.length; t++) e += this.ecBlocks[t].length;
        return e;
      }),
      (this.getECBlocks = function() {
        return this.ecBlocks;
      });
  }
  function te(e, t, n, r, i, o) {
    (this.versionNumber = e), (this.alignmentPatternCenters = t), (this.ecBlocks = new Array(n, r, i, o));
    for (var s = 0, a = n.ECCodewordsPerBlock, h = n.getECBlocks(), w = 0; w < h.length; w++) {
      var f = h[w];
      s += f.Count * (f.DataCodewords + a);
    }
    (this.totalCodewords = s),
      this.__defineGetter__('VersionNumber', function() {
        return this.versionNumber;
      }),
      this.__defineGetter__('AlignmentPatternCenters', function() {
        return this.alignmentPatternCenters;
      }),
      this.__defineGetter__('TotalCodewords', function() {
        return this.totalCodewords;
      }),
      this.__defineGetter__('DimensionForVersion', function() {
        return 17 + 4 * this.versionNumber;
      }),
      (this.buildFunctionPattern = function() {
        var e = this.DimensionForVersion,
          t = new k(e);
        t.setRegion(0, 0, 9, 9), t.setRegion(e - 8, 0, 8, 9), t.setRegion(0, e - 8, 9, 8);
        for (var n = this.alignmentPatternCenters.length, r = 0; r < n; r++)
          for (var i = this.alignmentPatternCenters[r] - 2, o = 0; o < n; o++)
            (0 == r && (0 == o || o == n - 1)) ||
              (r == n - 1 && 0 == o) ||
              t.setRegion(this.alignmentPatternCenters[o] - 2, i, 5, 5);
        return (
          t.setRegion(6, 9, 1, e - 17),
          t.setRegion(9, 6, e - 17, 1),
          this.versionNumber > 6 && (t.setRegion(e - 11, 0, 3, 6), t.setRegion(0, e - 11, 6, 3)),
          t
        );
      }),
      (this.getECBlocksForLevel = function(e) {
        return this.ecBlocks[e.ordinal()];
      });
  }
  (K.checkAndNudgePoints = function(e, t) {
    for (var n = A.width, r = A.height, i = !0, o = 0; o < t.length && i; o += 2) {
      var s = Math.floor(t[o]),
        a = Math.floor(t[o + 1]);
      if (s < -1 || s > n || a < -1 || a > r) throw new Error('Error.checkAndNudgePoints ');
      (i = !1),
        -1 == s ? ((t[o] = 0), (i = !0)) : s == n && ((t[o] = n - 1), (i = !0)),
        -1 == a ? ((t[o + 1] = 0), (i = !0)) : a == r && ((t[o + 1] = r - 1), (i = !0));
    }
    i = !0;
    for (o = t.length - 2; o >= 0 && i; o -= 2) {
      (s = Math.floor(t[o])), (a = Math.floor(t[o + 1]));
      if (s < -1 || s > n || a < -1 || a > r) throw new Error('Error.checkAndNudgePoints ');
      (i = !1),
        -1 == s ? ((t[o] = 0), (i = !0)) : s == n && ((t[o] = n - 1), (i = !0)),
        -1 == a ? ((t[o + 1] = 0), (i = !0)) : a == r && ((t[o + 1] = r - 1), (i = !0));
    }
  }),
    (K.sampleGrid3 = function(e, t, n) {
      for (var r = new k(t), i = new Array(t << 1), o = 0; o < t; o++) {
        for (var s = i.length, a = o + 0.5, h = 0; h < s; h += 2) (i[h] = 0.5 + (h >> 1)), (i[h + 1] = a);
        n.transformPoints1(i), K.checkAndNudgePoints(e, i);
        try {
          for (h = 0; h < s; h += 2) {
            var w = 4 * Math.floor(i[h]) + Math.floor(i[h + 1]) * A.width * 4,
              f = e[Math.floor(i[h]) + A.width * Math.floor(i[h + 1])];
            (A.imagedata.data[w] = f ? 255 : 0),
              (A.imagedata.data[w + 1] = f ? 255 : 0),
              (A.imagedata.data[w + 2] = 0),
              (A.imagedata.data[w + 3] = 255),
              f && r.set_Renamed(h >> 1, o);
          }
        } catch (e) {
          throw new Error('Error.checkAndNudgePoints');
        }
      }
      return r;
    }),
    (K.sampleGridx = function(e, t, n, r, i, o, s, a, h, w, f, u, l, c, d, v, g, m) {
      var y = x.quadrilateralToQuadrilateral(n, r, i, o, s, a, h, w, f, u, l, c, d, v, g, m);
      return K.sampleGrid3(e, t, y);
    }),
    (te.VERSION_DECODE_INFO = new Array(
      31892,
      34236,
      39577,
      42195,
      48118,
      51042,
      55367,
      58893,
      63784,
      68472,
      70749,
      76311,
      79154,
      84390,
      87683,
      92361,
      96236,
      102084,
      102881,
      110507,
      110734,
      117786,
      119615,
      126325,
      127568,
      133589,
      136944,
      141498,
      145311,
      150283,
      152622,
      158308,
      161089,
      167017
    )),
    (te.VERSIONS = new Array(
      new te(
        1,
        new Array(),
        new ee(7, new J(1, 19)),
        new ee(10, new J(1, 16)),
        new ee(13, new J(1, 13)),
        new ee(17, new J(1, 9))
      ),
      new te(
        2,
        new Array(6, 18),
        new ee(10, new J(1, 34)),
        new ee(16, new J(1, 28)),
        new ee(22, new J(1, 22)),
        new ee(28, new J(1, 16))
      ),
      new te(
        3,
        new Array(6, 22),
        new ee(15, new J(1, 55)),
        new ee(26, new J(1, 44)),
        new ee(18, new J(2, 17)),
        new ee(22, new J(2, 13))
      ),
      new te(
        4,
        new Array(6, 26),
        new ee(20, new J(1, 80)),
        new ee(18, new J(2, 32)),
        new ee(26, new J(2, 24)),
        new ee(16, new J(4, 9))
      ),
      new te(
        5,
        new Array(6, 30),
        new ee(26, new J(1, 108)),
        new ee(24, new J(2, 43)),
        new ee(18, new J(2, 15), new J(2, 16)),
        new ee(22, new J(2, 11), new J(2, 12))
      ),
      new te(
        6,
        new Array(6, 34),
        new ee(18, new J(2, 68)),
        new ee(16, new J(4, 27)),
        new ee(24, new J(4, 19)),
        new ee(28, new J(4, 15))
      ),
      new te(
        7,
        new Array(6, 22, 38),
        new ee(20, new J(2, 78)),
        new ee(18, new J(4, 31)),
        new ee(18, new J(2, 14), new J(4, 15)),
        new ee(26, new J(4, 13), new J(1, 14))
      ),
      new te(
        8,
        new Array(6, 24, 42),
        new ee(24, new J(2, 97)),
        new ee(22, new J(2, 38), new J(2, 39)),
        new ee(22, new J(4, 18), new J(2, 19)),
        new ee(26, new J(4, 14), new J(2, 15))
      ),
      new te(
        9,
        new Array(6, 26, 46),
        new ee(30, new J(2, 116)),
        new ee(22, new J(3, 36), new J(2, 37)),
        new ee(20, new J(4, 16), new J(4, 17)),
        new ee(24, new J(4, 12), new J(4, 13))
      ),
      new te(
        10,
        new Array(6, 28, 50),
        new ee(18, new J(2, 68), new J(2, 69)),
        new ee(26, new J(4, 43), new J(1, 44)),
        new ee(24, new J(6, 19), new J(2, 20)),
        new ee(28, new J(6, 15), new J(2, 16))
      ),
      new te(
        11,
        new Array(6, 30, 54),
        new ee(20, new J(4, 81)),
        new ee(30, new J(1, 50), new J(4, 51)),
        new ee(28, new J(4, 22), new J(4, 23)),
        new ee(24, new J(3, 12), new J(8, 13))
      ),
      new te(
        12,
        new Array(6, 32, 58),
        new ee(24, new J(2, 92), new J(2, 93)),
        new ee(22, new J(6, 36), new J(2, 37)),
        new ee(26, new J(4, 20), new J(6, 21)),
        new ee(28, new J(7, 14), new J(4, 15))
      ),
      new te(
        13,
        new Array(6, 34, 62),
        new ee(26, new J(4, 107)),
        new ee(22, new J(8, 37), new J(1, 38)),
        new ee(24, new J(8, 20), new J(4, 21)),
        new ee(22, new J(12, 11), new J(4, 12))
      ),
      new te(
        14,
        new Array(6, 26, 46, 66),
        new ee(30, new J(3, 115), new J(1, 116)),
        new ee(24, new J(4, 40), new J(5, 41)),
        new ee(20, new J(11, 16), new J(5, 17)),
        new ee(24, new J(11, 12), new J(5, 13))
      ),
      new te(
        15,
        new Array(6, 26, 48, 70),
        new ee(22, new J(5, 87), new J(1, 88)),
        new ee(24, new J(5, 41), new J(5, 42)),
        new ee(30, new J(5, 24), new J(7, 25)),
        new ee(24, new J(11, 12), new J(7, 13))
      ),
      new te(
        16,
        new Array(6, 26, 50, 74),
        new ee(24, new J(5, 98), new J(1, 99)),
        new ee(28, new J(7, 45), new J(3, 46)),
        new ee(24, new J(15, 19), new J(2, 20)),
        new ee(30, new J(3, 15), new J(13, 16))
      ),
      new te(
        17,
        new Array(6, 30, 54, 78),
        new ee(28, new J(1, 107), new J(5, 108)),
        new ee(28, new J(10, 46), new J(1, 47)),
        new ee(28, new J(1, 22), new J(15, 23)),
        new ee(28, new J(2, 14), new J(17, 15))
      ),
      new te(
        18,
        new Array(6, 30, 56, 82),
        new ee(30, new J(5, 120), new J(1, 121)),
        new ee(26, new J(9, 43), new J(4, 44)),
        new ee(28, new J(17, 22), new J(1, 23)),
        new ee(28, new J(2, 14), new J(19, 15))
      ),
      new te(
        19,
        new Array(6, 30, 58, 86),
        new ee(28, new J(3, 113), new J(4, 114)),
        new ee(26, new J(3, 44), new J(11, 45)),
        new ee(26, new J(17, 21), new J(4, 22)),
        new ee(26, new J(9, 13), new J(16, 14))
      ),
      new te(
        20,
        new Array(6, 34, 62, 90),
        new ee(28, new J(3, 107), new J(5, 108)),
        new ee(26, new J(3, 41), new J(13, 42)),
        new ee(30, new J(15, 24), new J(5, 25)),
        new ee(28, new J(15, 15), new J(10, 16))
      ),
      new te(
        21,
        new Array(6, 28, 50, 72, 94),
        new ee(28, new J(4, 116), new J(4, 117)),
        new ee(26, new J(17, 42)),
        new ee(28, new J(17, 22), new J(6, 23)),
        new ee(30, new J(19, 16), new J(6, 17))
      ),
      new te(
        22,
        new Array(6, 26, 50, 74, 98),
        new ee(28, new J(2, 111), new J(7, 112)),
        new ee(28, new J(17, 46)),
        new ee(30, new J(7, 24), new J(16, 25)),
        new ee(24, new J(34, 13))
      ),
      new te(
        23,
        new Array(6, 30, 54, 74, 102),
        new ee(30, new J(4, 121), new J(5, 122)),
        new ee(28, new J(4, 47), new J(14, 48)),
        new ee(30, new J(11, 24), new J(14, 25)),
        new ee(30, new J(16, 15), new J(14, 16))
      ),
      new te(
        24,
        new Array(6, 28, 54, 80, 106),
        new ee(30, new J(6, 117), new J(4, 118)),
        new ee(28, new J(6, 45), new J(14, 46)),
        new ee(30, new J(11, 24), new J(16, 25)),
        new ee(30, new J(30, 16), new J(2, 17))
      ),
      new te(
        25,
        new Array(6, 32, 58, 84, 110),
        new ee(26, new J(8, 106), new J(4, 107)),
        new ee(28, new J(8, 47), new J(13, 48)),
        new ee(30, new J(7, 24), new J(22, 25)),
        new ee(30, new J(22, 15), new J(13, 16))
      ),
      new te(
        26,
        new Array(6, 30, 58, 86, 114),
        new ee(28, new J(10, 114), new J(2, 115)),
        new ee(28, new J(19, 46), new J(4, 47)),
        new ee(28, new J(28, 22), new J(6, 23)),
        new ee(30, new J(33, 16), new J(4, 17))
      ),
      new te(
        27,
        new Array(6, 34, 62, 90, 118),
        new ee(30, new J(8, 122), new J(4, 123)),
        new ee(28, new J(22, 45), new J(3, 46)),
        new ee(30, new J(8, 23), new J(26, 24)),
        new ee(30, new J(12, 15), new J(28, 16))
      ),
      new te(
        28,
        new Array(6, 26, 50, 74, 98, 122),
        new ee(30, new J(3, 117), new J(10, 118)),
        new ee(28, new J(3, 45), new J(23, 46)),
        new ee(30, new J(4, 24), new J(31, 25)),
        new ee(30, new J(11, 15), new J(31, 16))
      ),
      new te(
        29,
        new Array(6, 30, 54, 78, 102, 126),
        new ee(30, new J(7, 116), new J(7, 117)),
        new ee(28, new J(21, 45), new J(7, 46)),
        new ee(30, new J(1, 23), new J(37, 24)),
        new ee(30, new J(19, 15), new J(26, 16))
      ),
      new te(
        30,
        new Array(6, 26, 52, 78, 104, 130),
        new ee(30, new J(5, 115), new J(10, 116)),
        new ee(28, new J(19, 47), new J(10, 48)),
        new ee(30, new J(15, 24), new J(25, 25)),
        new ee(30, new J(23, 15), new J(25, 16))
      ),
      new te(
        31,
        new Array(6, 30, 56, 82, 108, 134),
        new ee(30, new J(13, 115), new J(3, 116)),
        new ee(28, new J(2, 46), new J(29, 47)),
        new ee(30, new J(42, 24), new J(1, 25)),
        new ee(30, new J(23, 15), new J(28, 16))
      ),
      new te(
        32,
        new Array(6, 34, 60, 86, 112, 138),
        new ee(30, new J(17, 115)),
        new ee(28, new J(10, 46), new J(23, 47)),
        new ee(30, new J(10, 24), new J(35, 25)),
        new ee(30, new J(19, 15), new J(35, 16))
      ),
      new te(
        33,
        new Array(6, 30, 58, 86, 114, 142),
        new ee(30, new J(17, 115), new J(1, 116)),
        new ee(28, new J(14, 46), new J(21, 47)),
        new ee(30, new J(29, 24), new J(19, 25)),
        new ee(30, new J(11, 15), new J(46, 16))
      ),
      new te(
        34,
        new Array(6, 34, 62, 90, 118, 146),
        new ee(30, new J(13, 115), new J(6, 116)),
        new ee(28, new J(14, 46), new J(23, 47)),
        new ee(30, new J(44, 24), new J(7, 25)),
        new ee(30, new J(59, 16), new J(1, 17))
      ),
      new te(
        35,
        new Array(6, 30, 54, 78, 102, 126, 150),
        new ee(30, new J(12, 121), new J(7, 122)),
        new ee(28, new J(12, 47), new J(26, 48)),
        new ee(30, new J(39, 24), new J(14, 25)),
        new ee(30, new J(22, 15), new J(41, 16))
      ),
      new te(
        36,
        new Array(6, 24, 50, 76, 102, 128, 154),
        new ee(30, new J(6, 121), new J(14, 122)),
        new ee(28, new J(6, 47), new J(34, 48)),
        new ee(30, new J(46, 24), new J(10, 25)),
        new ee(30, new J(2, 15), new J(64, 16))
      ),
      new te(
        37,
        new Array(6, 28, 54, 80, 106, 132, 158),
        new ee(30, new J(17, 122), new J(4, 123)),
        new ee(28, new J(29, 46), new J(14, 47)),
        new ee(30, new J(49, 24), new J(10, 25)),
        new ee(30, new J(24, 15), new J(46, 16))
      ),
      new te(
        38,
        new Array(6, 32, 58, 84, 110, 136, 162),
        new ee(30, new J(4, 122), new J(18, 123)),
        new ee(28, new J(13, 46), new J(32, 47)),
        new ee(30, new J(48, 24), new J(14, 25)),
        new ee(30, new J(42, 15), new J(32, 16))
      ),
      new te(
        39,
        new Array(6, 26, 54, 82, 110, 138, 166),
        new ee(30, new J(20, 117), new J(4, 118)),
        new ee(28, new J(40, 47), new J(7, 48)),
        new ee(30, new J(43, 24), new J(22, 25)),
        new ee(30, new J(10, 15), new J(67, 16))
      ),
      new te(
        40,
        new Array(6, 30, 58, 86, 114, 142, 170),
        new ee(30, new J(19, 118), new J(6, 119)),
        new ee(28, new J(18, 47), new J(31, 48)),
        new ee(30, new J(34, 24), new J(34, 25)),
        new ee(30, new J(20, 15), new J(61, 16))
      )
    )),
    (te.getVersionForNumber = function(e) {
      if (e < 1 || e > 40) throw new Error('ArgumentException');
      return te.VERSIONS[e - 1];
    }),
    (te.getProvisionalVersionForDimension = function(e) {
      if (e % 4 != 1) throw new Error('Error getProvisionalVersionForDimension');
      try {
        return te.getVersionForNumber((e - 17) >> 2);
      } catch (e) {
        throw new Error('Error getVersionForNumber');
      }
    }),
    (te.decodeVersionInformation = function(e) {
      for (var t = 4294967295, n = 0, r = 0; r < te.VERSION_DECODE_INFO.length; r++) {
        var i = te.VERSION_DECODE_INFO[r];
        if (i == e) return this.getVersionForNumber(r + 7);
        var o = Q.numBitsDiffering(e, i);
        o < t && ((n = r + 7), (t = o));
      }
      return t <= 3 ? this.getVersionForNumber(n) : null;
    });
  let ne = (function() {
      var e = t(function*(e, t, n) {
        try {
          let e = new BarcodeDetector(),
            t = yield e.detect(n);
          if (t.length > 0) return t[0].rawValue;
        } catch (e) {
          oe = re;
        }
      });
      return function(t, n, r) {
        return e.apply(this, arguments);
      };
    })(),
    re = (function() {
      var e = t(function*(e, t, n) {
        try {
          return A.decode(e, t, n);
        } catch (e) {
          return;
        }
      });
      return function(t, n, r) {
        return e.apply(this, arguments);
      };
    })(),
    ie = (function() {
      var e = t(function*(e, t, n) {
        return oe(e, t, n);
      });
      return function(t, n, r) {
        return e.apply(this, arguments);
      };
    })(),
    oe = 'BarcodeDetector' in self ? ne : re;
  h({ detectUrl: ie }, self);
})();
