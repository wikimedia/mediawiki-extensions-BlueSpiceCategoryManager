Ext.define( 'BS.BlueSpiceCategoryManager.Model', {
	extend: 'BS.model.Category',
	fields: [
		{
			name: 'text', type: 'string', convert: function ( value, record ) {
				return mw.html.element( 'span', {
					'class': (record.raw.leaf ? 'bs-icon-tag' : 'bs-icon-tags' )
				},
				value );
			}
		},
		{
			name: 'link', type: 'string', convert: function ( value, record ) {
				return mw.Title.makeTitle( bs.ns.NS_CATEGORY, record.raw.text ).getUrl();
			}
		},
		{
			name: 'categoryName', type: 'string', convert: function ( value, record ) {
				return record.raw.text;
			}
		},
		{
			name: 'leaf', type: 'boolean', convert: function ( value, record ) {
				return false;
			}
		},
		{
			name: 'loaded', type: 'boolean', convert: function ( value, record ) {
				return record.raw.leaf;
			}
		}
	]
} );