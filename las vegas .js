Map.addLayer(lasvegas);

// Filter the Landsat 9 Collection 2, Tier 1 data between the specified dates
var dataset = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
    .filterDate('2024-06-01', '2024-09-01')
    .filterBounds(lasvegas);
    
    // Function to apply scaling factors for optical and thermal bands
function applyScaleFactors(image) {
  // Apply scaling to optical bands (SR_B1 to SR_B7)
  var opticalBands = image.select(['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'])
                          .multiply(0.0000275).add(-0.2);
  // Apply scaling to thermal bands (ST_B10)
  var thermalBands = image.select('ST_B10').multiply(0.00341802).add(149.0);
  
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

// Apply the scaling factors and get the median image
var medianImage = dataset.map(applyScaleFactors).median();

// Visualization parameters for true color image (RGB = 432)
var visualization = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'], // True color bands
  min: 0.0,
  max: 0.3,
};

// Add the true color image to the map
Map.addLayer(medianImage.clip(lasvegas), visualization, 'True Color (432)');

// Calculate NDVI using the median image
var ndvi = medianImage.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');

// NDVI visualization parameters
var ndvi_vis = {
  min: -1,
  max: 1,
  palette: ['blue', 'white', 'green']
};

// Add the NDVI layer to the map, clipped to AOI
Map.addLayer(ndvi.clip(lasvegas), ndvi_vis, 'NDVI');

// NDVI statistics (for FV and other calculations)
var ndvi_min = ee.Number(ndvi.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: lasvegas,
  scale: 30,
  maxPixels: 1e9
}).get('NDVI'));

var ndvi_max = ee.Number(ndvi.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: lasvegas,
  scale: 30,
  maxPixels: 1e9
}).get('NDVI'));

// Fraction of vegetation (FV)
var fv = (ndvi.subtract(ndvi_min).divide(ndvi_max.subtract(ndvi_min))).pow(ee.Number(2)).rename('FV');

// Emissivity (EM)
var em = fv.multiply(ee.Number(0.004)).add(ee.Number(0.986)).rename('EM');

// Use the median image to extract the thermal band
var thermal = medianImage.select('ST_B10').rename('thermal');

// Calculate Land Surface Temperature (LST)
var lst = thermal.expression(
  '(tb / (1 + (0.00115 * (tb/0.48359547432)) * log(em))) - 273.15',
  {'tb': thermal.select('thermal'), 'em': em}
).rename('LST');

// LST visualization parameters
var lst_vis = {
  min: 25,
  max: 50,
  palette: [
    '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
    '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
    '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
    'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
    'ff0000', 'de0101', 'c21301', 'a71001', '911003'
  ]
};

// Add the LST layer to the map
Map.addLayer(lst.clip(lasvegas), lst_vis, 'LST lasvegas');


// Urban Heat Island (UHI) Calculation

// LST mean and standard deviation
var lst_mean = ee.Number(lst.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: lasvegas,
  scale: 30,
  maxPixels: 1e9
}).values().get(0));

var lst_std = ee.Number(lst.reduceRegion({
  reducer: ee.Reducer.stdDev(),
  geometry: lasvegas,
  scale: 30,
  maxPixels: 1e9
}).values().get(0));

// Normalized UHI
var uhi = lst.subtract(lst_mean).divide(lst_std).rename('UHI');
var uhi_vis = {
  min: -4,
  max: 4,
  palette: ['313695', '74add1', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a', 'e31a1c', 'b10026']
};

// Add the UHI layer to the map
Map.addLayer(uhi.clip(lasvegas), uhi_vis, 'UHI lasvegas');

// Urban Thermal Field Variance Index (UTFVI)
var utfvi = lst.subtract(lst_mean).divide(lst).rename('UTFVI');
var utfvi_vis = {
  min: -1,
  max: 0.3,
  palette: ['313695', '74add1', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a', 'e31a1c', 'b10026']
};

// Add the UTFVI layer to the map
Map.addLayer(utfvi.clip(lasvegas), utfvi_vis, 'UTFVI lasvegas');

// Center the map on the area of interest
Map.centerObject(lasvegas, 10);

// Define export parameters for NDVI
Export.image.toDrive({
  image: ndvi.clip(lasvegas),
  description: 'NDVI_export',
  scale: 30,
  region: lasvegas,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

// Define export parameters for LST
Export.image.toDrive({
  image: lst.clip(lasvegas),
  description: 'LST_export',
  scale: 30,
  region: lasvegas,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

// Define export parameters for UHI
Export.image.toDrive({
  image: uhi.clip(lasvegas),
  description: 'UHI_export',
  scale: 30,
  region: lasvegas,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

// Define export parameters for UTFVI
Export.image.toDrive({
  image: utfvi.clip(lasvegas),
  description: 'UTFVI_export',
  scale: 30,
  region: lasvegas,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

// Define export parameters for True Color
Export.image.toDrive({
  image: medianImage.select(['SR_B4', 'SR_B3', 'SR_B2']).clip(lasvegas),
  description: 'TrueColor_export',
  scale: 30,
  region: lasvegas,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});


