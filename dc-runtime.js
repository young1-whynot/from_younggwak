/* Tiny runtime that renders the prototype's {{hole}} / <sc-if> / <sc-for> templates with Preact. */
(function () {
  var h = preact.h;
  var HOLE = /\{\{([^}]*)\}\}/g;

  function parts(str) {
    var out = [], last = 0, m;
    HOLE.lastIndex = 0;
    while ((m = HOLE.exec(str))) {
      if (m.index > last) out.push(str.slice(last, m.index));
      out.push({ p: m[1].trim() });
      last = m.index + m[0].length;
    }
    if (last < str.length) out.push(str.slice(last));
    return out;
  }

  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (path !== '' && !isNaN(Number(path))) return Number(path);
    var segs = path.split('.'), v = scope[segs[0]];
    for (var i = 1; i < segs.length && v != null; i++) v = v[segs[i]];
    return v;
  }

  function evalParts(ps, scope, raw) {
    if (raw && ps.length === 1 && typeof ps[0] === 'object') return lookup(ps[0].p, scope);
    var s = '';
    for (var i = 0; i < ps.length; i++) {
      if (typeof ps[i] === 'string') s += ps[i];
      else { var v = lookup(ps[i].p, scope); s += v == null ? '' : v; }
    }
    return s;
  }

  var EVENTS = { onclick: 'onClick', onpointerdown: 'onPointerDown', onpointerup: 'onPointerUp', onpointermove: 'onPointerMove', oninput: 'onInput', onkeydown: 'onKeyDown', onchange: 'onChange' };

  function compile(node) {
    if (node.nodeType === 3) return { text: parts(node.nodeValue) };
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    var kids = [];
    var src = tag === 'template' ? node.content : node;
    for (var c = src.firstChild; c; c = c.nextSibling) { var k = compile(c); if (k) kids.push(k); }
    if (tag === 'sc-if') return { kind: 'if', v: parts(node.getAttribute('value') || ''), kids: kids };
    if (tag === 'sc-for') return { kind: 'for', list: parts(node.getAttribute('list') || ''), as: node.getAttribute('as') || 'item', kids: kids };
    var attrs = [];
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i], name = a.name;
      if (name.indexOf('hint-') === 0) continue;
      var lname = name.toLowerCase();
      if (EVENTS[lname]) name = (lname === 'onchange' && (tag === 'input' || tag === 'textarea')) ? 'onInput' : EVENTS[lname];
      attrs.push([name, parts(a.value), name.indexOf('on') === 0 && name.length > 2 && name[2] === name[2].toUpperCase()]);
    }
    return { kind: 'el', tag: tag, attrs: attrs, kids: kids };
  }

  function render(n, scope, out) {
    if (n.text) { var t = evalParts(n.text, scope, false); if (t !== '') out.push(t); return; }
    if (n.kind === 'if') { if (evalParts(n.v, scope, true)) for (var i = 0; i < n.kids.length; i++) render(n.kids[i], scope, out); return; }
    if (n.kind === 'for') {
      var list = evalParts(n.list, scope, true) || [];
      for (var j = 0; j < list.length; j++) {
        var sc = Object.create(scope); sc[n.as] = list[j];
        for (var k = 0; k < n.kids.length; k++) render(n.kids[k], sc, out);
      }
      return;
    }
    var props = {};
    for (var a = 0; a < n.attrs.length; a++) {
      var at = n.attrs[a];
      var v = evalParts(at[1], scope, true);
      if (at[2]) { if (typeof v === 'function') props[at[0]] = v; continue; }
      if (v === false || v == null) continue;
      props[at[0]] = (v === true) ? '' : (typeof v === 'object' ? v : String(v));
    }
    var ch = [];
    for (var c = 0; c < n.kids.length; c++) render(n.kids[c], scope, ch);
    out.push(h.apply(null, [n.tag, props].concat(ch)));
  }

  var inst = null, root = null, tree = null, queued = false;
  function paint() {
    queued = false;
    var vals = inst.renderVals();
    var out = [];
    for (var i = 0; i < tree.length; i++) render(tree[i], vals, out);
    preact.render(h(preact.Fragment, null, out), root);
  }
  function schedule() { if (!queued) { queued = true; (window.queueMicrotask || setTimeout)(paint); } }

  window.DCLogic = function () {};
  window.DCLogic = class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(u, cb) {
      var p = typeof u === 'function' ? u(this.state, this.props) : u;
      if (p) { this.state = Object.assign({}, this.state, p); schedule(); }
      if (cb) setTimeout(cb, 0);
    }
    forceUpdate() { schedule(); }
  };

  window.DCMount = function (Comp, props) {
    var tpl = document.getElementById('tpl');
    tree = [];
    for (var c = tpl.content.firstChild; c; c = c.nextSibling) { var k = compile(c); if (k) tree.push(k); }
    root = document.getElementById('app');
    inst = new Comp(props || {});
    paint();
    if (inst.componentDidMount) inst.componentDidMount();
    window.addEventListener('pagehide', function () { if (inst.componentWillUnmount) inst.componentWillUnmount(); });
  };

  function fit() {
    var st = document.getElementById('stage');
    if (!st) return;
    var s = Math.min(window.innerWidth / 390, window.innerHeight / 844);
    st.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('DOMContentLoaded', fit);
})();
