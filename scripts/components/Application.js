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

		this.layerProcessIndex = 0;

		this.state = {
			layers: []
		};
	}

	createStyleSheet() {
		// Create the <style> tag
		var style = document.createElement("style");

		// Add a media (and/or media query) here if you'd like!
		// style.setAttribute("media", "screen")
		// style.setAttribute("media", "only screen and (max-width : 1024px)")

		// WebKit hack :(
		style.appendChild(document.createTextNode(""));

		// Add the <style> element to the page
		document.head.appendChild(style);

		return style.sheet;
	}

	componentDidMount() {
		this.map = this.refs.map.map;
		window.snabbKarta = this;
		window.map = this.map;

		this.customStyleSheet = this.createStyleSheet();

		if (window.location.search.indexOf('?config=') > -1) {
			var configFile = window.location.search.split('=')[1];

			console.log('Load config '+configFile);

			fetch('config/'+configFile)
				.then(function(response) {
					return response.json()
				}).then(function(json) {
					if (json.config) {
						this.configMap(json.config);
					}
					this.addLayers(_.filter(json.layers, function(layer) {
						return !layer.hidden;
					}));
				}.bind(this)).catch(function(ex) {
					console.log('parsing failed', ex)
				})
			;
		}
	}

	configMap(config) {
		this.setState({
			config: config
		});
		if (config.center || config.zoom) {
			this.refs.map.map.setView(config.center || this.refs.map.map.getCenter(), config.zoom || this.refs.map.map.getZoom());
		}
	}

	addLayers(layers) {
		this.setState({
			layers: layers
		});

		_.each(layers, function(layer, index) {
			if (layer.hidden) {
				return;
			}

			var layerType = layer.type.toLowerCase();

			if (layerType == 'geojson') {
				this.addGeoJson(layer, index);
			}
			if (layerType == 'vectorgrid') {
				this.addVectorGrid(layer, index);
			}
			if (layerType == 'wms') {
				this.addWMSLayer(layer, index);
			}
		}.bind(this));
	}

	addLayer(layer, layerData) {
		console.log(layerData);
		layer.addTo(this.refs.map.map);
		this.refs.map.layersControl.addOverlay(layer, layerData.name, true);

		if ((layerData.markerStyle && layerData.markerStyle.fillColor) || layerData.menuColor) {
			console.log('Add style rule');

			var color = (layerData.markerStyle && layerData.markerStyle.fillColor) ? layerData.markerStyle.fillColor : layerData.menuColor;
			var styleRule = '.map-wrapper .leaflet-control-container .leaflet-control-layers .leaflet-control-layers-overlays label:nth-child('+(this.layerProcessIndex+1)+') span:before {'+
				'content: " ";'+
				'display: inline-block;'+
				'position: relative;'+
				'top: 4px;'+
				'margin: 0 5px;'+
				'width: 20px;'+
				'height: 20px;'+
				'border-radius: 3px;'+
				'background-color: '+color+';'
			'}';

			console.log(styleRule);

			this.customStyleSheet.insertRule(styleRule);
		}

		this.layerProcessIndex++;
	}

	addGeoJson(layerData, index) {
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
	 					showCoverageOnHover: false,
	 					maxClusterRadius: 40,
	 					iconCreateFunction: function (cluster) {
							var childCount = cluster.getChildCount();
							var c = ' marker-cluster-';
							if (childCount < 10) {
								c += 'small';
							} else if (childCount < 20) {
								c += 'medium';
							} else {
								c += 'large';
							}

							var divBackgroundStyle = '';

							if (layerData.markerStyle && layerData.markerStyle.fillColor) {
								divBackgroundStyle = 'style="background-color: '+layerData.markerStyle.fillColor+'"'
							}

							return new L.DivIcon({
								html: '<div '+divBackgroundStyle+'><span>'+
									'<b>'+childCount+'</b>'+
									'</span></div>',
								className: 'marker-cluster'+c,
								iconSize: new L.Point(28, 28)
							});
						}
	 				});

					clusterGroup.addLayer(layer);

					this.addLayer(clusterGroup, layerData);
				}
				else {
					if (layerData.popupTemplate) {
						layer.bindPopup(function(marker) {
							var template = _.template(layerData.popupTemplate);
							return template(marker.feature.properties);
						});
					}

					this.addLayer(layer, layerData);
				}
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	addVectorGrid(layerData, index) {
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
			layer.on('click', function(event) {wms
				console.log(event);
				var template = _.template(layerData.popupTemplate);

				L.popup()
					.setContent(template(event.layer.properties))
					.setLatLng(event.latlng)
					.openOn(this.map);
			}.bind(this));
		}

		this.addLayer(layer, layerData);
//		layer.bringToFront();
	}

	addWMSLayer(layerData, index) {
		var layer = L.tileLayer.wms(layerData.url, {
			layers: layerData.layers,
			format: 'application/png',
			transparent: true
		});

		this.addLayer(layer, layerData);
	}

	render() {
		return (
			<div className="map-ui">

				{
					this.state.config && this.state.config.mapTitle &&
					<h1 className="map-title">{this.state.config.mapTitle}</h1>
				}

				<MapBase layersControlStayOpen={true} disableSwedenMap={false} maxZoom="13" scrollWheelZoom={true} ref="map" className="map-wrapper full-fixed" />

			</div>
		);
	}
}