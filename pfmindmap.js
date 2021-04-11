/*

pfmindmap
copyright people's feelings 2020
github.com/peoplesfeelings/pfmindmap


*/

import "./dependencies/d3/d3.v6.min.js";
import {Runtime, Library, Inspector} from './dependencies/observable/runtime.js';
import define from './notebook.js?v=1.2.1';


const   TAG = 'pfmm - ',
        OPTIONS_DEFAULTS = {
            'item_width': '200'
        };

export default class { 
    constructor (containerEl, itemCreator, itemPopulator, options) {
        if (arguments.length != 4) {
            this.error('constructor expected 4 parameters: containerEl, itemCreator, itemPopulator, and options object');
        }
        if (typeof(containerEl) != 'object') {
            this.error('constructor first parameter should be a dom element');
        }
        if (typeof(itemCreator) != 'function') {
            this.error('constructor second parameter should be a function');
        }
        if (typeof(itemPopulator) != 'function') {
            this.error('constructor third parameter should be a function');
        }
        if (typeof(options) != 'object') {
            this.error('constructor fourth parameter should be an object');
        }
        this.store = new store();
        this.combinedOptions = Object.assign({}, OPTIONS_DEFAULTS, options);

        this.main = new Runtime().module(define, observerFunctionParam => {
            if (observerFunctionParam === "chart") {
                return new Inspector(containerEl);
            }
            if (observerFunctionParam === "autoUpdate") {
                return true;
            }
            if (observerFunctionParam === "zoomToStored") {
                /*
                    allows loading transform on window resize.
                    sets the internal transform of the zoom to the stored transform, whenever 
                    the chart is created. without this, event.transform starts at zoomIdentity.
                */
                return true;
            }
        });
        
        this.main.define("container", [], containerEl );
        this.main.define("populate", [], () => { return itemPopulator; } );
        this.main.define("itemCreator", [], () => { return itemCreator; } );
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

    receiveItem(itemData) {
        this.store.addItem(itemData);
    }
    receiveItems(dataArray) {
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
    error(message) {
        throw 'pfmindmap error: ' + message;
    }
    // debug stuff
    getStoreString() {
        return JSON.stringify(this.store.getData(), null, 2);
    }
    getUnplacedString() {
        return JSON.stringify(this.store.getUnplaced(), null, 2);
    }
    info() {
        return 'store: \n' + this.store.info();
    }
}

class store {
    constructor() {
        this._placed = [];
        this._unplaced = [];
    }
    addItem(item) {
        if (item['is_first'] || this.parentIsPlaced(item)) {
            this.getData().push(item);
        } else {
            this.getUnplaced().push(item);
        }
    }
    addItems(items) {
        Array.prototype.push.apply(this.getUnplaced(), items)
    }
    placeUnplaced() {
        var needToGoAgain = false;

        for (let i = 0; i < this.getUnplaced().length; i++) {
            if (this.parentIsPlaced(this.getUnplaced()[i])) {
                this.getData().push(this.getUnplaced()[i]);
                this.getUnplaced().splice(i, 1);
                needToGoAgain = true;
            }
        }

        if (needToGoAgain) {
            this.placeUnplaced();
        }
    }
    parentIsPlaced(item) {
        return this.getData().find(obj => obj['id'] == item['reply_to_id']);
    }
    getData() {
        return this._placed;
    }
    getUnplaced() {
        return this._unplaced;
    }
    info() {
        return '_placed length: ' + this.getData().length + '\n_unplaced length: ' + this.getUnplaced().length;
    }
}
