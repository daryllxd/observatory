// Simple analytics script
export function trackPageView() {
  // Don't track in development
  // if (import.meta.env.DEV) return;

  console.log("Tracking page view");

  // Send the page view to our analytics endpoint
  fetch("https://delicate-flower-cb99.daryll-santos.workers.dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch(console.error);
}
