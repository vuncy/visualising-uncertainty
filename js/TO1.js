// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", function () {

    // Initialize the map
    var map = L.map("map").setView([48.3705, 10.8978], 13);

    // Add a pale base tile
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Load GeoJSON
    fetch("assets/augsburg-nm-7500-08102025.geojson")
        .then(response => response.json())
        .then(data => {

            // ---- 3 Time-of-Day Layers ----
            const colorSchemes = {
                day: ["#264653","#2a9d8f","#e9c46a","#f4a261","#e76f51"],
                evening: ["#f4a261","#e76f51","#e9c46a","#2a9d8f","#264653"],
                night: ["#2a9d8f","#264653","#e76f51","#f4a261","#e9c46a"]
            };

            function styleFactory(scheme) {
                return function(feature) {
                    const val = feature.properties.ISOLVL;
                    const color = scheme[val - 1] || "#cccccc";
                    return {
                        fillColor: color,
                        fillOpacity: 0.5,
                        weight: 0,
                        opacity: 0,
                        color: "none"
                    };
                };
            }

            function createLayer(label, scheme) {
                return L.geoJSON(data, {
                    style: styleFactory(scheme),
                    onEachFeature: function(feature, layer) {
                        layer.bindPopup(`<b>${feature.properties.name || "Feature"}</b><br>
                                         ISOLVL: ${feature.properties.ISOLVL}<br>
                                         Time: ${label}`);
                    }
                });
            }

            // Create the three layers
            const layerDay = createLayer("Day", colorSchemes.day);
            const layerEvening = createLayer("Evening", colorSchemes.evening);
            const layerNight = createLayer("Night", colorSchemes.night);

            const layers = {
                "Day": layerDay,
                "Evening": layerEvening,
                "Night": layerNight
            };

            const labels = ["Day", "Evening", "Night"];

            // Add Day layer by default
            layerDay.addTo(map);
            map.fitBounds(layerDay.getBounds(), { padding: [20, 20] });

            // --- Helper function to adjust opacity based on slider ---
            function updateLayerOpacity(activeLabel) {
                Object.keys(layers).forEach(name => {
                    if (map.hasLayer(layers[name])) {
                        layers[name].setStyle({
                            fillOpacity: (name === activeLabel) ? 0.6 : 0.15
                        });
                    }
                });
            }

            // ---- Checkbox Control (Bottom-Right) ----
            const LayerToggleControl = L.Control.extend({
                onAdd: function(map) {
                    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control layer-toggle');
                    container.style.background = 'white';
                    container.style.padding = '6px 10px';
                    container.style.borderRadius = '5px';
                    container.style.width = '140px';
                    container.style.fontSize = '14px';
                    container.style.lineHeight = '1.4';
                    container.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';

                    const title = L.DomUtil.create('div', '', container);
                    title.innerHTML = "<b>Show Layers:</b>";

                    Object.keys(layers).forEach(name => {
                        const label = L.DomUtil.create('label', '', container);
                        label.style.display = 'block';
                        label.style.marginTop = '4px';

                        const checkbox = L.DomUtil.create('input', '', label);
                        checkbox.type = 'checkbox';
                        checkbox.checked = (name === "Day"); // default visible
                        checkbox.style.marginRight = '6px';

                        const text = document.createTextNode(name);
                        label.appendChild(text);

                        checkbox.addEventListener('change', function() {
                            if (this.checked) {
                                layers[name].addTo(map);
                            } else {
                                map.removeLayer(layers[name]);
                            }
                            // After toggle, reapply opacity highlight
                            const idx = parseInt(slider.value);
                            updateLayerOpacity(labels[idx]);
                        });
                    });

                    L.DomEvent.disableClickPropagation(container);
                    L.DomEvent.disableScrollPropagation(container);
                    return container;
                }
            });
            map.addControl(new LayerToggleControl({ position: 'bottomright' }));

            // ---- Slider Control (Bottom-Left) ----
            const TimeControl = L.Control.extend({
                onAdd: function(map) {
                    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control time-slider');
                    container.style.background = 'white';
                    container.style.padding = '6px 10px';
                    container.style.borderRadius = '5px';
                    container.style.width = '220px';
                    container.style.textAlign = 'center';
                    container.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';

                    // Slider input
                    const slider = L.DomUtil.create('input', '', container);
                    slider.type = 'range';
                    slider.min = 0;
                    slider.max = 2;
                    slider.step = 1;
                    slider.value = 0;
                    slider.style.width = '100%';

                    const label = L.DomUtil.create('div', '', container);
                    label.style.marginTop = '4px';
                    label.textContent = labels[0];

                    // make slider global for opacity updates
                    window.slider = slider;

                    L.DomEvent.disableClickPropagation(container);
                    L.DomEvent.disableScrollPropagation(container);

                    slider.addEventListener('input', function() {
                        const idx = parseInt(this.value);
                        const activeLabel = labels[idx];
                        label.textContent = activeLabel;
                        updateLayerOpacity(activeLabel);
                    });

                    // Initial opacity setup
                    updateLayerOpacity(labels[0]);

                    return container;
                }
            });

            map.addControl(new TimeControl({ position: 'bottomleft' }));

        })
        .catch(error => console.error("Error loading GeoJSON:", error));

});
