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

		this.treePanel = new Ext.tree.Panel({
			useArrows: true,
			height: 500,
			rootVisible: false,
			displayField: 'text',
			store: this.store,
			viewConfig: {
				plugins: {
					ptype: 'treeviewdragdrop',
					dragText: mw.message( 'bs-categorymanager-draganddrop-text' ).plain(),
					enableDrop: true,
					appendOnly: false,
					sortOnDrop: true,
					expandDelay: 250,
					allowParentInserts: true
				}
			}
		} );

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
			this.originalParent = record.parentNode.get( 'text' );
		});
	},
	onItemclick: function ( obj, record, item, index, e, eOpts ) {
		this.btnRemove.enable();
		this.btnRemove.element = record;
	},
	onDrop: function ( node, data, overModel, dropPosition, dropHandler, eOpts ) {
		var me = this;

		Ext.Array.each( data.records, function ( record ) {
			var recordFullName = 'Category:' + record.get( 'text' );

			// append to category
			if( dropPosition === 'append' ) {
				$.when(
					me.removeCategories( recordFullName, [this.originalParent] )
				).always( function(){
					$.when(
						me.addCategories( recordFullName, [overModel.get( 'text' )] )
					).always( function() {
						me.treePanel.setLoading( false );
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
					});
				} else {
					// set category to parent of overModel
					$.when(
						me.removeCategories( recordFullName, [this.originalParent] )
					).always( function() {
						$.when(
							me.addCategories( recordFullName, [overModel.parentNode.get( 'text' )] )
						).always( function() {
							me.treePanel.setLoading( false );
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
						me.treePanel.getStore().load();
						me.treePanel.setLoading( false );
					})
					.fail( function() {
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
					var category = element.get( 'text' );
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
							me.treePanel.getStore().load();
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