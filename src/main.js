/*
pfmindmap
copyright people's feelings 2022
github.com/peoplesfeelings/pfmindmap
*/

import define from './notebook.js';
import * as d3 from "d3";
import {Runtime, Inspector} from "@observablehq/runtime";

const   TAG = 'pfmm - ',
        OPTIONS_DEFAULTS = {
            'item_width': 200,
            'force_unique_ids': true
        };

export default class { 
    constructor (containerEl, itemElCreator, options) {
        if (arguments.length != 3) {
            this.error('Constructor requires 3 parameters: a container element, a diagram item HTML element creator function, and an options object. See Readme for documentation. https://github.com/peoplesfeelings/pfmindmap');
        }
        if (typeof(containerEl) != 'object') {
            this.error('constructor first parameter should be a dom element');
        }
        if (typeof(itemElCreator) != 'function') {
            this.error('constructor second parameter should be a function');
        }
        if (typeof(options) != 'object') {
            this.error('constructor third parameter should be an object');
        }
        if ('item_width' in options && typeof(options.item_width) != 'number') {
            this.error("option.item_width should be a number");
        }
        if ('force_unique_ids' in options && typeof(options.force_unique_ids) != 'boolean') {
            this.error("option.force_unique_ids should be a boolean");
        }
        this.combinedOptions = Object.assign({}, OPTIONS_DEFAULTS, options);
        this.store = new Store(this.combinedOptions);

        /* 
            the observable runtime instance. 
            loads the notebook. 
            we pass an observer factory function, which assigns observers to a few of the 
            notebook's variables. 
        */
        this.main = new Runtime().module(define, notebookVariable => {
            if (notebookVariable === "chart") {
                return new Inspector(containerEl);
            }
            if (notebookVariable === "autoUpdate") {
                /* 
                    put an observer on this variable so the cell will run (at least) once, 
                    as soon as it is able to (when its observed variables resolve). the
                    variable is not observed by anything else so it would never run, otherwise.
                */ 
                return true;
            }
            if (notebookVariable === "zoomToStored") {
                /*
                    allows loading transform on window resize.
                    sets the internal transform of the zoom to the stored transform, whenever 
                    the chart is created. without this, event.transform starts at zoomIdentity.
                */
                return true;
            }
        });
        
        // add notebook variables
        this.main.define("container", [], containerEl );
        this.main.define("itemElCreator", [], () => { return itemElCreator; } );
        this.main.define("options", [], this.combinedOptions );

        let _this = this;
        let resizeTimeout;
        window.addEventListener('resize', function() {
            // timeout pattern solves issue of window.resize firing twice in some browsers, causing the chart cell to run twice
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(
                function() {
                    _this.main.redefine('dimens', [], [containerEl.clientWidth, containerEl.clientHeight]);
                }, 100);
            });
        d3.select(containerEl)
            .style("position", "relative")
            .style("cursor", "move");
    }

    addDataItems(dataArray) {
        this.store.addItems(dataArray);
    }
    updateSimulationData() {
        this.store.placeUnplaced();
        this.main.redefine('data', [], this.store.getData());
    }
    async zoomTo(level) {
        let chart = await this.main.value("chart");
        chart.zoomTo(level);
    }
    async freeze() {
        let chart = await this.main.value("chart");
        chart.freeze();
    }
    async centerView() {
        let chart = await this.main.value("chart");
        chart.centerView();
    }
    async untangle() {
        let chart = await this.main.value("chart");
        chart.untangle();
    }
    error(message) {
        throw 'pfmindmap error: ' + message;
    }
}

/*
    store data here before adding it to diagram.
    _placed is items for which we know we have the parent (confirmed part of hierarchical data structure). 
*/
class Store {
    constructor(opts) {
        this._placed = [];
        this._unplaced = [];
        this._opts = opts;
    }
    addItems(items) {
        if (this._opts.force_unique_ids) {
            for (let i = 0; i < items.length; i++) {
                if (this.isPlaced(items[i]) || this.isInUnplaced(items[i])) {
                    items.splice(i, 1);
                    i--;
                }
            }
        } 

        Array.prototype.push.apply(this._unplaced, items);
    }
    placeUnplaced() {
        // if we have added an element to _placed then we run this function again
        var needToGoAgain = false;

        for (let i = 0; i < this._unplaced.length; i++) {
            if (this.parentIsPlaced(this._unplaced[i])) {
                this._placed.push(this._unplaced[i]);
                this._unplaced.splice(i, 1);
                i--;
                needToGoAgain = true;
            }
        }

        if (needToGoAgain) {
            this.placeUnplaced();
        }
    }
    parentIsPlaced(item) {
        return this._placed.find(obj => obj.id == item.reply_to_id) || item.is_first;
    }
    isPlaced(item) {
        return this._placed.find(obj => obj.id == item.id);
    }
    isInUnplaced(item) {
        return this._unplaced.find(obj => obj.id == item.id);
    }
    getData() {
        return this._placed;
    }
}
