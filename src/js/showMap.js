import { helpers } from "./helpers.js";
import { state } from "./state.js";
import { editCatch } from "./editCatch.js";
import { deleteCatch } from "./deleteCatch.js";
import { addUserPosition } from "./adduserposition.js";
import { api } from "./api.js";

const API_URL = api.getURL();

export const showMap = (function () {
    let updatePositionInterval;

    let data = {};
    const content = helpers.getId("content");
    let inner;
    let map;
    const markers = new L.FeatureGroup();

    let handlers = [];

    let filterString = "";
    let minLength = 0;
    let maxLength = "more";
    let minWeight = 0;
    let maxWeight = "more";

    async function init (location, id) {
        clearListeners();
        clearInterval(updatePositionInterval);
        data = await api.getCatches();
        if (data.error) {
            helpers.showFlashMessage(data.error, "error");
            return;
        }
        render(location, id);
    }

    function showFilters () {
        const section = document.createElement("section");
        section.classList.add("filters");
        inner.appendChild(section);

        const textInput = document.createElement("input");
        textInput.classList.add("input");
        textInput.setAttribute("type", "text");
        textInput.setAttribute("placeholder", "Filter by species");
        section.appendChild(textInput);
        helpers.addListener("keyup", textInput, (e) => {
            filterString = e.target.value;
            filter();
        });

        const lenghtSlider = document.createElement("input");
        lenghtSlider.setAttribute("type", "text");
        lenghtSlider.setAttribute("id", "lenghtSlider");
        section.appendChild(lenghtSlider);

        const lengthLabel = document.createElement("label");
        lengthLabel.textContent = "length (cm)";
        lengthLabel.setAttribute("for", "lengthSlider");
        section.appendChild(lengthLabel);

        let customValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, "more"];
        let myFrom = customValues.indexOf(0);
        let myTo = customValues.indexOf("more");

        $("#lenghtSlider").ionRangeSlider({
            skin: "round",
            type: "double",
            grid: true,
            from: myFrom,
            to: myTo,
            prefix: "cm",
            values: customValues,
            onChange: (data) => {
                minLength = data.from_value;
                maxLength = data.to_value;
                filter();
            }
        });

        const weightSlider = document.createElement("input");
        weightSlider.setAttribute("type", "text");
        weightSlider.setAttribute("id", "weightSlider");
        section.appendChild(weightSlider);

        const weightLabel = document.createElement("label");
        weightLabel.textContent = "weight (g)";
        lengthLabel.setAttribute("for", "weightSlider");
        section.appendChild(weightLabel);

        customValues = [0, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 7500, 10000, "more"];
        myFrom = customValues.indexOf(0);
        myTo = customValues.indexOf("more");

        $("#weightSlider").ionRangeSlider({
            skin: "round",
            type: "double",
            grid: true,
            from: myFrom,
            to: myTo,
            prefix: "g",
            values: customValues,
            onChange: (data) => {
                minWeight = data.from_value;
                maxWeight = data.to_value;
                filter();
            }
        });
    }

    function filter () {
        const filteredData = data
            .filter(item => item.species.toLowerCase().includes(filterString.toLowerCase()))
            .filter(item => item.length >= minLength)
            .filter(item => item.length <= maxLength)
            .filter(item => item.weight >= minWeight)
            .filter(item => item.weight <= maxWeight)
        ;
        clearMarkers();
        addMarkers(filteredData);
    }

    function showMap (location, id) {
        const mapDiv = document.createElement("div");
        mapDiv.setAttribute("id", "map");
        mapDiv.setAttribute("class", "full_height");
        inner.appendChild(mapDiv);

        if (!location) {
            location = addUserPosition.getUserPosition();
        }

        if (!location) {
            map = L.map("map").setView([56.0445, 12.5316], 5);
        } else {
            const lat = location[0];
            const lon = location[1];

            map = L.map("map").setView([lat, lon], 10);
        }

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
        }).addTo(map);

        markers.addTo(map);

        addMarkers(data, id);

        updatePositionInterval = addUserPosition.add(L, map);
    }

    function clearMarkers () {
        markers.clearLayers();
        clearListeners();
        clearInterval(updatePositionInterval);
    }

    function addMarkers (newData, openId) {
        newData.forEach(c => {
            const lat = c.location.split(",")[0];
            const lon = c.location.split(",")[1];
            const catchId = `catch_${c.id}`;
            const editButtons = c.username === state.getUserName()
                ? `<div class="editButtons"><button id='edit_${catchId}'>Edit</button><button id='delete_${catchId}'>Delete</button></div>`
                : "";

            const popupContent = `
                <section>
                    <h2>${c.species}</h2>
                    <img
                        src="${API_URL}${c.imageurl}"
                        alt="catch_${c.imageurl}"
                    />
                    <p>${c.date}</p>
                    <p>${c.length} cm</p>
                    <p>${c.weight} g</p>
                    <p>Caught by ${c.username}</p>
                    ${editButtons}
                </section>
            `;
            const marker = L.marker([lat, lon]).bindPopup(popupContent);
            marker.id = c.id;

            markers.addLayer(marker);

            if (parseInt(marker.id) === parseInt(openId)) {
                marker.openPopup();
            }
        });

        const deleteEditHandler = (e) => {
            const targetArr = e.target.id.split("_");
            if (targetArr[0] === "delete") {
                deleteCatch.remove(targetArr[2]);
            }
            if (targetArr[0] === "edit") {
                editCatch.init(targetArr[2]);
            }
        };

        handlers.push(deleteEditHandler);

        document.addEventListener("click", deleteEditHandler);
    }

    function clearListeners () {
        handlers.forEach(handler => {
            document.removeEventListener("click", handler);
        });
        handlers = [];
    }

    function render (location, id) {
        inner = document.createElement("div");
        inner.classList.add("content_inner");
        content.appendChild(inner);
        const heading = document.createElement("h2");
        heading.textContent = "Catches";
        inner.appendChild(heading);
        showFilters();
        showMap(location, id);
    }

    return {
        init
    };
}());
