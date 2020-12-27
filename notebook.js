/*

pfmindmap
copyright people's feelings 2020

*/


export default function define(runtime, observer) {
    const main = runtime.module();
    const CONSOLE_TAG = "notebook - ";

    main.variable(observer("chart")).define("chart", 
      ["dimens", "drag", "invalidation", "itemCreator", "nodeFinder", "options", "mutableTransform", "populate"], 
      function(dimens, drag, invalidation, itemCreator, nodeFinder, options, mutableTransform, populate) {
        let nodeWidth = options['item_width'];

        const simulation = d3.forceSimulation()
            .alphaDecay(.05)
            .force("link", d3.forceLink().id(d => d.id).distance(nodeWidth/2).iterations(5).strength(0.4))
            .force("charge", d3.forceManyBody().strength(-55000))
            .force("collision", d3.forceCollide(d => {
                return Math.sqrt(d.width * d.width + d.height * d.height) / 2
            }).iterations(4))
            .force("x", d3.forceX().strength(0.3))
            .force("y", d3.forceY().strength(0.3))
            .force("center", d3.forceCenter().strength(0.4));

        const svg = d3.create("svg")
            .attr("viewBox", [-1*dimens[0] / 2, -1*dimens[1] / 2, dimens[0], dimens[1]]);

        let zoom = d3.zoom()
            .extent([[0, 0], [dimens[0], dimens[1]]])
            .scaleExtent([0.01, 8])
            .on("zoom", zoomed);

        svg.call(zoom);

        let link = svg.append("g")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.7)
            .attr("stroke-width", 3)
            .selectAll("line");

        let node = svg.append("g")
            .attr("id", "nodesG")
            .selectAll("rect");

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("x", d => d.x - nodeWidth/2)
                .attr("y", d => d.y - d['height']/2);
        });

        invalidation.then(() => simulation.stop());

        function zoomed({transform}) {
            mutableTransform.value = transform;
            node.attr("transform", transform);
            link.attr("transform", transform);
        }

        return Object.assign(svg.node(), {
            update: (dataNodes, dataLinks) => {
                let nodeData = node.data();
                const old = new Map(nodeData.map(d => [d.id, d]));
                dataNodes = dataNodes.map(d => Object.assign(old.get(d.id) || {}, d));
                dataLinks = dataLinks.map(d => Object.assign({}, d));

                node = node
                .data(dataNodes, d => d.id)
                .join(
                    enter => enter.append(function(d) {
                        let theClone = populate(itemCreator(), d);
                        // set width
                        theClone.style.boxSizing = "border-box";
                        theClone.style.width = nodeWidth + "px";
                        d['width'] = nodeWidth;
                        // get height
                        theClone.style.visibility = "hidden";
                        document.body.appendChild(theClone);
                        d['height'] = theClone.getBoundingClientRect().height;
                        theClone.remove();
                        theClone.style.visibility = "visible";

                        let rawFo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
                        rawFo.setAttribute("width", d['width']);
                        rawFo.setAttribute("height", d['height']);
                        rawFo.setAttribute("transform", mutableTransform.value);
                        rawFo.appendChild(theClone);

                        return rawFo;
                    })
                )
                .call(drag(simulation).subject(subject));

                link = link
                    .data(dataLinks, d => [d.source, d.target])
                    .join("line")
                    .attr("transform", mutableTransform.value);

                simulation.nodes(dataNodes);
                simulation.force("link").links(dataLinks);
                simulation.alpha(1).restart();

                function subject(event, d) {
                    const   x = mutableTransform.value.invertX(event.x),
                            y = mutableTransform.value.invertY(event.y);
                    const node = nodeFinder(dataNodes, x, y, nodeWidth);
                    if (node) {
                        node.x = mutableTransform.value.applyX(node.x);
                        node.y = mutableTransform.value.applyY(node.y);
                    }
                    return node;
                }
            },
            zoomTo: (level) => {
                svg.transition(d3.transition()
                    .duration(1500)
                    .ease(d3.easeQuadInOut)
                ).call(zoom.scaleTo, level, [0,0]);
            },
            zoomToStored: () => {
                svg.call(zoom.scaleTo, mutableTransform.value.k, [mutableTransform.value.x,mutableTransform.value.y]);
            }
        });
    });

    main.variable(observer("nodeFinder")).define("nodeFinder", [], function(){
        return (nodes, x, y, width) => {
            let i;
            for (i = nodes.length - 1; i >= 0; --i) {
                if (
                    x >= nodes[i].x - (width/2) && x <= nodes[i].x + (width/2) &&
                    y >= nodes[i].y - (nodes[i].height/2) && y <= nodes[i].y + (nodes[i].height/2)
                ) {
                    return nodes[i];
                }
            }
            return undefined; 
        }
    });

    main.variable(observer("zoomTo")).define("zoomTo", ["chart"], function(chart){
        return (
            (level) => {
                chart.zoomTo(level);
            }
        )
    });

    main.variable(observer("zoomToStored")).define("zoomToStored", ["chart"], function(chart){
        return (
            () => {
                chart.zoomToStored();
            }
        )
    });

    main.variable(observer("data")).define("data", function(){
        return []
    });

    main.variable(observer("autoUpdate")).define("autoUpdate", ["chart", "data"], function(chart, data){
        function getLinks(dataNodes) {
            let links = [];
            for (var item of dataNodes) {
                if (item['is_first']) {
                    continue;
                }
                links.push({source: item['id'], target: item['reply_to_id']});
            }
            return links;
        }

        return (chart.update(data, getLinks(data)))
    });

    main.variable(observer("dimens")).define("dimens", ["container"], function(container) {
        return [container.clientWidth, container.clientHeight]
    });

    main.variable(observer()).define("drag", ["d3"], function(d3) {
        return (
            simulation => {
                let isFirstEvent = true;
                function dragstarted(event, d) {
                    let transform = d3.zoomTransform(this);
                    d.x = transform.invertX(event.x);
                    d.y = transform.invertY(event.y);
                }
                function dragged(event, d) {
                    if (isFirstEvent) {
                        simulation.alphaTarget(0.5).alpha(0.51).restart();
                        let transform = d3.zoomTransform(this);
                        d.fx = transform.invertX(event.x);
                        d.fy = transform.invertY(event.y);
                        isFirstEvent = false;
                    }
                    let transform = d3.zoomTransform(this);
                    d.fx = transform.invertX(event.x);
                    d.fy = transform.invertY(event.y);
                }
                function dragended(event, d) {
                    isFirstEvent = true;
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }
                return d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended);
            }
        )
    });

    main.variable(observer("foreignObjects")).define("foreignObjects", ["autoUpdate","chart","d3"], function(autoUpdate,chart,d3){
        return( d3.select(chart).select("g#nodesG").selectAll("foreignObject") )
    });

    main.define("initialTransform", function(){
        return( d3.zoomIdentity )
    });

    main.variable(observer("mutableTransform")).define("mutableTransform", 
        ["Mutable", "initialTransform"], 
        (M, _) => new M(_)
    );

    main.variable(observer("transform")).define("transform", 
        ["mutableTransform"], 
        _ => _.generator
    );

    return main;
}

