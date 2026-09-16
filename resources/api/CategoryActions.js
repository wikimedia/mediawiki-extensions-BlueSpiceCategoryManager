bs.util.registerNamespace( 'bs.categoryManager.api' );

bs.categoryManager.api.CategoryActions = function () {

};

OO.initClass( bs.categoryManager.api.CategoryActions );

bs.categoryManager.api.CategoryActions.prototype.addCategory = function ( newCategory, parentCategory ) {
	const dfd = $.Deferred();
	const newCatTitle = mw.Title.makeTitle( bs.ns.NS_CATEGORY, newCategory );

	return this.getCategoryNames()
		.then( ( allCategories ) => {
			if ( allCategories.indexOf( newCategory.toLowerCase() ) !== -1 ) {
				bs.util.alert(
					'bs-categorymanager',
					{
						titleMsg: 'bs-categorymanager-addcategory-dialog-error-duplicate-title',
						text: mw.message( 'bs-categorymanager-addcategory-dialog-error-duplicate-text' ).text()
					}
				);
				dfd.reject( 'duplicate' );
				return dfd.promise();
			} else {
				const parentCatParam = [];
				if ( parentCategory.length > 0 ) {
					parentCatParam.push( mw.Title.makeTitle( bs.ns.NS_CATEGORY, parentCategory ).getPrefixedDb() );
				}
				return this.addCategories( newCatTitle.getPrefixedDb(), parentCatParam );
			}
		} )
		.then( () => {
			dfd.resolve( this );
			return dfd.promise();
		} )
		.catch( ( error, page, result ) => {
			if ( result.errors && result.errors.length > 0 ) {
				dfd.reject( result.errors[ 0 ].html );
			} else {
				dfd.reject( result );
			}
			return dfd.promise();
		} );
};

bs.categoryManager.api.CategoryActions.prototype.renameCategory = function ( oldCategory, newCategory ) {
	const dfd = $.Deferred();
	const fullName = 'Category:' + oldCategory;
	return this.getCategoryNames()
		.then( ( allCategories ) => {
			if ( allCategories.indexOf( newCategory.toLowerCase() ) !== -1 ) {
				bs.util.alert(
					'bs-categorymanager',
					{
						titleMsg: 'bs-categorymanager-addcategory-dialog-error-duplicate-title',
						text: mw.message( 'bs-categorymanager-addcategory-dialog-error-duplicate-text' ).text()
					}
				);
				dfd.reject( 'duplicate' );
				return dfd.promise();
			} else {
				return this.getPages( oldCategory );
			}
		} )
		.then( ( pages ) => this.moveCategory( oldCategory, newCategory )
			.then( () => {
				if ( pages.length > 0 ) {
					return pages.reduce(
						( promise, page ) => promise.then(
							() => this.replaceCategoriesInPage( page.title, oldCategory, newCategory )
						),
						Promise.resolve()
					);
				}
			} ) )
		.then( () => this.removeCategories( fullName, [ oldCategory ] ) )
		.then( () => this.addCategories( fullName, [ newCategory ] ) )
		.then( () => this.removeCategoryPage( fullName ) )
		.then( () => {
			dfd.resolve( this );
			return dfd.promise();
		} )
		.catch( ( error ) => {
			dfd.reject( error );
			return dfd.promise();
		} );
};

bs.categoryManager.api.CategoryActions.prototype.move = function ( moveCategory, newCategory, oldCategory ) {
	const dfd = $.Deferred();
	const fullName = 'Category:' + moveCategory;

	return this.removeCategories( fullName, [ oldCategory ] )
		.then( () => this.addCategories( fullName, [ newCategory ] ) )
		.then( () => {
			dfd.resolve( this );
			return dfd.promise();
		} )
		.catch( ( error ) => {
			dfd.reject( error );
			return dfd.promise();
		} );
};

/**
 * Removes the category from all pages it is assigned to and then deletes the category
 * page itself. Since this may touch a large number of pages, the caller can follow the
 * process page by page.
 *
 * @param {string} category Category name, without namespace prefix
 * @param {Object} [options]
 * @param {Array} [options.actions] Pre-fetched result of getRemoveCategoryActions, to
 *  avoid querying the members a second time
 * @param {Function} [options.onProgress] Called with ( page, index, total ) before a page is processed
 * @param {Function} [options.onPageResult] Called with ( page, success, message ) after a page is processed
 * @param {Function} [options.onCategoryPageDelete] Called before the category page itself is deleted
 * @return {jQuery.Promise} Resolves with an object holding total, processed, failed and,
 *  if the category page could not be removed, categoryPageError
 */
bs.categoryManager.api.CategoryActions.prototype.deleteCategory = function ( category, options ) {
	options = options || {};
	const dfd = $.Deferred();
	const fullName = 'Category:' + category;

	const actionsDfd = $.Deferred();
	if ( options.actions ) {
		actionsDfd.resolve( options.actions );
	} else {
		this.getRemoveCategoryActions( fullName )
			.done( ( categoryActions ) => actionsDfd.resolve( categoryActions ) )
			.fail( () => actionsDfd.reject() );
	}

	actionsDfd.promise()
		.done( ( categoryActions ) => {
			this.removeCategoryFromPages( categoryActions, options ).done( ( result ) => {
				if ( result.failed.length > 0 ) {
					dfd.resolve( result );
					return;
				}
				if ( typeof options.onCategoryPageDelete === 'function' ) {
					options.onCategoryPageDelete( fullName );
				}
				this.removeCategoryPage( fullName )
					.done( () => {
						dfd.resolve( result );
					} )
					.fail( ( me, response ) => {
						result.categoryPageError = this.getErrorMessage( response );
						dfd.resolve( result );
					} );
			} );
		} )
		.fail( () => {
			dfd.reject();
		} );

	return dfd.promise();
};

/**
 * Removes a category from the given pages, one after another. A page that cannot be
 * processed is recorded and does not stop the remaining pages.
 *
 * @param {Array} categoryActions List of { page, categories } as returned by getRemoveCategoryActions
 * @param {Object} options See deleteCategory
 * @return {jQuery.Promise}
 */
bs.categoryManager.api.CategoryActions.prototype.removeCategoryFromPages = function ( categoryActions, options ) {
	const dfd = $.Deferred();
	const total = categoryActions.length;
	const result = {
		total: total,
		processed: 0,
		failed: []
	};

	const step = ( index ) => {
		if ( index >= total ) {
			dfd.resolve( result );
			return;
		}
		const action = categoryActions[ index ];
		if ( typeof options.onProgress === 'function' ) {
			options.onProgress( action.page, index, total );
		}

		this.removeCategories( action.page, action.categories )
			.done( () => {
				result.processed++;
				if ( typeof options.onPageResult === 'function' ) {
					options.onPageResult( action.page, true );
				}
				step( index + 1 );
			} )
			.fail( ( context, data, response ) => {
				const message = this.getErrorMessage( response );
				result.failed.push( { page: action.page, message: message } );
				if ( typeof options.onPageResult === 'function' ) {
					options.onPageResult( action.page, false, message );
				}
				step( index + 1 );
			} );
	};

	step( 0 );
	return dfd.promise();
};

/**
 * @param {Object} response
 * @return {string}
 */
bs.categoryManager.api.CategoryActions.prototype.getErrorMessage = function ( response ) {
	if ( response && response.errors && response.errors.length > 0 ) {
		return $( '<span>' ).html( response.errors[ 0 ].html || response.errors[ 0 ].message || '' ).text();
	}
	if ( response && response.error && response.error.info ) {
		return response.error.info;
	}
	return mw.message( 'bs-categorymanager-deletecategory-error-unknown' ).text();
};

bs.categoryManager.api.CategoryActions.prototype.removeCategoryPage = function ( category ) {
	const dfd = $.Deferred(),
		me = this,
		deletePageAPI = new mw.Api();

	deletePageAPI.postWithToken( 'csrf', {
		action: 'delete',
		title: category
	} )
		.fail( ( code, errResp ) => {
			dfd.reject( me, errResp );
		} )
		.done( ( resp ) => {
			if ( resp.delete.title === undefined ) {
				dfd.reject( me, resp );
			}

			dfd.resolve( me );
		} );
	return dfd.promise();
};

bs.categoryManager.api.CategoryActions.prototype.addCategories = function ( page, categories ) {
	const dfd = $.Deferred();

	const set = {
		categories: categories,
		page_title: page // eslint-disable-line camelcase
	};
	this.doTask( dfd, 'wikipage-addcategories', set );
	return dfd.promise();
};

bs.categoryManager.api.CategoryActions.prototype.removeCategories = function ( page, categories ) {
	const dfd = $.Deferred();

	const set = {
		categories: categories,
		page_title: page // eslint-disable-line camelcase
	};
	this.doTask( dfd, 'wikipage-removecategories', set );
	return dfd.promise();
};

bs.categoryManager.api.CategoryActions.prototype.doTask = function ( dfd, task, data ) {
	const pageTitle = mw.Title.newFromText( data.page_title );
	if ( data.categories.length > 0 ) {
		data.categories = data.categories.join( '|' );
	} else {
		delete ( data.categories );
	}

	bs.api.tasks.exec(
		'wikipage',
		task,
		data,
		{
			useService: true,
			context: {
				wgAction: 'edit',
				wgCanonicalSpecialPageName: false,
				wgCanonicalNamespace: pageTitle.getNamespacePrefix().split( ':' ).shift(),
				wgPageName: pageTitle.getPrefixedText(),
				wgNamespaceNumber: pageTitle.getNamespaceId(),
				wgRedirectedFrom: pageTitle.getPrefixedText(),
				wgTitle: pageTitle.getMain()
			}
		}
	).fail( function ( response ) {
		dfd.reject( this, data, response );
	} )
		.done( function ( response ) {
			if ( !response.success ) {
				dfd.reject( this, data, response );
			}
			dfd.resolve( this );
		} );
};

bs.categoryManager.api.CategoryActions.prototype.getCategoryNames = function () {
	const dfd = $.Deferred();
	const categoryData = [];
	this.getCategoryNamesFromAPI( categoryData, dfd );
	return dfd.promise();
};

bs.categoryManager.api.CategoryActions.prototype.moveCategory = function ( oldCategory, newCategory ) {
	const dfd = $.Deferred(),
		oldTitle = mw.Title.makeTitle( bs.ns.NS_CATEGORY, oldCategory ),
		newTitle = mw.Title.makeTitle( bs.ns.NS_CATEGORY, newCategory ),
		params = {
			action: 'move',
			from: oldTitle.getPrefixedDb(),
			to: newTitle.getPrefixedDb(),
			movetalk: true,
			ignorewarnings: true
		};

	new mw.Api().postWithEditToken( params ).done( () => {
		dfd.resolve( this );
	} )
		.fail( () => {
			dfd.reject( this );
		} );

	return dfd.promise();
};

bs.categoryManager.api.CategoryActions.prototype.getCategoryNamesFromAPI = function ( categoryData, dfd, accontinueValue ) {
	accontinueValue = accontinueValue || '';
	const params = {
		action: 'query',
		format: 'json',
		list: 'allcategories',
		accontinue: accontinueValue
	};
	const api = new mw.Api();
	api.get( params ).done( ( data ) => {
		if ( data.query.allcategories ) {
			for ( let i = 0; i < data.query.allcategories.length; i++ ) {
				categoryData.push( data.query.allcategories[ i ][ '*' ].toLowerCase() );
			}
		}
		if (
			data.hasOwnProperty( 'continue' ) && data.continue.hasOwnProperty( 'accontinue' ) &&
			data.continue.accontinue !== ''
		) {
			accontinueValue = data.continue.accontinue;
			this.getCategoryNamesFromAPI( categoryData, dfd, accontinueValue );
		} else {
			accontinueValue = '';
			dfd.resolve( categoryData );
		}
	} );
};

bs.categoryManager.api.CategoryActions.prototype.getPages = function ( category ) {
	const dfd = $.Deferred();
	const pages = [];
	this.getPagesFromAPI( category, pages, dfd );
	return dfd.promise();
};

bs.categoryManager.api.CategoryActions.prototype.getPagesFromAPI = function ( category, pages, dfd, cmcontinueValue ) {
	const params = {
		action: 'query',
		list: 'categorymembers',
		cmtitle: 'category:' + category,
		format: 'json',
		cmcontinue: cmcontinueValue
	};

	new mw.Api().get( params ).done( ( json ) => {
		if ( json.query.categorymembers ) {
			for ( let i = 0; i < json.query.categorymembers.length; i++ ) {
				pages.push( json.query.categorymembers[ i ] );
			}
		}
		if ( json.continue && json.continue.cmcontinue != '' ) { // eslint-disable-line eqeqeq
			cmcontinueValue = json.continue.cmcontinue;
			this.getPagesFromAPI( category, pages, dfd, cmcontinueValue );
		} else {
			cmcontinueValue = '';
			dfd.resolve( pages );
		}
	} );
};

bs.categoryManager.api.CategoryActions.prototype.replaceCategoriesInPage = function ( pageTitle, oldCategory, newCategory ) {
	const dfd = $.Deferred();

	new mw.Api().edit( pageTitle, ( revision ) => {
		const categorymembers = this.getCategoriesFromConfig();
		const oldCategoryNames = this.prepareNewCategoryName( oldCategory )
			.split( '|' )
			.map( ( name ) => name.replace( /[.*+?^${}()[\]\\]/g, '\\$&' ) )
			.join( '|' );
		const regex = new RegExp( '\\[\\[(' + categorymembers + '):(' + oldCategoryNames + ')\\]\\]', 'gmi' );
		const newtext = revision.content.replace( regex, '[[$1:' + newCategory + ']]' );
		return {
			text: newtext,
			summary: 'Replace "' + oldCategory + '" with "' + newCategory + '".',
			minor: true
		};
	} )
		.done( () => {
			dfd.resolve( this );
		} )
		.fail( () => {
			dfd.reject( this );
		} );

	return dfd.promise();
};

bs.categoryManager.api.CategoryActions.prototype.getCategoriesFromConfig = function () {
	const namespaceIds = mw.config.get( 'wgNamespaceIds' );
	let categorynames = '';

	for ( const key in namespaceIds ) {
		if ( namespaceIds[ key ] == 14 ) { // eslint-disable-line eqeqeq
			categorynames = categorynames + key + '|';
		}
	}

	// Remove last '|'
	if ( categorynames.length > 0 ) {
		categorynames = categorynames.slice( 0, Math.max( 0, categorynames.length - 1 ) );
	}
	return categorynames;
};

bs.categoryManager.api.CategoryActions.prototype.prepareNewCategoryName = function ( category ) {
	let result = '';
	if ( category.includes( ' ' ) && category.includes( '_' ) ) {
		const withUnderscore = category.replace( ' ', '_' );
		const withWhitespaces = withUnderscore.replace( '_', ' ' );
		result = withUnderscore + '|' + withWhitespaces;
	} else if ( category.includes( '_' ) ) {
		result = category + '|' + category.replace( '_', ' ' );
	} else if ( category.includes( ' ' ) ) {
		result = category + '|' + category.replace( ' ', '_' );
	} else {
		result = category;
	}
	return result;
};

bs.categoryManager.api.CategoryActions.prototype.getRemoveCategoryActions = function ( category ) {
	const dfd = $.Deferred(),
		queryData = {
			cmtitle: category,
			titles: category
		},
		categoryActions = [];
	this.getRemoveCategoryActionsRecursive( dfd, queryData, categoryActions );
	return dfd.promise();
};

bs.categoryManager.api.CategoryActions.prototype.getRemoveCategoryActionsRecursive = function ( dfd, queryData, categoryActions ) {
	const api = new mw.Api();
	queryData = Object.assign( {
		action: 'query',
		list: 'categorymembers',
		cmlimit: 'max',
		prop: 'pageprops'
	}, queryData );

	api.get( queryData ).done( ( response ) => {
		if ( !response.query.hasOwnProperty( 'categorymembers' ) ||
			response.query.categorymembers.length === 0 ) {
			dfd.resolve( categoryActions );
		}
		for ( let i = 0; i < response.query.categorymembers.length; i++ ) {
			// maybe the categories is not necessary
			categoryActions.push( {
				page: response.query.categorymembers[ i ].title,
				categories: [ queryData.cmtitle ]
			} );
		}

		if ( response.hasOwnProperty( 'continue' ) ) {
			queryData = $.extend( queryData, response.continue ); // eslint-disable-line no-jquery/no-extend
			this.getRemoveCategoryActionsRecursive( dfd, queryData, categoryActions );
		} else {
			dfd.resolve( categoryActions );
		}
	} ).fail( () => {
		dfd.reject();
	} );
};
