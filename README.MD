### Summary
It&apos;s a JavaScript ES6 module. The default export is a class.

### Purpose 
To provide an easy way to implement a mind map interface. Useful for discussion interfaces or hierarchical data visualizations. It&apos;s kind of a D3 wrapper that gives you a certain set of features ready to go, and extends simple endpoints. That feature set is:
- works as reactive (continuous updates) or otherwise 
- entering items enter gracefully, near to the most recent ancestor that was already placed
- natural-looking, stable tree that makes economical use of space (accomplished with D3&apos;s force simulation)
- scales to thousands of diagram items
- diagram items are customizable in appearance and data model (you provide HTML for item, and a populator function)
- zoom and pan like a map interface
- draggable items
- handles window resize events
- data can arrive out of order (only items that can be placed in the tree are displayed)

### Installation
There are two ways to install this module.

**For JS apps that support ES modules and NodeJS module resolution:**
```
npm install github:peoplesfeelings/pfmindmap#react
```
and then
```
import pfmindmap from "pfmindmap";
```

**For web pages that are not bundled JS apps, and other cases:**
```
git clone https://github.com/peoplesfeelings/pfmindmap.git
git checkout react
npm install
npm run makebundle
```
That will generate a bundle in the `/dist` directory that includes the dependencies. Import that like this:
```
<script type="module"> 
    import pfmindmap from 'path/to/pfmindmap_bundle.js'; 
</script>
```

### Usage
1. Instantiate the default class export of this ES module.
2. Start sending data to your pfmindmap instance&apos;s **receiveItem** or **receiveItems** methods. 
3. Call the **updateSimulationData** method when you want the visualization to update.

### Class constructor parameters
- **containerEl**: DOM element (or ReactRef) of visualization container
- **itemCreator**: Function that returns an HTML element for an item (not populated with data)
- **itemPopulator**: Function that populates an item HTML element with data. Should have **(el, data)** for parameters and return the element it&apos;s passed, populated.
- **options**: options object

### Options
- **item_width**: numerical value. unit is pixels. default is 200

### Methods
- **receiveItem(data)**: takes a data object
- **receiveItems(array)**: takes an array of data objects
- **updateSimulationData()**: updates the visualization
- **zoomTo(level)**: to set zoom level, manually, if you want. Takes a numerical value, within the zoom scaleExtent specified in notebook.js, such as 0.1.
- **freeze()**: a way to temporarily freeze the simlation, manually, if you want 
- **centerView()**: a way to center the diagram in the viewport, such as if the user has panned and wants to recenter
- **untangle()**: a way to untangle anything that might be tangled in the diagram

### Item data format
+ JSON object
+ required keys:
    + **id**: unique string
    + **reply_to_id**: matching **id** of other item
    + **is_first**: only required for one item, the root item. boolean true, otherwise false or just don&apos;t include it. marks the root item.
+ Include whatever other key/value pairs you want. You will receive them in your populator function **data** argument, to populate your item element with

### Notes
- For continuous updates, just keep sending it data, with the **receiveItem** or **receiveItems** methods, and call the **updateSimulationData** method when you want the new items to be appended to the diagram.
- This module loads D3 to the DOM, so **d3** will be accessible anywhere, after instantiating the default class export of this module.

### To use as a discussion interface
- To add a message submit form, put a reply button in your item element, with a listener that shows a message submit form and sends that form the **id** being replied to. 
- If you are cloning an element in your itemCreator function then event handlers don&apos;t get cloned but you can use event delegation: put the listener on the container and check for the intended event.target in that handler. 
- You can get the **id** by finding the parent **foreignObject** of your item element and getting the **data-pfmm-id** attribute value from it. Ex: `event.target.closest('foreignObject').dataset.pfmmId`
- Submit the user&apos;s message from your form to your app&apos;s backend. Then the user&apos;s message can get populated to the interface in the same way as the rest of the data.

### Example
```
<html>
<head>
    <style>
        .item-to-clone { cursor: default; }
        .item-to-clone:active { cursor: grabbing; }
    </style>
</head>
<body>
    <div id="container-div" style="min-height:100vh;"></div>

    <div style="display:none;">
        <div class="item-to-clone" style="border: 1px solid black; background: white; border-radius: 5px; min-height: 50px; padding: 10px;"></div>
    </div>

    <script type="module">
        import pfmindmap from 'path/pfmindmap_bundle.js';
        
        var data = [
            { 'id': '8843784378', 'reply_to_id': '', 'message': 'wazaaa', 'is_first': true },
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
        };
        var itemPopulator = (item, data) => { 
            item.innerHTML = data["message"];
            return item; 
        };
        var pfmm = new pfmindmap(document.querySelector("#container-div"), itemCreator, itemPopulator, { 'item_width': 300 });
        pfmm.receiveItems(data);
        pfmm.updateSimulationData();
        pfmm.zoomTo(0.3);
    </script>
</body>
</html>
```

### Built with
- D3 v6.3.0
- Observable runtime v4.8.0

### License
- BSD 2 clause