Ext.define( 'BS.BlueSpiceCategoryManager.Model', {
	extend: 'BS.model.Category',
	fields: [
		{ name: 'text', type: 'string' },
		{
			name: 'leaf', type: 'boolean', convert: function() {
				return false;
			}
		},
		{
			name: 'href', type: 'string', convert: function( value, record  ) {
				var catTitle = mw.Title.makeTitle( bs.ns.NS_CATEGORY, record.get( 'text') );
				return catTitle.getUrl();
			}
		},
		{
			name: 'hrefTarget', type: 'string', defaultValue: '_blank'
		}
	]
} );