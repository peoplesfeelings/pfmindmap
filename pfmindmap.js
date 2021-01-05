/*

pfmindmap
copyright people's feelings 2020
github.com/peoplesfeelings

purpose of this module:
    easy way to implement a reactive, force-directed, scalable, customizable mind map, that has zoom, pan, and drag.
    meant to be a discussion interface, but message submit forms are up to you, and it works for non-discussion use cases, also.

dependencies (included):
    D3 v6
    Observable runtime

constructor params:
    containerEl:                dom element of visualization container
    itemCreatorReturner:        function that returns a function that returns an HTML element for the node items
    populateFunctionReturner:   function that returns a function that populates your node item elements.
                                the returned function should have (el, data) for parameters.
                                the returned function should return the HTML element it's passed, populated.
    options:                    options object

options
    item_width (required)       string with numerical characters only. pixels

usage:
    step 1. instantiate this es module, passing the args.
    step 2. start sending your item data to its receiveItem or receiveItems methods.
            the "is_first" item should be sent to the receiveItem method.
    step 3. call updateSimulationData() method when you want the visualization to update.
            you may want to do this whenever you add data, or, if loading a conversation with a 
            large number of replies, you may want to call this less frequently, or after all data is 
            loaded, to save on the frontend performance cost that comes, when updating the 
            visualization data, for very large conversations.

item data format:
    json object
    required keys:
        id              unique string
        reply_to_id     matching id of other item
        is_first        only required for one item. boolean true, otherwise false or just don't include it
    include whatever other key/value pairs you want. you will receive them in your 
        populator function data argument, to populate your node item element with

notes:
    works with reactive applications. just keep sending it data, whenever, and new items are appended to the diagram.
    the is_first item does not have to arrive first.
    the item referenced by a reply_to_id does not need to have arrived before the referencing item.
    loads D3 to the DOM, so 'd3' will be accessible anywhere, after instantiating the module.
    use pfmindmap.zoomTo(level) to set zoom level. number within zoom scaleExtent, such as 0.1. 

to use as a discussion interface
    to add a message submit form, you can put a reply button in your item el, with a listener that
        shows a message submit form, and sends the form the id being replied to. 
    submit the user's message from your form to your app's backend. then the user's message
        can get populated to the interface in the same way as the rest of the data.

example:
    <html>
    <body>
    <div id="some-div" style="height:100vh;"></div>
    <div style="display:none;">
        <div class="item-div" style="border: 1px solid black; background: white;"></div>
    </div>
    <script type="module">
        import pfmindmap from './pfmindmap/pfmindmap.js';
        var itemWithIsFirst = { 'id': '8843784378', 'reply_to_id': '', 'message': 'wazaaa', 'is_first': true };
        var otherItems = [
            { 'id': '8064783478', 'reply_to_id': '8843784378', 'message': 'wazaaaaaaa' },
            { 'id': '4785784534', 'reply_to_id': '8843784378', 'message': 'wazuhhhhh' },
            { 'id': '4398489489', 'reply_to_id': '4785784534', 'message': 'wasssaaahhh' },
            { 'id': '6734894958', 'reply_to_id': '4785784534', 'message': 'wauzzzuaaahhhh' },
            { 'id': '4783489548', 'reply_to_id': '8843784378', 'message': 'hey' }
        ];
        var itemCreatorReturner = () => {
            return () => {
                return document.querySelector('.item-div').cloneNode(true);
            }
        }
        var populateFunctionReturner = () => {
            return (item, data) => { 
                item.innerHTML = data["message"];
                return item; 
            }
        };
        var pfmmOptions = {'item_width': '200'}
        var pfmm = new pfmindmap(document.querySelector("#some-div"), itemCreatorReturner, populateFunctionReturner, pfmmOptions);
        pfmm.receiveItem(itemWithIsFirst);
        pfmm.receiveItems(otherItems);
        pfmm.updateSimulationData();
    </script>
    </body>
    </html>


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
