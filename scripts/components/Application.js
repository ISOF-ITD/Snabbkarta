import React from 'react';
import _ from 'underscore';
import L from 'leaflet';
import 'leaflet.vectorgrid';
import 'leaflet.markercluster';

window._ = _;

import MapBase from './../../ISOF-React-modules/components/views/MapBase';

import EventBus from 'eventbusjs';

export default class Application extends React.Component {
	constructor(props) {
		super(props);

		// Lägg till globalt eventBus variable för att skicka data mellan moduler
		window.eventBus = EventBus;

		this.searchBoxChangeHandler = this.searchBoxChangeHandler.bind(this);

		// Registrera kartan som object i window så man kan komma åt det i Developer Console
		window.isofKarta = this;

		this.layerProcessIndex = 0;

		this.leafletLayers = {};
		this.layerData = {};

		this.state = {
			layers: [],
			searchBoxVisible: false
		};
	}

	searchBoxChangeHandler(event) {
		console.log(event.target.value);

		if (this.layerData[this.state.searchLayer.layerId]) {
			if (event.target.value.length > 2) {			
				var searchLayer = this.layerData[this.state.searchLayer.layerId];

				this.addGeoJsonData(searchLayer.config, searchLayer.data, function(feature) {
					var found = false;

					_.each(searchLayer.config.searchFields, function(searchField) {
						if (event.target.value.substr(0, 1) == '-') {
							if (feature.properties[searchField].toLowerCase().substr(feature.properties[searchField].length-event.target.value.substr(1).length) == event.target.value.toLowerCase().substr(1)) {
								found = true;
							}
						}
						else {
							if (feature.properties[searchField].toLowerCase().indexOf(event.target.value.toLowerCase()) > -1) {
								found = true;
							};
						}
					});
					return found;
				});
			}
			else {
				this.addGeoJsonData(this.layerData[this.state.searchLayer.layerId].config, this.layerData[this.state.searchLayer.layerId].data);
			}
		}
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

	addLayer(layer, layerConfig) {
		layer.addTo(this.refs.map.map);
		this.refs.map.layersControl.addOverlay(layer, layerConfig.name, true);

		if ((layerConfig.markerStyle && layerConfig.markerStyle.fillColor) || layerConfig.menuColor) {
			console.log('Add style rule');

			var color = (layerConfig.markerStyle && layerConfig.markerStyle.fillColor) ? layerConfig.markerStyle.fillColor : layerConfig.menuColor;
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

	addGeoJson(layerConfig) {
		if (layerConfig.searchable) {
			this.setState({
				searchBoxVisible: true,
				searchLayer: {
					layerId: layerConfig.layerId,
					searchFields: layerConfig.searchFields
				}
			});
		}

		fetch(layerConfig.url)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.layerData[layerConfig.layerId] = {
					config: layerConfig,
					data: json
				};
				this.addGeoJsonData(layerConfig, json);
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	addGeoJsonData(layerConfig, data, filter) {
		if (this.leafletLayers[layerConfig.layerId]) {
			this.refs.map.layersControl.removeLayer(this.leafletLayers[layerConfig.layerId]);
			this.refs.map.map.removeLayer(this.leafletLayers[layerConfig.layerId]);
		}
		var options = {
			onEachFeature: function(feature, marker) {
				if (layerConfig.popupTemplate && layerConfig.clustered) {
					marker.bindPopup(function (layer) {
						var template = _.template(layerConfig.popupTemplate);
						return template(feature.properties);
					});
				}
			},
			pointToLayer: function(geoJsonPoint, latlng) {
				if (layerConfig.markerStyle && layerConfig.markerStyle.type == 'circle') {
					var divIcon = L.divIcon({
						html: '<div class="map-circle-marker" style="border-radius: 100%;'+
							'width: '+(layerConfig.markerStyle.radius*2 || 20)+'px;'+
							'height: '+(layerConfig.markerStyle.radius*2 || 20)+'px;'+
							'background-color: '+(layerConfig.markerStyle.fillColor || '#af0b25')+';'+
							'border-color: '+(layerConfig.markerStyle.strokeColor || '#333')+';'+
							'border-width: '+(layerConfig.markerStyle.strokeWeight+'px' || '1px')+';'+
							'border-style: '+(layerConfig.markerStyle.strokeColor || layerConfig.markerStyle.strokeWeight ? 'solid' : 'none')+';'+
							'">'+
								(layerConfig.labelField ? '<div class="marker-label" style="top: '+(layerConfig.markerStyle.radius*2 || 20)+'px">'+geoJsonPoint.properties[layerConfig.labelField]+'</div>' : '')+
							'</div>'
						}
					);

					return L.marker(latlng, {
						icon: divIcon,
						iconAnchor: [layerConfig.markerStyle.radius || 10, layerConfig.markerStyle.radius || 10]
					});
	/*
					return L.circleMarker(latlng, {
						radius: layerConfig.markerStyle.radius || 10,
						weight: layerConfig.markerStyle.strokeWeight || 1,
						color: layerConfig.markerStyle.strokeColor || '#444',
						fill: true,
						fillOpacity: layerConfig.markerStyle.fillOpacity || 1,
						fillColor: layerConfig.markerStyle.fillColor || '#af0b25'
					});
	*/
				}
				else {
					return L.marker(latlng);
				}
			}
		};

		if (filter) {
			options.filter = filter;
		}

		var layer = L.geoJSON(data, options);

		if (layerConfig.clustered) {
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

				if (layerConfig.markerStyle && layerConfig.markerStyle.fillColor) {
					divBackgroundStyle = 'style="background-color: '+layerConfig.markerStyle.fillColor+'"'
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

				// Lägger geoJson layer till clusterGroup
			clusterGroup.addLayer(layer);

			// Lägger clusterGroup till kartan
			this.addLayer(clusterGroup, layerConfig);

			this.leafletLayers[layerConfig.layerId] =  clusterGroup;
		}
		else {
			if (layerConfig.popupTemplate) {
				layer.bindPopup(function(marker) {
					var template = _.template(layerConfig.popupTemplate);
					return template(marker.feature.properties);
				});
			}

			// Lägger layer direkt till kartan, utan klustrering
			this.addLayer(layer, layerConfig);

			this.leafletLayers[layerConfig.layerId] =  layer;
		}
	}

	addVectorGrid(layerConfig) {
		var layerStyles = {};

		if (layerConfig.layers) {
			_.each(layerConfig.layers, function(vectorLayer) {
				layerStyles[vectorLayer.name] = vectorLayer.style;
			});
		}

		var layer = L.vectorGrid.protobuf(layerConfig.url, {
			interactive: true,
			vectorTileLayerStyles: layerStyles
		});

		if (layerConfig.popupTemplate) {
			layer.on('click', function(event) {
				console.log(event);
				var template = _.template(layerConfig.popupTemplate);

				L.popup()
					.setContent(template(event.layer.properties))
					.setLatLng(event.latlng)
					.openOn(this.map);
			}.bind(this));
		}

		this.addLayer(layer, layerConfig);

		this.leafletLayers[layerConfig.layerId] =  layer;
//		layer.bringToFront();
	}

	addWMSLayer(layerConfig) {
		var layer = L.tileLayer.wms(layerConfig.url, {
			layers: layerConfig.layers,
			format: 'application/png',
			transparent: true
		});

		this.addLayer(layer, layerConfig);

		this.leafletLayers[layerConfig.layerId] =  layer;
	}

	render() {
		return (
			<div className="map-ui">

				{
					this.state.config && this.state.config.mapTitle &&
					<h1 className="map-title">{this.state.config.mapTitle}</h1>
				}

				{
					this.state.searchBoxVisible &&
					<div className="search-box">
						<input placeholder="Sök" type="text" onChange={this.searchBoxChangeHandler} />
					</div>
				}

				<MapBase layersControlStayOpen={true} disableSwedenMap={false} maxZoom="13" scrollWheelZoom={true} ref="map" className="map-wrapper full-fixed" />

			</div>
		);
	}
}