Description
===========

This is a grafana table plugin.

Installation
============

Copy html and js files to a new directory "table" in  the grafana plugins directory.
A la main ou via maven:

Then add the plugin in the config.js :

```javascript
// Add your own custom panels
plugins: {
  // list of plugin panels
  panels: {
    'table': { path: '../plugins/table' } 
  },
  // requirejs modules in plugins folder that should be loaded
  // for example custom datasources
  dependencies: [],
}
```

Utilisation
===========

The table is split in row and column by the name of each serie (alias) with the separator (dot by default).
In the column, it take the sub key after the separator and the rest in the row.
For exemple, the serie MyService.MyMethod.MyIndicator can produce a table with one row MyService.MyMethod and one column MyIndicator.

Here an exemple of graphite key who works :
```
aliasByNode(Zenith.BLS.PAO.PAO.any.any.WAS.any.any.BLS.*.*.io.audit.any.vol.any.10min.count, 10,11,15)
```

Limitations
===========

- Grouping multiple series. For exemple, calculate an global error rate is easy but do it by sub key, isn't possible because we cannot ask to graphite to divide tow group of series by some matching element. 

Nota bene, we can use aliasSub with aliasByNode to have well names columns. Exemple :
```
aliasSub(aliasByNode(sumSeriesWithWildcards(Zenith.VSL.WDI.WDI.*.*.WAS.*.*.any.*.*.io.sla.any.err.{0060,0062}.10min.count, 4, 5, 7, 8,16), 6, 7, 11),"(.*)","\1 tech")
aliasSub(aliasByNode(sumSeriesWithWildcards(exclude(Zenith.VSL.WDI.WDI.*.*.WAS.*.*.any.*.*.io.sla.any.err.*.10min.count, "0060|0062"), 4, 5, 7, 8,13), 6, 7, 10),"(.*)","\1 fonct")
```
