function getLocation() {
    if (!navigator.geolocation) {
      return alert("Geolocation is not supported by your browser.");
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          // call OSM Nominatim reverse-geocoding API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
            {
              headers: {
                // Required by Nominatim usage policy
                "User-Agent": "TripMate/1.0 (+https://yourdomain.com)",
                "Referer": "https://yourdomain.com"
              }
            }
          );
          if (!res.ok) throw new Error("Geocoding failed");

          const data = await res.json();
          // display_name is a full, comma-separated address
          const place = data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          document.getElementById("source").value = place;
        } catch (err) {
          console.error(err);
          alert("Could not determine your address; using coordinates instead.");
          document.getElementById("source").value = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        }
      },
      (err) => {
        console.warn(err);
        alert("Unable to fetch location.");
      }
    );
}
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

window.addEventListener("DOMContentLoaded", () => {
  const source = decodeURIComponent(getQueryParam("start") || "");
  const destination = decodeURIComponent(getQueryParam("end") || "");

  if (source) document.getElementById("source").value = source;
  if (destination) document.getElementById("destination").value = destination;
});
// Set minimum date as today
let minDate = "";
window.onload = function () {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const dd = String(today.getDate()).padStart(2, '0');

    minDate = `${yyyy}-${mm}-${dd}`;
    document.getElementById('start-date').setAttribute('min', minDate);
};
document.getElementById("route-optimize").addEventListener("click", async () => {
    const source = document.getElementById("source").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const budget = document.querySelector("input[name='budget']:checked")?.value || 2000;
    const vehicle = document.querySelector("input[name='transport']:checked")?.value || 15;
    const stoppageDistance = document.querySelector("input[name='time']:checked")?.value || 350;
    const startDate = document.getElementById("start-date").value || minDate;

    if (!source || !destination) {
        alert("Please enter both source and destination.");
        return;
    }

     // Encode data for URL
    const planningData = {
      source,
      destination,
      vehicle,
      budget,
      stoppageDistance,
      startDate
    };

    try {
      const res = await fetch('http://localhost:3000/api/save-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planningData)
      });

      const result = await res.json();
      console.log(result.message || 'Planning data saved!');
      // alert(result.message || 'Your planning data has been saved!');
    } catch (err) {
      console.error('Error saving planning data:', err);
      // alert('Could not save your planning data.');
    }
    
    // Encode data for URL for redirection
    const params = new URLSearchParams(planningData);

    // Open route.html with query parameters
    window.location.href = `route.html?${params.toString()}`;
});

// plan.html
function searchDestination() {
  const input = document.getElementById('searchInput').value.toLowerCase().trim();
  
  const matchedHotels = hotels.filter(hotel => {
    return hotel.city?.toLowerCase().includes(input) ||
           hotel.state?.toLowerCase().includes(input) ||
           hotel.property_name?.toLowerCase().includes(input) ||
           hotel.area?.toLowerCase().includes(input);
  });

  // Save filtered data and input to localStorage
  localStorage.setItem('searchResults', JSON.stringify(matchedHotels));
  localStorage.setItem('searchInputValue', input); // ✅ Save the typed destination

  // Redirect to hotels.html
  window.location.href = "hotels.html";
}

