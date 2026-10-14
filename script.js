(function () {
        "use strict";
        var codes = [
            "USD",
            "EUR",
            "GBP",
            "INR",
            "JPY",
            "CAD",
            "AUD",
            "CHF",
            "CNY",
            "SGD",
          ],
          $ = function (x) {
            return document.getElementById(x);
          },
          abort;
        codes.forEach(function (c) {
          $("from").add(new Option(c, c));
          $("to").add(new Option(c, c));
        });
        $("from").value = "USD";
        $("to").value = "INR";
        async function convert() {
          var amount = Number($("amount").value);
          if (!Number.isFinite(amount) || amount < 0)
            return ($("status").textContent =
              "Enter a valid non-negative amount.");
          var from = $("from").value,
            to = $("to").value;
          if (from === to) {
            show(amount, 1, new Date().toISOString().slice(0, 10));
            return;
          }
          if (abort) abort.abort();
          abort = new AbortController();
          $("status").textContent = "Loading reference rate…";
          try {
            var r = await fetch(
              "https://api.frankfurter.dev/v2/rate/" + from + "/" + to,
              { signal: abort.signal },
            );
            if (!r.ok) throw Error("Rate service unavailable");
            var d = await r.json();
            show(amount * d.rate, d.rate, d.date);
            localStorage.setItem("rateorbit:" + from + to, JSON.stringify(d));
          } catch (e) {
            if (e.name === "AbortError") return;
            var cache;
            try {
              cache = JSON.parse(
                localStorage.getItem("rateorbit:" + from + to),
              );
            } catch (x) {}
            if (cache) {
              show(amount * cache.rate, cache.rate, cache.date);
              $("status").textContent =
                "Offline — showing cached reference rate.";
            } else $("status").textContent = e.message;
          }
        }
        function show(value, rate, date) {
          $("output").value = value.toFixed(2);
          $("big").textContent =
            $("to").value +
            " " +
            value.toLocaleString(undefined, { maximumFractionDigits: 2 });
          $("rateLabel").textContent =
            "1 " +
            $("from").value +
            " = " +
            rate.toFixed(4) +
            " " +
            $("to").value;
          $("date").textContent =
            "Reference rate dated " + date + " · Frankfurter";
          $("status").textContent = "";
        }
        ["amount", "from", "to"].forEach(function (id) {
          $(id).oninput = convert;
        });
        $("swap").onclick = function () {
          var x = $("from").value;
          $("from").value = $("to").value;
          $("to").value = x;
          convert();
        };
        document.querySelectorAll("[data-pair]").forEach(function (b) {
          b.onclick = function () {
            var p = b.dataset.pair.split(",");
            $("from").value = p[0];
            $("to").value = p[1];
            convert();
          };
        });
        $("refresh").onclick = convert;
        convert();
      })();
