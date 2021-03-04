mapboxgl.accessToken = 'pk.eyJ1Ijoid3NoZW55YyIsImEiOiJja2w3YjNvd3YxZnc1Mm5wZWp1MnVqZGh2In0.-wG4LWFGN76Nf-AEigxu2A';

var map = new mapboxgl.Map({
  container: 'mapContainer', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [6.788837657629339, 15.828117667000484], // starting position [lng, lat]
  zoom: 1 // starting zoom
});



// add a navigation control
var nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-right');



//Displaying country names with code from: https://docs.mapbox.com/mapbox-gl-js/example/display-and-style-rich-text-labels/
//attempting to add a cluster function to the map with https://docs.mapbox.com/mapbox-gl-js/example/cluster/
//also referred to https://docs.mapbox.com/mapbox-gl-js/example/cluster-html/
//and https://medium.com/@droushi/mapbox-cluster-icons-based-on-cluster-content-d462a5a3ad5c
map.on('load', function () {
  map.setLayoutProperty('country-label', 'text-field', [
    'format',
    ['get', 'name_en'],
    { 'font-scale': 1.2 },
    '\n',
    {},
    ['get', 'name'],
    {
      'font-scale': 0.8,
      'text-font': [
        'literal',
        ['DIN Offc Pro Italic', 'Arial Unicode MS Regular']
      ]
    }
  ]);


  // Add a new source from our GeoJSON data and
  // set the 'cluster' option to true. GL-JS will
  // add the point_count property to your source data.
  map.addSource('grantees', {
    type: 'geojson',
    data: './data/astraeagrantees.geojson',
    cluster: true,
    clusterRadius: 50 // Radius of each cluster when clustering points
  });

  //styling clusters
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'grantees',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#11b4da',
      'circle-opacity': 0.8,
      'circle-radius': 15
    }
  });

  //styling for clusters, number of orgs in the cluster is displayed in circle
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'grantees',
    filter: ['has', 'point_count'],
    paint: {
      'text-translate': [0, 0],
    },
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-allow-overlap': true,
    },
  });

  //styling for unclustered points
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'grantees',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'worktype'],
        'LBTQ/Women',
        '#fbb03b',
        'Intersex Rights',
        '#223b53',
        '#e55e5e'
      ],
      'circle-opacity': 0.75,
      'circle-radius': 10,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });

  //clicking on a cluster causes the map to zoom a bit

  map.on('click', 'clusters', function (e) {
    var features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    });
    var clusterId = features[0].properties.cluster_id;
    map.getSource('grantees').getClusterExpansionZoom(
      clusterId,
      function (err, zoom) {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      });
    });


    //Making sure that a pop up appears with org info when
    //clicking on an unclustered point, also that map zooms in closer
    map.on('click', 'unclustered-point', function (e) {
      var coordinates = e.features[0].geometry.coordinates.slice();
      var html = `
      <div>
      <h3 style = "text-align: center;">${e.features[0].properties.name}
      <br>
      <a href="${e.features[0].properties.contact}" target="_blank">Organization Website</a>
      </h3>
      <p>${e.features[0].properties.description}</p>
      </div>
      `

      // Ensure that if the map is zoomed out such that
      // multiple copies of the feature are visible, the
      // popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map);

      map.flyTo({
        center: coordinates,
        zoom: 4
      });
    });

    //source: https://docs.mapbox.com/help/tutorials/choropleth-studio-gl-pt-2/

    var layers = ['LBTQ/Women', 'Intersex Rights', 'Trans Rights'];
    var colors = ['#fbb03b', '#223b53', '#e55e5e'];

    for (i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var color = colors[i];
      var item = document.createElement('div');
      var key = document.createElement('span');
      key.className = 'legend-key';
      key.style.backgroundColor = color;

      var value = document.createElement('span');
      value.innerHTML = layer;
      item.appendChild(key);
      item.appendChild(value);
      legend.appendChild(item);
    }

    //Mouse cursor will change to a pointer when over something clickable
    map.on('mouseenter', 'clusters', function () {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', function () {
      map.getCanvas().style.cursor = '';
    });


    map.on('mouseenter', 'unclustered-point', function () {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'unclustered-point', function () {
      map.getCanvas().style.cursor = '';
    });
  });
