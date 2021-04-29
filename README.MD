### Purpose of this module
Easy way to create a mind map (a radial tree diagram) discussion interface, with the following functionality:
- works as reactive (continuous updates) or otherwise 
- entering items enter gracefully, near to the most recent ancestor that was already placed
- natural-looking, stable tree that makes economical use of space
- able to handle discussions of up to thousands of replies
- the individual items are completely customizable (both their appearance and what data fields they are populated from)
- zoom and pan like a map interface
- draggable items
- handles window resize events

### Summary
It&apos;s a JavaScript (ES6) module. The default export is a class.

### Usage
1. Instantiate the default class export of this ES module, passing its constructor your arguments.
2. Send the data for the root item to the <b>receiveItem</b> method.
3. Start sending reply data to your pfmindmap instance&apos;s <b>receiveItem</b> or <b>receiveItems</b> methods. 
4. Call the <b>updateSimulationData</b> method when you want the visualization to update. You may want to do this whenever you add data, or, if loading a conversation with a large number of replies, you may want to call this less frequently, or after all data is loaded, to save on the frontend performance cost that comes when updating the visualization data, for very large conversations.

### Class constructor parameters
- <b>containerEl</b>: DOM element of visualization container
- <b>itemCreator</b>: function that returns an HTML element for the items
- <b>itemPopulator</b>: function that populates your item elements. should have <b>(el, data)</b> for parameters and return the element it&apos;s passed, populated. (see example, below)
- <b>options</b>: options object

### Options keys
- <b>item_width</b>: string with numerical characters only. unit is pixels. default is '200'.

### Methods
- <b>receiveItem(data)</b>: takes a data object
- <b>receiveItems(array)</b>: takes an array of data objects
- <b>updateSimulationData()</b>: updates the visualization
- <b>zoomTo(level)</b>: to set zoom level, manually, if you want. Takes a numerical value, within the zoom scaleExtent specified in notebook.js, such as 0.1.
- <b>freeze()</b>: freezes the simlation. It will unfreeze again if the user drags an item. 
- <b>centerView()</b>: centers the diagram in the viewport
- <b>untangle()</b>: a way to untangle anything that might be tangled in the diagram

### Item data format
+ JSON object
+ required keys:
    + <b>id</b>: unique string
    + <b>reply_to_id</b>: matching <b>id</b> of other item
    + <b>is_first</b>: only required for one item, the root item. boolean true, otherwise false or just don&apos;t include it. marks the beginning message of the conversation
+ include whatever other key/value pairs you want. you will receive them in your populator function <b>data</b> argument, to populate your item element with

### Notes
- For continuous updates, just keep sending it data, with the <b>receiveItem</b> or <b>receiveItems</b> methods, and call the <b>updateSimulationData</b> method when you want the new items to be appended to the diagram.
- The <b>is_first</b> item does not have to arrive first, and the item referenced by a <b>reply_to_id</b> does not need to have arrived before the referencing item. 
- This module loads D3 to the DOM, so <b>d3</b> will be accessible anywhere, after instantiating the default class export of this module.
- This module is meant for discussion interfaces, but it works for non-discussion use cases, also (any hierarchical tree).

### To use as a discussion interface
- To add a message submit form, put a reply button in your item element, with a listener that shows a message submit form, and sends that form the <b>id</b> being replied to. 
- Submit the user&apos;s message from your form to your app&apos;s backend. Then the user&apos;s message can get populated to the interface in the same way as the rest of the data.

### Complete Example
Clone this repo, put the directory (named "pfmindmap") in the same directory as the following HTML file, and open it in a web server.
```
<html>
<body>
<div id="container-div" style="min-height:100vh;"></div>

<div style="display:none;">
    <div class="item-to-clone" style="border: 1px solid black; background: white; border-radius: 5px; min-height: 50px; padding: 10px;"></div>
</div>

<script type="module">
    import pfmindmap from './pfmindmap/pfmindmap.js';
    
    var rootItem = { 'id': '8843784378', 'reply_to_id': '', 'message': 'first message', 'is_first': true };
    var replies = [<html>
<body>
<div id="container-div" style="min-height:100vh;"></div>

<div style="display:none;">
    <div class="item-to-clone" style="border: 1px solid black; background: white; border-radius: 5px; min-height: 50px; padding: 10px;"></div>
</div>

<script type="module">
    import pfmindmap from './pfmindmap/pfmindmap.js';
    
    var rootItem = { 'id': '8843784378', 'reply_to_id': '', 'message': 'wazaaa', 'is_first': true };
    var replies = [
        { 'id': '8064783478', 'reply_to_id': '8843784378', 'message': 'first level reply' },
        { 'id': '4785784534', 'reply_to_id': '8843784378', 'message': 'another first level reply' },
        { 'id': '4398489489', 'reply_to_id': '4785784534', 'message': 'second level reply text' },
        { 'id': '6734894958', 'reply_to_id': '4785784534', 'message': 'another 2nd level reply' },
        { 'id': '6733494934', 'reply_to_id': '6734894958', 'message': 'a 3rd level reply' },
        { 'id': '6734894923', 'reply_to_id': '6734894958', 'message': 'another 3rd level reply' },
        { 'id': '6734894912', 'reply_to_id': '6734894923', 'message': '4th level reply' },
        { 'id': '4783489548', 'reply_to_id': '8843784378', 'message': 'this is another first level reply' }
    ];
    var itemCreator = () => {
        return document.querySelector('.item-to-clone').cloneNode(true);
    }
    var itemPopulator = (item, data) => { 
        item.innerHTML = data["message"];
        return item; 
    }
    var pfmm = new pfmindmap(document.querySelector("#container-div"), itemCreator, itemPopulator, { 'item_width': '300'});
    
    pfmm.receiveItem(rootItem);
    pfmm.receiveItems(replies);
    pfmm.updateSimulationData();
    pfmm.zoomTo(0.3);
</script>
</body>
</html>
    ];
    var itemCreator = () => {
        return document.querySelector('.item-to-clone').cloneNode(true);
    }
    var itemPopulator = (item, data) => { 
        item.innerHTML = data["message"];
        return item; 
    }
    var pfmm = new pfmindmap(document.querySelector("#container-div"), itemCreator, itemPopulator, {});
    
    pfmm.receiveItem(rootItem);
    pfmm.receiveItems(replies);
    pfmm.updateSimulationData();
    pfmm.zoomTo(0.3);
</script>
</body>
</html>
```

### Dependencies (included)
- D3 v6
- Observable runtime

### License
- BSD 2 clause

### Version
1.3.1