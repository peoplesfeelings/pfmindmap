/*

pfmindmap
copyright people's feelings 2020
github.com/peoplesfeelings


*/

import "./dependencies/d3/d3.v6.min.js";
import {Runtime, Library, Inspector} from './dependencies/observable/runtime.js';
import define from './notebook.js';


const TAG = 'pfmm - ';

export default class { 
    constructor (containerEl, itemCreatorReturner, populateFunctionReturner, options) {
        if (arguments.length != 4) {
            this.error('constructor expected 4 parameters: containerEl, itemReturner, populateFunctionReturner, and options object');
        }
        if (typeof(containerEl) != 'object') {
            this.error('constructor first parameter should be a dom element');
        }
        if (typeof(itemCreatorReturner) != 'function') {
            this.error('constructor second parameter should be a function');
        }
        if (typeof(populateFunctionReturner) != 'function') {
            this.error('constructor third parameter should be a function');
        }
        if (typeof(options) != 'object') {
            this.error('constructor fourth parameter should be an object');
        }
        if (!options['item_width']) {
            this.error('option item_width is required');
        }
        this.store = new store();

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
                return {
                  fulfilled: (value) => {
                    value();
                }};
            }
        });
        
        this.main.define("container", [], containerEl );
        this.main.define("populate", [], populateFunctionReturner );
        this.main.define("itemCreator", [], itemCreatorReturner );
        this.main.define("options", [], options );

        let _this = this;
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(
                function() {
                    _this.main.redefine('dimens', [], [containerEl.clientWidth, containerEl.clientHeight]);
                }, 500);
            });
        d3.select(containerEl).style("position", "relative");
        d3.select(containerEl).style("cursor", "move");
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
        let zoomToChart = await this.main.value("zoomTo");
        zoomToChart(level);
    }
    error(message) {
        throw 'PFMindMap error: ' + message;
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
        this._store = [];
        this._unplaced = [];
    }
    addItem(item) {
        if (item['is_first'] || this.parentIsPlaced(item)) {
            this._store.push(item);
        } else {
            this._unplaced.push(item);
        }
    }
    addItems(items) {
        Array.prototype.push.apply(this._unplaced, items)
    }
    placeUnplaced() {
        var needToGoAgain = false;

        for (let i = 0; i < this._unplaced.length; i++) {
            if (this.parentIsPlaced(this._unplaced[i])) {
                this._store.push(this._unplaced[i]);
                this._unplaced.splice(i, 1);
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
        return this._store;
    }
    getUnplaced() {
        return this._unplaced;
    }
    info() {
        return '_store length: ' + this._store.length + '\n_unplaced length: ' + this._unplaced.length;
    }
}
