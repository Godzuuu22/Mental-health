<template>
  <div class="page">
    <div class="card">
      <h1>Mood Check-in</h1>
      <p class="subtitle">Enter your name and how you feel today.</p>

      <form @submit.prevent="submitMood">
        <div class="field">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Enter your name"
            required
          />
        </div>

        <div class="field">
          <label for="mood">Mood Today</label>
          <textarea
            id="mood"
            v-model="mood"
            placeholder="How are you feeling today?"
            rows="5"
            required
          ></textarea>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "Submitting..." : "Submit" }}
        </button>
      </form>

      <div v-if="aiResponse" class="response">
        <h2>AI Response</h2>
        <p>{{ aiResponse }}</p>
      </div>

      <div v-if="errorMessage" class="error">
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MoodForm",
  data() {
    return {
      name: "",
      mood: "",
      aiResponse: "",
      errorMessage: "",
      loading: false
    };
  },
  methods: {
    async submitMood() {
      this.loading = true;
      this.aiResponse = "";
      this.errorMessage = "";

      try {
        const prompt = `My name is ${this.name}. Today I feel ${this.mood}. Please give me a short supportive response and simple advice.`;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt,
            userName: this.name
          })
        });

        const data = await response.json();

        if (!response.ok) {
          this.errorMessage = data.reply || "Something went wrong.";
          return;
        }

        this.aiResponse = data.reply || "No response from AI.";
      } catch (error) {
        console.error("Submit error:", error);
        this.errorMessage = "Failed to connect to the server.";
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f4f6fb;
  padding: 20px;
}

.card {
  width: 100%;
  max-width: 500px;
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

h1 {
  margin: 0 0 8px;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}

.field {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: #4f46e5;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  background: #999;
  cursor: not-allowed;
}

.response {
  margin-top: 20px;
  padding: 16px;
  background: #eef7ee;
  border-left: 4px solid #22c55e;
  border-radius: 10px;
}

.error {
  margin-top: 20px;
  padding: 16px;
  background: #fff0f0;
  border-left: 4px solid #ef4444;
  border-radius: 10px;
  color: #b91c1c;
}
</style>