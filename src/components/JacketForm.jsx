import { useState } from "react";

function JacketForm() {
  const [duration, setDuration] = useState("");
  const [tolerance, setTolerance] = useState("");
  const [activity, setActivity] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Duration:", duration);
    console.log("Tolerance:", tolerance);
    console.log("Activity:", activity);
};

return (
    <form onSubmit={handleSubmit}>
    <h2>Tell Us About Your Situation</h2>

    <div>
        <label>Time outside:</label>
        <select value={duration} onChange={(e) => setDuration(e.target.value)}>
        <option value="">Select...</option>
        <option value="short">Less than 10 minutes</option>
        <option value="medium">10–30 minutes</option>
        <option value="long">30+ minutes</option>
        </select>
    </div>

    <div>
        <label>Cold tolerance:</label>
        <select value={tolerance} onChange={(e) => setTolerance(e.target.value)}>
        <option value="">Select...</option>
        <option value="cold">Run cold</option>
        <option value="normal">Normal</option>
        <option value="hot">Run hot</option>
        </select>
    </div>

    <div>
        <label>Activity level:</label>
        <select value={activity} onChange={(e) => setActivity(e.target.value)}>
        <option value="">Select...</option>
        <option value="still">Standing still</option>
        <option value="walk">Walking</option>
        <option value="active">Active</option>
        </select>
    </div>

    <button type="submit">Check Recommendation</button>
    </form>
);
}

export default JacketForm;
