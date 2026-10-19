(() => {
  "use strict";

  const form = document.getElementById("sensor-form");
  const bayInput = document.getElementById("bay");
  const phInput = document.getElementById("ph");
  const ecInput = document.getElementById("ec");
  const temperatureInput = document.getElementById("temperature");
  const humidityInput = document.getElementById("humidity");

  const formError = document.getElementById("form-error");
  const formFeedback = document.getElementById("form-feedback");
  const storageFeedback = document.getElementById("storage-feedback");
  const logCount = document.getElementById("log-count");
  const emptyState = document.getElementById("empty-state");
  const logList = document.getElementById("log-list");
  const clearButton = document.getElementById("clear-logs");

  // The exact storage key required by the assignment.
  const STORAGE_KEY = "agrosens_telemetry_records_v1";

  // Physical bounds supported by the assignment.
  const LIMITS = {
    ph: { min: 0, max: 14 },
    ec: { min: 0 },
    humidity: { min: 0, max: 100 }
  };

  // Map each input to its associated error-message element.
  const errorElements = {
    ph: document.getElementById("ph-error"),
    ec: document.getElementById("ec-error"),
    temperature: document.getElementById("temperature-error"),
    humidity: document.getElementById("humidity-error")
  };

  const inputs = {
    ph: phInput,
    ec: ecInput,
    temperature: temperatureInput,
    humidity: humidityInput
  };

  function getFieldError(fieldName) {
    const input = inputs[fieldName];
    const rawValue = input.value.trim();

    if (rawValue === "") {
      return "This field is required.";
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      return "Enter a valid number.";
    }

    const limits = LIMITS[fieldName];

    if (limits && value < limits.min) {
      return `The value must be at least ${limits.min}.`;
    }

    if (limits && limits.max !== undefined && value > limits.max) {
      return `The value must be no greater than ${limits.max}.`;
    }

    return "";
  }

  function validateField(fieldName) {
    const input = inputs[fieldName];
    const errorElement = errorElements[fieldName];
    const errorMessage = getFieldError(fieldName);

    errorElement.textContent = errorMessage;
    errorElement.hidden = errorMessage === "";

    if (errorMessage) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }

    return errorMessage === "";
  }

  function validateForm() {
    let isValid = true;

    // Validate the selected greenhouse bay.
    if (bayInput.value === "") {
      isValid = false;
    }

    // Validate all four numerical measurements.
    for (const fieldName of Object.keys(inputs)) {
      if (!validateField(fieldName)) {
        isValid = false;
      }
    }

    return isValid;
  }

  // Validate measurements as the user types or changes them.
  for (const [fieldName, input] of Object.entries(inputs)) {
    input.addEventListener("input", () => {
      validateField(fieldName);
      formError.hidden = true;
      formFeedback.textContent = "";
    });

    input.addEventListener("change", () => {
      validateField(fieldName);
    });
  }

  bayInput.addEventListener("change", () => {
    formError.hidden = true;
    formFeedback.textContent = "";
  });

  function classifyReading(reading) {
    const { ph, ec, temperature, humidity } = reading;

    // All four metric groups must be critically outside
    // their limits for a Critical Hazard classification.
    const criticalPh = ph < 5.0 || ph > 7.5;
    const criticalTemperature =
      temperature < 55 || temperature > 95;
    const criticalEc = ec < 0.2 || ec > 4.5;
    const criticalHumidity = humidity < 30 || humidity > 90;

    if (
      criticalPh &&
      criticalTemperature &&
      criticalEc &&
      criticalHumidity
    ) {
      return "Critical Hazard";
    }

    // Every measurement must be inside its optimal range.
    const optimal =
      ph >= 5.5 && ph <= 6.5 &&
      temperature >= 64.4 && temperature <= 71.6 &&
      ec >= 1.0 && ec <= 2.0 &&
      humidity >= 50 && humidity <= 70;

    if (optimal) {
      return "Optimal";
    }

    // Everything else is a Warning.
    return "Warning";
  }

  function loadReadings() {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);

      if (savedData === null) {
        return [];
      }

      const parsedData = JSON.parse(savedData);

      if (!Array.isArray(parsedData)) {
        throw new Error("Saved log data is not a list.");
      }

      return parsedData;
    } catch (error) {
      console.error("Could not load saved readings:", error);
      storageFeedback.textContent =
        "Saved readings could not be loaded. Check the browser console.";
      return [];
    }
  }

  let readings = loadReadings();

  function saveReadings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
      storageFeedback.textContent = "Readings saved in this browser.";
      return true;
    } catch (error) {
      console.error("Could not save readings:", error);
      storageFeedback.textContent =
        "Unable to save readings. Browser storage may be unavailable or full.";
      return false;
    }
  }

  function renderReadings() {
    // Remove the old display before building the updated one.
    logList.replaceChildren();

    logCount.textContent = `Recorded readings: ${readings.length}`;
    emptyState.hidden = readings.length !== 0;

    for (const reading of readings) {
      const item = document.createElement("li");

      // CSS uses these classes to distinguish classifications.
      if (reading.status === "Optimal") {
        item.classList.add("status-optimal");
      } else if (reading.status === "Warning") {
        item.classList.add("status-warning");
      } else if (reading.status === "Critical Hazard") {
        item.classList.add("status-critical");
      }

      const heading = document.createElement("h3");
      heading.textContent = `${reading.bay} — ${reading.status}`;
      item.appendChild(heading);

      const details = document.createElement("p");
      details.textContent =
        `pH: ${reading.ph} | EC: ${reading.ec} mS/cm | ` +
        `Temperature: ${reading.temperature} °F | ` +
        `Humidity: ${reading.humidity}%`;
      item.appendChild(details);

      const date = document.createElement("p");
      date.textContent =
        `Recorded: ${new Date(reading.timestamp).toLocaleString()}`;
      item.appendChild(date);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete Reading";
      deleteButton.setAttribute(
        "aria-label",
        `Delete reading from ${reading.bay}`
      );

      deleteButton.addEventListener("click", () => {
        deleteReading(reading.id);
      });

      item.appendChild(deleteButton);
      logList.appendChild(item);
    }
  }

  form.addEventListener("submit", (event) => {
    // Keep the browser from refreshing the page.
    event.preventDefault();

    formFeedback.textContent = "";
    formError.hidden = true;

    if (!validateForm()) {
      formError.textContent =
        "Please correct the highlighted fields before recording.";
      formError.hidden = false;
      formFeedback.textContent = "";

      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus();
      } else {
        bayInput.focus();
      }

      return;
    }

    // Convert the input strings into numerical values.
    const reading = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      bay: bayInput.value,
      ph: Number(phInput.value),
      ec: Number(ecInput.value),
      temperature: Number(temperatureInput.value),
      humidity: Number(humidityInput.value),
      timestamp: new Date().toISOString()
    };

    // Determine the reading's classification.
    reading.status = classifyReading(reading);

    // Add the newest reading to the beginning of the log.
    readings.unshift(reading);

    saveReadings();
    renderReadings();

    formFeedback.textContent =
      `Reading recorded for ${reading.bay}. Classification: ${reading.status}.`;

    // Reset the form for the next reading.
    form.reset();

    // Clear validation messages from the previous entry.
    for (const fieldName of Object.keys(inputs)) {
      validateField(fieldName);
    }

    formError.hidden = true;
  });

  function deleteReading(id) {
    readings = readings.filter((reading) => reading.id !== id);
    saveReadings();
    renderReadings();
    formFeedback.textContent = "Reading deleted.";
  }

  clearButton.addEventListener("click", () => {
    if (readings.length === 0) {
      formFeedback.textContent = "There are no readings to clear.";
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete all recorded readings?"
    );

    if (!confirmed) {
      return;
    }

    readings = [];
    saveReadings();
    renderReadings();

    formFeedback.textContent = "All readings have been cleared.";
  });

  renderReadings();
})();
