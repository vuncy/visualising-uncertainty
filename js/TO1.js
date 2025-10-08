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
    fetch("assets/augsburg-nm-reproj-08102025.geojson")
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

            const layerDay = createLayer("Day", colorSchemes.day);
            const layerEvening = createLayer("Evening", colorSchemes.evening);
            const layerNight = createLayer("Night", colorSchemes.night);

            const layers = [layerDay, layerEvening, layerNight];
            const labels = ["Day", "Evening", "Night"];

            // Add default layer
            layerDay.addTo(map);

            // Fit map to the bounds of the default layer
            map.fitBounds(layerDay.getBounds(), { padding: [20, 20] });

            // ---- Slider Control (Bottom-Right) ----
            const TimeControl = L.Control.extend({
                onAdd: function(map) {
                    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control time-slider');
                    container.style.background = 'white';
                    container.style.padding = '6px 10px';
                    container.style.borderRadius = '5px';
                    container.style.width = '220px';
                    container.style.textAlign = 'center';

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

                    L.DomEvent.disableClickPropagation(container);
                    L.DomEvent.disableScrollPropagation(container);

                    slider.addEventListener('input', function() {
                        const idx = parseInt(this.value);
                        layers.forEach(l => map.removeLayer(l));
                        layers[idx].addTo(map);
                        label.textContent = labels[idx];
                    });

                    return container;
                }
            });

            map.addControl(new TimeControl({position:'bottomright'}));

        })
        .catch(error => console.error("Error loading GeoJSON:", error));

});
