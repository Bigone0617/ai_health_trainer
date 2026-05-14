/* global self, clearInterval, clearTimeout, setInterval, setTimeout */
const TAG = "nextset-rest-end";

let restEndsAt = null;
let restTimeout = null;
let restInterval = null;

function clearRestSchedule() {
  if (restTimeout != null) {
    clearTimeout(restTimeout);
    restTimeout = null;
  }
  if (restInterval != null) {
    clearInterval(restInterval);
    restInterval = null;
  }
  restEndsAt = null;
}

function fireRestEnd() {
  clearRestSchedule();
  self.registration
    .showNotification("휴식 끝", {
      body: "쉬는 시간이 끝났어요.",
      tag: TAG,
    })
    .catch(() => {});
}

function scheduleRest(endsAt) {
  clearRestSchedule();
  restEndsAt = endsAt;

  const runIfDue = () => {
    if (restEndsAt == null) return;
    if (Date.now() >= restEndsAt) fireRestEnd();
  };

  const delay = Math.max(0, endsAt - Date.now());
  restTimeout = setTimeout(runIfDue, delay);
  restInterval = setInterval(runIfDue, 10000);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "REST_CANCEL") {
    clearRestSchedule();
    return;
  }

  if (data.type === "REST_START" && typeof data.endsAt === "number") {
    scheduleRest(data.endsAt);
  }
});
