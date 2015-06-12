define([
  'angular',
  'app',
  'lodash',
  'jquery',
  'jquery.flot',
  'jquery.flot.time',
],
function (angular, app) {
  'use strict';

  var module = angular.module('grafana.panels.table', []);
  app.useModule(module);

  module.directive('tablePanel', function() {

    return {
      link: function(scope, elem) {
        var $container = $('<table class="grafana-options-table"></table>');
        var firstRender = true;
        var tablesData, options;
        var panel = scope.panel;
        var i;
        var col;

        scope.$on('render', function() {
          tablesData = scope.tablesData;
          if (tablesData) {
            render();
          }
        });

        function getSeriesIndexForElement(el) {
          return el.parents('[data-series-index]').data('series-index');
        }

        function getTableHeaderHtml(colName) {
          var html = '<th class="pointer" data-stat="' + colName + '">' + colName;
          return html + '</th>';
        }

        function getTableCellHtml(value) {
          var html = '<td>' + value;
          return html + '</td>';
        }

        function getTableRowHtml(row, columnDefs) {
          var html = '<tr>';
          for(var i in columnDefs){
            html += getTableCellHtml(row[columnDefs[i].field]);
          }
          return html + '</tr>';
        }

        function render() {
          if (firstRender) {
            elem.append($container);
            firstRender = false;
          }

          var gridOptions = scope.gridOptions;

          $container.empty();

          var header = '<tr>';

          if(gridOptions === undefined)
          {
            header += getTableHeaderHtml('No Data');
          } else {
            for (col in gridOptions.columnDefs) {
              header += getTableHeaderHtml(gridOptions.columnDefs[col].field);
            };
          }
          header += '</tr>';
          $container.append($(header));

          if(gridOptions === undefined) {
              $container.append('<tr><td>No Data</td></tr>');
          } else {
            for (i = 0; i < gridOptions.data.length; i++) {
              var row = gridOptions.data[i];

              // ignore empty series
              if (! row) {
                continue;
              }

              var html = getTableRowHtml(row, gridOptions.columnDefs);
              $container.append($(html));
            }
          }
        }
      }
    };
  });

});
