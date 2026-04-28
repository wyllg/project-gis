

// Define TimestampConverter in the global scope
window.TimestampConverter = {
    // Function to convert Firestore timestamp to JavaScript Date object
    convertFirestoreTimestamp: function(timestamp) {
        return timestamp.toDate();
    },
    // Function to convert Realtime Database timestamp string to JavaScript Date object
    convertRTDBTimestamp: function(timestampString) {
        return new Date(timestampString.replace(' at', ''));
    }
};

//-----------------slider navigation bar---------------------//
const tab = document.querySelector('.tabs'),
    badges = tab.querySelectorAll('.tab');

badges.forEach(badge => {
    badge.addEventListener('click', () => {
        tab.querySelector('.active').classList.remove('active');
        badge.classList.add('active');
    })
});


// Function to show only the dashboard content
function showDashboardContent() {
    // Hide all content sections except dashboardContent
    contentSections.forEach(section => {
        if (section.id === 'dashboardContent') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });

    // Scroll to the top of the middle container
    const middleContainer = document.querySelector('.middle');
    if (middleContainer) {
        middleContainer.scrollTop = 0;
    }
}

// Show only dashboard content when page reloads
window.addEventListener('load', () => {
    showDashboardContent();
});

document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.getElementById("menu-btn");
    const closeBtn = document.getElementById("close-btn");
    const sidebar = document.getElementById("sidebar");
  
    if (menuBtn && closeBtn && sidebar) {
      // Open sidebar when menu button is clicked
      menuBtn.addEventListener("click", () => {
        sidebar.classList.add("active");
        menuBtn.style.display = "none";
        closeBtn.style.display = "block"; // Show close button
      });
  
      // Close sidebar when close button is clicked
      closeBtn.addEventListener("click", () => {
        sidebar.classList.remove("active");
        menuBtn.style.display = "block"; // Show menu button again
        // closeBtn.style.display = "none";
      });
  
      // Close sidebar when clicking outside of it
      document.addEventListener("click", (event) => {
        if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
          sidebar.classList.remove("active");
          menuBtn.style.display = "block"; // Show menu button again
          closeBtn.style.display = "none";
        }
      });
    } else {
      console.error("Sidebar or buttons not found!");
    }
  });
  


// Additional JavaScript code...
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const contentSections = document.querySelectorAll('.content-section');

sidebarLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();

        // Hide all content sections
        contentSections.forEach(section => {
            section.style.display = 'none';
        });

        // Get the target content section
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);

        // Display the target content section
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Scroll to the top of the middle container
        const middleContainer = document.querySelector('.middle');
        if (middleContainer) {
            middleContainer.scrollTop = 0;
        }
    });
});

var datePicker
//============== DATE =================//


document.addEventListener("DOMContentLoaded", function () {
    
    datePicker = flatpickr("#datePicker", {
        dateFormat: "F j, Y",
        altInput: true,
        altFormat: "F j, Y",
        defaultDate: "Select Date",
        onChange: function (selectedDates, dateStr, instance) {
            var selectedDate = selectedDates[0];
            displayDataForDate(selectedDate);
        }
    });

    setTimeout(removeLoader, 5000)
    var mergedData = [];
    createChart(mergedData);


    //============== MAP PICKER =================//
    var sidebarLinks = document.querySelectorAll(".sidebar-link");
    sidebarLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            sidebarLinks.forEach(function (l) {
                l.classList.remove("active");
            });
            link.classList.add("active");
        });
    });
    
//============== ADD BUTTON =================//
 // Add event listener for 'addBtn' element
 

 document.getElementById('addBtn').addEventListener('click', function (event) {
    // Get rainfall value from input
    event.preventDefault(); // Prevent default form submission behavior
    const rainfallInput = document.getElementById('rainfallInput');
    const rainfallValue = parseFloat(rainfallInput.value);

    // Get selected date from input
    const selectedDate = new Date(document.getElementById('PickerDate').value);

    // Get selected time from input
    const selectedTime = document.getElementById('timeInput').value;
    const [hours, minutes] = selectedTime.split(':');

    // Check if the selected time is PM and adjust hours accordingly
    let adjustedHours = parseInt(hours);
    if (selectedTime.toLowerCase().includes('pm')) {
        adjustedHours = (adjustedHours % 12) + 12; // Convert to 24-hour format
    }

    selectedDate.setHours(adjustedHours, parseInt(minutes)); // Set selected time

    // Get location name, latitude, and longitude from input fields
    const locationName = document.getElementById('locationSearchInput').value;
    const latitudeInput = document.getElementById('latitudeInput');
    const longitudeInput = document.getElementById('longitudeInput');
    const latitude = parseFloat(latitudeInput.value);
    const longitude = parseFloat(longitudeInput.value);

        // Check if any of the required fields are empty
    if (isNaN(rainfallValue) || !rainfallInput.value.trim()) {
        Swal.fire({
            icon: 'error',
            title: 'Please enter a valid rainfall value.',
            confirmButtonText: 'OK'
        });
        rainfallInput.focus();
        return; // Exit the function early if rainfall value is not a number or empty
    }

    if (!selectedDate || isNaN(selectedDate.getTime())) {
        Swal.fire({
            icon: 'error',
            title: 'Please select a valid date and time.',
            confirmButtonText: 'OK'
        });
        return; // Exit the function early if date is empty or not valid
    }
    if (!locationName.trim() || !latitude || isNaN(latitude) || !longitude || isNaN(longitude)) {
        Swal.fire({
            icon: 'error',
            title: 'Please enter a valid location.',
            confirmButtonText: 'OK'
        });
        document.getElementById('locationSearchInput').focus();
        return; // Exit the function early if location details are incomplete
    }

    // Add data to Firestore with date and time
    addRainfallData(locationName, latitude, longitude, rainfallValue, selectedDate);
});

// Attach click event listener to delete button
document.getElementById('deleteBtn').addEventListener('click', async function() {
    try {
        // Query Firestore to retrieve all documents from the collection
        const querySnapshot = await getDocs(collection(db, 'rainfall'));

        // Check if there are any documents in the collection
        if (!querySnapshot.empty) {
            // Extract data from the query snapshot
            const documents = querySnapshot.docs.map(doc => doc.data());

            // Create an array of strings representing each document's data
            const documentStrings = documents.map((data, index) => {
                // Remove "Calabarzon, 4207, Philippines" from the locationName
                const locationNameSnippet = data.locationName.replace(/, Calabarzon, 4207, Philippines$/, '');
            
                // Construct the string for the document entry
                return `${index + 1}. ${locationNameSnippet}, Rainfall Value: ${data.rainfallValue}`;
            });

            // Show Swal message with a dropdown containing the document data
            const { value: documentIndex } = await Swal.fire({
                title: 'Select data to delete',
                input: 'select',
                inputOptions: documentStrings,
                inputPlaceholder: 'Select data',
                showCancelButton: true,
                inputValidator: (value) => {
                    return new Promise((resolve) => {
                        if (value !== '') {
                            resolve();
                        } else {
                            resolve('You need to select data to delete');
                        }
                    });
                },
                customClass: {
                    input: 'small-dropdown', // Define a custom class for the input dropdown
                },
                width: '50%', // Set the width of the Swal message
            });

            // If the user selects a document and confirms deletion
            if (documentIndex !== undefined) {
                const documentToDelete = querySnapshot.docs[documentIndex]; // Get the document to delete
                await deleteDoc(documentToDelete.ref); // Delete the document from Firestore
                Swal.fire('Success', 'Data deleted successfully', 'success'); // Show success message
            }
        } else {
            // Show error message if no documents are found in the collection
            Swal.fire('Error', 'No data found to delete', 'error');
        }
    } catch (error) {
        // Show error message if an error occurs during the deletion process
        Swal.fire('Error', 'Failed to delete data: ' + error.message, 'error');
    }
});

document.getElementById('updateBtn').addEventListener('click', async function() {
    try {
        // Query Firestore to retrieve all documents from the collection
        const querySnapshot = await getDocs(collection(db, 'rainfall'));

        // Check if there are any documents in the collection
        if (!querySnapshot.empty) {
            // Extract data from the query snapshot
            const documents = querySnapshot.docs.map(doc => doc.data());
            
            // Create an array of strings representing each document's data
            const documentStrings = documents.map((data, index) => {
                const locationNameSnippet = data.locationName.replace(/, Calabarzon, 4207, Philippines$/, '');
            
                // Construct the string for the document entry
                return `${index + 1}. ${locationNameSnippet}, Rainfall Value: ${data.rainfallValue}`;
            });

            // Show Swal message with a dropdown containing the document data
            const { value: documentIndex } = await Swal.fire({
                title: 'Select data to update',
                input: 'select',
                inputOptions: documentStrings,
                inputPlaceholder: 'Select data',
                showCancelButton: true,
                inputValidator: (value) => {
                    return new Promise((resolve) => {
                        if (value !== '') {
                            resolve();
                        } else {
                            resolve('You need to select data to update');
                        }
                    });
                },
                customClass: {
                    input: 'small-dropdown', // Define a custom class for the input dropdown
                    popup: 'custom-swal-popup'
                },
                width: '50%', // Set the width of the Swal message
            });

            // If the user selects a document to update
            if (documentIndex !== undefined) {
                // Get the selected document data
                const selectedDocument = documents[documentIndex];
                
                // Show a Swal prompt for updating the data
                const { value: updatedValues } = await Swal.fire({
                    title: `Update Data for ${selectedDocument.locationName}`,
                    html:
                        `<input id="locationName" class="swal2-input" placeholder="Location Name" value="${selectedDocument.locationName}">` +
                        `<input id="latitude" class="swal2-input" placeholder="Latitude" value="${selectedDocument.latitude}">` +
                        `<input id="longitude" class="swal2-input" placeholder="Longitude" value="${selectedDocument.longitude}">` +
                        `<input id="date" class="swal2-input" type="date" placeholder="Date" value="${selectedDocument.timestamp.toDate().toISOString().split('T')[0]}">` +
                        `<input id="time" class="swal2-input" type="time" placeholder="Time" value="${selectedDocument.timestamp.toDate().toLocaleTimeString()}">` +
                        `<input id="rainfallValue" class="swal2-input" type="number" placeholder="Rainfall Value" value="${selectedDocument.rainfallValue}">`,
                    showCancelButton: true,
                    focusConfirm: false,
                    preConfirm: () => {
                        return [
                            document.getElementById('locationName').value,
                            document.getElementById('latitude').value,
                            document.getElementById('longitude').value,
                            document.getElementById('date').value,
                            document.getElementById('time').value,
                            document.getElementById('rainfallValue').value
                        ];
                    }
                });

                // If the user provides valid new values and confirms
                if (updatedValues !== undefined) {
                    const [newLocationName, newLatitude, newLongitude, newDate, newTime, newRainfallValue] = updatedValues;
                    
                    // Update the document in Firestore with the new values
                    await updateDoc(doc(collection(db, 'rainfall'), querySnapshot.docs[documentIndex].id), {
                        locationName: newLocationName,
                        latitude: newLatitude,
                        longitude: newLongitude,
                        timestamp: new Date(newDate + ' ' + newTime),
                        rainfallValue: newRainfallValue
                    });
                    Swal.fire('Success', 'Data updated successfully', 'success'); // Show success message
                }
            }
        } else {
            // Show error message if no documents are found in the collection
            Swal.fire('Error', 'No data found to update', 'error');
        }
    } catch (error) {
        // Show error message if an error occurs during the updating process
        Swal.fire('Error', 'Failed to update data: ' + error.message, 'error');
    }
});

// Function to add rainfall data with date without time
const addRainfallData = async (locationName, latitude, longitude, rainfallValue, selectedDate) => {
    try {
        // Add a new document with data to the "rainfall" collection
        await addDoc(collection(db, "rainfall"), {
            locationName: locationName,
            latitude: latitude,
            longitude: longitude,
            rainfallValue: rainfallValue,
            timestamp: selectedDate // Use selected date without time
        });
        
        // Display success alert
        Swal.fire({
            icon: 'success',
            title: 'Rainfall data added successfully!',
            confirmButtonText: 'OK'
        }).then(() => {
            // Reload the page after successful addition of data
            location.reload();
        });
        
        } catch (error) {
        // Handle error
        // console.error("Error adding rainfall data: ", error);
        }
    };
    
});



// //============== CHART DISPLAY IN DASHBOARD =================//
// Function to create the chart using merged data
function createChart(mergedData) {
    var chartCanvas = document.getElementById('chart');

    if (mergedData && window.Chart && chartCanvas) {
        // Clear the canvas before creating the chart
        var ctx = chartCanvas.getContext('2d');
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

        // Check if there's an existing chart instance
        if (window.myChart) {
            window.myChart.destroy();
        }

        // Ensure that each entry in mergedData has the parsedTimestamp property properly set
        mergedData.forEach(entry => {
            // Check if the entry has a timestamp field and it's not already a Date object
            if (entry.timestamp && !(entry.timestamp instanceof Date)) {
                // Convert the timestamp to a JavaScript Date object using TimestampConverter
                if (typeof entry.timestamp.toDate === 'function') {
                    // Firestore timestamp
                    entry.parsedTimestamp = TimestampConverter.convertFirestoreTimestamp(entry.timestamp);
                } else {
                    // Realtime Database timestamp
                    entry.parsedTimestamp = TimestampConverter.convertRTDBTimestamp(entry.timestamp);
                }
            }
        });

        // Sort the merged data by parsedTimestamp in ascending order
        mergedData.sort((a, b) => a.parsedTimestamp - b.parsedTimestamp);
        // console.log('MergeData', mergedData)

        // Initialize arrays to store timestamp labels and rainfall data
        var labelsArray = [];
        var rainfallDataArray = [];
        var label = [];
        var datestring = new Date()
        // Process each entry in mergedData
        mergedData.forEach(entry => {
          if (entry.rainfallValue != "0" && entry.rainfallValue != 0) {
            if ((formatDateString((entry.parsedTimestamp).toLocaleString())).includes(formatDateString(datestring))){
            // Extract parsedTimestamp, locationName, and rainfallValue from each entry
            var parsedTimestamp = entry.parsedTimestamp;
            var locationName = entry.locationName;
            var rainfallValue = entry.rainfallValue;
            
            // Format parsedTimestamp to display in the chart (adjust this part as needed)
            var formattedTimestamp = parsedTimestamp ? parsedTimestamp.toLocaleString() : 'Unknown';
            
            // Add timestamp label and rainfall data to respective arrays
              labelsArray.push(`${entry.rainfallValue} mm\n${formattedTimestamp}\n${locationName}`);
                label.push(`${formattedTimestamp}`);
                rainfallDataArray.push(rainfallValue);
            }
          }
        });


        var myChart = new Chart(chartCanvas, {
          type: 'line',
          data: {
            labels: label,
            datasets: [{
              label: 'Rainfall Data',
              data: rainfallDataArray,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(0, 0, 0, 1)',
              borderWidth: 1,
              fill: true,
              tension: 0.1,
            }]
          },
          options: {
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const dataIndex = context.dataIndex;
                    return 'Rainfall Data: ' + labelsArray[dataIndex];
                  }
                }
              }
            },
            scales: {
							x: {
								display: true,
								title: {
									display: true,
									text: 'Date and Time'
								}
							},
							y: {
								beginAtZero: true,
								display: true,
								title: {
									display: true,
									text: 'Rainfall (mm)'
								}
							}
            }
          }
        });

        // Store the new chart instance
        window.myChart = myChart;

        return myChart;
    }
}


document.addEventListener("DOMContentLoaded", function () {
    const forecastPeriod = document.getElementById("forecastPeriod"); // Spinner input
    const datePickerInput = document.getElementById("datePicker"); // Flatpickr input

    // Initialize Flatpickr
    const datePicker = flatpickr(datePickerInput, {
        dateFormat: "F j, Y",
        altInput: true,
        altFormat: "F j, Y",
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                let selectedDate = selectedDates[0]; // Get picked date
                let today = new Date();
                let diffTime = selectedDate - today;
                let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
                forecastPeriod.value = diffDays > 0 ? diffDays : 0; // Update spinner
            }
        }
    });

    // Update Date Picker when spinner changes
    forecastPeriod.addEventListener("input", function () {
        let days = parseInt(forecastPeriod.value) || 0;
        let newDate = new Date();
        newDate.setDate(newDate.getDate() + days);
        datePicker.setDate(newDate, true); // Update Flatpickr
    });
});



//============== MUNICIPALIY CHART =================//

document.getElementById("municipalityFilter").addEventListener("click", function () {
    const selectedTributary = document.getElementById("municipality__select").value;

    if (selectedTributary === "") {
        // alert("Please select a tributary first.");
        showTributaryAlert();
        return;
    }

    fetchRainData(selectedTributary);
    
});


document.getElementById("forecastButton").addEventListener("click", function () {
    const forecastTributary = document.getElementById("forecast_tributary_select").value;

    if (forecastTributary === "") {
        // alert("Please select a tributary first.");
        showTributaryAlert();
        return;
    }

    fetchForecasting(forecastTributary);
    latestDataFetching(forecastTributary);
    
});

//fetching the tributaries based on the logged in municipalities
// Function to fetch user data and get municipality
async function fetchUserMunicipality() {
    try {
        const response = await fetch('./php/userdata.php');
        const data = await response.json();

        if (data.error) {
            console.error("Error fetching user data:", data.error);
            return null;
        }

    

        // Return the municipality associated with the user
        console.log(data.username);
        return data.username
    } catch (error) {
        console.error("Fetch Error (User Data):", error);
        return null;
    }
}

//====================Get the list of Municipality=========//

// Get the logged in user
async function getMunicipalityTributary() {
    const municipalityName = await fetchUserMunicipality();

    if (!municipalityName) {
        console.error("Municipality not found for the user.");
        return;
    }

    const response = await fetch(`/public/php/getTributaries.php?user=${encodeURIComponent(municipalityName)}`);
    const municipalityData = await response.json();


    return municipalityData;
}

//fetch the Municipality Names to the lists
async function loadUserMunicipality() {
    try {
        const userLoggedIn = await fetchUserMunicipality();

        // Fetch municipalities for the logged-in user
        const response = await fetch(`/public/php/getTributaries.php?user=${encodeURIComponent(userLoggedIn)}`);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            console.error("No municipality data found");
            return {};
        }

        // Store municipality names in an object
        const municipalities = {};
        data.forEach(entry => {
            municipalities[entry.municipality] = []; // Placeholder for discharge data
        });

        console.log("Municipalities under user:", municipalities);
        return municipalities; // Return municipality list as an object

    } catch (error) {
        console.error("Error loading municipalities:", error);
        return {};
    }
}


//===================Tributary Chart===================//
// Function to fetch tributaries based on municipality
async function fetchTributaries() {
    try {
        const municipalityList = await loadUserMunicipality();
        const municipalityName = await fetchUserMunicipality(); // Get municipality from user data

        if (!municipalityName) {
            console.error("Municipality not found for the user.");
            return;
        }

        // Fetch tributaries based on municipality
        const response = await fetch(`/public/php/getTributaries.php?user=${encodeURIComponent(municipalityName)}`);
        const data = await response.json();
        console.log("Fetched Tributaries:", data);

        const tributaryChart = document.getElementById("municipality__select");
        tributaryChart.innerHTML = "<option value='' selected hidden >Select tributary...</option>";

        const tributaryList = {};

        data.forEach(({ tributary, municipality }) => {
            if (!tributaryList[municipality]) {
                tributaryList[municipality] = new Set(); // Use a Set to store unique tributaries
            }
            tributaryList[municipality].add(tributary);
        });

        // Convert Set to an array if needed (JSON doesn't support Sets directly)
        for (const key in tributaryList) {
            tributaryList[key] = Array.from(tributaryList[key]);
        }

        console.log("Formatted Tributary List:", tributaryList);


        if(data.error) {
            console.error("Error: ", data.error);
        } else {
            data.forEach(tributary => {
                let option = document.createElement("option");
                option.value = tributary.tributary;
                option.textContent = tributary.tributary;
                tributaryChart.appendChild(option);
            });
        }

        return tributaryList; // Return the list of municipalities and their tributaries
    } catch (error) {
        console.error("Fetch Error (Tributaries):", error);
    }
}

// Run functions when the page loads
document.addEventListener("DOMContentLoaded", fetchTributaries);




//================Forecasting Dashboard================//

// Get the total discharge of municipality per tributary
async function getTotalDischarge() {
    const userMunicipality = await fetchUserMunicipality();
    const majorTributaries = new Set([
        "Calumala Creek 1", "Calumala Creek 2", "Bancoro Creek", "Tagudtod Creek",
        "Pansipit River", "Agoncillo Creek 1", "Agoncillo Creek 2", "Agoncillo Creek 3",
        "Bilibinwang Creek 1", "Bilibinwang Creek 2", "Buso-buso Stream 1", "Buso-buso Stream 2",
        "Buso-buso Stream 3", "Buso-buso Stream 4", "Gulod Stream 3", "Gulod Stream 4",
        "Gulod Stream 5", "Gulod Stream 6", "Gulod Stream 7", "Laurel River 1",
        "Molinete Creek 2", "Balakilong Creek", "Berinayan Creek", "Sampaloc Creek 1",
        "Sampaloc Creek 2", "Banga Creek", "Lambingan River", "Tumaway River",
        "Bignay Creek", "Caloocan Creek", "Ambulong Stream 2", "Ambulong Stream 3",
        "Wawa River", "Balete River", "Palsara River", "Kinalaglagan River", "Bulaklakan River"
    ]);

    try {
        // Load the GeoJSON file using fetch
        const geojsonResponse = await fetch("http://localhost:3000/geojson_files/Waterways_updated.geojson");
        const geojsonData = await geojsonResponse.json();

        // Extract tributary coordinates
        const tributaries = {};
        geojsonData.features.forEach(feature => {
            const name = feature.properties?.name || "Unknown";
            const coordinates = feature.geometry?.coordinates || [];
            if (majorTributaries.has(name)) {
                tributaries[name] = coordinates;
            }
        });

        // Fetch piggeries data
        const piggeriesUrl = "http://localhost:3000/public/php/piggeries.php";
        const piggeriesResponse = await fetch(piggeriesUrl);
        const piggeriesData = await piggeriesResponse.json();

        // Fetch tributaries with municipality data
        const tributariesUrl = `http://localhost:3000/public/php/getTributaries.php?user=${encodeURIComponent(userMunicipality)}`;
        const tributariesResponse = await fetch(tributariesUrl);
        const tributariesData = await tributariesResponse.json();

        console.log("Fetch tributaries Discharge: ", tributariesData);

        // Filter piggeries and compute total discharge
        const distanceThreshold = 40; // Meters
        const tributaryDischarge = {};

        piggeriesData.forEach(piggery => {
            if (piggery.sanitation === "Free-flow" && parseFloat(piggery.discharge) > 0) {
                const piggeryLocation = { latitude: parseFloat(piggery.latitude), longitude: parseFloat(piggery.longitude) };

                for (const [tribName, tribCoords] of Object.entries(tributaries)) {
                    for (const coord of tribCoords) {
                        const tributaryLocation = { latitude: coord[1], longitude: coord[0] }; // Convert GeoJSON format
                        const distance = getDistance(piggeryLocation, tributaryLocation);

                        if (distance < distanceThreshold) {
                            if (!tributaryDischarge[tribName]) {
                                tributaryDischarge[tribName] = 0;
                            }
                            tributaryDischarge[tribName] += parseFloat(piggery.discharge);
                            break; // Stop checking once assigned
                        }
                    }
                }
            }
        });

        // Group by municipality (ENSURE 0 DISCHARGE TRIBUTARIES ARE INCLUDED)
        const municipalityDischarge = {};
        tributariesData.forEach(({ tributary, municipality }) => {
            if (!municipalityDischarge[municipality]) {
                municipalityDischarge[municipality] = [];
            }
            municipalityDischarge[municipality].push({
                tributary, 
                discharge: tributaryDischarge[tributary] ?? 0 // Include 0 discharge tributaries
            });
        });

        return municipalityDischarge;
    } catch (error) {
        console.error("❌ Error fetching data", error);
        return {};
    }
}

// Function to calculate distance using Haversine formula
function getDistance(coord1, coord2) {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371000; // Earth's radius in meters
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(coord1.latitude)) * Math.cos(toRad(coord2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

getTotalDischarge().then(municipalityData => {
    console.log("Discharge grouped by municipality:", municipalityData);
});

document.addEventListener("DOMContentLoaded", getMunicipalityTributary);



// Get the percentage of discharge contribution per tributary
async function computeDischargePercentage() {
    const municipalityDischarge = await getTotalDischarge(); // Get discharge data
    const municipalityList = await loadUserMunicipality(); // Get municipalities under user

    console.log("Municipalities under user: ", municipalityList);

    // Store percentages
    const dischargePercentage = {};

    for (const [municipality, tributaries] of Object.entries(municipalityDischarge)) {
        // Calculate total discharge for the municipality
        const totalDischarge = tributaries.reduce((sum, { discharge }) => sum + discharge, 0);

        // Compute percentage for each tributary
        dischargePercentage[municipality] = tributaries.map(({ tributary, discharge }) => ({
            tributary,
            discharge: parseFloat(discharge.toFixed(2)),
            percentage: totalDischarge > 0 ? parseFloat(((discharge / totalDischarge) * 100).toFixed(2)) : 0
        }));

        // Attach computed data to the municipality list
        if (municipality in municipalityList) {
            municipalityList[municipality] = dischargePercentage[municipality];
        }
    }

    console.log("Updated municipality list with discharge percentage:", municipalityList);
    return municipalityList;
}

// Call the function and log the result
computeDischargePercentage().then(data => {
    console.log("Final Data:", data);
});

////
async function updateMunicipalityTabs() {
    try {
        const municipalityData = await computeDischargePercentage();
        const municipalitySanitationData = await getSanitation();
        const municipalityTributaryData = await fetchTributaries()

        console.log("municipalityTributaryData: ", municipalityTributaryData);

        
        const municipalityTabs = document.getElementById("municipalityTabs");
        municipalityTabs.innerHTML = ""; // Clear existing tabs
        // const tributaryMap = {}; // Object to store tributary data

        let first = true; // Flag to track the first municipality

        for (const municipality of Object.keys(municipalityData)) {
            const dischargeData = municipalityData[municipality] || {};
            const sanitationData = municipalitySanitationData[municipality] || {};
            const tributaryData = municipalityTributaryData[municipality] || [];

            // Create a tab for each municipality
            const li = document.createElement("li");
            li.className = "tab";
            li.textContent = municipality;

            if (first) {
                li.classList.add("active"); // Mark the first tab as active
                first = false;
            }

            // Attach data attributes for future reference
            li.dataset.discharge = JSON.stringify(dischargeData);
            li.dataset.sanitation = JSON.stringify(sanitationData);
            li.dataset.tributary = JSON.stringify(tributaryData);

            // Event listener to handle tab switching
            li.addEventListener("click", () => {
                document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
                li.classList.add("active");

                console.log(`Data for ${municipality}:`, {
                    dischargeData,
                    sanitationData,
                    tributaryData
                });

                updateTributaryDropdown(tributaryData);

        
                ///////////////////////////START OF CODE for zooming into the active Municipality in the map////////////////////////////////
                const activeTab = document.querySelector(".tab.active");
                if (activeTab) {        
                    const activeTabMunicipality = activeTab.textContent;
                    console.log("Active TabElement HEEEERRRREEEEE!!!!: ", activeTab);
                    console.log("Active Tab HEEEERRRREEEEE!!!!: ", activeTabMunicipality);

                    const municipalityCodes = {
                        'Agoncillo': 'AGON',
                        'Alitagtag': 'ALI',
                        'Balete': 'BAL',
                        'Cuenca': 'CUE',
                        'Laurel': 'LAU',
                        'MataasNaKahoy': 'MNK',
                        'San Nicolas': 'SAN',
                        'Santa Teresita': 'STA',
                        'Tanauan': 'TAN',
                        'Talisay': 'TAL'
                        // Add more mappings as needed
                    };
                    
                    const municipality_code = municipalityCodes[activeTabMunicipality];
                    console.log("Municipality Code HEEEERRRREEEE!!!!: ", municipality_code);
                    // Call function to show shape layer based on municipality code
                    // showShapeLayerBasedOnMunicipalityCode(municipality_code);

                    var municipalityCoordinates = {
                        "BAL": [14.03193, 121.095428],
                        "AGON" : [13.963389, 120.925484],
                        "ALI": [13.862914, 121.016121],
                        "CUE": [13.90461431313024, 121.05597251881868],
                        "LAU": [14.05213019982489, 120.90732456456205],
                        "MNK": [13.979085952016785, 121.09739159746668],
                        "SAN": [13.919965859758854, 120.94770603976525],
                        "STA": [13.875449936908929, 120.97140159298453],
                        "TAL": [14.106513571117576, 121.01920986439174],
                        "TAN": [14.09888862387092, 121.09632379483912]
                    };

                    var coordinates = municipalityCoordinates[municipality_code]; // Retrieve coordinates for the municipality
                    console.log("Coordinates HEEEERRRREEEE!!!!: ", coordinates);

                    if (coordinates) {
                        console.log("ISA PAAAAA Coordinates HEEEERRRREEEE!!!!: ", coordinates);
                        // map.flyTo(coordinates, 13); // Fly to the specified coordinates

                        console.log("LOOOOOKKKKK!!! Sending coordinates to map.js: ", coordinates);
                        // Send the coordinates to map.js via postMessage
                        const mapIframe = document.querySelector('.iframe');
                        if (mapIframe && mapIframe.contentWindow) {
                            // Send the coordinates to map.js
                            mapIframe.contentWindow.postMessage({ type: "zoom", coordinates: coordinates }, '*');

                            // Send the active municipality to show markers
                            mapIframe.contentWindow.postMessage({ 
                                type: "showMunicipalityMarkers", 
                                municipality: activeTabMunicipality 
                            }, '*');
                        }
                    }

                    // Send the active municipality to map.js
                    window.dispatchEvent(new CustomEvent("municipalityChanged", {
                        detail: { municipality: activeTabMunicipality }
                    }));


                    showShapeLayerBasedOnMunicipalityCode(municipality_code);
                }
                ///////////////////////////END OF CODE for zooming into the active Municipality in the map////////////////////////////////

            });

            // Append municipality tab
            municipalityTabs.appendChild(li);
        }

        // If there's an active tab, populate the dropdown initially
        const activeTab = document.querySelector(".tab.active");

        if (activeTab) {
            const initialTributaryData = JSON.parse(activeTab.dataset.tributary);
            updateTributaryDropdown(initialTributaryData);
        }

    } catch (error) {
        console.error("Error in updateMunicipalityTabs:", error);
    }
}



// Function to update the tributary dropdown
function updateTributaryDropdown(tributaryData) {
    const tributarySelect = document.getElementById("forecast_tributary_select");
    tributarySelect.innerHTML = "<option value='' selected hidden>Select tributary...</option>";

    tributaryData.forEach(tributaryName => {
        let option = document.createElement("option");
        option.value = tributaryName;
        option.textContent = tributaryName;
        tributarySelect.appendChild(option);
    });

    console.log("Updated Tributary Dropdown:", tributarySelect);
}

// Call function to update the UI
document.addEventListener("DOMContentLoaded", updateMunicipalityTabs);

async function updateDischargeChart(selectedMunicipality = null) {
    try {
        // Step 1: Fetch logged-in user's municipalities
        const userMunicipalities = await fetchUserMunicipality();
        const municipalityResponse = await fetch(`/public/php/getTributaries.php?user=${encodeURIComponent(userMunicipalities)}`);
        const municipalityData = await municipalityResponse.json();

        if (!municipalityData || municipalityData.length === 0) {
            console.error("❌ No municipality data found!");
            return;
        }

        // Step 2: Fetch discharge percentage data
        const dischargeData = await computeDischargePercentage();
        console.log("📊 Discharge Data:", dischargeData);

        // Step 3: Determine which municipality to show on the chart
        let municipalityName = selectedMunicipality || municipalityData[0]?.municipality;

        if (!municipalityName) {
            console.warn("⚠ No municipality name available!");
            return;
        }

        console.log("🔹 Displaying Data for:", municipalityName);

        // Step 4: Check if discharge data exists for the selected municipality
        let dischargeInfo = dischargeData[municipalityName];

        let labels, data, backgroundColors, borderColors;

        if (!dischargeInfo || dischargeInfo.length === 0) {
            console.warn(`⚠ No discharge data available for ${municipalityName}`);

            // Show a "No Data Available" segment filling 100%
            labels = ["No Data Available"];
            data = [100]; // Fill the entire chart
            backgroundColors = ["rgba(200, 200, 200, 0.6)"];
            borderColors = ["rgba(150, 150, 150,ta 1)"];
        } else {
            // Step 5: Extract labels (tributaries) and data (percentage contribution)
            labels = dischargeInfo.map(item => item.tributary);
            data = dischargeInfo.map(item => item.percentage);
            
            // Ensure the total percentage sums up to 100%
            const totalPercentage = data.reduce((sum, val) => sum + val, 0);
            if (totalPercentage < 100) {
                labels.push("No Data Available");
                data.push(100 - totalPercentage);
            }

            backgroundColors = [
                "rgba(255, 99, 132, 0.8)",   // Red
                "rgba(54, 162, 235, 0.8)",   // Blue
                "rgba(255, 206, 86, 0.8)",   // Yellow
                "rgba(75, 192, 192, 0.8)",   // Teal
                "rgba(153, 102, 255, 0.8)",  // Purple
                "rgba(255, 159, 64, 0.8)",   // Orange
                "rgba(199, 199, 199, 0.8)",  // Gray
                "rgba(255, 99, 255, 0.8)",   // Pink
                "rgba(99, 255, 132, 0.8)",   // Mint Green
                "rgba(255, 220, 99, 0.8)",   // Light Orange
                "rgba(99, 132, 255, 0.8)",   // Soft Blue
                "rgba(132, 255, 255, 0.8)",  // Cyan
                "rgba(255, 132, 99, 0.8)"    // Coral
            ];
            borderColors = 'rgba(255, 255, 255, 1)'; // White border for all segments
        }

        const ctx = document.getElementById('doughnut').getContext('2d');

        // Step 6: Destroy previous chart instance if it exists
        if (window.dischargeChartInstance) {
            window.dischargeChartInstance.destroy();
        }

        // Step 7: Create a new doughnut chart with updated data
        window.dischargeChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: `Discharge Contribution for ${municipalityName}`,
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Discharge Contribution for ${municipalityName}`, 
                        font: {
                            size: 12
                        },
                        color: '#000', // Set title color
                        padding: {
                            top: 10,
                            bottom: 10
                        }
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 11
                            }
                        },
                        padding: {
                            top: 20,
                            bottom: 0
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                return `${tooltipItem.label}: ${tooltipItem.raw}%`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error("❌ Error updating discharge chart:", error);
    }
}

// ✅ Fetch discharge chart on page load
document.addEventListener("DOMContentLoaded", () => {
    updateDischargeChart();
});



//Get Sanitation type of every municipality
async function getSanitation() {
    try {
        // Fetch logged-in user's municipality
        const userMunicipality = await fetchUserMunicipality();
        const municipalityList = await loadUserMunicipality();


        // Fetch piggeries data
        const response = await fetch("http://localhost:3000/public/php/piggeries.php");
        const piggeriesData = await response.json();

        // Extract all possible sanitation types from the dataset
        const allSanitationTypes = new Set(piggeriesData.map(piggery => piggery.sanitation));

        // Object to store sanitation counts per municipality
        const sanitationCount = {};

        // Process piggeries data
        piggeriesData.forEach(piggery => {
            const { municipality, sanitation } = piggery;

            // Ensure municipality exists in the sanitationCount object
            if (!sanitationCount[municipality]) {
                sanitationCount[municipality] = {};
                
                // Initialize all sanitation types to 0
                allSanitationTypes.forEach(type => {
                    sanitationCount[municipality][type] = 0;
                });
            }

            // Increment the sanitation count
            sanitationCount[municipality][sanitation]++;
            
        });

        // Ensure all municipalities have all sanitation types (even if missing)
        for (const municipality in sanitationCount) {
            allSanitationTypes.forEach(type => {
                if (!sanitationCount[municipality].hasOwnProperty(type)) {
                    sanitationCount[municipality][type] = 0;
                }
            });

            if(municipality in municipalityList){
                municipalityList[municipality] = sanitationCount[municipality];
            }
        }

        console.log("Sanitation count per municipality: ", sanitationCount);
        return sanitationCount;

    } catch (error) {
        console.error("❌ Error fetching sanitation data:", error);
        return {};
    }
}

// Call function and log result
getSanitation().then(data => {
    console.log("Total sanitation count per municipality: ", data);
});


// Function to update the bar chart
async function updateSanitationChart(selectedMunicipality = null) {
    try {
        // Fetch logged-in user's municipality from getTributaries.php
        const userMunicipalities = await fetchUserMunicipality();
        const userMunicipalityResponse = await fetch(`/public/php/getTributaries.php?user=${encodeURIComponent(await fetchUserMunicipality())}`);
        const userMunicipalityData = await userMunicipalityResponse.json();

        // Check if valid municipality data is received
        if (!userMunicipalityData || userMunicipalityData.length === 0) {
            console.warn("⚠ No municipality data found for the logged-in user.");
            return;
        }

        // Fetch sanitation data
        const sanitationData = await getSanitation();

        // Extract the municipality name (assuming the user is associated with one municipality)
        const municipalityName = selectedMunicipality || userMunicipalityData[0].municipality; 



        // Get sanitation counts for the fetched municipality
        const sanitationCounts = sanitationData[municipalityName];

        console.log("sanitation counts: ", sanitationCounts);

        // Check if sanitation data exists for the user's municipality
        if (!sanitationCounts) {
            console.warn(`⚠ No sanitation data available for ${municipalityName}`);
            return;
        }

        const ctx = document.getElementById('barchart').getContext('2d');

        // Extract sanitation types and counts
        const labels = Object.keys(sanitationCounts); // Sanitation types
        const data = labels.map(type => sanitationCounts[type]); // Corresponding counts

        // Destroy previous chart instance if it exists (to prevent duplicates)
        if (window.sanitationChartInstance) {
            window.sanitationChartInstance.destroy();
        }

        // Create new bar chart
        window.sanitationChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Sanitation Count for ${municipalityName}`,
                    data: data,
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.8)",   // Red
                        "rgba(54, 162, 235, 0.8)",   // Blue
                        "rgba(255, 206, 86, 0.8)",   // Yellow
                        "rgba(75, 192, 192, 0.8)",   // Teal
                        "rgba(153, 102, 255, 0.8)",  // Purple
                        "rgba(255, 159, 64, 0.8)",   // Orange
                        "rgba(199, 199, 199, 0.8)",  // Gray
                        "rgba(255, 99, 255, 0.8)",   // Pink
                        "rgba(99, 255, 132, 0.8)",   // Mint Green
                        "rgba(255, 220, 99, 0.8)",   // Light Orange
                        "rgba(99, 132, 255, 0.8)",   // Soft Blue
                        "rgba(132, 255, 255, 0.8)",  // Cyan
                        "rgba(255, 132, 99, 0.8)"    // Coral
                    ],
                    borderColor: [
                        "rgba(255, 99, 132, 0.8)",   // Red
                        "rgba(54, 162, 235, 0.8)",   // Blue
                        "rgba(255, 206, 86, 0.8)",   // Yellow
                        "rgba(75, 192, 192, 0.8)",   // Teal
                        "rgba(153, 102, 255, 0.8)",  // Purple
                        "rgba(255, 159, 64, 0.8)",   // Orange
                        "rgba(199, 199, 199, 0.8)",  // Gray
                        "rgba(255, 99, 255, 0.8)",   // Pink
                        "rgba(99, 255, 132, 0.8)",   // Mint Green
                        "rgba(255, 220, 99, 0.8)",   // Light Orange
                        "rgba(99, 132, 255, 0.8)",   // Soft Blue
                        "rgba(132, 255, 255, 0.8)",  // Cyan
                        "rgba(255, 132, 99, 0.8)"    // Coral
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'x', // Flip chart to horizontal bars
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: 'Sanitation Type' },
                        font: { weight: "bold", color: "black" }
                    },
                    y: {
                        title: { display: true, text: 'Sanitation Count' }
                    }
                }
            }
        });

    } catch (error) {
        console.error("❌ Error updating sanitation chart:", error);
    }
}

// Call function to update chart

document.addEventListener("DOMContentLoaded", () => {
    updateSanitationChart();
});

// ✅ Add event listener to update chart when a user selects a municipality
document.getElementById("municipalityTabs").addEventListener("click", (event) => {
    if (event.target.tagName === "LI") {
        const selectedMunicipality = event.target.textContent;
        updateDischargeChart(selectedMunicipality);
        updateSanitationChart(selectedMunicipality);
    }
});



//Request to Server Flas API
document.addEventListener("DOMContentLoaded", async function () {
    const dropdown = document.getElementById("forecast_tributary_select");
    const forecastPeriodInput = document.getElementById("forecastPeriod");
    const forecastButton = document.getElementById("forecastButton");
    const chartCanvas = document.getElementById("forecastChart");
    let chartInstance = null; // Store Chart.js instance
    let tributaryMap = {}; // Store tributary-to-encoded_tributary mapping
    let cachedForecasts = {}; // Store fetched forecast data per tributary

    /** ✅ Fetch Tributaries & Populate Dropdown */
    async function fetchTributaries() {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/tributaries");
            if (!response.ok) throw new Error("Failed to fetch tributaries");

            const tributaries = await response.json();

            dropdown.innerHTML = "<option value='' selected hidden>Select tributary...</option>";
            tributaries.forEach(entry => {
                let option = document.createElement("option");
                option.value = entry.tributary;
                option.textContent = `${entry.tributary} (${entry.municipality_name})`;
                dropdown.appendChild(option);
                tributaryMap[entry.tributary] = entry.encoded_tributary;
            });
        } catch (error) {
            console.error("Error fetching tributaries:", error);
        }
    }

    /** 🔍 Fetch Forecast */
    async function fetchForecast() {
        const selectedTributary = dropdown.value;
        const forecastPeriod = parseInt(forecastPeriodInput.value) || 10;

        if (!selectedTributary) {
            console.warn("Invalid tributary selection.");
            return;
        }

        console.log(`📡 Fetching forecast for: ${selectedTributary}, Period: ${forecastPeriod} days`);

        try {
            const url = `http://127.0.0.1:5000/api/forecast?periods=${forecastPeriod}&tributary=${selectedTributary}`;
            const forecastResponse = await fetch(url);
            if (!forecastResponse.ok) throw new Error(`HTTP error! Status: ${forecastResponse.status}`);

            const forecastData = await forecastResponse.json();
            console.log("Fetched Forecast Data:", forecastData);

            if (forecastData.forecasts?.length) {
                let forecastEntries = forecastData.forecasts.find(entry => entry.tributary === selectedTributary);
                if (forecastEntries?.forecastV) {
                    cachedForecasts[selectedTributary] = forecastEntries.forecastV;
                    updateChart(forecastEntries.forecastV, selectedTributary, forecastPeriod);
                } else {
                    console.warn("⚠ No forecastV data found for selected tributary.");
                    clearChart();
                }
            } else {
                console.warn("⚠ No forecast data found.");
                clearChart();
            }
        } catch (error) {
            console.error("❌ Error fetching forecast data:", error);
        }
    }

    /** 📈 Update Chart */
    function updateChart(forecastData, tributaryName, period) {
        const ctx = chartCanvas.getContext("2d");
        const labels = forecastData.slice(0, period).map(entry => entry.date);
        const values = forecastData.slice(0, period).map(entry => entry.forecast);

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: `Forecast for ${tributaryName}`,
                    data: values,
                    borderColor: "rgb(45, 139, 186)",
                    backgroundColor: "rgba(108, 229, 232,0.2)",
                    fill: true,
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: "Date" } },
                    y: { title: { display: true, text: "Distance Travelled by the Effluents (m)" } }
                }
            }
        });
    }

    /** 🗑 Clear Chart */
    function clearChart() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }

    /** 🎯 Fetch Latest Data */
    async function latestDataFetching() {
        const selectedTributary = dropdown.value;
        if (!selectedTributary) {
            console.warn("No tributary selected.");
            return;
        }

        // const url = /public/php/getVolume.php?tributary=${encodeURIComponent(selectedTributary)};
        const tributaryMap = {
            "Buso-buso Stream 2": "Buso-buso Stream 1",
            "Gulod Stream 6": "Gulod Stream 7"
        };
        
        const mappedTributary = tributaryMap[selectedTributary] || selectedTributary;
        const url = `/public/php/getRainfallperHour.php?tributary=${encodeURIComponent(mappedTributary)}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log("Fetched Data:", data);

            if (data?.error) {
                console.error("No valid latest data found:", data.error);
                return;
            }

            updateUIWithLatestData(data, selectedTributary);
        } catch (error) {
            console.error("Error fetching latest data:", error);
        }
    }

    function updateUIWithLatestData(data, selectedTributary) {
        if (!data?.total_volume) {
            console.error("No valid latest data found.");
            return;
        }

        const rainfallResultText = document.getElementById('rainfallResultText');
        const dischargeVolumeText = document.getElementById('dischargeVolumeText');
        const rainfallIntensityText = document.getElementById('rainfallIntensityText');

        let rainfallIntensity = data.total_volume < 2.5 ? "Light" :
                                data.total_volume < 7.5 ? "Moderate" :
                                data.total_volume < 15 ? "Heavy" :
                                data.total_volume < 30 ? "Intense" : "Torrential";

        if (rainfallResultText) rainfallResultText.textContent = `${data.total_volume.toFixed(2)} mm`;
        if (rainfallIntensityText) rainfallIntensityText.innerHTML = `${rainfallIntensity}`;

        getTotalDischarge().then(dischargeData => {
            if (!dischargeVolumeText) return;
            let totalDischarge = Object.values(dischargeData).flat().find(entry => entry.tributary === selectedTributary)?.discharge || 0;
            dischargeVolumeText.textContent = `${totalDischarge.toFixed(2)} kg`;
        });
    }

    // ✅ Load tributaries on page load
    await fetchTributaries();

    // ✅ Add event listener ONCE
    forecastButton.addEventListener("click", async () => {
        await fetchForecast();
        await latestDataFetching();
    });
});



// //======================================================//
async function fetchRainData(selectedTributary) {

    // const url = /public/php/getVolume.php?tributary=${encodeURIComponent(selectedTributary)};
    const tributaryMap = {
        "Buso-buso Stream 2": "Buso-buso Stream 1",
        "Gulod Stream 6": "Gulod Stream 7"
    };
    
    const mappedTributary = tributaryMap[selectedTributary] || selectedTributary;
    const url = `/public/php/get_rain_data.php?tributary=${encodeURIComponent(mappedTributary)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("Error fetching data:", data.error);
            return;
        }

        plotRainChart(data.rain_data, selectedTributary);
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

function showRainAlert(selectedTributary) {
    document.getElementById("rainTributaryName").textContent = selectedTributary;
    document.getElementById("rainAlertPopup").style.display = "flex";
}

function showHistoricalDataAlert(selectedTributary) {
    document.getElementById("historicalTributaryName").textContent = selectedTributary;
    document.getElementById("historicalDataAlertPopup").style.display = "flex";
}

function showTributaryAlert(){
    // document.getElementById("tributarySelectAlertPopup").style.display = "flex";
    document.getElementById("tributarySelectAlertPopup").style.display = "flex";
}

function closePopup() {
    document.getElementById("rainAlertPopup").style.display = "none";
    document.getElementById("historicalDataAlertPopup").style.display = "none";
    document.getElementById("tributarySelectAlertPopup").style.display = "none";
}





function plotRainChart(rainData, selectedTributary) {
    if (!rainData || rainData.length === 0) {
        // alert(`No rain data available for ${tributaryName}.`);
        showRainAlert(selectedTributary);
        return;
    }

    const labels = rainData.map(entry => new Date(entry.timestamp).toLocaleString());
    const values = rainData.map(entry => entry.volume);

    const ctx = document.getElementById("dynamicChart").getContext("2d");

    if (window.dynamicChartInstance) {
        window.dynamicChartInstance.destroy();
    }

    window.dynamicChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: `Rainfall Data for ${selectedTributary}`,
                data: values,
                borderColor: "rgb(45, 139, 186)",
                backgroundColor: "rgba(108, 229, 232,0.2)",
                fill: true,
                tension: 0.4, // Adjust tension for curve
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: "Timestamp", font: {weight: "bold", size: 14} } },
                y: { title: { display: true, text: "Rainfall (mm)", font: {weight: "bold", size: 14} } }
            }
        }
    });
}




function removeLoader(){
    $('#loaderWrapper').css('display','none')
}





function formatDateTime(date) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    let year = date.getFullYear();
    let month = months[date.getMonth()];
    let day = date.getDate();

    let hours = date.getHours();
    let minutes = String(date.getMinutes()).padStart(2, '0');

    let amPm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert to 12-hour format

    return {
        date: `${month} ${day}, ${year}`,
        time: `${hours}:${minutes} ${amPm}`
    };
}

document.addEventListener("DOMContentLoaded", function () {

    fetch("/public/php/accuweather_api.php")
        .then(response => response.json()) // Convert to JSON
        .then(data => {
            let dataList = document.getElementById("dataList");
            dataList.innerHTML = ""; // Clear previous content

            Object.keys(data).forEach(location => {
                let weather = data[location];
                let listItem = document.createElement("li");

                if (weather.error) {
                    listItem.textContent = `${location}: ERROR - ${weather.error}`;
                } else {
                    listItem.innerHTML = `
                    <b>${location}:</b><br>
                    Temperature: ${weather.temperature}<br>
                    Wind Speed: ${weather.wind_speed !== "N/A" ? weather.wind_speed : "No data"} 
                    (${weather.wind_direction !== "N/A" ? weather.wind_direction : "No direction"})<br>
                    Weather: ${weather.weather_text}
                `;
                }

                dataList.appendChild(listItem);
            });
        })
        .catch(error => console.error("Error fetching weather data:", error));
});


$(document).ready(function () {
    // Fetch user data
    $.ajax({
        url: './php/userdata.php',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (!response.error) {
                if(response.username === "MATAASNAKAHOY") {
                    document.getElementById("userDropdown").style.fontSize = "1.3rem";
                }
                $("#userDropdown").text(response.username);
            } else {
                $("#userDropdown").text("Guest");
            }
        },
        error: function () {
            $("#userDropdown").text("Error fetching user");
        }
    });

    // Toggle dropdown on click
    $("#userDropdown").click(function () {
        $(".dropdown-content").toggle();
    });

    // Close dropdown when clicking outside
    $(document).click(function (event) {
        if (!$(event.target).closest(".dropdown").length) {
            $(".dropdown-content").hide();
        }
    });

    $(document).ready(function () {
        // Ensure dropdown is hidden on page load
        $(".dropdown-content").hide(); 
        // Close dropdown when clicking outside
        $(document).on("click", function (event) {
            if (!$(event.target).closest(".dropdown").length) {
                $(".dropdown-content").slideUp(200); // Smoothly hide
            }
        });
    });
});


////////////////hide/show tributary markers//////////////////////
// Listen for changes in the tributary dropdown
const tributarySelect = document.getElementById("forecast_tributary_select");

tributarySelect.addEventListener("change", function() {
    const selectedTributary = tributarySelect.value;
    console.log("Selected Tributary: ", selectedTributary);

    // Send the selected tributary name to map.js via postMessage
    const mapIframe = document.querySelector('.iframe');
    if (mapIframe && mapIframe.contentWindow) {
        mapIframe.contentWindow.postMessage({
            type: "showSelectedTributary",
            tributaryName: selectedTributary
        }, '*');
    }
}); 


// Run the function when the page loads
document.addEventListener("DOMContentLoaded", fetchAllRainfallData);





