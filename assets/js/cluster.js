    const map = L.map("map").setView([22.9734, 78.6569], 5); // Center of India
    const stoppages = JSON.parse(localStorage.getItem("tripStoppages") || "[]");
    const stopButtonContainer = document.getElementById("stoppage-buttons");
    const hotelListContainer = document.getElementById("hotel-list");
    let currentStopIndex = null; // stores the selected stop


    // console.log("Stoppages from localStorage:", stoppages);
    

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Draw stoppages
    stoppages.forEach((stop, index) => {

        L.circle([stop.lat, stop.lng], {
            color: " #264469",
            fillColor: " #3F72AF",
            fillOpacity: 0.3,
            radius: 120000,
        }).addTo(map);

        // 📍 Use emoji icon for stoppage marker
        const stoppageIcon = L.divIcon({
            html: `<div style="font-size: 40px; height: 100px; display: flex; align-items: flex-end;">📍</div>`,
            className: '',
            iconSize: [30, 100],       // width: 30, height: 70
            iconAnchor: [25, 90]      // horizontally centered, anchored at the bottom
        });

        L.marker([stop.lat, stop.lng], { icon: stoppageIcon })
        .addTo(map)
        .bindPopup(stop.name || `Stop ${index + 1}`);

        if (typeof hotels !== "undefined") {
            hotels.forEach(hotel => {
                // 💥 Skip if latitude or longitude is null or not a number
                if (!hotel.latitude || !hotel.longitude) return;

                let isInsideAny = stoppages.some(stop => {
                const distance = map.distance(
                    [hotel.latitude, hotel.longitude],
                    [stop.lat, stop.lng]
                );
                return distance <= 120000;
                });

                if (isInsideAny) {
                const hotelIcon = L.divIcon({
                    className: "custom-hotel-icon",
                    html: "🏨",
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                });

                L.marker([hotel.latitude, hotel.longitude], { icon: hotelIcon })
                    .addTo(map)
                    .bindPopup(`<b>${hotel.property_name}</b><br>${hotel.city}, ${hotel.state}<br>Price: ₹${hotel.price}<br><a href="${hotel.link}" target="_blank">View on Map</a>`);
                }
            });
        } else {
            console.warn("Hotels data is not available.");
        }

        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = stop.name || `Stop ${index + 1}`;
        
        btn.addEventListener("click", () => {
            currentStopIndex = index; // ✅ update current stop
            renderHotelsNearStop(currentStopIndex);
            document.querySelectorAll(".stop-buttons button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");  
            
            // Show the search section
            const searchSection = document.getElementById("searchSection");
            if (searchSection) {
                searchSection.style.display = "block";
            }

            // Show the feedback section
            const feedbackSection = document.getElementById("feedbackSection");
            if (feedbackSection) {
                feedbackSection.style.display = "block";
            }
        });
        stopButtonContainer.appendChild(btn);
    });

    // search in hotels.html
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


    function renderHotelsNearStop(stopIndex) {
        hotelListContainer.innerHTML = "";

        const stop = stoppages[stopIndex];
        const hotelsNearby = hotels.filter(h => h.latitude && h.longitude)
            .filter(hotel => {
                const dist = map.distance([hotel.latitude, hotel.longitude], [stop.lat, stop.lng]);
                return dist <= 120000;
            });

        const sortOrder = document.querySelector('input[name="sortOrderByPrice"]:checked')?.value || '';
        const sortOrderStar = document.querySelector('input[name="sortOrderByStar"]:checked')?.value || '';
        const sortOrderDistance = document.querySelector('input[name="sortOrderByDistance"]:checked')?.value || '';
        const selectedBrands = Array.from(document.querySelectorAll('.brand-filter:checked')).map(cb => cb.value.toLowerCase());
        const selectedRatings = Array.from(document.querySelectorAll('.customer-rating:checked')).map(cb => parseFloat(cb.value));
        const selectedBudgets = Array.from(document.querySelectorAll('.budget-filter:checked')).map(cb => cb.value);
        const priceRangeValue = parseInt(priceRange.value);

        let filtered = hotelsNearby.filter(hotel => {
            const star = getStarValue(hotel.hotel_star_rating);
            const price = parseInt(hotel.price);
            const name = hotel.property_name?.toLowerCase() || '';

            let matchesBudget = true;
            if (selectedBudgets.length > 0) {
                const hasE = selectedBudgets.includes("Economical");
                const hasS = selectedBudgets.includes("Standard");
                const hasP = selectedBudgets.includes("Premium");

                if (hasE && !hasS && !hasP) matchesBudget = price <= 3000;
                else if (!hasE && hasS && !hasP) matchesBudget = price > 3000 && price <= 7000;
                else if (!hasE && !hasS && hasP) matchesBudget = price > 7000;
                else if (!hasE && hasS && hasP) matchesBudget = price > 3000;
                else if (hasE && hasS && !hasP) matchesBudget = price <= 7000;
                else if (hasE && !hasS && hasP) matchesBudget = price <= 3000 || price > 7000;
            }

            const withinPrice = selectedBudgets.length === 0 ? !isNaN(price) && price <= priceRangeValue : true;
            const matchesBrand = selectedBrands.length === 0 || selectedBrands.some(brand => name.includes(brand));
            const matchesCustomerRating = selectedRatings.length === 0 || selectedRatings.some(min => star >= min);

            return matchesBudget && matchesBrand && matchesCustomerRating && withinPrice;
        });

        // Sort by price
        if (sortOrder === 'low-to-high') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortOrder === 'high-to-low') {
            filtered.sort((a, b) => b.price - a.price);
        }

        // Sort by star rating
        if (sortOrderStar === 'low-to-high') {
            filtered.sort((a, b) => getStarValue(a.hotel_star_rating) - getStarValue(b.hotel_star_rating));
        } else if (sortOrderStar === 'high-to-low') {
            filtered.sort((a, b) => getStarValue(b.hotel_star_rating) - getStarValue(a.hotel_star_rating));
        }

        // Sort by distance
        if (sortOrderDistance === 'low-to-high') {
            filtered.sort((a, b) => {
                const distA = map.distance([a.latitude, a.longitude], [stop.lat, stop.lng]);
                const distB = map.distance([b.latitude, b.longitude], [stop.lat, stop.lng]);
                return distA - distB;
            });
        } else if (sortOrderDistance === 'high-to-low') {
            filtered.sort((a, b) => {
                const distA = map.distance([a.latitude, a.longitude], [stop.lat, stop.lng]);
                const distB = map.distance([b.latitude, b.longitude], [stop.lat, stop.lng]);
                return distB - distA;
            });
        }

        if (filtered.length === 0) {
            hotelListContainer.innerHTML = `<p style="text-align: center;">No hotels found near ${stop.name} with selected filters.</p>`;
            return;
        }

        filtered.forEach(hotel => {
            const card = document.createElement('div');
            card.className = 'card';
            const randomImage = Math.floor(Math.random() * 17) + 1;
            const distance = map.distance([hotel.latitude, hotel.longitude], [stop.lat, stop.lng]) / 1000;
            const formattedDistance = distance.toFixed(1);

            card.innerHTML = `
                <div class="image-placeholder">
                    <img src="./assets/images/hotel-img/${randomImage}.jpg" alt="Hotel Image" class="img-fit" />
                </div>
                <div class="details">
                    <div class="property-name">${hotel.property_name}</div>
                    <div class="location">${hotel.city || ''}, ${hotel.state || ''}</div>
                    <div class="location">${hotel.area || ''}</div>
                    <div class="price">₹${hotel.price || 'Not available'}</div>
                    <div class="rating">${hotel.hotel_star_rating || 'No rating'}</div>
                    
                    <div class="distance">${formattedDistance} km from ${stop.name || `Stop ${stopIndex + 1}`}</div>
                    
                    <a class="map-link" href="${hotel.link}" target="_blank">View on Map &rarr;</a>
                </div>`;

            hotelListContainer.appendChild(card);
        });
    }

    function applyFilters() {
        if (currentStopIndex !== null) {
            renderHotelsNearStop(currentStopIndex);
        }
    }

    function getStarValue(ratingStr) {
        const match = ratingStr?.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : 0;
    }

    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');

    priceRange.addEventListener("input", () => {
        priceValue.textContent = priceRange.value;
        applyFilters();
    });

    document.querySelectorAll('.brand-filter, .budget-filter, .customer-rating').forEach(cb =>
    cb.addEventListener('change', applyFilters)
    );

    document.addEventListener("DOMContentLoaded", () => {
        const inputFromStorage = localStorage.getItem('searchInputValue');
        if (inputFromStorage) {
            document.getElementById('searchInput').value = inputFromStorage;
            applyFilters();
        } else {
            renderHotels(hotelsList);
        }
    });


    function toggleFilters() {
        document.getElementById('filterSidebar').classList.toggle('active');
    }

    function toggleFilter() {
        const content = document.getElementById('filterContent');
        const arrow = document.getElementById('arrow');
        content.classList.toggle('active');
        arrow.innerHTML = content.classList.contains('active') ? '&#9650;' : '&#9660;';
    }

    function toggleFilterCustomer() {
        const customer_content = document.getElementById('customer-filter-content');
        const arrowCustomer = document.getElementById('arrowCustomer');
        customer_content.classList.toggle('active');
        arrowCustomer.innerHTML = customer_content.classList.contains('active') ? '&#9650;' : '&#9660;';
    }

    function budgetToggleFilter(){
        const budget_content = document.getElementById('budgetFilterContent');
        const arrowBudget = document.getElementById('arrowBudget');
        budget_content.classList.toggle('active');
        arrowBudget.innerHTML = budget_content.classList.contains('active') ? '&#9650;' : '&#9660;';
    }

    function toggleMoreBrands() {
        const extraBrands = document.querySelector('.extra-brands');
        const toggleBtn = document.querySelector('.more-link');

        if (extraBrands.classList.contains('hidden')) {
            extraBrands.classList.remove('hidden');
            toggleBtn.textContent = 'Show less';
        } else {
            extraBrands.classList.add('hidden');
            toggleBtn.textContent = '12 MORE';
        }
    }

    document.getElementById('clearAll').style.display = 'none';
    function handleSelection() {
        const checkboxes = document.querySelectorAll('#filterContent input[type="checkbox"]');
        const clearAll = document.getElementById('clearAll');
        const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
        clearAll.style.display = anyChecked ? 'block' : 'none';
        checkAnyFilterActive();
    }
    function clearFilters() {
        const checkboxesFilter = document.querySelectorAll('#filterContent input[type="checkbox"]');
        checkboxesFilter.forEach(cb => cb.checked = false);
        document.getElementById('clearAll').style.display = 'none';
        applyFilters();
        checkAnyFilterActive();
    }

    document.getElementById('customerClearAll').style.display = 'none';
    function customerHandleSelection() {
        const customerCheckboxes = document.querySelectorAll('#customer-filter-content input[type="checkbox"]');
        const customerClearAll = document.getElementById('customerClearAll');
        const customerAnyChecked = Array.from(customerCheckboxes).some(cb => cb.checked);
        customerClearAll.style.display = customerAnyChecked ? 'block' : 'none';
        checkAnyFilterActive();
    }
    function customerClearFilters() {
        const customerCheckboxesFilter = document.querySelectorAll('#customer-filter-content input[type="checkbox"]');
        customerCheckboxesFilter.forEach(cb => cb.checked = false);
        document.getElementById('customerClearAll').style.display = 'none';
        applyFilters();
        checkAnyFilterActive();
    }

    priceRange.addEventListener("input", () => {
        priceValue.textContent = priceRange.value;
        // Clear budget checkboxes if price is changed
        const budgetCheckboxes = document.querySelectorAll('.budget-filter');
        budgetCheckboxes.forEach(cb => cb.checked = false);
        // Hide "Clear All"
        document.getElementById('budgetClearAll').style.display = 'none';
        applyFilters();
        checkAnyFilterActive();
    });

    document.getElementById('budgetClearAll').style.display = 'none';
    function budgetHandleSelection() {
        const budgetCheckboxes = document.querySelectorAll('.budget-filter');
        const selected = Array.from(budgetCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const budgetClearAll = document.getElementById('budgetClearAll');
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        const priceRangeClearAll = document.getElementById('priceRangeClearAll');

        // Show/Hide Budget Clear All
        budgetClearAll.style.display = selected.length > 0 ? 'block' : 'none';

        if (selected.length === 0) {
            priceRange.value = priceRange.max;
            priceValue.textContent = priceRange.max;
            priceRangeClearAll.style.display = 'none'; // hide price clear
            applyFilters();
            return;
        }

        // Sync price range based on selected budgets
        let min = 16000;
        let max = 800;

        if (selected.includes("Economical")) {
            min = Math.min(min, 800);
            max = Math.max(max, 3000);
        }
        if (selected.includes("Standard")) {
            min = Math.min(min, 3001);
            max = Math.max(max, 7000);
        }
        if (selected.includes("Premium")) {
            min = Math.min(min, 7001);
            max = Math.max(max, parseInt(priceRange.max));
        }

        // Set price range
        priceRange.value = max;
        priceValue.textContent = max;

        // 👇 Show price clear-all only if it's NOT already at max (16000)
        priceRangeClearAll.style.display = (parseInt(priceRange.value) < parseInt(priceRange.max)) ? 'block' : 'none';
        applyFilters();
        checkAnyFilterActive();
    }
    function budgetClearFilters() {
        const budgetCheckboxesFilter = document.querySelectorAll('#budgetFilterContent input[type="checkbox"]');
        budgetCheckboxesFilter.forEach(cb => cb.checked = false);
        // Reset price range to full range (max)
        const priceRangeClear = document.getElementById('priceRange');
        const priceValueClear = document.getElementById('priceValue');
        const priceRangeClearAll = document.getElementById('priceRangeClearAll');

        priceRangeClear.value = priceRangeClear.max;  // set to 16000
        priceValueClear.textContent = priceRangeClear.max;

        // Hide both budget and price clear buttons
        document.getElementById('budgetClearAll').style.display = 'none';
        priceRangeClearAll.style.display = 'none'; // ✅ this was missing

        applyFilters();
        checkAnyFilterActive();
    }

    document.getElementById('sortByPriceClearAll').style.display = 'none';
    function sortByPriceHandleSelection() {
        const sortByStarRadiosClear = document.querySelectorAll('#sortByStarFilterContent input[type="radio"]');
        sortByStarRadiosClear.forEach(rb => rb.checked = false);
        document.getElementById('sortByStarClearAll').style.display = 'none';

        const sortByDistanceRadiosClear = document.querySelectorAll('#sortByDistanceFilterContent input[type="radio"]');
        sortByDistanceRadiosClear.forEach(rb => rb.checked = false);
        document.getElementById('sortByDistanceClearAll').style.display = 'none';

        const sortByPriceRadios = document.querySelectorAll('#sortByPriceFilterContent input[type="radio"]');
        const sortByPriceClearAll = document.getElementById('sortByPriceClearAll');
        const sortByPriceAnySelected = Array.from(sortByPriceRadios).some(rb => rb.checked);
        sortByPriceClearAll.style.display = sortByPriceAnySelected ? 'block' : 'none';
        applyFilters(); // also apply filter immediately on selection
        checkAnyFilterActive();
    }
    function sortByPriceFilters() {
        const sortByPriceRadios = document.querySelectorAll('#sortByPriceFilterContent input[type="radio"]');
        sortByPriceRadios.forEach(rb => rb.checked = false);
        document.getElementById('sortByPriceClearAll').style.display = 'none';
        applyFilters();
        checkAnyFilterActive();
    }

    document.getElementById('sortByStarClearAll').style.display = 'none';
    function sortByStarHandleSelection() {
        const sortByPriceRadiosClear = document.querySelectorAll('#sortByPriceFilterContent input[type="radio"]');
        sortByPriceRadiosClear.forEach(rb => rb.checked = false);
        document.getElementById('sortByPriceClearAll').style.display = 'none';

        const sortByDistanceRadiosClear = document.querySelectorAll('#sortByDistanceFilterContent input[type="radio"]');
        sortByDistanceRadiosClear.forEach(rb => rb.checked = false);
        document.getElementById('sortByDistanceClearAll').style.display = 'none';

        const sortByStarRadios = document.querySelectorAll('#sortByStarFilterContent input[type="radio"]');
        const sortByStarClearAll = document.getElementById('sortByStarClearAll');
        const sortByStarAnySelected = Array.from(sortByStarRadios).some(rb => rb.checked);
        sortByStarClearAll.style.display = sortByStarAnySelected ? 'block' : 'none';
        applyFilters(); // also apply filter immediately on selection
        checkAnyFilterActive();
    }
    function sortByStarFilters() {
        const sortByStarRadios = document.querySelectorAll('#sortByStarFilterContent input[type="radio"]');
        sortByStarRadios.forEach(rb => rb.checked = false);
        document.getElementById('sortByStarClearAll').style.display = 'none';
        applyFilters();
        checkAnyFilterActive();
    }

    document.getElementById('sortByDistanceClearAll').style.display = 'none';
    function sortByDistanceHandleSelection() {
        const sortByPriceRadiosClear = document.querySelectorAll('#sortByPriceFilterContent input[type="radio"]');
        sortByPriceRadiosClear.forEach(rb => rb.checked = false);
        document.getElementById('sortByPriceClearAll').style.display = 'none';

        const sortByStarRadiosClear = document.querySelectorAll('#sortByStarFilterContent input[type="radio"]');
        sortByStarRadiosClear.forEach(rb => rb.checked = false);
        document.getElementById('sortByStarClearAll').style.display = 'none';

        const sortByDistanceRadios = document.querySelectorAll('#sortByDistanceFilterContent input[type="radio"]');
        const sortByDistanceClearAll = document.getElementById('sortByDistanceClearAll');
        const sortByDistanceAnySelected = Array.from(sortByDistanceRadios).some(rb => rb.checked);
        sortByDistanceClearAll.style.display = sortByDistanceAnySelected ? 'block' : 'none';
        applyFilters(); // also apply filter immediately on selection
        checkAnyFilterActive();
    }
    function sortByDistanceFilters() {
        const sortByDistanceRadios = document.querySelectorAll('#sortByDistanceFilterContent input[type="radio"]');
        sortByDistanceRadios.forEach(rb => rb.checked = false);
        document.getElementById('sortByDistanceClearAll').style.display = 'none';
        applyFilters();
        checkAnyFilterActive();
    }

    document.getElementById('priceRangeClearAll').style.display = 'none';
    function priceRangeClearFilters() {
        const priceRangeClear = document.getElementById('priceRange');
        const priceValueClear = document.getElementById('priceValue');
        const priceRangeClearAll = document.getElementById('priceRangeClearAll');
        // Reset price range to max
        priceRangeClear.value = priceRangeClear.max;
        priceValueClear.textContent = priceRangeClear.max;
        // Clear all budget checkboxes
        const budgetCheckboxes = document.querySelectorAll('#budgetFilterContent input[type="checkbox"]');
        budgetCheckboxes.forEach(cb => cb.checked = false);
        // Hide both clear buttons
        priceRangeClearAll.style.display = 'none';
        document.getElementById('budgetClearAll').style.display = 'none';

        applyFilters(); // Reapply with default filters
        checkAnyFilterActive();
    }
    document.getElementById('priceRange').addEventListener('input', () => {
        const priceRangeClear = document.getElementById('priceRange');
        const priceRangeClearAll = document.getElementById('priceRangeClearAll');

        if (parseInt(priceRangeClear.value) < parseInt(priceRangeClear.max)) {
            priceRangeClearAll.style.display = 'block';
        } else {
            priceRangeClearAll.style.display = 'none';
        }

        checkAnyFilterActive();
    });

    document.getElementById('totalClearAll').style.display = 'none';
    function totalClearFilters() {
        // 🔹 Reset Budget Filters
        const budgetCheckboxes = document.querySelectorAll('#budgetFilterContent input[type="checkbox"]');
        budgetCheckboxes.forEach(cb => cb.checked = false);
        document.getElementById('budgetClearAll').style.display = 'none';

        // 🔹 Reset Price Range
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        priceRange.value = priceRange.max;
        priceValue.textContent = priceRange.max;
        document.getElementById('priceRangeClearAll').style.display = 'none';

        // 🔹 Reset Sort by Price
        const sortByPriceRadios = document.querySelectorAll('#sortByPriceFilterContent input[type="radio"]');
        sortByPriceRadios.forEach(rb => rb.checked = false);
        document.getElementById('sortByPriceClearAll').style.display = 'none';

        // 🔹 Reset Sort by Star
        const sortByStarRadios = document.querySelectorAll('#sortByStarFilterContent input[type="radio"]');
        sortByStarRadios.forEach(rb => rb.checked = false);
        document.getElementById('sortByStarClearAll').style.display = 'none';

        // 🔹 Reset Sort by Distance
        const sortByDistanceRadios = document.querySelectorAll('#sortByDistanceFilterContent input[type="radio"]');
        sortByDistanceRadios.forEach(rb => rb.checked = false);
        document.getElementById('sortByDistanceClearAll').style.display = 'none';

        // 🔹 Reset General Filters
        const generalCheckboxes = document.querySelectorAll('#filterContent input[type="checkbox"]');
        generalCheckboxes.forEach(cb => cb.checked = false);
        document.getElementById('clearAll').style.display = 'none';

        // 🔹 Reset Customer Filters
        const customerCheckboxes = document.querySelectorAll('#customer-filter-content input[type="checkbox"]');
        customerCheckboxes.forEach(cb => cb.checked = false);
        document.getElementById('customerClearAll').style.display = 'none';

        document.getElementById('totalClearAll').style.display = 'none';

        // 🔹 Reapply Filters
        applyFilters();
    }
    function checkAnyFilterActive() {
        const isAnyBudgetChecked = Array.from(document.querySelectorAll('#budgetFilterContent input[type="checkbox"]')).some(cb => cb.checked);
        const isAnyGeneralChecked = Array.from(document.querySelectorAll('#filterContent input[type="checkbox"]')).some(cb => cb.checked);
        const isAnyCustomerChecked = Array.from(document.querySelectorAll('#customer-filter-content input[type="checkbox"]')).some(cb => cb.checked);
        const isAnySortByPrice = Array.from(document.querySelectorAll('#sortByPriceFilterContent input[type="radio"]')).some(rb => rb.checked);
        const isAnySortByStar = Array.from(document.querySelectorAll('#sortByStarFilterContent input[type="radio"]')).some(rb => rb.checked);
        const isAnyDistanceByStar = Array.from(document.querySelectorAll('#sortByDistanceFilterContent input[type="radio"]')).some(rb => rb.checked);
        const isPriceRangeChanged = parseInt(document.getElementById('priceRange').value) < parseInt(document.getElementById('priceRange').max);

        const totalClearAll = document.getElementById('totalClearAll');
        totalClearAll.style.display = (
            isAnyBudgetChecked ||
            isAnyGeneralChecked ||
            isAnyCustomerChecked ||
            isAnySortByPrice ||
            isAnySortByStar ||
            isAnyDistanceByStar ||
            isPriceRangeChanged
        ) ? 'block' : 'none';
    }


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