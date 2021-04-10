/*

pfmindmap
copyright people's feelings 2020
github.com/peoplesfeelings/pfmindmap

*/


export default function define(runtime, observer) {
    const main = runtime.module();
    const CONSOLE_TAG = "notebook - ";

    main.variable(observer("chart")).define("chart", 
      ["dimens", "drag", "invalidation", "itemCreator", "options", "mutableTransform", "populate"], 
      function(dimens, drag, invalidation, itemCreator, options, mutableTransform, populate) {

        const simulation = d3.forceSimulation()
            .alphaDecay(.04)
            .alphaMin(.6001)
            .alphaTarget(.6)
            .velocityDecay(0.6)
            .force("link", d3.forceLink().id(d => d.id).distance(options['item_width']/2).iterations(5).strength(0.4))
            .force("charge", d3.forceManyBody().strength(-55000).distanceMin(d => d['radius'] * 2))
            .force("collision", d3.forceCollide(d => { return d.radius }).iterations(1))
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
            .selectAll("foreignObject");

        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("x", d => d.x - options['item_width']/2)
                .attr("y", d => d.y - d['height']/2);
        });

        invalidation.then(() => simulation.stop());

        function zoomed({transform}) {
            mutableTransform.value = transform;
            node.attr("transform", transform);
            link.attr("transform", transform);
        }

        return Object.assign(svg.node(), {
            // d3 pattern for introducing new data while keeping position data of existing data
            update: (dataNodes, dataLinks) => {
                const oldNodeDataWithIdKeys = new Map(node.data().map(d => [d.id, d])),
                      dataNodesWithOld = dataNodes.map(d => Object.assign(oldNodeDataWithIdKeys.get(d.id) || {}, d));

                node = node.data(dataNodesWithOld, d => d.id)
                    .join(
                        enter => enter.append(function(d) {
                            // entering items get positioned next to most recent ancestor with position
                            d = setPosToAncestor(d, dataNodesWithOld);
                            let newItem = populate(itemCreator(), d);

                            newItem.style.boxSizing = "border-box";
                            newItem.style.width = options['item_width'] + "px";
                            d['width'] = options['item_width'];
                            // temporarily hide it and add to dom to get height
                            newItem.style.visibility = "hidden";
                            document.body.appendChild(newItem);
                            d['height'] = newItem.getBoundingClientRect().height;
                            newItem.remove();
                            newItem.style.visibility = "visible";
                            // set radius for collide. (radius of rectangle's enclosing circle is half its diagonal)
                            d['radius'] = Math.sqrt(d.width * d.width + d.height * d.height) / 2;

                            if (d['is_first']) {
                                d['fx'] = 0;
                                d['fy'] = 0;
                            }

                            let rawFo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
                            rawFo.setAttribute("width", d['width']);
                            rawFo.setAttribute("height", d['height']);
                            rawFo.setAttribute("transform", mutableTransform.value);
                            rawFo.appendChild(newItem);

                            return rawFo;
                        })
                    )
                    .call(drag(simulation).subject(subject));

                link = link.data(dataLinks, d => [d.source, d.target])
                    .join("line")
                    .attr("transform", mutableTransform.value);

                simulation.nodes(dataNodesWithOld);
                simulation.force("link").links(dataLinks);
                simulation.alpha(1).restart();

                // helper functions used in this 'update' method
                function movePosByRadius(x, y, r) {
                    // radians
                    var randomAngle = Math.random()*Math.PI*2;
                    // opp = hyp * sin(θ)
                    var opp = r * Math.sin(randomAngle);
                    // pythagorean
                    // var adj = Math.sqrt(r * r + opp * opp);
                    return [x + opp, y + Math.sqrt(r * r + opp * opp)];
                }
                function setPosToAncestor(itemDatum, itemsData) {
                    let transform = mutableTransform.value;

                    if (itemDatum['is_first']) {
                        return itemDatum;
                    }
                    let firstParentWithPos = getFirstAncestorWithPos(itemDatum['reply_to_id'], itemsData);
                    if (firstParentWithPos === null) {
                        return itemDatum;
                    } else {
                        let posAtEdgeOfParent = movePosByRadius(firstParentWithPos['x'], firstParentWithPos['y'], firstParentWithPos['radius'] * 2);

                        itemDatum['x'] = posAtEdgeOfParent[0];
                        itemDatum['y'] = posAtEdgeOfParent[1];
                        
                        return itemDatum;
                    }
                }
                function getFirstAncestorWithPos(parentId, data) {
                    /* first parent with position, unless it's the root node */
                    for (var item of data) {
                        if (item['id'] == parentId) {
                            if (item['is_first']) {
                                return null;
                            }
                            if ('x' in item && 'y' in item) {
                                return item;
                            } else {
                                return getFirstAncestorWithPos(item['reply_to_id'], data);
                            }
                        }
                    }
                }
                // nodeFinder/subject pattern: d3 pattern that allows drag and zoom to work together
                function nodeFinder(nodes, x, y, width) {
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
                function subject(event, d) {
                    const   x = mutableTransform.value.invertX(event.x),
                            y = mutableTransform.value.invertY(event.y),
                            node = nodeFinder(dataNodesWithOld, x, y, options['item_width']);
                    if (node) {
                        node.x = mutableTransform.value.applyX(node.x);
                        node.y = mutableTransform.value.applyY(node.y);
                    }
                    return node;
                }
            },
            zoomTo: (level) => {
                svg.transition()
                    .duration(1500)
                    .ease(d3.easeQuadInOut)
                    .call(zoom.scaleTo, level, [0,0]);
            },
            zoomToStored: () => {
                svg.call(zoom.scaleTo, mutableTransform.value.k, [mutableTransform.value.x,mutableTransform.value.y]);
            },
            freeze: () => {
                simulation.stop();
            },
            centerView: () => {
                let centeredTransform = d3.zoomIdentity.scale(mutableTransform.value.k);
                svg.transition()
                    .duration(500)
                    .ease(d3.easeQuadInOut)
                    .call(zoom.transform, centeredTransform);
            }
        });
    });

    main.variable(observer("data")).define("data", function(){
        return []
    });

    main.variable(observer("autoUpdate")).define("autoUpdate", ["chart", "data"], function(chart, data){
        function createLinkArray(dataNodes) {
            let links = [];
            for (var item of dataNodes) {
                if (item['is_first']) {
                    continue;
                }
                links.push({source: item['id'], target: item['reply_to_id']});
            }
            return links;
        }

        chart.update(data, createLinkArray(data))
    });

    main.variable(observer("dimens")).define("dimens", ["container"], function(container) {
        return [container.clientWidth, container.clientHeight]
    });

    main.variable().define("drag", [], function() {
        return (
            simulation => {
                let isFirstEvent = true;
                function dragstarted(event, d) {
                    let transform = d3.zoomTransform(this);
                    d.x = transform.invertX(event.x);
                    d.y = transform.invertY(event.y);
                }
                function dragged(event, d) {
                    // using isFirst is a solution to the issue of drag getting activated for click events
                    if (isFirstEvent) {
                        simulation.alphaMin(0).restart();
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
                    if (!event.active) simulation.alphaMin(0.6001).alpha(.61);
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

    // if chart is recreated because user resized their window, this prevents the zoom level being reset to baseline
    main.variable(observer("zoomToStored")).define("zoomToStored", ["chart"], function(chart){
        chart.zoomToStored();
    });

    // mutable/initial pattern: observable pattern that allows a cell to be changed by a cell that observes it, while having an initial value
    main.variable().define("initialTransform", [], function(){
        return d3.zoomIdentity;
    });

    main.variable(observer("mutableTransform")).define("mutableTransform", ["Mutable", "initialTransform"], function(Mutable, initialTransform) {
        return new Mutable(initialTransform);
    });

    return main;
}

