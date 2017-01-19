## jQuery DataTables wrapper for transitioning from CFGrid

Maybe you, too, have come to see the error of your ways in giving in to the dark side, i.e. using ColdFusions nifty UI tags. The discussion for or against going down this path is moot, or should a least be held some other place and time. If you ever plan to move from ACF to Lucee, you'll better check your code and get rid of these proprietary controls.

Raymond Camden's excellent collection of tipps on how to make this transition [cfjedimaster/ColdFusion-UI-the-Right-Way](https://github.com/cfjedimaster/ColdFusion-UI-the-Right-Way) is unfortunately somewhat on the lean side when it comes to CFGRID. As I had to replace quite a number of these buggers, I decided to write a jQuery plugin to wrap the almighty [DataTables](https://datatables.net/) (which we were already using in other places) in a way that would allow us to streamline the rewriting efforts.

The webservice endpoints need not be touched at all when moving away from CFGRID, UnCFGrid will happily consume the output that is intended for CFGRID, and assigning query columns to table columns is handled by very straightforward `data`-attribute conventions quite similar to the way you're used to with CFGRID. Declaring specific fields editable or having a delete-button for a row is also very easily accomplished, there's no need for the commercial editor extension of DataTables.

Code has been tested successfully with ColdFusion 8, Lucee 4.5 and Lucee 5.

## Prerequisites

UnCFGrid relies on jQuery and DataTables, obviously, so you'll need to make sure to load these before the plugin.

## Usage

First you need to write down the usual table markup with a `thead` section that declares all the columns. Use the `data-ucfg-data` to declare the query column name as it is used in your webservice endpoint. I you want to have a delete-button for each row, just add the column in the `thead` and set a `data-ucfg-del` attribute. `data-ucfg-del` makes the fields of that column editable and if you specify a value to this attribute, a validator function of the same name will be used to prevent illegal changes (you'll still need to re-validate serverside). Currently only one validator function (`notempty`) is build-in, but you can always pass in your own - they just need to return a boolean for the checked value depending on if the test is passed or not. The `data-ucfg-check` should be set on columns with boolean values where a checkbox should be rendered instead of the literal value.

If you have at least one `data-ucfg-edit/check/del` column, you'll also need to identify the column(s) that hold the primary key by assigning the `data-ucfg-primary` attribute. If the field in this column for some reason has another attribute name for update/delete webservice than the original name it had in the get-service, you simply assign this name as a value to the `data-ucfg-primary` attribute - if you don't, the value of the `data-ucfg-data` attribute is used as a field descriptor for the write operation, too.

Putting this all together in one example:

```html
<table id="myGrid" cellspacing="0">
 	<thead>
        <tr>
            <th data-ucfg-data="ID" data-ucfg-primary="id">ID</th>
			<th data-ucfg-data="URL" data-ucfg-edit="notempty">URL</th>
			<th data-ucfg-data="TEXT" data-ucfg-edit>Text</th>
			<th data-ucfg-data="FLAG" data-ucfg-check>Check</th>			
			<th data-ucfg-del>&nbsp;</th>
        </tr>
    </thead>	    
</table>
```

Now you can instantiate the datatable using your webservice endpoints by calling the plugin on the table like this:

```javascript
$(document).ready(function() {

	// init Grid
	var elemGrid = $('#myGrid');
	elemGrid.UnCFGrid({
		getUrl: "./data.cfc?method=getData",
		getParams: {"someId":1234},
		updUrl: "./data.cfc?method=editData",
		showNullRows: false,
		dtOptions: {								
			pageLength	: 5,
			columnDefs : [
				{ visible: false, targets: [ 0 ] },
				{ className: "colcenter", "targets": [ 3,4 ] },
			],
			order: [[ 0, "DESC" ]],
		}
	});
});
```

The configuration object of UnCFGrid takes the URL of the WS endpoint serving the data (`getUrl`) and optional parameters passed through to it along with the usual `CFGRID` parameters (`getParams`). If `showNullRows` is set to false, rows containing only NULL values will be filtered from the output. The optional `updUrl` takes the URL of the update/delete endpoint. `dtOptions` passes options through to DataTables. Additional validators for edits can be passed as object members of the `validators` setting object and you can set the button labels of the save/reset/reload-buttons in the `language` setting - see plugin source code for details. 

I make a habit of storing the original jQuery object of the table's DOM element in a variable in order to re-use this for other purposes. If, for example, you would want access to the underlying DataTables object, you'll simply do

```javascript
var objDataTable = elemGrid.DataTable();
```

You can of course have multiple UnCFGrids per page.

See demo.html for a working usage example. I have faked the query generation for the webservice using a SESSION-stored array, so the example should work out of the box, you won't need to set up any datasource.