Ext.define( 'BS.BlueSpiceCategoryManager.Model', {
	extend: 'BS.model.Category',
	fields: [
		{ name: 'text', type: 'string' },
		{
			name: 'leaf', type: 'boolean', convert: function ( value, record ) {
				return false;
			}
		},
		{
			name: 'loaded', type: 'boolean', convert: function ( value, record ) {
				return record.raw.leaf;
			}
		},
		{
			name: 'href', type: 'string', convert: function ( value, record ) {
				var catTitle = mw.Title.makeTitle( bs.ns.NS_CATEGORY, record.get( 'text' ) );
				return catTitle.getUrl();
			}
		},
		{
			name: 'hrefTarget', type: 'string', defaultValue: '_blank'
		}
	]
} );