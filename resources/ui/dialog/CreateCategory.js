bs.util.registerNamespace( 'bs.categoryManager.ui.dialog' );

require( '../../api/CategoryActions.js' );

bs.categoryManager.ui.dialog.CreateCategory = function ( cfg ) {
	cfg = cfg || {};
	bs.categoryManager.ui.dialog.CreateCategory.super.call( this, cfg );
	this.selectedCategory = cfg.selectedCategory;
};

OO.inheritClass( bs.categoryManager.ui.dialog.CreateCategory, OO.ui.ProcessDialog );

bs.categoryManager.ui.dialog.CreateCategory.static.name = 'CreateCategoryDialog';
bs.categoryManager.ui.dialog.CreateCategory.static.title = mw.message( 'bs-categorymanager-dlg-add-title' ).text();

bs.categoryManager.ui.dialog.CreateCategory.static.size = 'medium';

bs.categoryManager.ui.dialog.CreateCategory.static.actions = [
	{
		action: 'save',
		label: mw.message( 'bs-categorymanager-dialog-action-add-label' ).text(),
		flags: [ 'primary', 'progressive' ]
	},
	{
		label: mw.message( 'cancel' ).text(),
		flags: [ 'safe', 'close' ]
	}
];

bs.categoryManager.ui.dialog.CreateCategory.prototype.getSetupProcess = function ( data ) {
	return bs.categoryManager.ui.dialog.CreateCategory.parent.prototype.getSetupProcess.call( this, data )
		.next( () => {
			this.saveAction = this.actions.getSpecial().primary;
			this.saveAction.setDisabled( true );
		} );
};

bs.categoryManager.ui.dialog.CreateCategory.prototype.initialize = function () {
	bs.categoryManager.ui.dialog.CreateCategory.super.prototype.initialize.apply( this, arguments );
	this.panel = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false
	} );
	this.categoryInput = new OO.ui.TextInputWidget();
	this.categoryInput.connect( this, {
		change: function () {
			if ( this.categoryInput.getValue().length > 0 ) {
				this.saveAction.setDisabled( false );
				return;
			}
			this.saveAction.setDisabled( true );
		}
	} );
	const categoryInputLayout = new OO.ui.FieldLayout( this.categoryInput, {
		align: 'top',
		label: mw.message( 'bs-categorymanager-add-category-label' ).text()
	} );
	this.panel.$element.append( categoryInputLayout.$element );
	this.$body.append( this.panel.$element );
	this.updateSize();
};

bs.categoryManager.ui.dialog.CreateCategory.prototype.getActionProcess = function ( action ) {
	if ( action ) {
		return new OO.ui.Process( function () {
			this.pushPending();
			const newCategoryValue = this.categoryInput.getValue();
			const categoryAction = new bs.categoryManager.api.CategoryActions();

			categoryAction.addCategory( newCategoryValue, this.selectedCategory )
				.then( () => {
					this.close( { action: action } );
					this.emit( 'close' );
				} )
				.catch( ( error ) => {
					if ( error === 'duplicate' ) {
						this.saveAction.setDisabled( true );
						this.popPending();
						return;
					}
					this.showErrors( new OO.ui.Error( error, { recoverable: false } ) );
					this.updateSize();
					this.popPending();
					return;
				} );
		}, this );
	}
	return bs.categoryManager.ui.dialog.CreateCategory.super.prototype.getActionProcess.call( this, action );
};
