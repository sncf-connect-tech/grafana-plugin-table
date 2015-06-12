define([
  'angular',
  'app',
  'lodash',
  'components/timeSeries',
  'kbn',
  'components/panelmeta',
  './tablePanel'
],
function (angular, app, _, TimeSeries, kbn, PanelMeta) {
  'use strict';

  var module = angular.module('grafana.panels.table', []);
  app.useModule(module);

  module.controller('TableCtrl', function($scope, $filter, $log, panelSrv, timeSrv) {

    $scope.tablesData = { rows: [], cols: [] };

    $scope.panelMeta = new PanelMeta({
      description: 'Table Panel',
      fullscreen: true,
      metricsEditor: true
    });

    $scope.panelMeta.addEditorTab('Options', 'plugins/table/editor.html');

    // Set and populate defaults
    var _d = {
      valueName: 'avg',
      targets: [{}],
      maxDataPoints: 100,
      nullPointMode: 'connected',
      nbSplittedKeyInCol: 1,
      separator: '.',
      isTranspose: false,
      maxRows: 50,
      maxCols: 10,
    };

    _.defaults($scope.panel, _d);

    $scope.init = function() {
      panelSrv.init($scope);
      $scope.$on('refresh', $scope.get_data);
    };

    $scope.updateTimeRange = function () {
      $scope.range = timeSrv.timeRange();
      $scope.rangeUnparsed = timeSrv.timeRange(false);
      $scope.resolution = $scope.panel.maxDataPoints;
      $scope.interval = kbn.calculateInterval($scope.range, $scope.resolution, $scope.panel.interval);
    };

    $scope.get_data = function() {
      $scope.updateTimeRange();

      var metricsQuery = {
        range: $scope.rangeUnparsed,
        interval: $scope.interval,
        targets: $scope.panel.targets,
        maxDataPoints: $scope.resolution
      };

      return $scope.datasource.query(metricsQuery)
        .then($scope.dataHandler)
        .then(null, function(err) {
          $scope.panelMeta.loading = false;
          $scope.panelMeta.error = err.message || "Data request error";
          $scope.inspector.error = err;
          $scope.render();
        });
    };

    $scope.dataHandler = function(results) {
      $scope.panelMeta.loading = false;
      $scope.series = _.map(results.data, $scope.seriesHandler);
      $scope.render();
    };

    $scope.seriesHandler = function(seriesData, index) {
      var datapoints = seriesData.datapoints;
      var alias = seriesData.target;

      var series = new TimeSeries({
        datapoints: datapoints,
        alias: alias,
      });

      series.flotpairs = series.getFlotPairs($scope.panel.nullPointMode);

      return series;
    };

    $scope.render = function() {
      var tablesData = {};
      var series = $scope.series;
      
      $scope.buildFlatDataAndScopeIt(series);

      $scope.$emit('render');
    };

    $scope.buildFlatDataAndScopeIt = function(seriesList) {
      
      var gridOptions = { columnDefs : [] };
      var gridData = [];
      var rowByRowNames = [];
      var colNames = [];

      var nbSplittedKeyInCol = $scope.panel.nbSplittedKeyInCol;
      var separator = $scope.panel.separator;
      var isTranspose = $scope.panel.isTranspose;
      var maxRows = $scope.panel.maxRows;
      var maxCols = $scope.panel.maxCols;
      
      

      if(seriesList === undefined){
        $scope.panelMeta.loading = false;
        $scope.panelMeta.error = "Unable to get series from datasource";
        $scope.inspector.error = "Unable to get series from datasource";
        $scope.render();
        return;
      }

      $scope.panelMeta.error = "";
      $scope.inspector.error = "";

      for (var i = 0; i < seriesList.length; i++) {
          var series = seriesList[i];
          var alias = series.alias.split(separator);

          if(nbSplittedKeyInCol >= alias.length)
          {
            $scope.panelMeta.error = "The option value : 'Splitted alias in column' is lower or equal to the splitted alias";
            $scope.inspector.error = "The option value : 'Splitted alias in column' is lower or equal to the splitted alias";
            continue;
          }

          //split name by dot
          var rowName = alias.slice(0, alias.length-nbSplittedKeyInCol);
          var colName = alias.slice(alias.length-nbSplittedKeyInCol, alias.length);

          if(isTranspose)
          {
            var temp = rowName;
            rowName = colName;
            colName = temp;
          }

          if (rowByRowNames[rowName.join(separator)] == undefined) {
            colNames['key'] = 'key';
            rowByRowNames[rowName.join(separator)] = { 'key': rowName.join(separator) };
          }

          if (colNames[colName] == undefined) {
            colNames[colName] = colName;
          }

          var value = series.stats[$scope.panel.valueName];
          rowByRowNames[rowName.join(separator)][colName] = isNaN(value) ? '' : Math.round(value);
      }

      var nbRow = 1;
      for(var rowName in rowByRowNames)
      {
        if(nbRow > maxRows)
        {
          $scope.panelMeta.error = "Too many rows : "+Object.keys(rowByRowNames).length+" > "+maxRows+". See Option to change the max value";
          $scope.inspector.error = "Too many rows : "+Object.keys(rowByRowNames).length+" > "+maxRows+". See Option to change the max value";
          break;
        }
        gridData.push(rowByRowNames[rowName]);
        ++nbRow;
      }
      
      var nbCol = 1;
      for(var colName in colNames)
      {
        if(nbCol > maxCols)
        {
          $scope.panelMeta.error = "Too many columns : "+Object.keys(colNames).length+" > "+maxCols+". See Option to change the max value";
          $scope.inspector.error = "Too many columns : "+Object.keys(colNames).length+" > "+maxCols+". See Option to change the max value";
          break;
        }
        //Key must be first column
        if(colName === 'key')
        {
          gridOptions.columnDefs.unshift({field:colName});
        } else {
          gridOptions.columnDefs.push({field:colName});
        }
        
        ++nbCol;
      }

      gridOptions.data = gridData;
      $scope.gridOptions = gridOptions;
    };

    $scope.exportCsv = function() {
      kbn.exportSeriesListToCsv($scope.seriesList);
    };

    $scope.init();
  });

});
