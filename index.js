import Map from 'ol/Map'
import View from 'ol/View'
import OSMXML from 'ol/format/OSMXML'
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer'
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import {transformExtent} from 'ol/proj';
import BingMaps from 'ol/source/BingMaps';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';

let map = null;

const styles = {
    'amenity': {
        'parking': new Style({
            stroke: new Stroke({
                color: 'rgba(170, 170, 170, 1.0)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(170, 170, 170, 0.3)'
            })
        })
    },
    'building': {
        '.*': new Style({
            zIndex: 100,
            stroke: new Stroke({
                color: 'rgba(246, 99, 79, 1.0)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(246, 99, 79, 0.3)'
            })
        })
    },
    'highway': {
        'service': new Style({
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 1.0)',
                width: 2
            })
        }),
        '.*': new Style({
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 1.0)',
                width: 3
            })
        })
    },
    'landuse': {
        'forest|grass|allotments': new Style({
            stroke: new Stroke({
                color: 'rgba(140, 208, 95, 1.0)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(140, 208, 95, 0.3)'
            })
        })
    },
    'natural': {
        'tree|scrub': new Style({
            image: new CircleStyle({
                radius: 2,
                fill: new Fill({
                    color: 'rgba(140, 208, 95, 1.0)'
                }),
                stroke: null
            })
        })
    }
};

let vectorSource = new VectorSource({
    format: new OSMXML(),
    loader: function(extent, resolution, projection) {
        var epsg4326Extent = transformExtent(extent, projection, 'EPSG:4326');
        var client = new XMLHttpRequest();
        client.open('POST', 'https://overpass-api.de/api/interpreter');
        client.addEventListener('load', function() {
            var features = new OSMXML().readFeatures(client.responseText, {
                featureProjection: map.getView().getProjection()
            });
            vectorSource.addFeatures(features);
        });
        // var query = '(node["natural"="scrub"](' +
        var query = '(node(' +
            epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
            epsg4326Extent[3] + ',' + epsg4326Extent[2] +
            ');rel(bn)->.foo;way["natural"="scrub"](bn);node(w)->.foo;rel(bw););out meta;';
        client.send(query);
    },
    strategy: bboxStrategy
});

let vector = new VectorLayer({
    source: vectorSource,
    style: function(feature) {
        for (var key in styles) {
            var value = feature.get(key);
            if (value !== undefined) {
                for (var regexp in styles[key]) {
                    if (new RegExp(regexp).test(value)) {
                        return styles[key][regexp];
                    }
                }
            }
        }
        return null;
    }
});

let raster = new TileLayer({
    // source: new BingMaps({
    //     imagerySet: 'AerialWithLabels',
    //     key: 'Al_859_5QYnu8IzcfKeOa96T3MrAyi5DkTLjHRoVLzUhSlglS68PIbzm5HQnxj0q'
    // })
    source: new OSM()
});

map = new Map({
    layers: [raster, vector],
    target: document.getElementById('map'),
    view: new View({
        // center: [769218, 5906096],
        center: [2068740.27, 7238187.46],
        maxZoom: 19,
        zoom: 19
    })
});