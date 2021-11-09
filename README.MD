### Summary
It&apos;s a JavaScript ES6 module. The default export is a class.

### Purpose 
To provide an easy way to implement a mind map interface. Useful for discussion interfaces or hierarchical data visualizations. It&apos;s kind of a D3 wrapper that gives you a certain set of features ready to go, and extends simple endpoints. That feature set is:
- diagram items can be continually added
- entering items enter gracefully, near to the most recent ancestor that was already placed
- natural-looking, stable tree that makes economical use of space (accomplished with D3&apos;s force simulation)
- scales to thousands of diagram items
- diagram items are customizable in appearance and data model (the implementing app provides a function that takes a data argument and returns an HTML element for that diagram item)
- zoom and pan like a map interface
- diagram items are draggable 
- handles window resize events
- data can arrive out of order (only items that can be placed in the tree are displayed)

### Importing
There are two ways to import this module.

**For JS apps that support ES modules and NodeJS module resolution:**
```
npm install pfmindmap
```
then:
```
import pfmindmap from "pfmindmap";
```

**For web pages that are not JS apps, and other cases:**
```
git clone https://github.com/peoplesfeelings/pfmindmap.git
cd pfmindmap
npm install
npm run makebundle
```
That will generate a JS (ES6) module format bundle in the `/dist` directory that includes the dependencies. Import that like this:
```
<script type="module"> 
    import pfmindmap from './path/to/pfmindmap_bundle.js'; 
</script>
```

### Usage
1. Instantiate the default class export of this ES module.
2. Add data using the pfmindmap instance&apos;s **addDataItems** method. 
3. Call the **updateSimulationData** method for the visualization to update.

### Class constructor parameters
- **containerEl**: HTML element (or React ref) of visualization container
- **itemElCreator**: Function that takes a data object as its parameter and returns an HTML element for that diagram item. This function will receive data objects sent to **addDataItems**. The returned element should be populated with the data, as desired.
- **options**: Options object. Include a key to override its default value.

### Options
- **item_width**: Numerical. The unit is pixels. Default: 200
- **force_unique_ids**: Boolean. Set false for some performance improvement, if the implementing app can ensure no duplicate data items. Default: true

### Methods
- **addDataItems(array)**: Endpoint where implementing app sends data. Takes an array of diagram item data objects. See **Item data format** section for info on data format.
- **updateSimulationData()**: Update the visualization. This does not happen automatically when data is received by the module, so the implementing app may inform the user when new items are ready to be added, and let the user control when they are added.
- **zoomTo(level)**: Set zoom level, manually. Takes a numerical value, within the zoom scaleExtent specified in notebook.js, such as 0.1.
- **freeze()**: Temporarily freeze the simulation, manually 
- **centerView()**: Center the diagram in the viewport. Useful if the user has panned and wants to recenter
- **untangle()**: Untangle anything that might be tangled in the diagram

### Item data format
+ JSON object
+ Required keys:
    + **id**: unique string
    + **reply_to_id**: matching **id** of other item
    + **is_first**: only required for one item, the root item. boolean true, otherwise false or just don&apos;t include it. marks the root item.
+ The implementing app can include any custom key/value pairs needed for its use case.

### To use as a discussion interface
- Put a reply button in your item element, with a listener that shows a message form and sends that form the **id** being replied to. 
- If cloning an element in the itemElCreator function, event handlers don&apos;t get cloned, so use event delegation: put the listener on the container and check for the intended event.target in that handler. 
- You can get the **id** by finding the closest ancestor **foreignObject** of the item element and getting the **data-pfmm-id** attribute value from it. Ex: `event.target.closest('foreignObject').dataset.pfmmId`
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
        import pfmindmap from './path/to/pfmindmap_bundle.js';
        
        var data = [
            { 'id': '8843784378', 'reply_to_id': '', 'message': 'wazaaa', 'is_first': true },
            { 'id': '8064783478', 'reply_to_id': '8843784378', 'message': 'first level reply' },
            { 'id': '4785784534', 'reply_to_id': '8843784378', 'message': 'another first level reply' },
            { 'id': '4398489489', 'reply_to_id': '6734894923', 'message': 'some reply text' },
            { 'id': '6734894958', 'reply_to_id': '4785784534', 'message': 'another 2nd level reply' },
            { 'id': '6733494934', 'reply_to_id': '6734894958', 'message': 'a 3rd level reply' },
            { 'id': '6734894923', 'reply_to_id': '6734894958', 'message': 'another 3rd level reply' },
            { 'id': '6734894912', 'reply_to_id': '6734894923', 'message': '4th level reply' },
            { 'id': '4783489548', 'reply_to_id': '8843784378', 'message': 'this is another first level reply' }
        ];
        var itemElCreator = (data) => {
            const newEl = document.querySelector('.item-to-clone').cloneNode(true);
            newEl.innerHTML = data["message"];
            return newEl;
        };
        var pfmm = new pfmindmap(document.querySelector("#container-div"), itemElCreator, { 'item_width': 300 });
        pfmm.addDataItems(data);
        pfmm.updateSimulationData();
        pfmm.zoomTo(0.3);
    </script>
</body>
</html>
```

### License
- BSD 2 clause