/*
  controller.js

  Questo file gestisce gli input da dispositivi touch, mouse, tastiera ed eventuali gamepad per garantire un'esperienza fluida e responsiva su smartphone, tablet e PC.
  
  Le funzionalità incluse sono:
  • Disabilitazione dello scrolling (overflow hidden) per evitare scrollbar indesiderate.
  • Eventi touch (touchstart, touchmove, touchend) con gestione in modalità "passive: false" per bloccare il comportamento predefinito.
  • Eventi mouse (mousedown, mousemove, mouseup).
  • Eventi tastiera (keydown, keyup) che possono essere usati per eventuali scorciatoie o per controlli via tastiera.
  • Supporto al Gamepad: rilevamento di gamepad con eventi 'gamepadconnected' e 'gamepaddisconnected' e polling per leggere bottoni e assi.
  
  Per usarlo basta includere controller.js dopo jQuery e prima degli script specifici del gioco e chiamare Controller.init().
  
  Inoltre, è possibile registrare callback per ogni evento usando Controller.on("eventName", callback).
*/

const Controller = (function() {
  let callbacks = {};
  let gamepadIndex = null;

  function init() {
    // Impedisci lo scrolling su dispositivi mobili (per evitare scrollbar indesiderate).
    document.body.style.overflow = "hidden";

    initTouch();
    initMouse();
    initKeyboard();
    initGamepad();

    // Esegui un polling periodico per il gamepad (da 100 ms in poi).
    setInterval(pollGamepad, 100);
  }

  // Funzione per registrare callback per un determinato evento.
  function on(event, callback) {
    if (!callbacks[event]) {
      callbacks[event] = [];
    }
    callbacks[event].push(callback);
  }

  // Rimuove una callback per un determinato evento.
  function off(event, callback) {
    if (!callbacks[event]) return;
    callbacks[event] = callbacks[event].filter(cb => cb !== callback);
  }

  // Trigger/dispatch di un evento con un data payload.
  function trigger(event, data) {
    if (callbacks[event]) {
      callbacks[event].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error("Errore nell'evento '" + event + "':", err);
        }
      });
    }
  }

  /* EVENTI TOUCH */
  function initTouch() {
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    // Qui si potrebbero anche generare pulsanti virtuali nel DOM per gestire comandi
    // ad esempio, per movimenti sinistra/destra o per azioni specifiche.
  }

  function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      let touch = e.touches[0];
      let pos = { x: touch.clientX, y: touch.clientY };
      trigger("touchstart", pos);
    }
  }

  function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      let touch = e.touches[0];
      let pos = { x: touch.clientX, y: touch.clientY };
      trigger("touchmove", pos);
    }
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    trigger("touchend", {});
  }

  /* EVENTI MOUSE */
  function initMouse() {
    document.addEventListener("mousedown", function(e) {
      let pos = { x: e.clientX, y: e.clientY };
      trigger("mousedown", pos);
    });
    document.addEventListener("mousemove", function(e) {
      let pos = { x: e.clientX, y: e.clientY };
      trigger("mousemove", pos);
    });
    document.addEventListener("mouseup", function(e) {
      let pos = { x: e.clientX, y: e.clientY };
      trigger("mouseup", pos);
    });
  }

  /* EVENTI TASTIERA */
  function initKeyboard() {
    document.addEventListener("keydown", function(e) {
      trigger("keydown", e);
    });
    document.addEventListener("keyup", function(e) {
      trigger("keyup", e);
    });
  }

  /* SUPPORTO AI GAMEPAD */
  function initGamepad() {
    window.addEventListener("gamepadconnected", function(e) {
      console.log("Gamepad connesso:", e.gamepad);
      gamepadIndex = e.gamepad.index;
      trigger("gamepadconnected", e.gamepad);
    });
    window.addEventListener("gamepaddisconnected", function(e) {
      console.log("Gamepad disconnesso:", e.gamepad);
      gamepadIndex = null;
      trigger("gamepaddisconnected", e.gamepad);
    });
  }

  function pollGamepad() {
    if (gamepadIndex !== null) {
      let gp = navigator.getGamepads()[gamepadIndex];
      if (gp) {
        // Esempio: Trigger per tutti i bottoni premuti
        gp.buttons.forEach((button, index) => {
          if (button.pressed) {
            trigger("gamepad:button", { index: index });
          }
        });
        // Esempio: Trigger per gli assi (movimenti analogici)
        if (gp.axes.length >= 2) {
          let axisData = { x: gp.axes[0], y: gp.axes[1] };
          trigger("gamepad:axis", axisData);
        }
      }
    }
  }

  return {
    init: init,
    on: on,
    off: off,
    trigger: trigger
  };
})();

// Inizializza il Controller appena il documento è pronto.
document.addEventListener("DOMContentLoaded", function() {
  Controller.init();
});
