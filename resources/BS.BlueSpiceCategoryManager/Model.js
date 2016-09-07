Ext.define( 'BS.BlueSpiceCategoryManager.Model', {
	extend: 'BS.model.Category',
	fields: [
		{ name: 'text', type: 'string' },
		{ name: 'leaf', type: 'boolean', 'default': false }
	]
} );