/*
 * Shar — lightweight runtime for the .dc.html pages.
 * Reads the <x-dc> template and the data-dc-script logic class of a page
 * and renders them with React 18 (loaded from ./vendor before this file).
 */
(function () {
  'use strict';

  var EVENTS = {
    onclick: 'onClick', onchange: 'onChange', oninput: 'onInput',
    onkeydown: 'onKeyDown', onkeyup: 'onKeyUp',
    onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave',
    onpointerdown: 'onPointerDown', onpointermove: 'onPointerMove', onpointerup: 'onPointerUp',
    onpointerenter: 'onPointerEnter', onpointerleave: 'onPointerLeave',
    ontouchstart: 'onTouchStart', ontouchend: 'onTouchEnd',
    onsubmit: 'onSubmit', onfocus: 'onFocus', onblur: 'onBlur'
  };
  var ATTRS = {
    'class': 'className', 'for': 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly',
    maxlength: 'maxLength', colspan: 'colSpan', rowspan: 'rowSpan', autocomplete: 'autoComplete',
    'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
    'fill-rule': 'fillRule', 'clip-rule': 'clipRule', viewbox: 'viewBox'
  };
  var VOID = { img: 1, input: 1, br: 1, hr: 1, meta: 1, link: 1, source: 1, area: 1, col: 1, wbr: 1 };
  var NO_TEXT = { table: 1, thead: 1, tbody: 1, tfoot: 1, tr: 1, select: 1, colgroup: 1 };
  var HOLE = /\{\{\s*([^}]*?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]*?)\s*\}\}\s*$/;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function lookup(path, scope) {
    path = String(path).trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (path === 'undefined' || path === '') return undefined;
    if (/^-?\d+(\.\d+)?$/.test(path)) return parseFloat(path);
    if (/^'.*'$|^".*"$/.test(path)) return path.slice(1, -1);
    var parts = path.split('.');
    var v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v === null || v === undefined) return undefined;
      v = v[parts[i]];
    }
    return v;
  }

  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) {
      var v = lookup(p, scope);
      return v === null || v === undefined ? '' : String(v);
    });
  }

  function camel(prop) {
    if (prop.indexOf('--') === 0) return prop;
    return prop.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
  }

  function styleObject(css) {
    var out = {};
    String(css || '').split(';').forEach(function (decl) {
      var i = decl.indexOf(':');
      if (i < 0) return;
      var k = decl.slice(0, i).trim();
      var v = decl.slice(i + 1).trim();
      if (k) out[camel(k)] = v;
    });
    return out;
  }

  function holeOf(node, name) {
    var raw = node.getAttribute(name) || '';
    var m = WHOLE.exec(raw);
    return m ? m[1] : raw;
  }

  function children(node, scope) {
    var parentTag = node.nodeType === 1 ? node.tagName.toLowerCase() : '';
    var out = [];
    node.childNodes.forEach(function (child, i) {
      if (child.nodeType === 3 && NO_TEXT[parentTag] && !child.nodeValue.trim()) return;
      var r = build(child, scope, i);
      if (r !== null && r !== undefined && r !== false) out.push(r);
    });
    return out;
  }

  function build(node, scope, key) {
    var React = window.React;
    if (node.nodeType === 3) {
      var text = node.nodeValue;
      return text.indexOf('{{') < 0 ? text : interp(text, scope);
    }
    if (node.nodeType !== 1) return null;

    var tag = node.namespaceURI === SVG_NS ? node.tagName : node.tagName.toLowerCase();

    if (tag === 'helmet') return null;

    if (tag === 'sc-for') {
      var list = lookup(holeOf(node, 'list'), scope) || [];
      var as = node.getAttribute('as') || 'item';
      return list.map(function (item, i) {
        var inner = Object.create(scope);
        inner[as] = item;
        inner.$index = i;
        return React.createElement.apply(null, [React.Fragment, { key: i }].concat(children(node, inner)));
      });
    }

    if (tag === 'sc-if') {
      if (!lookup(holeOf(node, 'value'), scope)) return null;
      return React.createElement.apply(null, [React.Fragment, { key: key }].concat(children(node, scope)));
    }

    var props = { key: key };
    var hasChange = node.hasAttribute('onchange') || node.hasAttribute('oninput');
    Array.prototype.forEach.call(node.attributes, function (attr) {
      var name = attr.name;
      var raw = attr.value;
      if (name.indexOf('hint-') === 0) return;
      if (name === 'data-dc-src') name = 'src';
      if (name === 'data-dc-href') name = 'href';
      var whole = WHOLE.exec(raw);
      var value = whole ? lookup(whole[1], scope) : (raw.indexOf('{{') >= 0 ? interp(raw, scope) : raw);

      if (name === 'style') { props.style = styleObject(typeof value === 'string' ? value : ''); return; }
      if (EVENTS[name]) { if (typeof value === 'function') props[EVENTS[name]] = value; return; }
      if (name === 'ref') { if (typeof value === 'function') props.ref = value; return; }

      var prop = ATTRS[name] || name;
      var formField = tag === 'input' || tag === 'select' || tag === 'textarea';
      if (prop === 'checked' || prop === 'disabled' || prop === 'readOnly' || prop === 'selected') {
        var on = value === true || value === '' || value === 'true' || value === prop;
        if (prop === 'checked' && !hasChange) props.defaultChecked = on;
        else props[prop] = on;
        return;
      }
      if (prop === 'value' && formField) {
        if (hasChange) props.value = value === null || value === undefined ? '' : value;
        else props.defaultValue = value;
        return;
      }
      props[prop] = value;
    });

    if (VOID[tag]) return React.createElement(tag, props);
    return React.createElement.apply(null, [tag, props].concat(children(node, scope)));
  }

  function boot() {
    var React = window.React;
    var ReactDOM = window.ReactDOM;
    var host = document.querySelector('x-dc');
    var script = document.querySelector('script[data-dc-script]');
    if (!host || !script || !React || !ReactDOM) return;

    var helmet = host.querySelector('helmet');
    if (helmet) {
      Array.prototype.forEach.call(helmet.children, function (el) {
        document.head.appendChild(el.cloneNode(true));
      });
    }

    var nodes = Array.prototype.filter.call(host.childNodes, function (n) {
      return !(n.nodeType === 1 && n.tagName.toLowerCase() === 'helmet');
    });
    host.parentNode.removeChild(host);

    var defaults = {};
    try {
      var declared = JSON.parse(script.getAttribute('data-props') || '{}');
      Object.keys(declared).forEach(function (k) {
        if (k.charAt(0) !== '$' && declared[k] && 'default' in declared[k]) defaults[k] = declared[k]['default'];
      });
    } catch (e) { /* no defaults */ }

    class DCLogic extends React.Component {
      render() {
        var vals = this.renderVals ? this.renderVals() : {};
        var out = [];
        nodes.forEach(function (n, i) {
          var r = build(n, vals, i);
          if (r !== null && r !== undefined) out.push(r);
        });
        return React.createElement.apply(null, [React.Fragment, null].concat(out));
      }
    }

    var Component = new Function('DCLogic', 'React', script.textContent + '\n;return Component;')(DCLogic, React);
    var mount = document.createElement('div');
    mount.id = 'shar-root';
    document.body.appendChild(mount);
    ReactDOM.createRoot(mount).render(React.createElement(Component, defaults));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
