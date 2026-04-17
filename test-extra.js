import fetch from "node-fetch";

async function runExtraTests() {
  const baseUrl = "http://localhost:3000";
  const user = "ExtraTester";

  console.log("----------------------------");
  console.log("🚀 Testing EXTRA Features...");
  console.log("----------------------------");

  // 1. Test Login
  try {
    const res = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: user })
    });
    const data = await res.json();
    console.log("POST /login:", res.ok ? "✅ PASSED" : "❌ FAILED");
    if (res.ok) console.log(`   -> User ID: ${data.id}`);
  } catch (e) {
    console.log("POST /login: ❌ FAILED - Server unreachable");
    return;
  }

  // 2. Test Streak (Should be 0 initially or 1 if we log now)
  try {
    // Log a habit first to ensure a streak of 1 today
    await fetch(`${baseUrl}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity: "Test Streak Habit", userName: user })
    });

    const res = await fetch(`${baseUrl}/streaks/${user}`);
    const data = await res.json();
    console.log("GET /streaks:", data.streak >= 1 ? "✅ PASSED" : "❌ FAILED (No streak detected)");
    console.log(`   -> Current Streak: ${data.streak} days`);
  } catch (e) {
    console.log("GET /streaks: ❌ FAILED");
  }

  // 3. Test Goals
  try {
    // Create goal
    const resPost = await fetch(`${baseUrl}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: user, goalName: "Finish Project Overview", targetValue: 5 })
    });
    console.log("POST /goals:", resPost.ok ? "✅ PASSED" : "❌ FAILED");

    // Get goals
    const resGet = await fetch(`${baseUrl}/goals/${user}`);
    const data = await resGet.json();
    console.log("GET /goals:", data.length > 0 ? "✅ PASSED" : "❌ FAILED");
    if (data.length > 0) console.log(`   -> Found Goal: ${data[0].goal_name}`);
  } catch (e) {
    console.log("Goals Test: ❌ FAILED");
  }

  console.log("----------------------------");
  console.log("🏁 EXTRA Verification Completed.");
  console.log("----------------------------");
}

runExtraTests();
