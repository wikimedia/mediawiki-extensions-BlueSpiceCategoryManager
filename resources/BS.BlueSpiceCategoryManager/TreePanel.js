Ext.define( "BS.BlueSpiceCategoryManager.TreePanel", {
	extend: 'BS.CRUDPanel',
	id: 'BlueSpiceCategoryManager',
	requires: [
		'BS.action.APIAddCategories',
		'BS.action.APIRemoveCategories',
		'BS.BlueSpiceCategoryManager.Model',
		'BS.dialog.BatchActions'
	],
	originalParent: undefined,
	afterInitComponent: function () {
		this.store = Ext.create( 'Ext.data.TreeStore', {
			proxy: {
				type: 'ajax',
				url: mw.util.wikiScript('api'),
				reader: {
					type: 'json',
					root: 'results',
					totalProperty: 'total'
				},
				extraParams: {
					action: 'bs-category-treestore',
					format: 'json'
				}
			},
			root: {
				text: 'Categories',
				id: 'src',
				expanded: true
			},
			model: 'BS.BlueSpiceCategoryManager.Model',
			listeners: {
				load: function(obj, store, records){
					Ext.Array.each( records, function( record ) {
						record.set( 'leaf', false );
						record.expand();
					})
				}
			}
		});

		this.treePanel = new Ext.tree.Panel( {
			useArrows: true,
			rootVisible: false,
			displayField: 'text',
			store: this.store,
			viewConfig: {
				plugins: {
					ptype: 'treeviewdragdrop',
					dragText: mw.message( 'bs-categorymanager-draganddrop-text' ).plain(),
					enableDrop: true
				},
				listeners: {
					beforedrop: function( node, data, overModel, dropPosition, dropHandler, eOpts ){
						Ext.Array.each( data.records, function ( record ) {
							this.originalParent = record.parentNode.get('text');
						});
					},
					drop: function ( node, data, overModel, dropPosition, dropHandler, eOpts ) {
						function addCategories(page, categories){
								return Ext.create('BS.action.APIAddCategories', {
											pageTitle: page,
											categories: categories
										}).execute()
										.fail( function (dfd, set, resp) {
											mw.log("Add fail");
											mw.log( page + " " + categories); //for the time of debugging
											mw.log(resp);
										});
						};

						function removeCategories(page, categories){
								return Ext.create('BS.action.APIRemoveCategories', {
											pageTitle: page,
											categories: categories
										}).execute()
										.fail( function (dfd, set, resp) {
											mw.log("Remove fail");
											mw.log(resp);
										});
						};

						Ext.Array.each( data.records, function ( record ) {
							var recordFullName = 'Category:' + record.get( 'text' );

							if ( record.parentNode === overModel ) {
								//MOVING FROM ROOT TO CATEGORY
								if (this.originalParent && this.originalParent === 'Categories'){
									addCategories(recordFullName, [overModel.get( 'text' )]);
								} else{
									//MOVING FROM CATEGORY FROM CATEGORY SELECTING PARENT CATEGORY AS DROP TARGET
									removeCategories(recordFullName, [this.originalParent])
										.done(function(resp){
											addCategories(recordFullName, [overModel.get( 'text' )]);
										});
								}
							} else {
								//MOVE FROM CATEGORY TO ROOT
								if(record.parentNode.get('text') === 'Categories'){
									removeCategories(recordFullName, [this.originalParent]);
								}
								else{
									//MOVE FROM ROOT TO CATEGORY BY PLACING ITEM BETWEEN EXISTING CATEGORIES OF PARENT
									if (this.originalParent && this.originalParent === 'Categories'){
										addCategories(recordFullName, [record.parentNode.get( 'text' )]);
									}
									//MOVING FROM CATEGORY FROM CATEGORY BY PLACING ITEM BETWEEN EXISTING CATEGORIES OF PARENT
									else {
										removeCategories(recordFullName, [this.originalParent])
											.done(function(resp){
												addCategories(recordFullName, [record.parentNode.get( 'text' )]);
											});
									}
								}
							}
							this.originalParent = undefined;
						});
					},
					itemclick: function ( obj, record, item, index, e, eOpts ) {
						var btnRemove = Ext.getCmp( 'BlueSpiceCategoryManager' ).btnRemove;
						btnRemove.enable();
						btnRemove.element = record;
					}
				}
			}
		} );

		this.items = [
			this.treePanel
		];

		this.callParent();
	},

	onBtnAddClick: function ( oButton, oEvent ) {
		var treePanel = this.treePanel;
		bs.util.prompt(
			"bs-categorymanager",
			{
				title: mw.message( 'bs-categorymanager-dlg-new-title' ).plain(),
				text: mw.message( 'bs-categorymanager-dlg-new-prompt' ).plain()
			},
			{
				ok: function( input ) {
					var addCategoryAction = Ext.create('BS.action.APIAddCategories', {
						pageTitle: 'Category:' + input.value,
						categories: []
					});
					addCategoryAction.execute()
					.done(function(resp){
						btnDoneProxy();
					});

				},
				scope: this
			}
		);
		function btnDoneProxy(){
			treePanel.getStore().load();
		}
	},

	onBtnRemoveClick: function ( oButton, oEvent ) {
		bs.util.confirm('RemoveCategory', {
				text: mw.message('bs-categorymanager-removecategoryconfirm-text').plain(),
				title: mw.message('bs-categorymanager-removecategoryconfirm-title').plain(),
			},
			{
				ok: function(){
					var data = new Array();
					var element = oButton.element;
					var category = element.get('text')
					var categoryEntire = 'Category:' + category;

					var api = new mw.Api();
					api.get({
						action: 'query',
						list: 'categorymembers',
						cmtitle: categoryEntire

					})
					.done( function ( response ){
						$.each(response.query.categorymembers, function(index, val){
							var action = Ext.create('BS.action.APIRemoveCategories', {
											pageTitle: val.title,
											categories: [category]
										});
							data.push( action );
						});
						if ( data.length === 0){
							removeCategory( element );
						} else {
							var batchPanel = Ext.create('BS.panel.BatchActions', {});
							batchPanel.setData(data);
							batchPanel.startProcessing();
							batchPanel.on('processcomplete', function(){
								removeCategory( element );
							}, element);
						}
					});
					function removeCategory( element ){
						api.postWithEditToken( {
								action: 'delete',
								title: 'Category:' + element.get('text')
						})
						.fail( function (data){
								element.parentNode.removeChild( element );
						})
						.done( function (data) {
							element.parentNode.removeChild( element ); //remove node from TreePanel
						});
					}
				},
				scope: this
			}
		);
	},

	opPermitted: function( operation ) {
		//Edit functionality is not yet implemented. For the time being this
		//is the simplest way to hide the "edit" button from the UI.
		if( operation === 'update' ) {
			return false;
		}
		return this.callParent( arguments );
	}
} );