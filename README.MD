### Purpose of this module
Easy way to create a mind map (radial, hierarchical tree diagram) discussion interface, including these features:
- works as reactive (continuous updates) or otherwise 
- natural-looking tree that makes economical use of space
- able to handle discussions of up to thousands of replies
- the individual items are completely customizable (both their appearance and what data fields they are populated with)
- zoom and pan like a map interface
- draggable items

### Summary
It&apos;s a JavaScript (ES6) module. The default export is a class.

### Usage
1. Instantiate this ES module, passing the constructor your arguments.
2. Start sending your item data to your pfmindmap instance&apos;s <b>receiveItem</b> or <b>receiveItems</b> methods. The item marked as <b>is_first</b> should be sent to the <b>receiveItem</b> method.
3. Call the <b>updateSimulationData</b> method when you want the visualization to update. You may want to do this whenever you add data, or, if loading a conversation with a large number of replies, you may want to call this less frequently, or after all data is loaded, to save on the frontend performance cost that comes when updating the visualization data, for very large conversations.

### Class constructor parameters
- <b>containerEl</b>: DOM element of visualization container
- <b>itemCreatorReturner</b>: function that returns a function that returns an HTML element for the items
- <b>populateFunctionReturner</b>: function that returns a function that populates your item elements. The returned function should have <b>(el, data)</b> for parameters. The returned function should return the element it&apos;s passed, populated. (see example, below)
- <b>options</b>: options object

### Options keys
- <b>item_width</b> (required): string with numerical characters only. pixels

### Methods
- <b>zoomTo(level)</b>: to set zoom level, manually, if you want. Takes a numerical value, within the zoom scaleExtent specified in notebook.js, such as 0.1.
- <b>receiveItem(data)</b>: takes a data object
- <b>receiveItems(array)</b>: takes an array of data objects
- <b>updateSimulationData()</b>: updates the visualization

### Item data format
+ JSON object
+ required keys:
    + <b>id</b>: unique string
    + <b>reply_to_id</b>: matching <b>id</b> of other item
    + <b>is_first</b>: only required for one item. boolean true, otherwise false or just don&apos;t include it. marks the beginning message of the conversation
+ include whatever other key/value pairs you want. you will receive them in your populator function <b>data</b> argument, to populate your item element with

### Notes
- For continuous updates, just keep sending it data, with the <b>receiveItem</b> or <b>receiveItems</b> methods, and call the <b>updateSimulationData</b> method when you want the new items to be appended to the diagram.
- The <b>is_first</b> item does not have to arrive first.
- The item referenced by a <b>reply_to_id</b> does not need to have arrived before the referencing item. 
- This module loads D3 to the DOM, so <b>d3</b> will be accessible anywhere, after instantiating the module.
- This module is meant for discussion interfaces, but it works for non-discussion use cases, also (any hierarchical tree).

### To use as a discussion interface
- To add a message submit form, you can put a reply button in your item element, with a listener that shows a message submit form, and sends that form the <b>id</b> being replied to. 
- Submit the user&apos;s message from your form to your app&apos;s backend. Then the user&apos;s message can get populated to the interface in the same way as the rest of the data.

### Complete Example
Clone this repo, put the directory in the same directory as the following HTML file, and open it in a web server.
```
<html>
<body>

<!-- container div -->
<div id="some-div" style="height:100vh;"></div>

<!-- item element to be cloned, in a hidden div -->
<div style="display:none;">
    <div class="item-div" style="border: 1px solid black; background: white;"></div>
</div>

<script type="module">
    import pfmindmap from './pfmindmap/pfmindmap.js';
    
    // some dummy data, one of them marked with 'is_first' (the root item)
    var itemWithIsFirst = { 'id': '8843784378', 'reply_to_id': '', 'message': 'wazaaa', 'is_first': true };
    var otherItems = [
        { 'id': '8064783478', 'reply_to_id': '8843784378', 'message': 'wazaaaaaaa' },
        { 'id': '4785784534', 'reply_to_id': '8843784378', 'message': 'wazuhhhhh' },
        { 'id': '4398489489', 'reply_to_id': '4785784534', 'message': 'wasssaaahhh' },
        { 'id': '6734894958', 'reply_to_id': '4785784534', 'message': 'wauzzzuaaahhhh' },
        { 'id': '4783489548', 'reply_to_id': '8843784378', 'message': 'hey' }
    ];
    
    // just return a copy of your unpopulated item element
    var itemCreatorReturner = () => {
        return () => {
            return document.querySelector('.item-div').cloneNode(true);
        }
    }
    
    // you decide how to populate your item with your data
    var populateFunctionReturner = () => {
        return (item, data) => { 
            item.innerHTML = data["message"];
            return item; 
        }
    };
    
    // instantiate
    var pfmmOptions = {'item_width': '200'}
    var pfmm = new pfmindmap(document.querySelector("#some-div"), itemCreatorReturner, populateFunctionReturner, pfmmOptions);
    
    // send it data
    pfmm.receiveItem(itemWithIsFirst);
    pfmm.receiveItems(otherItems);
    
    // you control when you want the visualization to update. call this to update it
    pfmm.updateSimulationData();

    // call this if you want to manually set an initial zoom level
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