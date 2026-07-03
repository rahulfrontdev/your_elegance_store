var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// node_modules/toposort/index.js
var require_index = __commonJS({
  "node_modules/toposort/index.js"(exports, module) {
    module.exports = function(edges) {
      return toposort(uniqueNodes(edges), edges);
    };
    module.exports.array = toposort;
    function toposort(nodes, edges) {
      var cursor = nodes.length, sorted = new Array(cursor), visited = {}, i = cursor, outgoingEdges = makeOutgoingEdges(edges), nodesHash = makeNodesHash(nodes);
      edges.forEach(function(edge) {
        if (!nodesHash.has(edge[0]) || !nodesHash.has(edge[1])) {
          throw new Error("Unknown node. There is an unknown node in the supplied edges.");
        }
      });
      while (i--) {
        if (!visited[i]) visit(nodes[i], i, /* @__PURE__ */ new Set());
      }
      return sorted;
      function visit(node, i2, predecessors) {
        if (predecessors.has(node)) {
          var nodeRep;
          try {
            nodeRep = ", node was:" + JSON.stringify(node);
          } catch (e) {
            nodeRep = "";
          }
          throw new Error("Cyclic dependency" + nodeRep);
        }
        if (!nodesHash.has(node)) {
          throw new Error("Found unknown node. Make sure to provided all involved nodes. Unknown node: " + JSON.stringify(node));
        }
        if (visited[i2]) return;
        visited[i2] = true;
        var outgoing = outgoingEdges.get(node) || /* @__PURE__ */ new Set();
        outgoing = Array.from(outgoing);
        if (i2 = outgoing.length) {
          predecessors.add(node);
          do {
            var child = outgoing[--i2];
            visit(child, nodesHash.get(child), predecessors);
          } while (i2);
          predecessors.delete(node);
        }
        sorted[--cursor] = node;
      }
    }
    function uniqueNodes(arr) {
      var res = /* @__PURE__ */ new Set();
      for (var i = 0, len = arr.length; i < len; i++) {
        var edge = arr[i];
        res.add(edge[0]);
        res.add(edge[1]);
      }
      return Array.from(res);
    }
    function makeOutgoingEdges(arr) {
      var edges = /* @__PURE__ */ new Map();
      for (var i = 0, len = arr.length; i < len; i++) {
        var edge = arr[i];
        if (!edges.has(edge[0])) edges.set(edge[0], /* @__PURE__ */ new Set());
        if (!edges.has(edge[1])) edges.set(edge[1], /* @__PURE__ */ new Set());
        edges.get(edge[0]).add(edge[1]);
      }
      return edges;
    }
    function makeNodesHash(arr) {
      var res = /* @__PURE__ */ new Map();
      for (var i = 0, len = arr.length; i < len; i++) {
        res.set(arr[i], i);
      }
      return res;
    }
  }
});
export default require_index();
