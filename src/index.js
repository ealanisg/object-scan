const assert = require('assert');
const compiler = require('./util/compiler');
const { findLast, toPath } = require('./util/helper');

const isWildcardMatch = (wildcard, key, isArray, subSearch) => {
  if (wildcard === '**') {
    return true;
  }
  if (wildcard === (isArray ? '[*]' : '*')) {
    return true;
  }
  if (isArray && !wildcard.match(/^\[.*]$/)) {
    return false;
  }
  return (isArray ? `[${key}]` : key).match(compiler.getWildcardRegex(subSearch));
};

const formatPath = (input, ctx) => (ctx.joined ? toPath(input) : [...input]);

const find = (haystack_, searches_, ctx) => {
  const result = ctx.context === undefined ? [] : null;

  const stack = [false, searches_, null, 0];
  const path = [];
  const parents = [];

  let depth;
  let segment;
  let searches;
  let isResult;
  let haystack = haystack_;

  const kwargs = {
    getKey: () => formatPath(path, ctx),
    get key() {
      return kwargs.getKey();
    },
    getValue: () => haystack,
    get value() {
      return kwargs.getValue();
    },
    getIsMatch: () => compiler.isLastLeafMatch(searches),
    get isMatch() {
      return kwargs.getIsMatch();
    },
    getMatchedBy: () => compiler.matchedBy(searches),
    get matchedBy() {
      return kwargs.getMatchedBy();
    },
    getExcludedBy: () => compiler.excludedBy(searches),
    get excludedBy() {
      return kwargs.getExcludedBy();
    },
    getTraversedBy: () => compiler.traversedBy(searches),
    get traversedBy() {
      return kwargs.getTraversedBy();
    },
    getParents: () => [...parents].reverse(),
    get parents() {
      return kwargs.getParents();
    },
    context: ctx.context
  };

  do {
    depth = stack.pop();
    segment = stack.pop();
    searches = stack.pop();
    isResult = stack.pop();

    const diff = path.length - depth;
    for (let idx = 0; idx < diff; idx += 1) {
      parents.pop();
      path.pop();
    }
    if (diff === -1) {
      parents.push(haystack);
      path.push(segment);
      haystack = haystack[segment];
    } else if (segment !== null) {
      path[path.length - 1] = segment;
      haystack = parents[parents.length - 1][segment];
    } else {
      haystack = haystack_;
    }

    if (isResult) {
      if (ctx.filterFn === undefined || ctx.filterFn(kwargs) !== false) {
        if (result !== null) {
          result.push(formatPath(path, ctx));
        }
      }
      // eslint-disable-next-line no-continue
      continue;
    }

    if (!searches.some((s) => compiler.hasMatches(s))) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const recurseHaystack = ctx.breakFn === undefined || ctx.breakFn(kwargs) !== true;

    if (ctx.useArraySelector === false && Array.isArray(haystack)) {
      if (recurseHaystack) {
        for (let idx = 0, len = haystack.length; idx < len; idx += 1) {
          stack.push(false, searches, idx, depth + 1);
        }
      }
      // eslint-disable-next-line no-continue
      continue;
    }

    if (compiler.isMatch(findLast(searches, (s) => compiler.isLeaf(s)))) {
      stack.push(true, searches, segment, depth);
    }

    if (searches[0][''] !== undefined && path.find((p) => typeof p === 'string') === undefined) {
      assert(searches.length === 1);
      stack.push(false, [searches[0]['']], segment, depth);
    }

    if (recurseHaystack && haystack instanceof Object) {
      const isArray = Array.isArray(haystack);
      const keys = isArray ? haystack : Object.keys(haystack);
      for (let kIdx = 0, kLen = keys.length; kIdx < kLen; kIdx += 1) {
        const key = isArray ? kIdx : keys[kIdx];
        const searchesOut = [];
        for (let sIdx = 0, sLen = searches.length; sIdx < sLen; sIdx += 1) {
          const search = searches[sIdx];
          const recursionPos = compiler.isRecursive(search) ? compiler.getRecursionPos(search) : null;
          if (recursionPos === 0) {
            searchesOut.push(search);
          }
          const entries = compiler.getEntries(search);
          for (let eIdx = 0, eLen = entries.length; eIdx < eLen; eIdx += 1) {
            const entry = entries[eIdx];
            if (isWildcardMatch(entry[0], key, isArray, entry[1])) {
              searchesOut.push(entry[1]);
            }
            if (eIdx + 1 === recursionPos) {
              searchesOut.push(search);
            }
          }
        }
        stack.push(false, searchesOut, key, depth + 1);
      }
    }
  } while (stack.length !== 0);

  return result === null ? ctx.context : result;
};

module.exports = (needles, opts = {}) => {
  assert(Array.isArray(needles));
  assert(opts instanceof Object && !Array.isArray(opts));
  if (needles.length === 0) {
    return () => [];
  }

  const ctx = {
    filterFn: undefined,
    breakFn: undefined,
    joined: false,
    useArraySelector: true,
    strict: true,
    ...opts
  };
  assert(Object.keys(ctx).length === 5, 'Unexpected Option provided!');
  assert(['function', 'undefined'].includes(typeof ctx.filterFn));
  assert(['function', 'undefined'].includes(typeof ctx.breakFn));
  assert(typeof ctx.joined === 'boolean');
  assert(typeof ctx.useArraySelector === 'boolean');
  assert(typeof ctx.strict === 'boolean');

  const search = compiler.compile(needles, ctx.strict); // keep separate for performance
  return (haystack, context) => find(haystack, [search], { context, ...ctx });
};
