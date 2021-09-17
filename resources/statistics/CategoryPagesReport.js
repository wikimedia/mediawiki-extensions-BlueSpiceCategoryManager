(function ( mw, $, bs) {
	bs.util.registerNamespace( 'bs.categoryManager.report' );

	bs.categoryManager.report.CategoryPagesReport = function ( cfg ) {
		bs.categoryManager.report.CategoryPagesReport.parent.call( this, cfg );
	};

	OO.inheritClass( bs.categoryManager.report.CategoryPagesReport, bs.aggregatedStatistics.report.ReportBase );

	bs.categoryManager.report.CategoryPagesReport.static.label = mw.message( "bs-categorymanager-statistics-report-category-pages" ).text();

	bs.categoryManager.report.CategoryPagesReport.prototype.getFilters = function () {
		return [
			new bs.aggregatedStatistics.filter.IntervalFilter(),
			new bs.aggregatedStatistics.filter.CategoryMultiFilter( { required: true } ),
			new bs.aggregatedStatistics.filter.NamespaceFilter( { onlyContentNamespaces: true } ),
		];
	};

	bs.categoryManager.report.CategoryPagesReport.prototype.getChart = function () {
		return new bs.aggregatedStatistics.charts.LineChart();
	};
} )( mediaWiki, jQuery , blueSpice);