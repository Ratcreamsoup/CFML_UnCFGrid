/*!
 * jQuery UnCFGrid Plugin
 * Requires DataTables
 *
 * Copyright 2017, Markus Wollny
 *
 * Licensed under MIT License
 */
;( function( $, window, document, undefined ) {

	"use strict";

	// we require DataTable to be present
	if(!jQuery().DataTable) {
		throw new Error("jQuery DataTable plugin required.");     
	}
		
	var pluginName = "UnCFGrid",

		defaults = {					
			dtOptions: {
				processing  : true,
				serverSide  : true,
				pageLength	: 25,
				searching	: false,
				paging	 	: true,
				dom 		: "rt<'UnCFGrid_savereset'>p",
				order: [[ 0, "asc" ]]
			},
			language: {
				save: 'Save',
				reset: 'Reset',
				reload: 'Reload'
			},
			showNullRows : false,
			getUrl: '',
			getParams : {},
			updUrl: '',
			validators : {
				notempty : function(val) {
					return (val.length > 0) ? true : false;
				}
			}
		},

		_changeClass 		= 'ucfgChanged',
		_checkBoxClass 		= 'ucfgCheck',
		_deleteClass 		= 'ucfgDelete',			
		_isEditable			= false,
		_isDeleteable		= false,
		_validatorClass 	= 'ucfgVal',	

		_enableSaveResetButtons = function(elem,state) {					
			elem.prop('disabled',!state);
		},

		_getColumnConfig = function(elem,renderEditableSpan,renderDelete,renderCheckbox){
			var columns 	= [],
				nokey 		= [],
				pkey		= [],
				validator  	= [];
			elem.find('thead th').each(function(idx){					
				var $this 		= $(this),
					column  	= {},
					editable 	= $this.data('ucfgEdit'),
					primary  	= $this.data('ucfgPrimary');

				column.data = $this.data('ucfgData') || '';

				if (column.data == '') {
					nokey.push(idx);
					column.defaultContent = '';
				} 						
				if (typeof primary !== 'undefined' && column.data) {
					var p = {getKey:column.data};
					p.putKey = (primary == '') ? column.data : primary;
					pkey.push(p);
				}
				if (typeof $this.data(_checkBoxClass) !== 'undefined') {
					column.render = renderCheckbox;
					_isEditable = true;
				} else if (typeof $this.data('ucfgDel') !== 'undefined') {
					column.render = renderDelete;
					column.className = _deleteClass;
					column.orderable = false;
					_isDeleteable = true;
				} else if (typeof editable !== 'undefined') {
					column.render = renderEditableSpan;
					_isEditable = true;
					if (editable !== '') {
						column.className = _validatorClass;	
						validator[idx]	= editable;
					}
				}
				columns.push(column);
			});				

			if ( (_isEditable || _isDeleteable) && !pkey.length) {
				throw new Error("No primary key found.\nAt least one column needs to be assigned with attribute data-ucfg-primary when using edit/delete");
			}				

			return {columns:columns,pkey:pkey,validator:validator};
		},

		// remove prior yet uncommitted edits for a specific row or cell
		_cleanArr = function(arr2Clean,pkey,elem) {
			for (var i=arr2Clean.length-1; i >= 0; i--) {
				// if no element was provided, remove row, i.e. all entries regardless of datasource, otherwise just the cell
				if  ( (typeof elem == 'undefined') || (arr2Clean[i].dataSource == elem.dataSource) ) {
					var sameField = true;
					for (var j=1; j < pkey.length; j++) {
						if (arr2Clean[i][pkey[i].putKey] !== elem[pkey[i].putKey]) {
							sameField = false;
						}
					}
					if (sameField) {
						arr2Clean.splice(i,1);
					}
				}								
			}
			return arr2Clean;
		},

		// save edits to DB
		_updateLinkModel = function(data, url, objDt, reload) {								
			$.ajax({
				type: 'POST',
				url: url,
				cache: false,
				data: {argumentCollection: JSON.stringify( data )},
				dataType: 'json',
				complete: function() {					
					if (reload) {						
						objDt.ajax.reload(null, false);
					}
				}
			});			
		},

		// The actual plugin constructor
		Plugin = function( element, options ) {
			this.domElem = element;
			this.elem = $(element);					
			this.settings = $.extend(true, {}, defaults, options );				
			this._defaults = defaults;
			this._name = pluginName;								
			this.init();				
		}

		// Avoid Plugin.prototype conflicts
		$.extend( Plugin.prototype, {
			init: function() {

				var that = this;

				// array to hold updates
				this.arrChanged = [];

				// get table configuration
				this.columnConfig = _getColumnConfig(this.elem,this.renderEditableSpan,this.renderDelete,this.renderCheckbox);

				// merge datatables configuration into one object
				this.dtOptions = $.extend(true, {}, this.getGridConfig(), this.settings.dtOptions);					

				// create DataTable
				// console.log(JSON.stringify(this.dtOptions));
				this.objDt = this.elem.DataTable(this.dtOptions);

				if (_isEditable) {
					// render save/reset/reload buttons
					this.buttons =	this.elem.nextAll('div.UnCFGrid_savereset')
						.html('<button type="save">' + 
								this.settings.language.save +
							'</button><button type="reset">' +
								this.settings.language.reset +
							'</button><button type="button">' + 
								this.settings.language.reload +
							'</button>').find('button');
				} else {
					// just the reload button
					this.buttons =	this.elem.nextAll('div.UnCFGrid_savereset')
						.html('<button type="button">' + 
								this.settings.language.reload +
							'</button>').find('button');
				}

				this.saveResetButtons = this.buttons.filter('button[type="save"],button[type="reset"]');
				
				if (_isDeleteable) {
					// delete info link
					this.elem.on('click','td.' + _deleteClass, function(){
						var $this = $(this),								
							myData = {
								gridaction : 'D',
								gridrow : {},
								gridchanged : {}
							},
							cellIdx = that.objDt.cell($this).index(),
							pkey = that.columnConfig.pkey;
						
						for (var i=0; i < pkey.length; i++){							
							myData.gridrow[pkey[i].putKey] = that.objDt.row(cellIdx.row).data()[pkey[i].getKey];							
						}

						// remove uncomitted changes for the deleted row
						that.arrChanged = _cleanArr(that.arrChanged,pkey);
						// persist delete and reload table						
						_updateLinkModel(myData, that.settings.updUrl, that.objDt, true);									
					});
				}

				// reload button
				this.buttons.filter('[type="button"]').click(function(){						
					that.objDt.ajax.reload(null, false);
					that.arrChanged = [];
					_enableSaveResetButtons(that.saveResetButtons,false);
				});

				// if there's no _isEditable field, that's all we need
				if (!_isEditable) return;

				// tracking changes on editables						
				this.elem.on('focus',"span[contenteditable='true']",function(){
					// on focus, save elements original data
					var $this = $(this);
					$this.data('beforeContentEdit', $this.html());						
				}).on('blur',"span[contenteditable='true']",function(){
					// on blur check if data has changed and if there is a difference, trigger change event
					var $this = $(this),
						$parent = $this.parent(),
						newContent = $this.html(),
						oldContent = $this.data('beforeContentEdit'),
						check = true;

					if ($parent.hasClass(_validatorClass)){
						var validatorFunction = that.columnConfig.validator[that.objDt.cell($parent).index().column];
						if (that.settings.validators.hasOwnProperty(validatorFunction)) {
							check = that.settings.validators[validatorFunction](newContent);
						}
					}						

					if (!check) {
						$this.html(oldContent);						
					} else if ($this.data('beforeContentEdit') !== $this.html()) {
		                $this.removeData('beforeContentEdit').trigger('change');
		            }
				}).on('change','span[contenteditable="true"],input.' + _checkBoxClass,function(){
					// track updates in array			
					var $this = $(this),							
						change = false,
						cellIdx = that.objDt.cell($this.parent()[ 0 ]).index(),
						pkey = that.columnConfig.pkey,
						changedElem = {
							dataSource : that.objDt.column(cellIdx.column).dataSrc()
						};							
					for (var i=0; i < that.columnConfig.pkey.length; i++){
						changedElem[pkey[i].putKey] = 
							that.objDt.row(cellIdx.row).data()[pkey[i].getKey];
					}
					
					if ($this.is('span')){																														
						changedElem.newVal = $this.html();								
						change = true;

					} else if ($this.is('input.' + _checkBoxClass))	{
						var beforeContentEdit = $this.data('beforeContentEdit'),
						curState = $this.prop('checked');
						changedElem.newVal = curState;							
						if (typeof beforeContentEdit == 'undefined') {
							// save original state
							$this.data('beforeContentEdit', !curState);								
							change = true;
						} else {
							if (beforeContentEdit !== curState) {
								// back to original state
								change = true;
							} 
						}
					}						
					// remove prior uncomitted changes for the same field
					that.arrChanged = _cleanArr(that.arrChanged,pkey,changedElem);
					if (change) {
						$this.addClass(_changeClass);														
						that.arrChanged.push(changedElem);							
					} else {
						$this.removeClass(_changeClass);
					}						 
					_enableSaveResetButtons(that.saveResetButtons,(that.arrChanged.length>0));			
					return false;
				}).on('xhr.dt',function(){
					that.arrChanged = [];
					_enableSaveResetButtons(that.saveResetButtons,false);
				});					

				// save button
				this.buttons.filter('[type="save"]').click(function(){
					$.each(that.arrChanged,function(idx,updElem){							
						var myData = {
							gridaction : 'U',
							gridrow : {},								
							gridchanged : {}
						}, 
						pkey = that.columnConfig.pkey;
						myData.gridchanged[updElem.dataSource] = updElem.newVal;
						for(var i=0; i< pkey.length;i++) {
							var putKey = pkey[i].putKey;
							myData.gridrow[putKey] = updElem[putKey];
						}									 
						// send update and trigger AJAX reload on last update
						_updateLinkModel(myData, that.settings.updUrl, that.objDt, (idx+1 == that.arrChanged.length));
					});
					that.arrChanged = [];
					_enableSaveResetButtons(that.saveResetButtons,false);			
				});

				// reset button					
				this.buttons.filter('[type="reset"]').click(function(){
					// editable text
					that.elem.find("span[contenteditable='true']." + _changeClass).each(function(){
						var $this = $(this);
						$this.html(that.objDt.cell($this.parent()[ 0 ]).data()).removeClass(_changeClass);
					});						
					// checkboxes
					that.elem.find('input[type="checkbox"].' + _checkBoxClass + '.' + _changeClass).each(function(){
						var $this = $(this);
						$this.prop('checked',that.objDt.cell($this.parent()[ 0 ]).data()).removeClass(_changeClass);
					});
					that.arrChanged = [];
					_enableSaveResetButtons(that.saveResetButtons,false);
				});
				

			},
			renderEditableSpan: function(data, type, row, meta){			
				return '<span contenteditable="true">'+data+'</span>';
			},
			renderDelete: function(){
				return '<div />';
			},
			renderCheckbox: function(data, type, row, meta){	
				var cellHtml = '<input class="' + _checkBoxClass + '" type="checkbox" ';
					if (data) {
						cellHtml += 'checked="checked" ';
					}
					cellHtml += '/>'
					return cellHtml;
			},
			getDataFilter: function(settings, arrChanged){					
		    	return function ( data ) {
			    	var	json 		= jQuery.parseJSON( data ),
			    		returnData 	= {},
			    		arrData 	= [],
			    		ien 		= json.QUERY.DATA.length,
			    		jen			= json.QUERY.COLUMNS.length;
			    	for ( var i=0; i<ien ; i++ ) {
			    		if (settings.showNullRows || json.QUERY.DATA[i].some(function(el){return el !== null;})) {
			    			// if row contains non-null values
			    			var row = {};
				    		for ( var j=0; j<jen ; j++ ) {			    			
				    			row[json.QUERY.COLUMNS[j]] = json.QUERY.DATA[i][j];			    			
				    		}
				    		arrData.push(row);
			    		}			    						        
				    }
				    returnData.data = arrData;
				    returnData.recordsTotal = json.TOTALROWCOUNT;
				    returnData.recordsFiltered = returnData.recordsTotal;
				    returnData.draw = json.draw;					    					    			    
				    return JSON.stringify( returnData );
			    }
			},
		    getData: function(settings){
		    	return function(data) {				    			    				    				    	
			        var sParams = {					    					    		
				        	pageSize: data.length,
				        	page: 1+(data.start/data.length),
				        	gridsortdirection: data.order[0].dir,
				        	returnFormat: 'json',
				        	draw: data.draw
				    	}, 
				    	sortColIdx = data.order[0].column;						    
					sParams.gridsortcolumn = data.columns[sortColIdx].data;
					for (var key in settings.getParams) {
						if (!sParams.hasOwnProperty(key) && settings.getParams.hasOwnProperty(key)) {
							sParams[key] = settings.getParams[key];
						}
					}
			        return sParams;			            
				}
		    },
			getGridConfig: function() {									
				return {
					columns: this.columnConfig.columns,
					ajax: {
						url: this.settings.getUrl,
						data: this.getData(this.settings),
						dataFilter: this.getDataFilter(this.settings, this.arrChanged)
					}						
				};
			}
		} );
		
		// constructor wrapper preventing against multiple instantiations
		$.fn[ pluginName ] = function( options ) {
			return this.each( function() {
				if ( !$.data( this, "plugin_" + pluginName ) ) {
					$.data( this, "plugin_" +
						pluginName, new Plugin( this, options ) );
				}
			} );
		};

} )( jQuery, window, document );