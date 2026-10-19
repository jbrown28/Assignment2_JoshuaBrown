Section 4.1: The Less-than-equal-4-Click User Journey Funnel
•   Starting State: When the UI loads, the user will see the Greenhouse Sensor Logger interface, a sensor entry form, and a log history section.
•	Action 1: Data Entry & Real-Time Constraint Check: The user will choose a greenhouse bay and will enter the necessary information into labeled form fields. HTML input constraints and JavaScript event listeners will validate the entries and apply visual error feedback when a value exceeds its permitted range.
•	Action 2: Log Submission: After the user clicks the Record Reading button, JavaScript validates the form and rejects invalid entries. If the measurements are valid, the system creates a reading object, calculates its environmental status, adds the record to the log collection, and saves the updated collection to localStorage.
•	Action 3: Output Telemetry Inspection: After a successful submission, the log history updates to display the new sensor reading and its environmental status tag. The interface will distinguish the necessary information through visible status labels and appropriate styling.
•	Action 4: Output Resolution: The user can delete an individual reading using its Delete button or remove all readings using a Clear All Logs button. JavaScript updates the in-memory collection, refreshes the displayed log, and synchronizes the changes with localStorage.
•	Terminal State: The interface displays the current log history and status of each remaining reading. Any records deleted by the user are removed from both the interface and localStorage, so the resulting log state persists after a browser refresh.
Section 4.2: Don Norman Usability & Constraint Audit
•	Gulf of Execution: The form uses descriptive labels for pH, Electrical Conductivity (EC), Air Temperature, and Relative Humidity (RH), with the corresponding units displayed beside the field names. HTML label elements identify the purpose of each input, while placeholder attributes provide examples of expected values. Numeric input types and applicable constraints help users understand the required format before submitting a reading.
•	Gulf of Evaluation: After a valid reading is submitted, JavaScript evaluates the necessary information values using the specified classification logic. The result is displayed in the updated log as an explicit Optimal, Warning, or Critical Hazard label, with a corresponding CSS class and visual styling.
•	System Constraint: The pH field uses an HTML number input with min="0", max="14", step="0.1", and required attributes to enforce its specified physical bounds and input precision. JavaScript validates the form values before accepting a reading into application state. Equivalent input constraints should be defined for EC, temperature, and RH according to their specified units and applicable requirements. Environmental classification thresholds are applied separately from physical input validation.
•	Visual Feedback State: JavaScript input event listeners evaluate field values as the user types. When a value exceeds its permitted range, JavaScript adds an input-error CSS class, changes the field border and background color, and displays an explanatory error message. When the value becomes valid, the error styling and message are cleared. This provides immediate feedback before form submission.
•	Error Recovery: Each log entry provides a Delete button that removes the selected record from the in-memory collection and updates localStorage. A Clear All Logs button allows the user to purge the entire history, preferably with a confirmation prompt to prevent accidental deletion. After either operation, JavaScript refreshes the displayed log so that the interface reflects the updated application state.
Section 4.3: Component, DOM Tree & Event Target Architecture
•	<body> [STATIC]
o	<header class="app-header"> (CSS: flex, row, space-between, center) [STATIC]
	<h1> (Text: "Greenhouse Sensor Logger") [STATIC]
o	<main class="app-main"> (CSS: grid, two columns on wide screens; one column on narrow screens) [STATIC]
	<section class="sensor-entry"> (CSS: flex, column, gap) [STATIC]
	<h2> (Text: "Record Sensor Reading") [STATIC]
	<form id="sensor-form"> [STATIC] (Event: submit)
	<div class="form-field"> [STATIC]
	<label for="bay">Greenhouse Bay</label> [STATIC]
	<select id="bay" name="bay" required> [STATIC]
	<option> (Greenhouse bay choices) [STATIC]
	<div class="form-field"> [STATIC]
	<label for="ph">pH (0–14)</label> [STATIC]
	<input id="ph" name="ph" type="number" min="0" max="14" step="0.1" required> [STATIC](Event: input)
	<small id="ph-error"> (pH validation message) [STATIC; initially hidden]
	<div class="form-field"> [STATIC]
	<label for="ec">Electrical Conductivity (mS/cm)</label> [STATIC]
	<input id="ec" name="ec" type="number" min="[confirmed minimum]" max="[confirmed maximum]" step="[defined precision]" required> [STATIC] (Event: input)
	<small id="ec-error"> (EC validation message) [STATIC; initially hidden]
	<div class="form-field"> [STATIC]
	<label for="temperature">Air Temperature (°F)</label> [STATIC]
	<input id="temperature" name="temperature" type="number" min="[confirmed minimum]" max="[confirmed maximum]" step="[defined precision]" required> [STATIC] (Event: input)
	<small id="temperature-error"> (Temperature validation message) [STATIC; initially hidden]
	<div class="form-field"> [STATIC]
	<label for="humidity">Relative Humidity (%)</label> [STATIC]
	<input id="humidity" name="humidity" type="number" min="[confirmed minimum]" max="[confirmed maximum]" step="[defined precision]" required> [STATIC] (Event: input)
	<small id="humidity-error"> (Humidity validation message) [STATIC; initially hidden]
	<button type="submit">Record Reading</button> [STATIC]
	<p id="form-feedback" role="status" aria-live="polite"> (Submission feedback) [STATIC; initially empty]
	<section class="log-history"> (CSS: flex, column, gap) [STATIC]
	<h2> (Text: "Sensor Log History") [STATIC]
	<button id="clear-logs" type="button">Clear All Logs</button> [STATIC] (Event: click)
	<p id="empty-state"> (Text: "No readings recorded yet.") [STATIC; initially shown when no records exist]
	<ul id="log-list"> (CSS: flex, column, gap) [STATIC; child records are dynamic]
	<li class="log-entry"> (One recorded sensor reading) [DYNAMIC]
	<h3> (Text: greenhouse bay and reading timestamp) [DYNAMIC]
	<p> (Text: pH, EC, temperature, and RH values) [DYNAMIC]
	<p class="status-tag"> (Text: Optimal, Warning, or Critical Hazard) [DYNAMIC]
	<button type="button" class="delete-log">Delete</button> [DYNAMIC] (Event: click, handled through event delegation on #log-list)
	<p id="storage-feedback" role="status" aria-live="polite"> (Storage or deletion feedback) [STATIC; initially empty]
o	<footer class="app-footer"> [STATIC]
	<p> (Text: "Greenhouse Sensor Logger") [STATIC]
Section 4.4: Data Schema
The application stores each sensor reading as a JavaScript object. Multiple reading objects are maintained in an in-memory array and persisted in localStorage as JSON.
const sensorReadingSchema = {
  id: "String",	// Unique identifier for each reading
  bay: "String",	// Greenhouse bay identifier
  ph: "Number",	// pH measurement, 0–14
  ec: "Number",	// Electrical conductivity in mS/cm
  temperature: "Number",	// Air temperature in degrees Fahrenheit
  humidity: "Number",	// Relative humidity percentage
  status: "String",	// Optimal, Warning, or Critical Hazard
  timestamp: "String"	// Date and time of the recorded reading
};
