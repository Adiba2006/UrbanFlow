
import { useState, useEffect, useRef } from "react";
import "./App.css";
import MapView from "./MapView";

const PLACE_CATEGORIES = {
  Restaurants: ['["amenity"~"restaurant|fast_food|cafe"]'],
  Hotels: ['["tourism"~"hotel|motel|guest_house|hostel"]'],
  Shopping: ['["shop"]', '["amenity"="marketplace"]'],
  Clothing: ['["shop"="clothes"]'],
  Hospitals: ['["amenity"~"hospital|clinic"]'],
  ATMs: ['["amenity"="atm"]'],
};

const LANGUAGES = {
  English: "en-US",
  Hindi: "hi-IN",
  Marathi: "mr-IN",
};

function getReadableLocation(address, fallback) {
  const area =
    address.neighbourhood ||
    address.suburb ||
    address.city_district ||
    address.village ||
    address.town ||
    address.city;

  const city =
    address.city ||
    address.town ||
    address.city_district ||
    address.county;

  const parts = [...new Set([area, city, address.state].filter(Boolean))];

  return parts.length ? parts.join(", ") : fallback;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function App() {
  
function getLocalizedInstruction(step, language) {
  const maneuver = (step.maneuver || "STRAIGHT").toUpperCase();
  const original = step.instruction || step.instructions || "";

  const roadMatch = original.match(
    /\b(?:onto|toward|towards|on|at|into)\s+(.+)$/i
  );

  const road = roadMatch
    ? roadMatch[1].replace(/[.,;]+$/, "").trim()
    : "";

  const directions = {
    Hindi: {
      DEPART: "आगे बढ़ें",
      STRAIGHT: "सीधे चलते रहें",
      TURN_LEFT: "बाएँ मुड़ें",
      TURN_RIGHT: "दाएँ मुड़ें",
      TURN_SLIGHT_LEFT: "थोड़ा बाएँ मुड़ें",
      TURN_SLIGHT_RIGHT: "थोड़ा दाएँ मुड़ें",
      TURN_SHARP_LEFT: "तेज़ बाएँ मुड़ें",
      TURN_SHARP_RIGHT: "तेज़ दाएँ मुड़ें",
      UTURN_LEFT: "यू-टर्न लें",
      UTURN_RIGHT: "यू-टर्न लें",
      KEEP_LEFT: "बाईं ओर रहें",
      KEEP_RIGHT: "दाईं ओर रहें",
      MERGE: "मुख्य रास्ते के ट्रैफिक में शामिल हों",
      RAMP_LEFT: "बाएँ रैंप पर जाएँ",
      RAMP_RIGHT: "दाएँ रैंप पर जाएँ",
      FORK_LEFT: "बाएँ रास्ते पर रहें",
      FORK_RIGHT: "दाएँ रास्ते पर रहें",
      ROUNDABOUT_LEFT: "गोल चक्कर में प्रवेश करके बाएँ जाएँ",
      ROUNDABOUT_RIGHT: "गोल चक्कर में प्रवेश करके दाएँ जाएँ",
      ROUNDABOUT_STRAIGHT: "गोल चक्कर से सीधे आगे बढ़ें",
      ROUNDABOUT_EXIT: "गोल चक्कर से बाहर निकलें",
    },
    Marathi: {
      DEPART: "पुढे जा",
      STRAIGHT: "सरळ पुढे जात राहा",
      TURN_LEFT: "डावीकडे वळा",
      TURN_RIGHT: "उजवीकडे वळा",
      TURN_SLIGHT_LEFT: "थोडे डावीकडे वळा",
      TURN_SLIGHT_RIGHT: "थोडे उजवीकडे वळा",
      TURN_SHARP_LEFT: "तीव्र डावीकडे वळा",
      TURN_SHARP_RIGHT: "तीव्र उजवीकडे वळा",
      UTURN_LEFT: "यू-टर्न घ्या",
      UTURN_RIGHT: "यू-टर्न घ्या",
      KEEP_LEFT: "डाव्या बाजूला राहा",
      KEEP_RIGHT: "उजव्या बाजूला राहा",
      MERGE: "मुख्य रस्त्यावरील वाहतुकीत सामील व्हा",
      RAMP_LEFT: "डाव्या रॅम्पवर जा",
      RAMP_RIGHT: "उजव्या रॅम्पवर जा",
      FORK_LEFT: "डाव्या मार्गावर राहा",
      FORK_RIGHT: "उजव्या मार्गावर राहा",
      ROUNDABOUT_LEFT: "गोल चौकात जाऊन डावीकडे वळा",
      ROUNDABOUT_RIGHT: "गोल चौकात जाऊन उजवीकडे वळा",
      ROUNDABOUT_STRAIGHT: "गोल चौकातून सरळ पुढे जा",
      ROUNDABOUT_EXIT: "गोल चौकातून बाहेर पडा",
    },
  };

  if (language === "English") {
    return original || "Continue on the route.";
  }

  const dictionary = directions[language] || directions.Hindi;

  let text = dictionary[maneuver];

  if (!text) {
    if (maneuver.includes("LEFT")) {
      text = language === "Hindi"
        ? "बाएँ मुड़ें"
        : "डावीकडे वळा";
    } else if (maneuver.includes("RIGHT")) {
      text = language === "Hindi"
        ? "दाएँ मुड़ें"
        : "उजवीकडे वळा";
    } else {
      text = language === "Hindi"
        ? "सीधे चलते रहें"
        : "सरळ पुढे जात राहा";
    }
  }

  if (road) {
    text += language === "Hindi"
      ? `. आगे का रास्ता: ${road}`
      : `. पुढील रस्ता: ${road}`;
  }

  return text;
}
 
  const watchIdRef = useRef(null);
  const guidanceIndexRef = useRef(0);
  const speechActiveRef = useRef(false);
  const arrivalAnnouncedRef = useRef(false);

  const [origin, setOrigin] = useState("Nagpur");
  const [destination, setDestination] = useState("Wardha");

  const [originLat, setOriginLat] = useState(null);
  const [originLng, setOriginLng] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [language, setLanguage] = useState("English");
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");

  const [category, setCategory] = useState("Restaurants");
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyMessage, setNearbyMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  
const [guiding, setGuiding] = useState(false);
const [distanceToNextTurn, setDistanceToNextTurn] = useState(null);
const [guidanceMessage, setGuidanceMessage] = useState("");

const steps = Array.isArray(data?.recommended_route?.steps)
  ? data.recommended_route.steps
  : [];

useEffect(() => {
  return () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };
}, []);


function stopGuidance() {
  if (watchIdRef.current !== null) {
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  speechActiveRef.current = false;
  setGuiding(false);
  setGuidanceMessage("Voice directions stopped.");
}

function startGuidance() {
  if (!navigator.geolocation) {
    setGuidanceMessage("GPS is not supported by this browser.");
    return;
  }

  if (originLat == null || originLng == null) {
    setGuidanceMessage(
      "First click 'Use my current location', then search the route again."
    );
    return;
  }

  if (!steps.length) {
    setGuidanceMessage("No route instructions are available.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    setGuidanceMessage("Voice guidance requires Chrome or Edge.");
    return;
  }

  const languageCode = LANGUAGES[language];
  const prefix = languageCode.split("-")[0].toLowerCase();

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(
    (item) => item.lang.toLowerCase().startsWith(prefix)
  );

  if (!voice) {
    setGuidanceMessage(
      `No ${language} speech voice is available in your browser. ` +
      "Check your installed system speech languages."
    );
    return;
  }

  const speak = (text, onFinished) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode;
    utterance.voice = voice;
    utterance.rate = 0.9;

    utterance.onstart = () => {
      speechActiveRef.current = true;
    };

    utterance.onend = () => {
      speechActiveRef.current = false;
      if (onFinished) onFinished();
    };

    utterance.onerror = () => {
      speechActiveRef.current = false;
      setGuiding(false);
      setGuidanceMessage("Voice playback failed. Please try again.");
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakStep = (index) => {
    const step = steps[index];

    if (!step) return;

    const instruction = getLocalizedInstruction(step, language);
    if (!instruction) {
      speechActiveRef.current = false;
      return;
    }

    setGuidanceMessage(
      `Step ${index + 1} of ${steps.length}: ${instruction}`
    );

    speak(instruction, () => {
      if (index === steps.length - 1) {
        setGuidanceMessage(
          "Final instruction given. Follow GPS until you reach the destination."
        );
      }
    });
  };
  
  window.speechSynthesis.cancel();

  if (watchIdRef.current !== null) {
    navigator.geolocation.clearWatch(watchIdRef.current);
  }

  guidanceIndexRef.current = 0;
  arrivalAnnouncedRef.current = false;
  speechActiveRef.current = false;

  setGuiding(true);
  setGuidanceMessage("Starting GPS navigation...");

  // Speak the first instruction immediately.
  speakStep(0);

  watchIdRef.current = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setCurrentLocation({ lat, lng });

      const index = guidanceIndexRef.current;
      const step = steps[index];

      if (!step?.end_location) {
        setGuidanceMessage(
          "GPS is active, but this step has no turn coordinates."
        );
        return;
      }

      const target = step.end_location;

      const distance = calculateDistance(
        lat,
        lng,
        target.lat,
        target.lng
      ) * 1000;
      setDistanceToNextTurn(Math.round(distance));

      // Announce the next instruction when approaching this turn.
      if (
        index < steps.length - 1 &&
        distance <= 220 &&
        !speechActiveRef.current
      ) {
        guidanceIndexRef.current = index + 1;
        speakStep(index + 1);
        return;
      }

      // Finish only when close to the final destination.
      if (
        index === steps.length - 1 &&
        distance <= 35 &&
        !speechActiveRef.current &&
        !arrivalAnnouncedRef.current
      ) {
        arrivalAnnouncedRef.current = true;

        const arrivalText = {
          English: "You have reached your destination.",
          Hindi: "आप अपनी मंज़िल पर पहुँच गए हैं।",
          Marathi: "तुम्ही तुमच्या ठिकाणी पोहोचला आहात."
        }[language];

        speak(arrivalText, () => {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }

          setGuiding(false);
          setGuidanceMessage(arrivalText);
        });
      }
    },
    (error) => {
      setGuidanceMessage(
        error.code === 1
          ? "Allow location permission for GPS navigation."
          : "GPS signal unavailable. Check your location settings."
      );
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000
    }
  );
}


  function startVoiceSearch() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceMessage(
        "Voice search is not supported in this browser. Try Google Chrome or Microsoft Edge."
      );
      return;
    }

    setVoiceMessage("");

    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGES[language];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setVoiceMessage(
        language === "Hindi"
          ? "सुन रही हूँ... अपनी destination बोलिए।"
          : language === "Marathi"
            ? "ऐकत आहे... तुमचे destination सांगा."
            : "Listening... Say your destination."
      );
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();

      if (transcript) {
        setDestination(transcript);
        setVoiceMessage(`Recognized: ${transcript}`);
      } else {
        setVoiceMessage("Could not recognize the destination. Try again.");
      }
    };

    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Allow microphone access in your browser settings.",
        "no-speech": "No speech detected. Please try again.",
        "network": "Voice recognition needs a working network connection.",
        "audio-capture": "No microphone was detected.",
      };

      setVoiceMessage(
        messages[event.error] ||
          `Voice search failed: ${event.error}. Please try again.`
      );
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
      setVoiceMessage("Could not start the microphone. Please try again.");
    }
  }

  async function useCurrentLocation() {
    setLocationMessage("");
    setError("");

    if (!navigator.geolocation) {
      setLocationMessage("Your browser does not support GPS location.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setOriginLat(latitude);
        setOriginLng(longitude);
        setCurrentLocation({ lat: latitude, lng: longitude });
        setNearbyPlaces([]);
        setNearbyMessage("");
        setOrigin("Current Location");

        try {
          const url = new URL(
            "https://nominatim.openstreetmap.org/reverse"
          );

          url.searchParams.set("format", "jsonv2");
          url.searchParams.set("lat", latitude);
          url.searchParams.set("lon", longitude);
          url.searchParams.set("zoom", "18");
          url.searchParams.set("addressdetails", "1");

          const response = await fetch(url);

          if (!response.ok) {
            throw new Error("Area name lookup failed");
          }

          const result = await response.json();
          const readableName = getReadableLocation(
            result.address || {},
            "Current Location"
          );

          setOrigin(readableName);
          setLocationMessage(`Current area: ${readableName}`);
        } catch {
          setLocationMessage(
            "GPS detected. The readable area name is unavailable."
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        const messages = {
          1: "Location permission denied. Allow location access in your browser.",
          2: "Location unavailable. Check your GPS or network.",
          3: "Location request timed out. Please try again.",
        };

        setLocationMessage(
          messages[err.code] || "Could not detect your location."
        );
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  async function searchNearby() {
    if (originLat === null || originLng === null) {
      setNearbyMessage("First click Use my current location.");
      return;
    }

    setNearbyLoading(true);
    setNearbyMessage("");
    setNearbyPlaces([]);

    const query = `
      [out:json][timeout:20];
      (
        node(around:3000,${originLat},${originLng})["amenity"~"restaurant|fast_food|cafe"];
        way(around:3000,${originLat},${originLng})["amenity"~"restaurant|fast_food|cafe"];
        node(around:3000,${originLat},${originLng})["tourism"~"hotel|motel|guest_house|hostel"];
        way(around:3000,${originLat},${originLng})["tourism"~"hotel|motel|guest_house|hostel"];
        node(around:3000,${originLat},${originLng})["shop"];
        way(around:3000,${originLat},${originLng})["shop"];
        node(around:3000,${originLat},${originLng})["amenity"~"hospital|clinic|atm"];
        way(around:3000,${originLat},${originLng})["amenity"~"hospital|clinic|atm"];
      );
      out center tags;
    `;

    const servers = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

    let result = null;
    let lastError = "";

    try {
      for (const server of servers) {
        try {
          const response = await fetch(server, {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8",
            },
            body: new URLSearchParams({ data: query }),
            signal: AbortSignal.timeout(30000),
          });

          if (!response.ok) {
            lastError = `${server} returned HTTP ${response.status}`;
            continue;
          }

          result = await response.json();
          break;
        } catch (err) {
          lastError = err.message || "Network request failed";
        }
      }

      if (!result) {
        throw new Error(lastError || "All nearby-place servers failed");
      }

      const places = (result.elements || [])
        .map((item) => {
          const lat = item.lat ?? item.center?.lat;
          const lng = item.lon ?? item.center?.lon;

          if (lat == null || lng == null) return null;

          const tags = item.tags || {};
          const shop = tags.shop;
          const amenity = tags.amenity;
          const tourism = tags.tourism;

          let placeCategory = "Shopping";

          if (["restaurant", "fast_food", "cafe"].includes(amenity)) {
            placeCategory = "Restaurants";
          } else if (tourism) {
            placeCategory = "Hotels";
          } else if (shop === "clothes") {
            placeCategory = "Clothing";
          } else if (["hospital", "clinic"].includes(amenity)) {
            placeCategory = "Hospitals";
          } else if (amenity === "atm") {
            placeCategory = "ATMs";
          }

          if (placeCategory !== category) return null;

          return {
            id: `${item.type}-${item.id}`,
            name: tags.name || `${placeCategory} place`,
            lat,
            lng,
            category: placeCategory,
            address:
              tags["addr:street"] ||
              tags["addr:suburb"] ||
              tags["addr:city"] ||
              "",
            distance: calculateDistance(
              originLat,
              originLng,
              lat,
              lng
            ),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 30);

      setNearbyPlaces(places);

      setNearbyMessage(
        places.length
          ? `Found ${places.length} nearby places within approximately 3 km.`
          : "No matching places found in the available map data."
      );
    } catch (err) {
      setNearbyMessage(
        `Nearby search failed: ${err.message}. Please retry in a minute.`
      );
    } finally {
      setNearbyLoading(false);
    }
  }

  async function searchRoutes(e) {
    e.preventDefault();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setGuiding(false);
    setGuidanceMessage("");
    setLoading(true);
    setError("");
    setData(null);

    try {
      const url = new URL("http://127.0.0.1:8000/route");

      url.searchParams.set("origin", origin);
      url.searchParams.set("destination", destination);
      url.searchParams.set("language_code", LANGUAGES[language]);
      url.searchParams.set("language_code", LANGUAGES[language]);

      if (originLat !== null && originLng !== null) {
        url.searchParams.set("origin_lat", originLat);
        url.searchParams.set("origin_lng", originLng);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err) {
      setError(
        "Routes could not be loaded. Check your backend and Google Routes API. " +
          err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">↗</span>
          <div>
            <h2>UrbanFlow</h2>
            <p>INTELLIGENT MOBILITY</p>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <div className="nav-item active">▦ &nbsp; Traffic Dashboard</div>
        <div className="nav-item">⌁ &nbsp; Route Optimization</div>
        <div className="nav-item">◷ &nbsp; Route History</div>
        <div className="nav-item">◎ &nbsp; AI Analytics</div>

        <div className="sidebar-bottom">
          <span className="online-dot" />
          Backend connection
          <small>127.0.0.1:8000</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">SMART CITY MOBILITY PLATFORM</p>
            <h1>Traffic Dashboard</h1>
            <p className="subtitle">
              Live routes. Intelligent predictions. Smarter journeys.
            </p>
          </div>

          <div className="live-badge">
            <span className="online-dot" /> LIVE ROUTING
          </div>
        </header>

        <section className="welcome-card">
          <div>
            <p className="eyebrow">WELCOME TO URBANFLOW</p>
            <h2>Make every journey smarter.</h2>
            <p>
              Compare available routes, analyze traffic delays, and get an
              AI-assisted route recommendation.
            </p>
          </div>
          <div className="hero-symbol">↗</div>
        </section>

        <section className="panel search-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PLAN YOUR JOURNEY</p>
              <h2>Find the best route</h2>
            </div>
            <span className="panel-icon">⌖</span>
          </div>

          <label className="language-control">
            VOICE SEARCH LANGUAGE
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setVoiceMessage("");
              }}
            >
              <option value="English">English</option>
              <option value="Hindi">हिंदी (Hindi)</option>
              <option value="Marathi">मराठी (Marathi)</option>
            </select>
          </label>

          <form onSubmit={searchRoutes}>
            <div className="input-grid">
              <label>
                ORIGIN
                <input
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    setOriginLat(null);
                    setOriginLng(null);
                    setCurrentLocation(null);
                    setLocationMessage("");
                    setNearbyPlaces([]);
                    setNearbyMessage("");
                  }}
                  placeholder="Enter starting area"
                  required
                />

                <button
                  type="button"
                  className="location-button"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading
                    ? "Finding your location..."
                    : "◎ Use my current location"}
                </button>

                {locationMessage && (
                  <small className="location-message">
                    {locationMessage}
                  </small>
                )}
              </label>

              <label>
                DESTINATION
                <div className="voice-search-row">
                  <input
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setVoiceMessage("");
                    }}
                    placeholder="Type your destination"
                    required
                  />

                  <button
                    type="button"
                    className={`mic-button ${listening ? "listening" : ""}`}
                    onClick={startVoiceSearch}
                    disabled={listening}
                    aria-label="Speak destination"
                    title={`Speak in ${language}`}
                  >
                    {listening ? "🎙️" : "🎤"}
                  </button>
                </div>

                <small className="voice-message" aria-live="polite">
                  {voiceMessage ||
                    `Tap the microphone and speak in ${language}.`}
                </small>
              </label>
            </div>

            <button className="search-button" disabled={loading}>
              {loading ? "Finding routes..." : "↗ Find best route"}
            </button>
          </form>
        </section>

        <section className="panel nearby-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE AROUND YOU</p>
              <h2>Nearby Places</h2>
              <p className="subtitle">
                Discover places around your current GPS location.
              </p>
            </div>
            <span className="panel-icon">⌖</span>
          </div>

          <div className="nearby-controls">
            <label>
              PLACE CATEGORY
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setNearbyPlaces([]);
                  setNearbyMessage("");
                }}
              >
                {Object.keys(PLACE_CATEGORIES).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="search-button nearby-search-button"
              onClick={searchNearby}
              disabled={nearbyLoading || originLat === null}
            >
              {nearbyLoading ? "Searching nearby..." : "⌕ Find nearby places"}
            </button>
          </div>

          {originLat === null && (
            <p className="nearby-message">
              Use your current location first to find nearby places.
            </p>
          )}

          {nearbyMessage && (
            <p className="nearby-message">{nearbyMessage}</p>
          )}

          {nearbyPlaces.length > 0 && (
            <div className="nearby-list">
              {nearbyPlaces.map((place) => (
                <article className="nearby-card" key={place.id}>
                  <div className="nearby-icon">
                    {category === "Restaurants" && "🍽️"}
                    {category === "Hotels" && "🏨"}
                    {category === "Shopping" && "🛍️"}
                    {category === "Clothing" && "👗"}
                    {category === "Hospitals" && "🏥"}
                    {category === "ATMs" && "🏧"}
                  </div>

                  <div className="nearby-info">
                    <strong>{place.name}</strong>
                    <span>
                      {place.distance < 1
                        ? `${Math.round(place.distance * 1000)} m away`
                        : `${place.distance.toFixed(2)} km away`}
                    </span>
                    {place.address && <small>{place.address}</small>}
                  </div>

                  <a
                    href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View map ↗
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>

        {error && <div className="error-box">{error}</div>}
        {data?.recommended_route && (
  <section className="panel guidance-panel">
    <h2>🧭 Start Directions</h2>
    <p>
      {data.origin} → {data.destination}
    </p>

    <div className="guidance-controls">
      <button
        type="button"
        className="search-button"
        onClick={startGuidance}
        disabled={guiding || !steps.length}
      >
        {guiding ? "🔊 Speaking directions..." : "▶ Start Directions"}
      </button>

      <button
        type="button"
        className="location-button"
        onClick={stopGuidance}
      >
        ■ Stop Directions
      </button>
    </div>

    {guidanceMessage && (
      <p className="nearby-message">{guidanceMessage}</p>
    )}
    
{guiding && distanceToNextTurn !== null && (
  <p className="nearby-message">
    📍 Next turn in:{" "}
    {distanceToNextTurn < 1000
      ? `${distanceToNextTurn} metres`
      : `${(distanceToNextTurn / 1000).toFixed(1)} km`}
  </p>
)}


    {!steps.length && (
      <p className="nearby-message">
        Route instructions are not available. Search the route again.
      </p>
    )}
  </section>
)}
        {(data || currentLocation || nearbyPlaces.length > 0) && (
          <section className="panel map-panel">
            <MapView
              routes={data?.routes || []}
              recommendedRoute={data?.recommended_route || null}
              originLabel={origin}
              currentLocation={currentLocation}
              nearbyPlaces={nearbyPlaces}
            />
          </section>
        )}

        {data && (
          <section className="results">
            <div className="results-heading">
              <div>
                <p className="eyebrow">ROUTE ANALYSIS</p>
                <h2>
                  {data.origin} → {data.destination}
                </h2>
              </div>

              <span className="count-badge">
                {data.total_routes_found} routes found
              </span>
            </div>

            {data.recommended_route && (
              <article className="recommended-card">
                <div className="recommended-top">
                  <span className="recommended-label">
                    ✦ AI-ASSISTED RECOMMENDATION
                  </span>
                  <span className="status-badge">
                    {data.recommended_route.predicted_traffic_status ||
                      data.recommended_route.traffic_status}
                  </span>
                </div>

                <h3>Route {data.recommended_route.route_number}</h3>

                <div className="metrics">
                  <div>
                    <strong>{data.recommended_route.traffic_time_min} min</strong>
                    <span>Travel time</span>
                  </div>
                  <div>
                    <strong>{data.recommended_route.distance_km} km</strong>
                    <span>Distance</span>
                  </div>
                  <div>
                    <strong>{data.recommended_route.traffic_delay_min} min</strong>
                    <span>Traffic delay</span>
                  </div>
                </div>
              </article>
            )}

            <h3 className="routes-title">Available routes</h3>
            <div className="route-list">
              {data.routes?.map((route) => (
                <article className="route-card" key={route.route_number}>
                  <div className="route-number">{route.route_number}</div>
                  <div className="route-info">
                    <strong>Route {route.route_number}</strong>
                    <span>
                      {route.distance_km} km ·{" "}
                      {route.predicted_traffic_status || route.traffic_status} traffic
                    </span>
                  </div>
                  <div className="route-time">
                    <strong>{route.traffic_time_min} min</strong>
                    <span>Estimated time</span>
                  </div>
                  <span className="delay">+{route.traffic_delay_min} min</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {!data && !error && !currentLocation && (
          <section className="info-grid">
            <article className="info-card">
              <span>⌁</span>
              <h3>Live route data</h3>
              <p>Fetch traffic-aware routes from the Google Routes API.</p>
            </article>
            <article className="info-card">
              <span>◈</span>
              <h3>AI predictions</h3>
              <p>Display traffic classifications from your trained model.</p>
            </article>
            <article className="info-card">
              <span>◷</span>
              <h3>Route history</h3>
              <p>Store route searches for historical analysis.</p>
            </article>
          </section>
        )}

        <footer>URBANFLOW · AI-POWERED TRAFFIC OPTIMIZATION</footer>
      </main>
    </div>
  );
}

export default App;
