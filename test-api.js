import fetch from "node-fetch";

async function runTests() {
  console.log("----------------------------");
  console.log("🚀 Running Growth System API Tests...");
  console.log("----------------------------");

  const baseUrl = "http://localhost:3000";

  // 1. Test Health Check
  try {
    const resHealth = await fetch(`${baseUrl}/health`);
    console.log("GET /health:", resHealth.status === 200 ? "✅ PASSED" : "❌ FAILED");
  } catch (e) {
    console.log("GET /health: ❌ FAILED (Server might not be running)");
  }

  // 2. Test Habit Logging (POST)
  try {
    const resPost = await fetch(`${baseUrl}/habits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        activity: "Morning Meditation (Automated Test)", 
        status: "completed",
        userName: "TestRunner" 
      })
    });
    
    console.log("POST /habits:", resPost.status === 201 ? "✅ PASSED" : "❌ FAILED");
    if (resPost.ok) {
      const data = await resPost.json();
      console.log("   -> Activity logged:", data.activity);
    }
  } catch (e) {
    console.log("POST /habits: ❌ FAILED (Is the DB connected?)");
  }

  // 3. Test Habit History (GET)
  try {
    const resGet = await fetch(`${baseUrl}/habits`);
    console.log("GET /habits:", resGet.status === 200 ? "✅ PASSED" : "❌ FAILED");
    if (resGet.ok) {
      const data = await resGet.json();
      console.log(`   -> Found ${data.length} logs in history.`);
    }
  } catch (e) {
    console.log("GET /habits: ❌ FAILED");
  }

  console.log("----------------------------");
  console.log("🏁 API Verification Completed.");
  console.log("----------------------------");
}

runTests();
