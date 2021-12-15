// https://www.demo2s.com/javascript/javascript-d3-js-force-direct-chart-add-link-with-label.html
var color; 
var force;
var svg;

var node;
var link;
var nodeCircle;
var nodeLabel;
var linkLine;
var linkLabel;

// var nns = [{"id": "a"}, {"id": "b"}, {"id": "c"}];
// var lls = [{"similarity": "0.5", "source": 0, "target": 1}, {"similarity": "0.2", "source": 0, "target": 2}]

var nns = []
var lls = []
var id_names = []

var nodes = [];
var links = [];

$.ajax({
      dataType: "json",
      url: "/data",
     // data: data,
      async: false, 
      success: function(data) {
        nns = data['nns'];
        lls = data['lls'];
        id_names = data['id_names']
    }
});


function get_name(spectrumid) {
    return id_names[spectrumid]
}

function create_graph() {
  svg = d3.select("#divSVG").append("svg")
    .attr("width", "100%")
    .attr("height", (window.innerHeight - 200));
  
  color = d3.scale.identity();
  force = d3.layout.force() 
    .nodes(nodes)
    .links(links)
    .charge(-1e3)
    .linkDistance(function (n) {
            sim = parseFloat(n.similarity);
            dist = 1/sim * 75;
            return dist;
         })
    .chargeDistance(-600)
    .size([$("#divSVG").width(), (window.innerHeight - 100)])
    .on("tick", tick)

  svg.html('<defs><filter x="-0.1" y="0" width="1.2" height="1" id="solid"><feFlood flood-color="white"/><feComposite in="SourceGraphic"/></filter></defs>');
}

function add_nodes() {

  for (i=0; i<nns.length; i++) {
      nodes.push(nns[i]);
  }

  for (i=0; i<lls.length; i++) {
      link = {
          similarity: lls[i].similarity,
          source: nodes[lls[i].source],
          target: nodes[lls[i].target]
      }
      links.push(link);
  }
  construct_graph();
}

function construct_graph() {
  force
    .nodes(nodes)
    .links(links)

  node = svg.selectAll(".node").data(nodes)
  var appendedG = node.enter().append("g")
    .attr("class", "node")
    .call(force.drag)
    .on("mousedown", function(d) {
      d.fixed = true;
    });
  
  nodeCircle = appendedG.append("circle")
    .attr("r", function(d) {
      return 20;
    })
    .attr("fill", function(d) {
      return "#e48768";
    })
    .append("svg:title")
    .text(function(d) {
        return get_name(d.id);
    });
  
 nodeLabel = appendedG.append("text")
    .attr("class", "nodeLabel")
    .attr("y", 5)
    .text(function(d) {
      return d.id;
    });

  node.exit().remove();

  link = svg.selectAll(".link").data(links);
  linkLabelContainer = svg.selectAll(".linkLabel").data(links);
  
  linkLine = link.enter().append("line")
    .attr("class", "link")
    .style("stroke-width", 1);

  linkLabel = linkLabelContainer.enter().append("text")
    .attr("class", "linkLabel")
    .attr("dy", 5)
    .attr("filter", "url(#solid)")
    .text(function(d) {
      return d.similarity;
    });

  link.exit().remove();
  linkLabelContainer.exit().remove();

  force.on('tick', tick)
  force.start();
}


function tick() {

  link.attr("x1", function(d) {
      return d.source.x;
    })
    .attr("y1", function(d) {
      return d.source.y;
    })
    .attr("x2", function(d) {
      return d.target.x;
    })
    .attr("y2", function(d) {
      return d.target.y;
    });
  linkLabelContainer.attr("transform", function(d) { //calcul de l'angle du label
    var angle = Math.atan((d.source.y - d.target.y) / (d.source.x - d.target.x)) * 180 / Math.PI;
    return 'translate(' + [((d.source.x + d.target.x) / 2), ((d.source.y + d.target.y) / 2)] + ')rotate(' + angle + ')';
  });
  node.attr("transform", function(d) {
    return 'translate(' + [d.x, d.y] + ')';
  });
}

$().ready(function() {
  create_graph();
  add_nodes();
});
