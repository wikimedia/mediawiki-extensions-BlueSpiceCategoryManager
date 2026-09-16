bs.util.registerNamespace( 'bs.categoryManager.ui.dialog' );

require( '../../api/CategoryActions.js' );

bs.categoryManager.ui.dialog.DeleteCategory = function ( cfg ) {
	cfg = cfg || {};
	bs.categoryManager.ui.dialog.DeleteCategory.super.call( this, cfg );
	this.category = cfg.category;
	this.actionApi = cfg.actionApi || new bs.categoryManager.api.CategoryActions();
	this.categoryActions = [];
	this.processedCount = 0;
	this.running = false;
};

OO.inheritClass( bs.categoryManager.ui.dialog.DeleteCategory, OO.ui.ProcessDialog );

bs.categoryManager.ui.dialog.DeleteCategory.static.name = 'DeleteCategoryDialog';
bs.categoryManager.ui.dialog.DeleteCategory.static.title = mw.message( 'bs-categorymanager-removecategoryconfirm-title' ).text();

bs.categoryManager.ui.dialog.DeleteCategory.static.size = 'medium';

bs.categoryManager.ui.dialog.DeleteCategory.static.actions = [
	{
		action: 'delete',
		label: mw.message( 'bs-categorymanager-category-item-delete-label' ).text(),
		flags: [ 'primary', 'destructive' ],
		modes: [ 'confirm' ]
	},
	{
		label: mw.message( 'cancel' ).text(),
		flags: [ 'safe', 'close' ],
		modes: [ 'confirm' ]
	},
	{
		action: 'done',
		label: mw.message( 'bs-categorymanager-deletecategory-action-done-label' ).text(),
		flags: [ 'primary', 'progressive' ],
		modes: [ 'report' ]
	}
];

bs.categoryManager.ui.dialog.DeleteCategory.prototype.initialize = function () {
	bs.categoryManager.ui.dialog.DeleteCategory.super.prototype.initialize.apply( this, arguments );

	this.stack = new OO.ui.StackLayout( {
		items: [
			this.makeConfirmPanel(),
			this.makeProgressPanel(),
			this.makeReportPanel()
		],
		continuous: false,
		expanded: false
	} );

	this.$body.append( this.stack.$element );
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.getBodyHeight = function () {
	const current = this.stack && this.stack.getCurrentItem();
	const height = current ? current.$element.outerHeight( true ) : 0;
	return height > 0 ? height : 100;
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.makeConfirmPanel = function () {
	this.confirmPanel = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false
	} );

	this.$confirmCount = $( '<p>' )
		.text( mw.message( 'bs-categorymanager-deletecategory-counting' ).text() );

	this.confirmPanel.$element.append(
		$( '<p>' ).text( mw.message( 'bs-categorymanager-removecategoryconfirm-text' ).text() ),
		this.$confirmCount
	);

	return this.confirmPanel;
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.makeProgressPanel = function () {
	this.progressPanel = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false
	} );

	this.$currentOperation = $( '<div>' ).addClass( 'bs-categorymanager-delete-current-op' );
	this.progressBar = new OO.ui.ProgressBarWidget( { progress: 0 } );
	this.$logContainer = $( '<div>' ).addClass( 'bs-categorymanager-delete-log' );

	this.progressPanel.$element.append(
		this.$currentOperation,
		this.progressBar.$element,
		this.$logContainer
	);

	return this.progressPanel;
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.makeReportPanel = function () {
	this.reportPanel = new OO.ui.PanelLayout( {
		padded: true,
		expanded: false
	} );

	this.reportMessage = new OO.ui.MessageWidget( { type: 'success' } );
	this.$reportDetails = $( '<div>' ).addClass( 'bs-categorymanager-delete-report-details' );

	this.reportPanel.$element.append(
		this.reportMessage.$element,
		this.$reportDetails
	);

	return this.reportPanel;
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.getSetupProcess = function ( data ) {
	return bs.categoryManager.ui.dialog.DeleteCategory.parent.prototype.getSetupProcess.call( this, data )
		.next( () => {
			this.actions.setMode( 'confirm' );
			this.actions.setAbilities( { delete: false } );
			this.pushPending();

			this.actionApi.getRemoveCategoryActions( 'Category:' + this.category )
				.done( ( categoryActions ) => {
					this.categoryActions = categoryActions;
					this.$confirmCount.text( mw.message(
						'bs-categorymanager-deletecategory-affected-pages',
						categoryActions.length
					).text() );
					this.popPending();
					this.actions.setAbilities( { delete: true } );
					this.updateSize();
				} )
				.fail( () => {
					this.popPending();
					this.showErrors( new OO.ui.Error(
						mw.message( 'bs-categorymanager-deletecategory-error-members' ).text(),
						{ recoverable: false }
					) );
				} );
		} );
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.getTeardownProcess = function ( data ) {
	return bs.categoryManager.ui.dialog.DeleteCategory.parent.prototype.getTeardownProcess.call( this, data )
		.first( () => {
			this.emit( 'close' );
		} );
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.getActionProcess = function ( action ) {
	if ( action === 'delete' ) {
		return new OO.ui.Process( () => {
			this.actions.setMode( 'progress' );
			this.stack.setItem( this.progressPanel );
			this.updateSize();
			return this.runDelete();
		} );
	}
	if ( action === 'done' ) {
		return new OO.ui.Process( () => {
			this.close( { action: action } );
		} );
	}

	return bs.categoryManager.ui.dialog.DeleteCategory.super.prototype.getActionProcess.call( this, action );
};

/**
 * @inheritdoc
 */
bs.categoryManager.ui.dialog.DeleteCategory.prototype.getEscapeAction = function () {
	// Pages are being edited right now, the dialog must not be closed by accident
	if ( this.running ) {
		return null;
	}
	return bs.categoryManager.ui.dialog.DeleteCategory.super.prototype.getEscapeAction.call( this );
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.runDelete = function () {
	this.running = true;
	const dfd = $.Deferred();
	const total = this.categoryActions.length;

	this.actionApi.deleteCategory( this.category, {
		actions: this.categoryActions,
		onProgress: ( page, index ) => {
			this.$currentOperation.text( mw.message(
				'bs-categorymanager-deletecategory-progress-current',
				page,
				index + 1,
				total
			).text() );
		},
		onPageResult: ( page, success, message ) => {
			this.processedCount++;
			this.addLogItem( page, success, message );
			this.progressBar.setProgress( Math.round( ( this.processedCount / total ) * 100 ) );
		},
		onCategoryPageDelete: () => {
			this.progressBar.setProgress( 100 );
			this.$currentOperation.text( mw.message(
				'bs-categorymanager-deletecategory-progress-category-page',
				this.category
			).text() );
		}
	} )
		.done( ( result ) => {
			this.running = false;
			this.showReport( result );
			dfd.resolve();
		} )
		.fail( () => {
			this.running = false;
			this.showErrors( new OO.ui.Error(
				mw.message( 'bs-categorymanager-deletecategory-error-unknown' ).text(),
				{ recoverable: false }
			) );
			dfd.resolve();
		} );

	return dfd.promise();
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.addLogItem = function ( page, success, message ) {
	const $item = $( '<div>' )
		.addClass( 'bs-categorymanager-delete-log-item' )
		.append(
			new OO.ui.IconWidget( { icon: success ? 'check' : 'close' } ).$element,
			$( '<span>' ).addClass( 'bs-categorymanager-delete-log-item-label' ).text( page )
		);

	if ( !success && message ) {
		$item.append( $( '<span>' ).addClass( 'bs-categorymanager-delete-log-item-error' ).text( message ) );
	}

	this.$logContainer.append( $item );
	this.$logContainer.scrollTop( this.$logContainer.prop( 'scrollHeight' ) );
};

bs.categoryManager.ui.dialog.DeleteCategory.prototype.showReport = function ( result ) {
	this.$reportDetails.empty();

	if ( result.failed.length > 0 ) {
		this.reportMessage.setType( 'error' );
		this.reportMessage.setLabel( mw.message(
			'bs-categorymanager-deletecategory-report-failed',
			result.failed.length,
			result.total
		).text() );
		this.$reportDetails.append( $( '<p>' ).text(
			mw.message( 'bs-categorymanager-deletecategory-report-kept', this.category ).text()
		) );
		for ( let i = 0; i < result.failed.length; i++ ) {
			this.$reportDetails.append(
				$( '<div>' ).addClass( 'bs-categorymanager-delete-report-failure' ).append(
					$( '<span>' ).text( result.failed[ i ].page ),
					$( '<span>' ).addClass( 'bs-categorymanager-delete-report-failure-reason' ).text( result.failed[ i ].message )
				)
			);
		}
	} else if ( result.categoryPageError ) {
		this.reportMessage.setType( 'error' );
		this.reportMessage.setLabel( mw.message(
			'bs-categorymanager-deletecategory-error-category-page',
			this.category,
			result.categoryPageError
		).text() );
	} else {
		this.reportMessage.setType( 'success' );
		this.reportMessage.setLabel( mw.message(
			'bs-categorymanager-deletecategory-report-success',
			this.category,
			result.processed
		).text() );
	}

	this.actions.setMode( 'report' );
	this.stack.setItem( this.reportPanel );
	this.updateSize();
};
