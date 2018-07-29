import * as messaging from "messaging";

import { debug, error } from "../common/log.js";
import { getLocalStorage, writeLocalStorage } from "localStorage";
import { drawTodayScreen, renderError, stopSpinner } from "draw";

const initMessaging = () => {
  // Message is received
  messaging.peerSocket.onmessage = evt => {
    debug(`App received: ${JSON.stringify(evt, undefined, 2)}`);

    if (evt.data.key === "WEIGHT_TODAY") {
      const localStorage = getLocalStorage();
      let changed = false;

      if (localStorage.today) {
        const lastDate = localStorage.today.date;
        const lastValue = localStorage.today.value;
        const lastBmi = localStorage.today.bmi;

        if (
          lastDate != evt.data.date ||
          lastValue != evt.data.value ||
          !lastBmi
        ) {
          changed = true;
        }
      } else {
        changed = true;
      }

      writeLocalStorage("today", {
        date: evt.data.date,
        value: evt.data.value,
        bmi: evt.data.bmi
      });

      if (changed) {
        drawTodayScreen();
      }

      // Stop spinner after data is received for today
      stopSpinner();
    } else if (evt.data.key === "LATEST_ENTRY") {
      writeLocalStorage("latestEntry", evt.data.value);
    } else if (evt.data.key === "ERROR") {
      renderError();
    }
  };

  // Message socket opens
  messaging.peerSocket.onopen = () => {
    debug("App Socket Open");
  };

  // Message socket closes
  messaging.peerSocket.onclose = () => {
    debug("App Socket Closed");
  };

  // Problem with message socket
  messaging.peerSocket.onerror = err => {
    error("Connection error: " + err.code + " - " + err.message);
  };
};

// Send data to device using Messaging API
const sendVal = data => {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    try {
      messaging.peerSocket.send(data);
      debug(`Sent to companion: ${JSON.stringify(data, undefined, 2)}`);
    } catch (err) {
      error(`Exception when sending to companion`);
    }
  } else {
    error("Unable to send data to app");
  }
};

export { initMessaging, sendVal };
