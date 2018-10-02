const expect = require('chai').expect;
const compiler = require("./../../src/util/compiler");

describe("Testing compiler", () => {
  it("Testing traversing", () => {
    const input = ["a.{b,c}.d", "a.{c,e}.f", "a.b.d.g"];
    const tower = compiler.compile(input);
    expect(tower).to.deep.equal({
      a: {
        b: {
          d: {
            g: {}
          }
        },
        c: {
          d: {},
          f: {}
        },
        e: {
          f: {}
        }
      }
    });

    expect(compiler.isMatch(tower)).to.equal(false);
    expect(compiler.isMatch(tower.a)).to.equal(false);
    expect(compiler.isMatch(tower.a.b)).to.equal(false);
    expect(compiler.isMatch(tower.a.b.d)).to.equal(true);
    expect(compiler.isMatch(tower.a.b.d.g)).to.equal(true);
    expect(compiler.isMatch(tower.a.c)).to.equal(false);
    expect(compiler.isMatch(tower.a.c.d)).to.equal(true);
    expect(compiler.isMatch(tower.a.c.f)).to.equal(true);
    expect(compiler.isMatch(tower.a.e)).to.equal(false);
    expect(compiler.isMatch(tower.a.e.f)).to.equal(true);

    expect(compiler.getNeedles(tower)).to.deep.equal(["a.{b,c}.d", "a.{c,e}.f", "a.b.d.g"]);
    expect(compiler.getNeedles(tower.a)).to.deep.equal(["a.{b,c}.d", "a.{c,e}.f", "a.b.d.g"]);
    expect(compiler.getNeedles(tower.a.b)).to.deep.equal(["a.{b,c}.d", "a.b.d.g"]);
    expect(compiler.getNeedles(tower.a.b.d)).to.deep.equal(["a.{b,c}.d", "a.b.d.g"]);
    expect(compiler.getNeedles(tower.a.b.d.g)).to.deep.equal(["a.b.d.g"]);
    expect(compiler.getNeedles(tower.a.c)).to.deep.equal(["a.{b,c}.d", "a.{c,e}.f"]);
    expect(compiler.getNeedles(tower.a.c.d)).to.deep.equal(["a.{b,c}.d"]);
    expect(compiler.getNeedles(tower.a.c.f)).to.deep.equal(["a.{c,e}.f"]);
    expect(compiler.getNeedles(tower.a.e)).to.deep.equal(["a.{c,e}.f"]);
    expect(compiler.getNeedles(tower.a.e.f)).to.deep.equal(["a.{c,e}.f"]);

    expect(compiler.getNeedle(tower)).to.deep.equal(null);
    expect(compiler.getNeedle(tower.a)).to.deep.equal(null);
    expect(compiler.getNeedle(tower.a.b)).to.deep.equal(null);
    expect(compiler.getNeedle(tower.a.b.d)).to.deep.equal("a.{b,c}.d");
    expect(compiler.getNeedle(tower.a.b.d.g)).to.deep.equal("a.b.d.g");
    expect(compiler.getNeedle(tower.a.c)).to.deep.equal(null);
    expect(compiler.getNeedle(tower.a.c.d)).to.deep.equal("a.{b,c}.d");
    expect(compiler.getNeedle(tower.a.c.f)).to.deep.equal("a.{c,e}.f");
    expect(compiler.getNeedle(tower.a.e)).to.deep.equal(null);
    expect(compiler.getNeedle(tower.a.e.f)).to.deep.equal("a.{c,e}.f");
  });
});
