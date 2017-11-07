import React from 'react';
import { hashHistory } from 'react-router';
import _ from 'underscore';
import L from 'leaflet';
import 'leaflet.vectorgrid';
import 'leaflet.markercluster';

import MapBase from './../../ISOF-React-modules/components/views/MapBase';

import EventBus from 'eventbusjs';

export default class Application extends React.Component {
	constructor(props) {
		super(props);

		// Lägg till globalt eventBus variable för att skicka data mellan moduler
		window.eventBus = EventBus;

		this.state = {
			layers: []
		};
	}

	componentDidMount() {
		this.map = this.refs.map.map;
		window.map = this.map;

		fetch('layers.config.json')
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.addLayers(json.layers);
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	addLayers(layers) {
		this.setState({
			layers: layers
		});

		_.each(layers, function(layer) {
			if (layer.hidden) {
				return;
			}

			var layerType = layer.type.toLowerCase();

			if (layerType == 'geojson') {
				this.addGeoJson(layer);
			}
			if (layerType == 'vectorgrid') {
				this.addVectorGrid(layer);
			}
			if (layerType == 'wms') {
				this.addWMSLayer(layer);
			}
		}.bind(this));
	}

	addGeoJson(layerData) {
		fetch(layerData.url)
			.then(function(response) {
				return response.json()
			}).then(function(json) {

				var layer = L.geoJSON(json, {
					onEachFeature: function(feature, marker) {
						if (layerData.popupTemplate && layerData.clustered) {
							marker.bindPopup(function (layer) {
								var template = _.template(layerData.popupTemplate);
								return template(feature.properties);
							});
						}
					},
					pointToLayer: function(geoJsonPoint, latlng) {
						if (layerData.markerStyle && layerData.markerStyle.type == 'circle') {
							var divIcon = L.divIcon({
								html: '<div class="map-circle-marker" style="border-radius: 100%;'+
									'width: '+(layerData.markerStyle.radius*2 || 20)+'px;'+
									'height: '+(layerData.markerStyle.radius*2 || 20)+'px;'+
									'background-color: '+(layerData.markerStyle.fillColor || '#af0b25')+';'+
									'border-color: '+(layerData.markerStyle.strokeColor || '#333')+';'+
									'border-width: '+(layerData.markerStyle.strokeWeight+'px' || '1px')+';'+
									'border-style: '+(layerData.markerStyle.strokeColor || layerData.markerStyle.strokeWeight ? 'solid' : 'none')+';'+
									'">'+
										(layerData.labelField ? '<div class="marker-label" style="top: '+(layerData.markerStyle.radius*2 || 20)+'px">'+geoJsonPoint.properties[layerData.labelField]+'</div>' : '')+
									'</div>'
								}
							);

							return L.marker(latlng, {
								icon: divIcon,
								iconAnchor: [layerData.markerStyle.radius || 10, layerData.markerStyle.radius || 10]
							});
/*
							return L.circleMarker(latlng, {
								radius: layerData.markerStyle.radius || 10,
								weight: layerData.markerStyle.strokeWeight || 1,
								color: layerData.markerStyle.strokeColor || '#444',
								fill: true,
								fillOpacity: layerData.markerStyle.fillOpacity || 1,
								fillColor: layerData.markerStyle.fillColor || '#af0b25'
							});
*/
						}
						else {
							return L.marker(latlng);
						}
					}
				});


				if (layerData.clustered) {
	 				var clusterGroup = new L.MarkerClusterGroup({
	 					showCoverageOnHover: false
	 				});
					clusterGroup.addLayer(layer);
					this.map.addLayer(clusterGroup);
				}
				else {
					if (layerData.popupTemplate) {
						layer.bindPopup(function(marker) {
							var template = _.template(layerData.popupTemplate);
							return template(marker.feature.properties);
						});
					}

					this.map.addLayer(layer);
				}
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	addVectorGrid(layerData) {
		var layerStyles = {};

		if (layerData.layers) {
			_.each(layerData.layers, function(vectorLayer) {
				layerStyles[vectorLayer.name] = vectorLayer.style;
			});
		}

		var layer = L.vectorGrid.protobuf(layerData.url, {
			interactive: true,
			vectorTileLayerStyles: layerStyles
		});

		if (layerData.popupTemplate) {
			layer.on('click', function(event) {
				console.log(event);
				var template = _.template(layerData.popupTemplate);

				L.popup()
					.setContent(template(event.layer.properties))
					.setLatLng(event.latlng)
					.openOn(this.map);
			}.bind(this));
		}

		layer.addTo(this.map);
		layer.bringToFront();
	}

	addWMSLayer(layerData) {
		var layer = L.tileLayer.wms(layerData.url, {
			layers: layerData.layers,
			format: 'application/png',
			transparent: true
		});

		this.map.addLayer(layer);
	}

	render() {
		return (
			<div>

				<MapBase disableSwedenMap={false} maxZoom="13" scrollWheelZoom={true} ref="map" className="map-container full-fixed" />

			</div>
		);
	}
}