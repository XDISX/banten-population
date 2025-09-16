// Bikin variabel peta
let southWest = L.latLng(-5.50, 104.938);
let northEast = L.latLng(-7.36, 107);
let bounds = L.latLngBounds(southWest, northEast);

let map = L.map('map', {maxBounds: bounds, minZoom: 9, maxZoom: 15}).setView([-6.46, 106.0], 7);

// Tambahin basemap OpenStreetMap
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

let populasiLayer;
let kepadatanLayer;
let kecLayer;
let desaLayer;
let kecData;
let desaData;
let currentLegend;
let currentMode = 'populasi';
let currentLevel = 'kabupaten';
let previousLevelState = null;

// =========================================================
// Fungsi dan data untuk MODE POPULASI
// =========================================================
const kabPopGrades = [0, 500000, 1000000, 1500000, 2000000, 2500000, 3000000];
const kecPopGrades = [0, 50000, 100000, 150000, 200000, 250000, 300000];
const desaPopGrades = [0, 1000, 2500, 5000, 10000, 20000, 30000];
function getColorKabPop(value) {
    return value > 3000000 ? '#800026' :
           value > 2500000 ? '#BD0026' :
           value > 2000000 ? '#E31A1C' :
           value > 1500000 ? '#FC4E2A' :
           value > 1000000 ? '#FD8D3C' :
           value > 500000  ? '#FEB24C' :
                               '#FFEDA0';
}
function getColorKecPop(value) {
    return value > 250000 ? '#800026' :
           value > 200000 ? '#BD0026' :
           value > 150000 ? '#E31A1C' :
           value > 100000 ? '#FC4E2A' :
           value > 50000  ? '#FD8D3C' :
                                '#FFEDA0';
}
function getColorDesaPop(value) {
    return value > 20000 ? '#800026' :
           value > 10000 ? '#BD0026' :
           value > 5000  ? '#E31A1C' :
           value > 2500  ? '#FC4E2A' :
           value > 1000  ? '#FD8D3C' :
                               '#FFEDA0';
}
function getStyleKabPop(feature) {
    return {
        fillColor: getColorKabPop(feature.properties.jumlah_pen),
        weight: 2, color: 'white', dashArray: '3', fillOpacity: 0.3
    };
}
function getStyleKecPop(feature) {
    return {
        fillColor: getColorKecPop(feature.properties.jumlah_pen),
        weight: 2, color: 'white', dashArray: '3', fillOpacity: 0.3
    };
}
function getStyleDesaPop(feature) {
    return {
        fillColor: getColorDesaPop(feature.properties.jumlah_pen),
        weight: 1.5, color: 'white', dashArray: '1', fillOpacity: 0.3
    };
}

// =========================================================
// Fungsi dan data untuk MODE KEPADATAN
// =========================================================
const kabKepGrades = [0, 500, 1000, 2000, 5000, 10000, 20000];
const kecKepGrades = [0, 500, 1000, 2000, 5000, 10000, 20000];
const desaKepGrades = [0, 500, 1000, 2000, 5000, 10000, 15000];
function getColorKabKep(value) {
    return value > 20000 ? '#08519c' :
           value > 10000 ? '#3182bd' :
           value > 5000  ? '#6baed6' :
           value > 2000  ? '#9ecae1' :
           value > 1000  ? '#c6dbef' :
           value > 500   ? '#deebf7' :
                               '#eff3ff';
}
function getColorKecKep(value) {
    return value > 10000 ? '#08519c' :
           value > 5000  ? '#3182bd' :
           value > 2000  ? '#6baed6' :
           value > 1000  ? '#9ecae1' :
           value > 500   ? '#c6dbef' :
                               '#deebf7';
}
function getColorDesaKep(value) {
    return value > 15000 ? '#08519c' :
           value > 10000 ? '#3182bd' :
           value > 5000  ? '#6baed6' :
           value > 2000  ? '#9ecae1' :
           value > 1000  ? '#c6dbef' :
                                '#deebf7';
}
function getStyleKabKep(feature) {
    return {
        fillColor: getColorKabKep(feature.properties.kepadatan_),
        weight: 2, color: 'white', dashArray: '3', fillOpacity: 0.5
    };
}
function getStyleKecKep(feature) {
    return {
        fillColor: getColorKecKep(feature.properties.kepadatan_),
        weight: 2, color: 'white', dashArray: '3', fillOpacity: 0.5
    };
}
function getStyleDesaKep(feature) {
    return {
        fillColor: getColorDesaKep(feature.properties.kepadatan_),
        weight: 1.5, color: 'white', dashArray: '1', fillOpacity: 0.7
    };
}

// Custom info control
const info = L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};
info.update = function (props, title = 'Populasi Kabupaten di Banten') {
    let propName = currentMode === 'populasi' ? 'jumlah_pen' : 'kepadatan_';
    let label = currentMode === 'populasi' ? 'jiwa' : 'jiwa/km²';
    let nameProp = currentLevel === 'kabupaten' ? 'nama_kab' : (currentLevel === 'kecamatan' ? 'nama_kec' : 'nama_kel');
    this._div.innerHTML = `<h4>${title}</h4>` +  (props ?
        `<b>${props[nameProp]}</b><br />${props[propName].toLocaleString()} ${label}`
        : 'Arahkan kursor ke peta');
};
info.addTo(map);

// Fungsi untuk membuat dan menambahkan legenda
function addLegend(grades, getColorFunc, title, label) {
    if (currentLegend) {
        map.removeControl(currentLegend);
    }
    const legend = L.control({position: 'bottomleft'});
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const labels = [];
        let from, to;
        for (let i = 0; i < grades.length; i++) {
            from = grades[i];
            to = grades[i + 1];
            labels.push(
                `<i style="background:${getColorFunc(from + 1)}"></i> ${from.toLocaleString()}` +
                (to ? ` &ndash; ${to.toLocaleString()}` : '+'));
        }
        div.innerHTML = `<h4>${title}</h4>` + labels.join('<br>') + `<br>${label}`;
        return div;
    };
    legend.addTo(map);
    currentLegend = legend;
}

// Fungsi untuk memperbarui tabel (tampilan 3 kolom)
function updateTable(features, propName, isKabupaten = true, isKecamatan = false) {
    const header = isKabupaten ? 'Kabupaten' : (isKecamatan ? 'Kecamatan' : 'Desa');
    let html = `<table border="1" cellpadding="6"><thead><tr><th>${header}</th><th>Jumlah Penduduk</th><th>Luas Area (km²)</th><th>Kepadatan Penduduk (jiwa/km²)</th></tr></thead><tbody>`;
    features.forEach(f => {
        const featureName = f.properties[propName];
        // Handle null values
        const jumlahPen = f.properties.jumlah_pen ? f.properties.jumlah_pen.toLocaleString() : '-';
        const luasWilay = f.properties.luas_wilay ? f.properties.luas_wilay.toLocaleString() : '-';
        const kepadatan = f.properties.kepadatan_ ? f.properties.kepadatan_.toLocaleString() : '-';
        
        html += `<tr data-name="${featureName}">
            <td>${featureName}</td>
            <td>${jumlahPen}</td>
            <td>${luasWilay}</td>
            <td>${kepadatan}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('table-container').innerHTML = html;
    
    // Event listener untuk highlight dari tabel
    const tableRows = document.querySelectorAll('#table-container tr[data-name]');
    tableRows.forEach(row => {
        row.addEventListener('mouseover', function() {
            const name = this.getAttribute('data-name');
            const layer = findLayerByName(name);
            if (layer) {
                layer.setStyle({ weight: 5, color: '#666', dashArray: '', fillOpacity: 0.7 });
                layer.bringToFront();
                info.update(layer.feature.properties);
            }
        });

        row.addEventListener('mouseout', function() {
            const name = this.getAttribute('data-name');
            const layer = findLayerByName(name);
            if (layer) {
                if (currentLevel === 'kabupaten') {
                    if (currentMode === 'populasi') populasiLayer.resetStyle(layer);
                    else kepadatanLayer.resetStyle(layer);
                } else if (currentLevel === 'kecamatan') {
                    kecLayer.resetStyle(layer);
                } else {
                    desaLayer.resetStyle(layer);
                }
                info.update();
            }
        });

        row.addEventListener('click', function() {
            const name = this.getAttribute('data-name');
            const layer = findLayerByName(name);
            if (layer) {
                layer.fire('click');
            }
        });
    });
}

// Fungsi untuk mencari layer berdasarkan nama
function findLayerByName(name) {
    let currentActiveLayer;
    if (currentLevel === 'kabupaten') {
        currentActiveLayer = (currentMode === 'populasi' ? populasiLayer : kepadatanLayer);
    } else if (currentLevel === 'kecamatan') {
        currentActiveLayer = kecLayer;
    } else {
        currentActiveLayer = desaLayer;
    }

    let propName = currentLevel === 'kabupaten' ? 'nama_kab' : (currentLevel === 'kecamatan' ? 'nama_kec' : 'nama_kel');
    let foundLayer = null;

    currentActiveLayer.eachLayer(function(layer) {
        if (layer.feature.properties[propName] === name) {
            foundLayer = layer;
        }
    });
    return foundLayer;
}

// Fungsi untuk highlight baris tabel saat mouseover di peta
function highlightTableRow(name) {
    const activeRow = document.querySelector(`#table-container tr[data-name="${name}"]`);
    if (activeRow) {
        activeRow.classList.add('highlight');
    }
}

// Fungsi untuk menghapus highlight dari baris tabel
function resetTableRowHighlight() {
    const highlightedRow = document.querySelector(`#table-container tr.highlight`);
    if (highlightedRow) {
        highlightedRow.classList.remove('highlight');
    }
}

function showBackButton() {
    document.getElementById('backViewBtn').style.display = 'inline-block';
}

function hideBackButton() {
    document.getElementById('backViewBtn').style.display = 'none';
}

// =========================================================
// Fungsi Interaksi untuk Kabupaten
// =========================================================
function highlightFeatureKab(e) {
    const layer = e.target;
    layer.setStyle({ weight: 5, color: '#666', dashArray: '', fillOpacity: 0.7 });
    layer.bringToFront();
    info.update(layer.feature.properties);
    highlightTableRow(layer.feature.properties.nama_kab);
}
function resetHighlightKab(e) {
    if (currentMode === 'populasi') {
        populasiLayer.resetStyle(e.target);
    } else {
        kepadatanLayer.resetStyle(e.target);
    }
    info.update();
    resetTableRowHighlight();
}
function onEachFeatureKab(feature, layer) {
    layer.on({
        mouseover: highlightFeatureKab,
        mouseout: resetHighlightKab,
        click: zoomToKecamatan
    });
    layer.bindTooltip(feature.properties.nama_kab, {
        direction: 'center', className: 'kab-label'
    });
}

// =========================================================
// Fungsi Interaksi untuk Kecamatan
// =========================================================
function highlightFeatureKec(e) {
    const layer = e.target;
    layer.setStyle({ weight: 5, color: '#666', dashArray: '', fillOpacity: 0.7 });
    layer.bringToFront();
    info.update(layer.feature.properties, `Kecamatan di ${layer.feature.properties.nama_kab}`);
    highlightTableRow(layer.feature.properties.nama_kec);
}
function resetHighlightKec(e) {
    kecLayer.resetStyle(e.target);
    info.update(null, `Kecamatan di ${e.target.feature.properties.nama_kab}`);
    resetTableRowHighlight();
}
function onEachFeatureKec(feature, layer) {
    layer.on({
        mouseover: highlightFeatureKec,
        mouseout: resetHighlightKec,
        click: zoomToDesa
    });
    layer.bindTooltip(feature.properties.nama_kec, {
        direction: 'center', className: 'kab-label'
    });
}

// =========================================================
// Fungsi Interaksi untuk Desa
// =========================================================
function highlightFeatureDesa(e) {
    const layer = e.target;
    layer.setStyle({ weight: 2.5, color: '#666', dashArray: '', fillOpacity: 0.9 });
    layer.bringToFront();
    info.update(layer.feature.properties, `Desa di ${layer.feature.properties.nama_kec}`);
    highlightTableRow(layer.feature.properties.nama_kel);
}
function resetHighlightDesa(e) {
    desaLayer.resetStyle(e.target);
    info.update(null, `Desa di ${e.target.feature.properties.nama_kec}`);
    resetTableRowHighlight();
}
function onEachFeatureDesa(feature, layer) {
    layer.on({
        mouseover: highlightFeatureDesa,
        mouseout: resetHighlightDesa,
    });
    layer.bindTooltip(feature.properties.nama_kel, {
        direction: 'center', className: 'kab-label'
    });
}

// =========================================================
// Fungsi utama saat mengklik kabupaten (sekarang zoom ke Kecamatan)
// =========================================================
function zoomToKecamatan(e) {
    previousLevelState = {
        level: 'kabupaten',
        feature: e.target.feature,
        layer: populasiLayer.toGeoJSON().features, // Simpan semua fitur kabupaten
        bounds: populasiLayer.getBounds() // Simpan batas semua kabupaten
    };
    
    map.fitBounds(e.target.getBounds());
    currentLevel = 'kecamatan';
    const namaKab = e.target.feature.properties.nama_kab;
    const kodeKab = e.target.feature.properties.kode_kab_s;

    if (map.hasLayer(populasiLayer)) { map.removeLayer(populasiLayer); }
    if (map.hasLayer(kepadatanLayer)) { map.removeLayer(kepadatanLayer); }
    if (desaLayer) { map.removeLayer(desaLayer); }
    if (kecLayer) { map.removeLayer(kecLayer); }

    const filteredFeatures = kecData.features.filter(f => f.properties.kode_kab_s === kodeKab);
    const filteredData = { ...kecData, features: filteredFeatures };
    
    let getStyleFunc = currentMode === 'populasi' ? getStyleKecPop : getStyleKecKep;
    let getColorFunc = currentMode === 'populasi' ? getColorKecPop : getColorKecKep;
    let grades = currentMode === 'populasi' ? kecPopGrades : kecKepGrades;
    let legendLabel = currentMode === 'populasi' ? 'jiwa' : 'jiwa/km²';

    kecLayer = L.geoJSON(filteredData, {
        style: getStyleFunc,
        onEachFeature: onEachFeatureKec
    }).addTo(map);

    updateTable(filteredFeatures, 'nama_kec', false, true);
    info.update(null, `Kecamatan di ${namaKab}`);
    addLegend(grades, getColorFunc, 'Kecamatan', legendLabel);
    showBackButton();
}

// =========================================================
// Fungsi utama saat mengklik kecamatan (sekarang zoom ke Desa)
// =========================================================
function zoomToDesa(e) {
    previousLevelState = {
        level: 'kecamatan',
        feature: e.target.feature,
        layer: kecLayer.toGeoJSON().features, // Simpan semua fitur kecamatan
        bounds: kecLayer.getBounds() // Simpan batas semua kecamatan
    };
    
    const namaKec = e.target.feature.properties.nama_kec;
    const namaKab = e.target.feature.properties.nama_kab;

    if (!namaKec) {
        console.error("Fitur yang diklik tidak memiliki properti 'nama_kec'. Tidak bisa menampilkan data desa.");
        return;
    }
    
    map.fitBounds(e.target.getBounds());
    currentLevel = 'desa';

    if (kecLayer) { map.removeLayer(kecLayer); }
    if (desaLayer) { map.removeLayer(desaLayer); }
    
    const filteredFeatures = desaData.features.filter(f => f.properties.nama_kec === namaKec);
    const filteredData = { ...desaData, features: filteredFeatures };

    console.log("Nama Kecamatan yang dicari:", namaKec);
    console.log("Jumlah desa yang ditemukan:", filteredFeatures.length);
    console.log("Nama desa yang ditemukan:", filteredFeatures.map(f => f.properties.nama_kel));

    let getStyleFunc = currentMode === 'populasi' ? getStyleDesaPop : getStyleDesaKep;
    let getColorFunc = currentMode === 'populasi' ? getColorDesaPop : getColorDesaKep;
    let grades = currentMode === 'populasi' ? desaPopGrades : desaKepGrades;
    let legendLabel = currentMode === 'populasi' ? 'jiwa' : 'jiwa/km²';

    desaLayer = L.geoJSON(filteredData, {
        style: getStyleFunc,
        onEachFeature: onEachFeatureDesa
    }).addTo(map);

    updateTable(filteredFeatures, 'nama_kel', false, false);
    info.update(null, `Desa di ${namaKec}, ${namaKab}`);
    addLegend(grades, getColorFunc, 'Desa', legendLabel);
    showBackButton();
}

// =========================================================
// Fungsi untuk tombol 'Back View'
// =========================================================
document.getElementById('backViewBtn').onclick = function() {
    if (!previousLevelState) {
        return;
    }

    if (currentLevel === 'desa') {
        // Balik dari desa ke kecamatan
        map.fitBounds(previousLevelState.bounds);
        currentLevel = 'kecamatan';
        if (desaLayer) { map.removeLayer(desaLayer); }
        if (kecLayer) { map.removeLayer(kecLayer); }
        
        const parentFeature = previousLevelState.feature;
        const filteredFeatures = kecData.features.filter(f => f.properties.kode_kab_s === parentFeature.properties.kode_kab_s);
        const filteredData = { ...kecData, features: filteredFeatures };
        
        let getStyleFunc = currentMode === 'populasi' ? getStyleKecPop : getStyleKecKep;
        let getColorFunc = currentMode === 'populasi' ? getColorKecPop : getColorKecKep;
        let grades = currentMode === 'populasi' ? kecPopGrades : kecKepGrades;
        let legendLabel = currentMode === 'populasi' ? 'jiwa' : 'jiwa/km²';

        kecLayer = L.geoJSON(filteredData, {
            style: getStyleFunc,
            onEachFeature: onEachFeatureKec
        }).addTo(map);

        updateTable(filteredFeatures, 'nama_kec', false, true);
        info.update(null, `Kecamatan di ${parentFeature.properties.nama_kab}`);
        addLegend(grades, getColorFunc, 'Kecamatan', legendLabel);

        // Update previousLevelState
        const kabFeature = findLayerByName(parentFeature.properties.nama_kab).feature;
        previousLevelState = {
            level: 'kabupaten',
            feature: kabFeature,
            layer: populasiLayer.toGeoJSON().features,
            bounds: populasiLayer.getBounds()
        };

    } else if (currentLevel === 'kecamatan') {
        // Balik dari kecamatan ke kabupaten
        map.fitBounds(bounds);
        currentLevel = 'kabupaten';
        if (kecLayer) { map.removeLayer(kecLayer); }
        if (map.hasLayer(kepadatanLayer)) { map.removeLayer(kepadatanLayer); }
        if (!map.hasLayer(populasiLayer)) { map.addLayer(populasiLayer); }
        
        updateTable(populasiLayer.toGeoJSON().features, 'nama_kab');
        info.update(null, 'Populasi Kabupaten di Banten');
        addLegend(kabPopGrades, getColorKabPop, 'Populasi Kabupaten', 'jiwa');

        hideBackButton();
        previousLevelState = null;
    }
};

// =========================================================
// Pengaturan Awal dan Muat Data
// =========================================================
fetch('data/GA_banten_kab_simplified.geojson')
    .then(response => response.json())
    .then(data => {
        populasiLayer = L.geoJSON(data, { style: getStyleKabPop, onEachFeature: onEachFeatureKab }).addTo(map);
        kepadatanLayer = L.geoJSON(data, { style: getStyleKabKep, onEachFeature: onEachFeatureKab });

        const baseMaps = {
            'Jumlah Populasi': populasiLayer,
            'Kepadatan Penduduk': kepadatanLayer
        };
        L.control.layers(baseMaps).addTo(map);

        updateTable(data.features, 'nama_kab');
        addLegend(kabPopGrades, getColorKabPop, 'Populasi Kabupaten', 'jiwa');

        return fetch('data/GA_banten_kec_simplified_r2.geojson');
    })
    .then(response => response.json())
    .then(data => {
        kecData = data;
        return fetch('data/GA_banten_desa_simplified_r2.geojson');
    })
    .then(response => response.json())
    .then(data => {
        desaData = data;
    })
    .catch(error => console.error('Error saat memuat data:', error));

// Event listener saat layer berubah
map.on('baselayerchange', function(e) {
    currentMode = e.name === 'Jumlah Populasi' ? 'populasi' : 'kepadatan';
    
    let layerToUpdate = null;
    let grades, getColorFunc, title, label;

    if (currentLevel === 'kabupaten') {
        layerToUpdate = currentMode === 'populasi' ? populasiLayer : kepadatanLayer;
        grades = currentMode === 'populasi' ? kabPopGrades : kabKepGrades;
        getColorFunc = currentMode === 'populasi' ? getColorKabPop : getColorKabKep;
        title = currentMode === 'populasi' ? 'Populasi Kabupaten' : 'Kepadatan Kabupaten';
        label = currentMode === 'populasi' ? 'jiwa' : 'jiwa/km²';
        updateTable(layerToUpdate.toGeoJSON().features, 'nama_kab');
        info.update(null, title + ' di Banten');
    } else if (currentLevel === 'kecamatan') {
        layerToUpdate = kecLayer;
        grades = currentMode === 'populasi' ? kecPopGrades : kecKepGrades;
        getColorFunc = currentMode === 'populasi' ? getColorKecPop : getColorKecKep;
        title = `Kecamatan di ${layerToUpdate.toGeoJSON().features[0].properties.nama_kab}`;
        label = currentMode === 'populasi' ? 'jiwa' : 'jiwa/km²';
        updateTable(layerToUpdate.toGeoJSON().features, 'nama_kec', false, true);
        info.update(null, title);
    } else { // desa
        layerToUpdate = desaLayer;
        grades = currentMode === 'populasi' ? desaPopGrades : desaKepGrades;
        getColorFunc = currentMode === 'populasi' ? getColorDesaPop : getColorDesaKep;
        title = `Desa di ${layerToUpdate.toGeoJSON().features[0].properties.nama_kec}`;
        label = currentMode === 'populasi' ? 'jiwa' : 'jiwa/km²';
        updateTable(layerToUpdate.toGeoJSON().features, 'nama_kel', false, false);
        info.update(null, title);
    }
    
    layerToUpdate.setStyle(feature => {
        return {
            fillColor: getColorFunc(feature.properties[currentMode === 'populasi' ? 'jumlah_pen' : 'kepadatan_']),
            weight: currentLevel === 'desa' ? 1.5 : 2,
            color: 'white',
            dashArray: currentLevel === 'desa' ? '1' : '3',
            fillOpacity: currentLevel === 'desa' ? 0.7 : 0.5
        };
    });
    
    addLegend(grades, getColorFunc, title, label);
});

// Fungsi untuk tombol reset
document.getElementById('resetViewBtn').onclick = function() {
    map.setView([-6.46, 106], 7);
    currentLevel = 'kabupaten';
    currentMode = 'populasi';
    
    if (kecLayer) { map.removeLayer(kecLayer); kecLayer = null; }
    if (desaLayer) { map.removeLayer(desaLayer); desaLayer = null; }
    if (map.hasLayer(kepadatanLayer)) { map.removeLayer(kepadatanLayer); }
    if (!map.hasLayer(populasiLayer)) { map.addLayer(populasiLayer); }
    
    const kabData = populasiLayer.toGeoJSON();
    updateTable(kabData.features, 'nama_kab');
    info.update(null, 'Populasi Kabupaten di Banten');
    addLegend(kabPopGrades, getColorKabPop, 'Populasi Kabupaten', 'jiwa');

    hideBackButton();
    previousLevelState = null;

};
