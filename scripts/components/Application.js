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

		this.searchTextSelectChangeHandler = this.searchTextSelectChangeHandler.bind(this);

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


	searchBoxChangeHandler() {
		this.search();
	}

	searchTextSelectChangeHandler() {
		let searchBox = document.getElementById("search-field");
		if (searchBox.value.length > 0) {
			this.search();
		}
	}


	search() {

		//TODO: Bryta ut funktion. 
		function returnHighest(coordinate1, coordinate2) {
			if (coordinate1 > coordinate2) {
				return coordinate1
			}
			else { return coordinate2 }
		}

		//TODO: Bryta ut funktion. 
		function returnLowest(coordinate1, coordinate2) {
			if (coordinate1 < coordinate2) {
				return coordinate1
			}
			else { return coordinate2 }
		}

		let selected = document.getElementById("selected");
		let searchBox = document.getElementById("search-field");
		let searchTerms = searchBox.value.toLowerCase().split(' ');
		let hitsString = "";
		//let origX = this.state.config.center.lng;
		//let origY = this.state.config.center.lat;
		let minX = 180
		let minY = 90
		let maxX = -180
		let maxY = -90
		//console.log(searchTerms);
		//console.log(this.layerData);

		//Start for: 
		for (var layer in this.layerData) {
			let idSet = new Set();  
			//console.log('searching ' + layer);
			
			// Sökfunktion
			if (this.layerData[layer]) {

				// Hittar layer objektet som vi ska söka
				var searchLayer = this.layerData[layer];
				//console.log(this.layerData[this.state.searchLayer.layerId]);

				//if (searchBox.value.length > 2) {
				if (searchBox.value.length > -1) {

					// kör addGeoJsonData med data som redan finns fast med filter function
					this.addGeoJsonData(searchLayer.config, searchLayer.data, function (feature) {
						var found = false;
						// Söker i varje searchFields som defineras i config filen
						_.each(searchLayer.config.searchFields, function (searchField) {

							if (selected.options[selected.selectedIndex].value == 'endswith') {
								// Sökresultat som sultar på sökterm. Efterled. 
								if (feature.properties[searchField].toLowerCase().substr(feature.properties[searchField].length - searchBox.value.length) == searchBox.value.toLowerCase()) {
									found = true;
									minX = returnLowest(minX, feature.geometry.coordinates[0]);
									minY = returnLowest(minY, feature.geometry.coordinates[1]);
									maxX = returnHighest(maxX, feature.geometry.coordinates[0]);
									maxY = returnHighest(maxY, feature.geometry.coordinates[1]);
									//console.log('id', feature.id);
									idSet.add(feature.id); 

								}
							}

							else if (selected.options[selected.selectedIndex].value == 'startswith') {
								// Sökresultat som börjar på sökterm. Förled. 
								if (feature.properties[searchField].toLowerCase().substr(0, searchBox.value.length) == searchBox.value.toLowerCase()) {
									found = true;
									minX = returnLowest(minX, feature.geometry.coordinates[0]);
									minY = returnLowest(minY, feature.geometry.coordinates[1]);
									maxX = returnHighest(maxX, feature.geometry.coordinates[0]);
									maxY = returnHighest(maxY, feature.geometry.coordinates[1]);
									//console.log('id', feature.id);
									idSet.add(feature.id); 
								}
							}
							else {
								// Sökresultat som innehåller sökterm. 

								// Old code: 
								//	if (feature.properties[searchField].toLowerCase().indexOf(searchBox.value.toLowerCase()) > -1) {
								//		found = true;
								//	};

								// Sökresultat som innehåller sökterm(er).
								// New code: 
								//TODO: Bryta ut funktion. 
								function hasHit(searchTerm) {
									if (feature.properties[searchField].toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) {
										return true;
									}
									else {
										return false
									}
								}

								if (searchTerms.every(hasHit)) {
									found = true;
									minX = returnLowest(minX, feature.geometry.coordinates[0]);
									minY = returnLowest(minY, feature.geometry.coordinates[1]);
									maxX = returnHighest(maxX, feature.geometry.coordinates[0]);
									maxY = returnHighest(maxY, feature.geometry.coordinates[1]);
									//console.log('id', feature.id);
									idSet.add(feature.id); 
								}
							}
						});
						return found;
					});
				}
				else {
					this.addGeoJsonData(searchLayer.config, searchLayer.data);
				}
				
			}
			
			hitsString += idSet.size + ' träffar i ' + this.layerData[layer].config.name + '<br/>';
			//Endfor: 
		}
		document.getElementById("hits").innerHTML = hitsString
		//console.log(minX, minY, maxX, maxY);
		var southWest = L.latLng(minY, minX);
		var northEast = L.latLng(maxY, maxX);
		var bounds = L.latLngBounds(southWest, northEast);
		//console.log('bounds', bounds); 
		if (minX != 180 && minY != 90 && maxX != -180 && maxY != -90) {
			this.map.fitBounds(bounds, { padding: [50, 50] });
		}
	}

	createStyleSheet() {
		// Lägger till stylesheet
		var style = document.createElement("style");

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

			// Laddar config.json filen
			fetch('config/' + configFile)
				.then(function (response) {
					return response.json()
				}).then(function (json) {
					if (json.config) {
						// Konfigurerar kartan utifrån config filen
						this.configMap(json.config);
					}

					// Lägger till alla layers som finns i config filen
					this.addLayers(json.layers);
				}.bind(this)).catch(function (ex) {
					console.log('parsing failed', ex)
				})
				;
		}
	}

	configMap(config) {
		// Konfigurerar kartan, setView till center och zoom som kan finnas i config filen
		this.setState({
			config: config
		});
		if (config.center || config.zoom) {
			this.refs.map.map.setView(config.center || this.refs.map.map.getCenter(), config.zoom || this.refs.map.map.getZoom());
		}
	}

	addLayers(layers) {
		// Lägger till layers från config filen
		this.setState({
			layers: layers
		});

		// Går igenom alla layers och lägger varje till kartan
		_.each(layers, function (layer, index) {
			// Filtrerar bort dem som har hidden = true
			if (layer.hidden) {
				return;
			}

			// Kör rätt function för varje typ av layer
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
		// Lägger layer till kartan
		layer.addTo(this.refs.map.map);
		this.refs.map.layersControl.addOverlay(layer, layerConfig.name, true);

		if ((layerConfig.markerStyle && layerConfig.markerStyle.fillColor) || layerConfig.menuColor) {
			// Skapar css rule till customStyleSheet objectet, används för att visa färgsymbol i layers menyn
			var color = (layerConfig.markerStyle && layerConfig.markerStyle.fillColor) ? layerConfig.markerStyle.fillColor : layerConfig.menuColor;
			var styleRule = '.map-wrapper .leaflet-control-container .leaflet-control-layers .leaflet-control-layers-overlays label:nth-child(' + (this.layerProcessIndex + 1) + ') span:before {' +
				'content: " ";' +
				'display: inline-block;' +
				'position: relative;' +
				'top: 4px;' +
				'margin: 0 5px;' +
				'width: 20px;' +
				'height: 20px;' +
				'border-radius: 3px;' +
				'background-color: ' + color + ';'
			'}';

			this.customStyleSheet.insertRule(styleRule);
		}

		this.layerProcessIndex++;
	}

	addGeoJson(layerConfig) {
		// Lägger till geoJson layer

		if (layerConfig.searchable) {
			// Om layeren är sökbar sparar vi information om det i state
			this.setState({
				searchBoxVisible: true,
				searchLayer: {
					layerId: layerConfig.layerId,
					searchFields: layerConfig.searchFields
				}
			});
		}


		if (layerConfig.searchTextSelect) {
			// Meny till sökboxen. 
			this.setState({
				searchTextSelectVisible: true,

			});
		}

		fetch(layerConfig.url)
			.then(function (response) {
				return response.json()
			}).then(function (json) {
				this.layerData[layerConfig.layerId] = {
					config: layerConfig,
					data: json
				};

				// Lägger till själva layern
				this.addGeoJsonData(layerConfig, json);
			}.bind(this)).catch(function (ex) {
				console.log('parsing failed', ex)
			})
			;
	}

	addGeoJsonData(layerConfig, data, filter) {
		// Lägger till geoJsonLayer, tar den bort först om den redan finns
		// Här kan man lägga till filter function för att filtrera features, sökfunktionen lägger till filter till addGeoJsonData

		/*
		Test filtrering, körs i developer tools:
	
		isofKarta.addGeoJsonData(isofKarta.layerData.agonamn_oland.config, isofKarta.layerData.agonamn_oland.data, function(feature) {
			return feature.geometry.coordinates[1] < 56.4160;
		})
	
		isofKarta.addGeoJsonData(isofKarta.layerData.agonamn_oland.config, isofKarta.layerData.agonamn_oland.data, function(feature) {
			return feature.properties.Namn.indexOf('skog') > -1;
		})
	
		*/

		if (this.leafletLayers[layerConfig.layerId]) {
			this.refs.map.layersControl.removeLayer(this.leafletLayers[layerConfig.layerId]);
			this.refs.map.map.removeLayer(this.leafletLayers[layerConfig.layerId]);
		}

		// 
		var options = {
			onEachFeature: function (feature, marker) {
				if (layerConfig.popupTemplate && layerConfig.clustered) {
					marker.bindPopup(function (layer) {
						var template = _.template(layerConfig.popupTemplate);
						return template(feature.properties);
					});
				}
			},
			pointToLayer: function (geoJsonPoint, latlng) {
				if (layerConfig.markerStyle && layerConfig.markerStyle.type == 'circle') {
					var divIcon = L.divIcon({
						html: '<div class="map-circle-marker" style="border-radius: 100%;' +
							'width: ' + (layerConfig.markerStyle.radius * 2 || 20) + 'px;' +
							'height: ' + (layerConfig.markerStyle.radius * 2 || 20) + 'px;' +
							'background-color: ' + (layerConfig.markerStyle.fillColor || '#af0b25') + ';' +
							'border-color: ' + (layerConfig.markerStyle.strokeColor || '#333') + ';' +
							'border-width: ' + (layerConfig.markerStyle.strokeWeight + 'px' || '1px') + ';' +
							'border-style: ' + (layerConfig.markerStyle.strokeColor || layerConfig.markerStyle.strokeWeight ? 'solid' : 'none') + ';' +
							'">' +
							(layerConfig.labelField ? '<div class="marker-label" style="top: ' + (layerConfig.markerStyle.radius * 2 || 20) + 'px">' + geoJsonPoint.properties[layerConfig.labelField] + '</div>' : '') +
							'</div>'
					}
					);

					return L.marker(latlng, {
						icon: divIcon,
						iconAnchor: [layerConfig.markerStyle.radius || 10, layerConfig.markerStyle.radius || 10]
					});
				}
				else {
					return L.marker(latlng);
				}
			}
		};

		// Om filter function finns som argument lägger vi den till options för L.geoJSON
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
						divBackgroundStyle = 'style="background-color: ' + layerConfig.markerStyle.fillColor + '"'
					}

					return new L.DivIcon({
						html: '<div ' + divBackgroundStyle + '><span>' +
							'<b>' + childCount + '</b>' +
							'</span></div>',
						className: 'marker-cluster' + c,
						iconSize: new L.Point(28, 28)
					});
				}
			});

			// Lägger geoJson layer till clusterGroup
			clusterGroup.addLayer(layer);

			// Lägger clusterGroup till kartan
			this.addLayer(clusterGroup, layerConfig);

			this.leafletLayers[layerConfig.layerId] = clusterGroup;
		}
		else {
			if (layerConfig.popupTemplate) {
				layer.bindPopup(function (marker) {
					var template = _.template(layerConfig.popupTemplate);
					return template(marker.feature.properties);
				});
			}

			// Lägger layer direkt till kartan, utan klustrering
			this.addLayer(layer, layerConfig);

			this.leafletLayers[layerConfig.layerId] = layer;
		}
	}

	addVectorGrid(layerConfig) {
		var layerStyles = {};

		if (layerConfig.layers) {
			_.each(layerConfig.layers, function (vectorLayer) {
				layerStyles[vectorLayer.name] = vectorLayer.style;
			});
		}

		var layer = L.vectorGrid.protobuf(layerConfig.url, {
			interactive: true,
			vectorTileLayerStyles: layerStyles
		});

		if (layerConfig.popupTemplate) {
			layer.on('click', function (event) {
				var template = _.template(layerConfig.popupTemplate);

				L.popup()
					.setContent(template(event.layer.properties))
					.setLatLng(event.latlng)
					.openOn(this.map);
			}.bind(this));
		}

		this.addLayer(layer, layerConfig);

		this.leafletLayers[layerConfig.layerId] = layer;
		//		layer.bringToFront();
	}

	addWMSLayer(layerConfig) {
		var layer = L.tileLayer.wms(layerConfig.url, {
			layers: layerConfig.layers,
			format: 'image/png',
			transparent: true,
			TILED: layerConfig.TILED,
			ISBASELAYER: layerConfig.ISBASELAYER,
			TILESORIGIN: layerConfig.TILESORIGIN
		});

		this.addLayer(layer, layerConfig);

		this.leafletLayers[layerConfig.layerId] = layer;
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
						<input id="search-field" placeholder="Sök" type="text" onChange={this.searchBoxChangeHandler} />
					</div>
				}
				{
					this.state.searchTextSelectVisible &&
					<div className="search-text-select">
						<select id="selected" onChange={this.searchTextSelectChangeHandler}>
							<option value="contains">Innehåller</option>
							<option value="startswith">Börjar med</option>
							<option value="endswith">Slutar med</option>
						</select>
					</div>
				}
				{
					<div className="search-hits">
						<p id="hits"></p>
					</div>
				}
				<MapBase layersControlStayOpen={true} disableSwedenMap={false} maxZoom="13" scrollWheelZoom={true} ref="map" className="map-wrapper full-fixed" />

			</div>
		);
	}
}