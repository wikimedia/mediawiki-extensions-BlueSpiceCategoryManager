bs.util.registerNamespace( 'bs.categoryManager.ui.dialog' );

require( '../../api/CategoryActions.js' );

bs.categoryManager.ui.dialog.CreateCategory = function ( cfg ) {
	cfg = cfg || {};
	bs.categoryManager.ui.dialog.CreateCategory.super.call( this, cfg );
	this.selectedCategory = cfg.selectedCategory;
};

OO.inheritClass( bs.categoryManager.ui.dialog.CreateCategory, OO.ui.ProcessDialog );

bs.categoryManager.ui.dialog.CreateCategory.static.name = 'CreateCategoryDialog';
bs.categoryManager.ui.dialog.CreateCategory.static.title = mw.message( 'bs-categorymanager-dlg-new-title' ).text();

bs.categoryManager.ui.dialog.CreateCategory.static.size = 'medium';

bs.categoryManager.ui.dialog.CreateCategory.static.actions = [
	{
		action: 'save',
		label: mw.message( 'bs-categorymanager-dialog-action-done-label' ).text(),
		flags: [ 'primary', 'progressive' ]
	},
	{
		label: mw.message( 'cancel' ).text(),
		flags: 'safe'
	}
];

bs.categoryManager.ui.dialog.CreateCategory.prototype.getSetupProcess = function( data ) {
	return bs.categoryManager.ui.dialog.CreateCategory.parent.prototype.getSetupProcess.call( this, data )
	.next( function() {
		this.saveAction = this.actions.getSpecial().primary;
		this.saveAction.setDisabled( true );
	}.bind( this ) )
};

bs.categoryManager.ui.dialog.CreateCategory.prototype.initialize = function () {
	bs.categoryManager.ui.dialog.CreateCategory.super.prototype.initialize.apply( this, arguments );
	this.panel = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false
	} );
	this.categoryInput = new OO.ui.TextInputWidget( {
		placeholder: mw.message( 'bs-categorymanager-dialog-create-category-placeholder' ).text() //'Add new category name'
	} );
	this.categoryInput.connect( this, {
		change: function () {
			if ( this.categoryInput.getValue().length > 0 ) {
				this.saveAction.setDisabled( false );
				return;
			}
			this.saveAction.setDisabled( true );
		}
	} );
	var categoryInputLayout = new OO.ui.FieldLayout( this.categoryInput, {
		align: 'top',
		label: mw.message( 'bs-categorymanager-create-new-category-label' ).text(),
	} );
	this.panel.$element.append( categoryInputLayout.$element );
	this.$body.append( this.panel.$element );
	this.updateSize();
};

bs.categoryManager.ui.dialog.CreateCategory.prototype.getActionProcess = function ( action ) {
	if ( action ) {
		return new OO.ui.Process( function () {
			this.pushPending();
			var newCategoryValue = this.categoryInput.getValue();
			var categoryAction = new bs.categoryManager.api.CategoryActions();

			categoryAction.addCategory( newCategoryValue, this.selectedCategory )
			.then( function () {
				this.close( { action: action } );
				this.emit( 'close' );
			}.bind( this ) )
			.catch( ( error ) => {
				if ( error === 'duplicate' ) {
					this.saveAction.setDisabled( true );
					this.popPending();
					return;
				}
				console.error( error );
				this.showErrors( new OO.ui.Error( error, { recoverable: false } ) );
				this.updateSize();
				return;
			} );
		}, this );
	}
	return bs.categoryManager.ui.dialog.CreateCategory.super.prototype.getActionProcess.call( this, action );
};
