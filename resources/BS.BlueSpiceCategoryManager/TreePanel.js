Ext.define( "BS.BlueSpiceCategoryManager.TreePanel", {
	extend: 'BS.CRUDPanel',
	requires: [
		'BS.action.APIAddCategories',
		'BS.action.APIRemoveCategories',
		'BS.action.APIDeletePage',
		'BS.BlueSpiceCategoryManager.Model',
		'BS.dialog.BatchActions',
		'Ext.data.TreeStore'
	],
	originalParent: undefined,
	afterInitComponent: function () {
		this.store = new Ext.data.TreeStore({
			proxy: {
				type: 'ajax',
				url: mw.util.wikiScript( 'api' ),
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
			model: 'BS.BlueSpiceCategoryManager.Model'
		});

		var me = this;

		this.treePanel = new Ext.tree.Panel({
			useArrows: true,
			height: 500,
			rootVisible: false,
			displayField: 'text',
			store: this.store,
			rowLines: true,
			viewConfig: {
				stripeRows : true,
				plugins: {
					ptype: 'treeviewdragdrop',
					dragText: mw.message( 'bs-categorymanager-draganddrop-text' ).plain(),
					enableDrop: true,
					appendOnly: false,
					sortOnDrop: true,
					expandDelay: 250,
					allowParentInserts: true
				}
			},
			columns : [{
				xtype: 'treecolumn', //this is so we know which column will show the tree
				flex: 2,
				dataIndex: 'text',
				sortable: false
			},
			new Ext.grid.column.Action({
				header: mw.message('bs-extjs-actions-column-header').plain(),
				flex: 0,
				items: [
					{
						tooltip: mw.message('bs-extjs-delete').plain(),
						iconCls: 'bs-extjs-actioncolumn-icon bs-icon-cross destructive',
						glyph: true,
						handler: function() {
							me.onBtnRemoveClick( me.btnRemove, null);
						}
					}
				],
				menuDisabled: true,
				hideable: false,
				sortable: false
			})
			]
		} );

		this.treePanel.expandAll();
		this.treePanel.getView().on( 'drop', this.onDrop, this );
		this.treePanel.getView().on( 'beforedrop', this.onBeforedrop, this );
		this.treePanel.getView().on( 'itemclick', this.onItemclick, this );

		this.items = [
			this.treePanel
		];

		this.callParent();
	},
	onBeforedrop: function( node, data, overModel, dropPosition, dropHandler, eOpts ){
		Ext.Array.each( data.records, function ( record ) {
			this.originalParent = record.parentNode.get( 'categoryName' );
		});
	},
	onItemclick: function ( obj, record, item, index, e, eOpts ) {
		this.btnRemove.enable();
		this.btnRemove.element = record;
	},
	onDrop: function ( node, data, overModel, dropPosition, dropHandler, eOpts ) {
		var me = this;

		Ext.Array.each( data.records, function ( record ) {
			var recordFullName = 'Category:' + record.get( 'categoryName' );

			// append to category
			if( dropPosition === 'append' ) {
				$.when(
					me.removeCategories( recordFullName, [this.originalParent] )
				).always( function(){
					$.when(
						me.addCategories( recordFullName, [overModel.get( 'categoryName' )] )
					).always( function() {
						me.treePanel.setLoading( false );
						me.treePanel.getStore().load({
							callback: function(records, operation, success) {
								me.treePanel.expandAll();
							}
						});
					});
				});
			} else {
				// moved before or after
				if( overModel.parentNode.isRoot() ) {
					// moved to root, only remove category
					$.when(
						me.removeCategories( recordFullName, [this.originalParent] )
					).always( function(){
						me.treePanel.setLoading( false );
						me.treePanel.getStore().load({
							callback: function(records, operation, success) {
								me.treePanel.expandAll();
							}
						});
					});
				} else {
					// set category to parent of overModel
					$.when(
						me.removeCategories( recordFullName, [this.originalParent] )
					).always( function() {
						$.when(
							me.addCategories( recordFullName, [overModel.parentNode.get( 'categoryName' )] )
						).always( function() {
							me.treePanel.setLoading( false );
							me.treePanel.getStore().load({
								callback: function(records, operation, success) {
									me.treePanel.expandAll();
								}
							});
						});
					});
				}
			}

			this.originalParent = undefined;
		});
	},
	addCategories: function( page, categories ) {
		this.treePanel.setLoading( true );

		return new BS.action.APIAddCategories({
			pageTitle: page,
			categories: categories
		}).execute();
	},

	removeCategories: function( page, categories ) {
		this.treePanel.setLoading( true );
		return new BS.action.APIRemoveCategories({
			pageTitle: page,
			categories: categories
		}).execute();
	},

	onBtnAddClick: function ( oButton, oEvent ) {
		var me = this;
		bs.util.prompt(
			"bs-categorymanager",
			{
				title: mw.message( 'bs-categorymanager-dlg-new-title' ).plain(),
				text: mw.message( 'bs-categorymanager-dlg-new-prompt' ).plain()
			},
			{
				ok: function( input ) {
					me.treePanel.setLoading( true );

					var addCategoryAction = new BS.action.APIAddCategories({
						pageTitle: 'Category:' + input.value,
						categories: []
					});
					addCategoryAction.execute()
					.done( function( resp ) {
						me.treePanel.setLoading( false );
						me.treePanel.getStore().load({
							callback: function(records, operation, success) {
								me.treePanel.expandAll();
							}
						});
					})
					.fail( function( jqXHR, textStatus, response ) {
						Ext.Msg.alert( mw.message( 'bs-categorymanager-addcategory-dialog-error-title' ).plain(), response.message );

						me.treePanel.setLoading( false );
					});
				},
				scope: this
			}
		);
	},

	onBtnRemoveClick: function ( oButton, oEvent ) {
		var me = this;
		bs.util.confirm( 'RemoveCategory', {
				text: mw.message( 'bs-categorymanager-removecategoryconfirm-text' ).plain(),
				title: mw.message( 'bs-categorymanager-removecategoryconfirm-title' ).plain(),
			},
			{
				ok: function(){
					var data = new Array();
					var element = oButton.element;
					var category = element.get( 'categoryName' );
					var categoryEntire = 'Category:' + category;

					var api = new mw.Api();
					api.get({
						action: 'query',
						list: 'categorymembers',
						cmtitle: categoryEntire
					})
					.done( function ( response ){
						$.each(response.query.categorymembers, function( index, val ){
							var action = new BS.action.APIRemoveCategories({
											pageTitle: val.title,
											categories: [category]
										});
							data.push( action );
						});

						data.push( new BS.action.APIDeletePage({
							pageTitle: categoryEntire
						}) );

						var batchDialog = new BS.dialog.BatchActions({});
						batchDialog.setData( data );
						batchDialog.show();
						batchDialog.startProcessing();
						batchDialog.on( 'ok', function() {
							me.treePanel.getStore().load({
								callback: function(records, operation, success) {
									me.treePanel.expandAll();
								}
							});
						}, this );
					})
					.fail( function(){
						me.treePanel.setLoading( false );
					});
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