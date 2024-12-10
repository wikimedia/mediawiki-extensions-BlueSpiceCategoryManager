( function ( mw, $, bs, d, undefined ) {

	$( function () {
		require( './ui/CategoryManager.js' );

		let manager = new bs.categoryManager.ui.CategoryManager();
		$( '#bs-categorymanager-tree' ).append( manager.$element );
	} );

} )( mediaWiki, jQuery, blueSpice, document );
