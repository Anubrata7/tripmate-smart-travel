  // Read trip details from URL query parameters
  function getQueryParams() {
    const params = {};
    location.search.substring(1).split("&").forEach(pair => {
      const [key, value] = pair.split("=");
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });
    return params;
  }

  const params = getQueryParams();  
  const source = params.source || "";
  const destination = params.destination || "";
  const vehicle = params.vehicle || "car";
  const budget = Number(params.budget) || 2000;
  const stoppageDistance = Number(params.stoppageDistance) || 350;
  const startDate = params.startDate || "";

  let currentDate = new Date(startDate);

  if (!source || !destination) {
    document.getElementById("result").innerText = "Source or destination missing.";
  }

  const map = L.map("map").setView([20.5937, 78.9629], 5); // Center India

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  let control = null;
  let stoppageMarkers = [];

  function geocode(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    return fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
          };
        }
        return null;
      })
      .catch(() => null);
  }

  function getPointAtDistance(polyline, distance) {
    if (!polyline || polyline.getLatLngs().length === 0) return null;
    const latlngs = polyline.getLatLngs();

    let travelled = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      const segmentDistance = latlngs[i].distanceTo(latlngs[i + 1]);
      if (travelled + segmentDistance >= distance) {
        const overshoot = distance - travelled;
        const ratio = overshoot / segmentDistance;

        const lat = latlngs[i].lat + (latlngs[i + 1].lat - latlngs[i].lat) * ratio;
        const lng = latlngs[i].lng + (latlngs[i + 1].lng - latlngs[i].lng) * ratio;
        return L.latLng(lat, lng);
      }
      travelled += segmentDistance;
    }
    return null;
  }

  const startIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width:30px; height:40px; fill: #264469;"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>`,
    className: '',    
    iconSize: [30, 40],
    iconAnchor: [15, 40] 
  });  

  const endIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width:30px; height:40px; fill: #264469;"> <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>`,
    className: '',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -30]
  });

  const stoppageIcon = L.divIcon({
    html: `<div style="font-size: 30px; line-height: 1;">📍</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [20, 30]
  });


const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const issueContainer = document.getElementById('issueContainer');
  const yesFeedback = document.getElementById('yesFeedback');
  const closeBtn = document.getElementById('close-btn');

  let yesRating = 0;
  let noRating = 0;

  yesBtn.addEventListener('click', () => {
    if (yesBtn.classList.contains('active')) {
      closeFeedbackForm();
    } else {
      yesBtn.classList.add('active');
      noBtn.classList.remove('active');
      yesFeedback.style.display = 'block';
      issueContainer.style.display = 'none';
      closeBtn.style.display = 'block';
    }
  });

  noBtn.addEventListener('click', () => {
    if (noBtn.classList.contains('active')) {
      closeFeedbackForm();
    } else {
      noBtn.classList.add('active');
      yesBtn.classList.remove('active');
      issueContainer.style.display = 'block';
      yesFeedback.style.display = 'none';
      closeBtn.style.display = 'block';
    }
  });

  function setupStarRating(containerId, setRatingCallback, getRatingCallback) {
    const stars = document.querySelectorAll(`#${containerId} .star`);
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        if (getRatingCallback() === index + 1) {
          setRatingCallback(0);
          stars.forEach((s) => s.classList.remove('selected'));
        } else {
          setRatingCallback(index + 1);
          stars.forEach((s, i) => {
            s.classList.toggle('selected', i <= index);
          });
        }
      });
    });
  }

  setupStarRating('yesStars', (rating) => { yesRating = rating; }, () => yesRating);
  setupStarRating('noStars', (rating) => { noRating = rating; }, () => noRating);

async function submitYesFeedback() {
  const feedback = document.getElementById('yesFeedbackText').value;
  if (yesRating === 0 || feedback.trim() === '') {
    alert('Please give a star rating and feedback before submitting.');
    return;
  }

  const feedbackData = {
    rating: yesRating,
    issue: 'Yes feedback', // Or you can leave it as null / empty string
    others: '',
    feedback: feedback
  };

  try {
    const res = await fetch('http://localhost:3000/api/save-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });

    const result = await res.json();
    alert(result.message || 'Feedback submitted!');

    // Clear the form
    document.getElementById('yesFeedbackText').value = '';
    yesRating = 0;
    document.querySelectorAll('#yesStars .star').forEach(star => star.classList.remove('selected'));
    closeFeedbackForm();

  } catch (err) {
    console.error(err);
    alert('Failed to submit feedback.');
  }
}


async function submitFeedback() {
  const issue = document.getElementById('issueSelect').value;
  const feedback = document.getElementById('feedbackText').value.trim();
  const othersOption = document.getElementById('othersOptionText')?.querySelector('input')?.value.trim() || '';

  // Basic validation
  if (noRating === 0 || issue === '' || feedback === '') {
    alert('Please fill in all required fields before submitting.');
    return;
  }

  // If "Others" selected, ensure the custom input is filled
  if (issue === 'Others' && othersOption === '') {
    alert('Please enter your problem title.');
    return;
  }

  const feedbackData = {
    rating: noRating,
    issue: issue,
    others: othersOption,
    feedback: feedback
  };

  try {
    const res = await fetch('http://localhost:3000/api/save-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });

    const result = await res.json();
    alert(result.message || 'Feedback submitted!');

    // Clear the form
    document.getElementById('feedbackText').value = '';
    document.getElementById('issueSelect').value = '';
    document.getElementById('othersOptionText').innerHTML = '';
    noRating = 0;
    document.querySelectorAll('#noStars .star').forEach(star => star.classList.remove('selected'));
    closeFeedbackForm();

  } catch (err) {
    console.error(err);
    alert('Failed to submit feedback.');
  }
}



  function handleIssueSelectChange() {
    const select = document.getElementById('issueSelect');
    const othersOptionText = document.getElementById('othersOptionText');
    if (select.value === 'Others') {
      othersOptionText.innerHTML = `<input type="text" placeholder="Please enter your problem title" class="others-input" />`;
    } else {
      othersOptionText.innerHTML = '';
    }
  }

  function closeFeedbackForm() {
    issueContainer.style.display = 'none';
    yesFeedback.style.display = 'none';
    yesBtn.classList.remove('active');
    noBtn.classList.remove('active');
    closeBtn.style.display = 'none';
  }


  Promise.all([geocode(source), geocode(destination)]).then(([start, end]) => {
    if (!start || !end) {
      document.getElementById("result").innerText = "Could not find one or both locations.";
      return;
    }

    L.marker([start.lat, start.lon], { icon: startIcon })
      .addTo(map)
      .bindPopup(`${source}`);

    L.marker([end.lat, end.lon], { icon: endIcon })
      .addTo(map)
      .bindPopup(`${destination}`);

    control = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lon), L.latLng(end.lat, end.lon)],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: "#3F72AF", opacity: 1, weight: 4 }]
      },
      createMarker: function () {
        return null; // Prevent default start/end markers from rendering
      }
    }).addTo(map);

    control.on('routesfound', function(e) {
      const routes = e.routes;
      if (routes.length > 0) {
        const distanceMeters = routes[0].summary.totalDistance;
        const distanceKm = distanceMeters / 1000;

        const mileage = vehicle === "car" ? 15 : 30;
        
        const numStops = Math.floor(distanceKm / stoppageDistance);
        
          
        const cost = (distanceKm / mileage) * 100 + (budget * numStops);

        let stoppageText = "";
        let stoppagePromises = [];

        const collectedWeatherDescriptions = [];
        if (numStops > 0) {
          stoppageText = `<p><span>Stoppages every ${stoppageDistance} km:</span><p>`;
          const line = L.polyline(routes[0].coordinates);

          const apiKey = "1894accea497bf9b8a66a0573d999cc7"; // 🟢 Your actual OpenWeatherMap API key
          for (let i = 1; i <= numStops; i++) {
            const distAlong = i * stoppageDistance * 1000;
            const latlng = getPointAtDistance(line, distAlong);

            if (latlng) {
              // 🟢 Define an async function to handle this stoppage
              const stopPromise = (async () => {
                const stopNum = i;
                const latitude = latlng.lat;
                const longitude = latlng.lng;
                let name = "Unknown location";
                let temperature = "N/A";
                let weatherDescription = "unknown weather";

                // 1️⃣ Get location name
                try {
                  const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
                  const response = await fetch(reverseUrl);
                  const data = await response.json();
                  name = data.address?.city || data.address?.town || data.address?.village || data.display_name || "Unknown location";
                  stoppageText += `<p class="stops"><span>• Stop ${stopNum}:</span> ${name} (~${stopNum * stoppageDistance} km)</p>`;
                } catch (error) {
                  stoppageText += `<p class="stops"><span>• Stop ${stopNum}:</span> Location unknown (~${stopNum * stoppageDistance} km)</p>`;
                }

                // 2️⃣ Get weather data
                try {
                  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
                  const response = await fetch(url);
                  const weatherData = await response.json();
                  temperature = weatherData.main.temp;
                  weatherDescription = weatherData.weather[0].description;
                } catch (error) {
                  console.error(`Error fetching weather at Stop ${stopNum}:`, error);
                }

                // 🟡 Save weather description
                collectedWeatherDescriptions.push(weatherDescription);

                // 3️⃣ Create marker
                const marker = L.marker(latlng, { icon: stoppageIcon })
                  .addTo(map)
                  .bindPopup(`${name} (${weatherDescription}, ${temperature}°C)`);
                stoppageMarkers.push(marker);

                // 4️⃣ Show stop info in HTML
                const dateStr = currentDate.toISOString().split('T')[0];
                const infoDiv = document.getElementById("weather-info");
                const stopWeather = document.createElement("div");
                stopWeather.innerHTML = `
                  <div>
                    <p class="stopnum"><strong>Stop ${stopNum}</strong></p>
                    <p><span>Date:</span> ${dateStr}</p>
                    <p><span>Location:</span> ${name}</p>
                    <p><span>Lattitude:</span> ${latitude},<br> <span>Longitude:</span> ${longitude}</p>
                    <p><span>Temperature:</span> ${temperature} °C</p>
                    <p><span>Weather:</span> ${weatherDescription}</p>
                  </div>
                `;
                infoDiv.appendChild(stopWeather);

                // 5️⃣ Increment date
                currentDate.setDate(currentDate.getDate() + 1);
              })();

              // 🟢 Add this promise to stoppagePromises
              stoppagePromises.push(stopPromise);
            }
          }

          // Outside the loop - calculateTravelPreference function
          const weatherDescriptionScores = {
            "clear sky": 100, "storm": 40, "few clouds": 90, "scattered clouds": 85,
            "broken clouds": 80, "light rain": 70, "moderate rain": 60, "heavy intensity rain": 50,
            "very heavy rain": 40, "extreme rain": 30, "freezing rain": 30, "light snow": 70,
            "snow": 60, "heavy snow": 40, "sleet": 50, "shower sleet": 50,
            "thunderstorm with light rain": 40, "thunderstorm with rain": 30, "thunderstorm with heavy rain": 20,
            "thunderstorm with light drizzle": 40, "thunderstorm with drizzle": 30, "mist": 80,
            "smoke": 70, "haze": 70, "sand/ dust whirls": 60, "fog": 60, "sand": 50,
            "dust": 50, "volcanic ash": 30, "squalls": 20, "tornado": 10,
            "unknown weather": 50 // fallback
          };
          const defaultScore = 50;

          function calculateTravelPreference(weatherDescriptions) {
            const criticalConditions = ["tornado", "extreme rain", "thunderstorm with heavy rain", "squalls"];
            for (const desc of weatherDescriptions) {
              if (criticalConditions.includes(desc)) {
                return 20; // Critical conditions found!
              }
            }
            let totalScore = 0;
            for (const desc of weatherDescriptions) {
              const score = weatherDescriptionScores[desc] ?? defaultScore;
              totalScore += score;
            }
            return Math.round(totalScore / weatherDescriptions.length);
          }

          // console.log(calculateTravelPreference);

        } else {
          stoppageText = "<p>No stoppages required for this distance.</p>";
          document.getElementById("travel-score-text").style.display = "none";
          document.getElementById("weather-details").style.display = "none";
          document.getElementById("viewClusters").style.display = "none";
          document.getElementById("travel-score-bar-container").style.display = "none";
          document.getElementById("check-details-btn").style.display = "none";
        }

        Promise.all(stoppagePromises).then(() => {
          
          document.getElementById("result").innerHTML =
            `<p><span>Distance:</span> ${distanceKm.toFixed(2)} km \n <span>Estimated Trip Cost:</span> ₹${cost.toFixed(2)}
             <span>${stoppageText}</span></p>`;

          // Calculate preference
          const preference = calculateTravelPreference(collectedWeatherDescriptions);
          console.log(`Travel preference score: ${preference}%`);

          let scoreBar = document.getElementById("travel-score-bar");
          let scoreText = document.getElementById("travel-score-text");
          scoreBar.style.width = `${preference * 8}px`;
          if (preference < 30) {
            scoreBar.style.backgroundColor = "rgba(255, 0, 0, 1)";
            scoreText.innerHTML = `<p><span>Travel preference score:</span> ${preference}% - Not preferable to travel.</p>`;
            const scoreElements = document.getElementsByClassName("scorePercentageValue");
            if (scoreElements.length > 0) {
              scoreElements[0].style.color = "rgba(255, 0, 0, 1)";
            }
          } else if (preference <= 60) {
            scoreBar.style.backgroundColor = "rgba(255, 255, 0, 1)";
            scoreText.innerHTML = `<p><span>Travel preference score:</span> <span class="scorePercentageValue">${preference}%</span> - Go, but with caution.</p>`;
            const scoreElements = document.getElementsByClassName("scorePercentageValue");
            if (scoreElements.length > 0) {
              scoreElements[0].style.color = "rgba(255, 255, 0, 1)";
            }
          } else {
            scoreBar.style.backgroundColor = "rgba(0, 255, 0, 1)";
            scoreText.innerHTML = `<p><span>Travel preference score:</span> ${preference}% - Happy travel!</p>`;
            const scoreElements = document.getElementsByClassName("scorePercentageValue");
            if (scoreElements.length > 0) {
              scoreElements[0].style.color = "rgba(0, 255, 0, 1)";
            }
          }

          // document.getElementById("check-details-btn").addEventListener("click", () => {
            const weatherDetails = document.getElementById("weather-details");
            weatherDetails.style.display = "none";
            document.getElementById("check-details-btn").addEventListener("click", () => {
              weatherDetails.style.display = weatherDetails.style.display === "none" ? "block" : "none";
            });

          // Collect only lat/lng data of all stoppages
          const stoppageLatLngList = [];
          stoppageMarkers.forEach(marker => {
            const { lat, lng } = marker.getLatLng();
            const popupContent = marker.getPopup().getContent(); // e.g. "Stoppage 1<br>Kolkata"
            // const name = popupContent.split("<br>")[1]; // Extract "Kolkata"
            const popupLines = marker.getPopup().getContent().split("<br>");
            const name = popupLines.length > 1 ? popupLines[1] : popupLines[0]; // fallback
            stoppageLatLngList.push({ lat, lng, name });
          });
          // Save to localStorage so another page can access
          localStorage.setItem("tripStoppages", JSON.stringify(stoppageLatLngList));
          // Optional: redirect or allow user to click to go to second page
          document.getElementById("viewClusters").addEventListener("click", () => {
            window.location.href = "clusters.html"; // Your second page
          });
        });
      }
    });
  });

  

  