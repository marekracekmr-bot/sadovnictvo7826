
import { useState } from "react";
import Quiz from "./components/Quiz";
import Quiz4 from "./components/Quiz4";
import Quiz5 from "./components/Quiz5";
import Study from "./components/Study";
import GroupOrganizer from "./components/GroupOrganizer";
import SharedTest from "./components/SharedTest";
import plants from "./data/plants";


function App() {
  // =========================================
  // ZÁKLADNÝ STAV
  // =========================================

  const [category, setCategory] = useState(null);
  const [mode, setMode] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);

  const [testMenu, setTestMenu] = useState(false);
  const [groupMenu, setGroupMenu] = useState(false);

  const [testLimit, setTestLimit] = useState("");
  const [allPlants, setAllPlants] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  // =========================================
  // KATEGÓRIE
  // =========================================

  const categories = [
    {
      name: "Vždyzelené listnaté kry",
      value: "vzdyzelene_kry",
      icon: "🌿"
    },
    {
      name: "Popínavé rastliny",
      value: "popinave",
      icon: "🌱"
    },
    {
      name: "Ihličnany",
      value: "ihlicnany",
      icon: "🌲"
    },
    {
      name: "Opadavé listnaté stromy",
      value: "opadave_stromy",
      icon: "🌳"
    },
    {
      name: "Buriny",
      value: "buriny",
      icon: "🌾"
    }
  ];

  // =========================================
  // POMOCNÉ FUNKCIE
  // =========================================

  function getCategoryPlants() {
    return plants.filter(
      (plant) => plant.category === category
    );
  }

  function getSelectedCategory() {
    return categories.find(
      (item) => item.value === category
    );
  }

  // =========================================
  // VÝUKA
  // =========================================

  if (category && mode === "study") {
    return (
      <Study
        category={category}
        plantId={selectedPlant}
        goBack={() => {
          setMode(null);
          setSelectedPlant(null);
        }}
      />
    );
  }

  // =========================================
  // TEST 4
  // =========================================

  if (mode === "quiz4") {
    const numberOfQuestions = allPlants
      ? plants.filter(
          (plant) => plant.category === category
        ).length
      : Number(testLimit);

    return (
      <Quiz4
        category={category}
        testLimit={numberOfQuestions}
        goBack={() => {
          setMode(null);
          setSelectedTest(null);
          setTestLimit("");
          setAllPlants(false);
        }}
      />
    );
  }

  // =========================================
  // ZAHRAJME SA - QUIZ 5
  // =========================================

  if (mode === "quiz5") {
    const numberOfQuestions = allPlants
      ? plants.filter(
          (plant) => plant.category === category
        ).length
      : Number(testLimit);

    return (
      <Quiz5
        category={category}
        testLimit={numberOfQuestions}
        goBack={() => {
          setMode(null);
          setSelectedTest(null);
          setTestLimit("");
          setAllPlants(false);
        }}
      />
    );
  }

  // =========================================
  // TESTY 1 - 3
  // =========================================

  if (category && mode === "quiz") {
    const numberOfQuestions = allPlants
      ? plants.filter(
          (plant) => plant.category === category
        ).length
      : Number(testLimit);

    return (
      <Quiz
        category={category}
        testType={selectedTest}
        testLimit={numberOfQuestions}
        goBack={() => {
          setMode(null);
          setSelectedPlant(null);
          setSelectedTest(null);
        }}
      />
    );
  }

  // =========================================
  // SKUPINOVÉ TESTOVANIE
  //
  // Celé rieši SharedTest.
  // Heslo sa overuje iba tam.
  // =========================================

  if (category && mode === "shared-test") {
    return (
      <SharedTest
        category={category}
        goBack={() => {
          setMode(null);
        }}
      />
    );
  }

  // =========================================
  // ORGANIZÁTOR
  //
  // SharedTest sem príde až po správnom
  // overení hesla.
  // GroupOrganizer už heslo nepýta.
  // =========================================

  if (category && mode === "group-organizer") {
    return (
      <GroupOrganizer
        category={category}
        goBack={() => {
          setMode(null);
        }}
      />
    );
  }

  // =========================================
  // MENU TESTOV
  // =========================================

  if (category && testMenu) {
    const selectedCategory = getSelectedCategory();
    const categoryPlants = getCategoryPlants();

    return (
      <div className="app">
        <h1>
          {selectedCategory?.icon}{" "}
          {selectedCategory?.name}
        </h1>

        <h2>📝 Testy</h2>

        <p>
          Koľko rastlín chceš v teste?
        </p>

        <input
          type="number"
          min="1"
          max={categoryPlants.length}
          value={testLimit}
          disabled={allPlants}
          onChange={(e) => {
            setTestLimit(e.target.value);
            setAllPlants(false);
          }}
        />

        <div
          style={{
            margin: "15px 0"
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={allPlants}
              onChange={(e) => {
                const checked = e.target.checked;

                setAllPlants(checked);

                if (checked) {
                  setTestLimit(
                    categoryPlants.length
                  );
                } else {
                  setTestLimit("");
                }
              }}
            />

            {" "}
            Všetky rastliny
          </label>
        </div>

        <h3>Vyber test:</h3>

        <div className="test-list">

          {/* =====================================
              TEST 1
              ===================================== */}

          <button
            onClick={() => {
              if (!allPlants && !testLimit) {
                alert(
                  "Vyber počet rastlín."
                );
                return;
              }

              setSelectedTest(1);
              setMode("quiz");
              setTestMenu(false);
            }}
          >
            🌿 Test 1
          </button>

          {/* =====================================
              TEST 2
              ===================================== */}

          <button
            onClick={() => {
              if (!allPlants && !testLimit) {
                alert(
                  "Vyber počet rastlín."
                );
                return;
              }

              setSelectedTest(2);
              setMode("quiz");
              setTestMenu(false);
            }}
          >
            🌱 Test 2
          </button>

          {/* =====================================
              TEST 3
              ===================================== */}

          <button
            onClick={() => {
              if (!allPlants && !testLimit) {
                alert(
                  "Vyber počet rastlín."
                );
                return;
              }

              setSelectedTest(3);
              setMode("quiz");
              setTestMenu(false);
            }}
          >
            🌳 Test 3
          </button>

          {/* =====================================
              TEST 4
              ===================================== */}

          <button
            onClick={() => {
              if (!allPlants && !testLimit) {
                alert(
                  "Vyber počet rastlín."
                );
                return;
              }

              setSelectedTest(4);
              setMode("quiz4");
              setTestMenu(false);
            }}
          >
            🪴 Test 4
          </button>

        </div>

        <br />

        <button
          onClick={() => {
            setTestMenu(false);
            setTestLimit("");
            setAllPlants(false);
          }}
        >
          ⬅ Späť
        </button>
      </div>
    );
  }

  // =========================================
  // ZAHRAJME SA - NASTAVENIE
  // =========================================

  if (category && mode === "game-menu") {
    const selectedCategory = getSelectedCategory();
    const categoryPlants = getCategoryPlants();

    return (
      <div className="app">
        <h1>
          {selectedCategory?.icon}{" "}
          {selectedCategory?.name}
        </h1>

        <h2>🎮 Zahrajme sa</h2>

        <p>
          Koľko rastlín chceš v hre?
        </p>

        <input
          type="number"
          min="1"
          max={categoryPlants.length}
          value={testLimit}
          disabled={allPlants}
          onChange={(e) => {
            setTestLimit(e.target.value);
            setAllPlants(false);
          }}
        />

        <div
          style={{
            margin: "15px 0"
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={allPlants}
              onChange={(e) => {
                const checked = e.target.checked;

                setAllPlants(checked);

                if (checked) {
                  setTestLimit(
                    categoryPlants.length
                  );
                } else {
                  setTestLimit("");
                }
              }}
            />

            {" "}
            Všetky rastliny
          </label>
        </div>

        <button
          onClick={() => {
            if (!allPlants && !testLimit) {
              alert(
                "Vyber počet rastlín."
              );
              return;
            }

            setMode("quiz5");
          }}
        >
          🎯 Spustiť hru
        </button>

        <br />
        <br />

        <button
          onClick={() => {
            setMode(null);
            setTestLimit("");
            setAllPlants(false);
          }}
        >
          ⬅ Späť
        </button>
      </div>
    );
  }

  // =========================================
  // VÝBER KATEGÓRIE
  //
  // Po výbere kategórie sa zobrazí iba
  // menu možností.
  //
  // Tlačidlá používajú rovnakú triedu
  // "categories" ako hlavná stránka,
  // takže majú rovnaký vzhľad.
  //
  // Zoznam rastlín sa tu už nezobrazuje.
  // =========================================

  if (category && !mode) {
    const selectedCategory = getSelectedCategory();

    return (
      <div className="app">
        <h1>
          {selectedCategory?.icon}{" "}
          {selectedCategory?.name}
        </h1>

        <div className="categories">

          {/* =====================================
              VÝUKA
              ===================================== */}

          <button
            onClick={() => {
              setMode("study");
            }}
          >
            📖 Výuka
          </button>

          {/* =====================================
              TESTY
              ===================================== */}

          <button
            onClick={() => {
              setTestMenu(true);
            }}
          >
            📝 Testy
          </button>

          {/* =====================================
              ZAHRAJME SA
              ===================================== */}

          <button
            onClick={() => {
              setMode("game-menu");
            }}
          >
            🎮 Zahrajme sa
          </button>

          {/* =====================================
              SKUPINOVÉ TESTOVANIE
              ===================================== */}

          <button
            onClick={() => {
              setMode("shared-test");
            }}
          >
            👥 Skupinové testovanie
          </button>

          {/* =====================================
              SPÄŤ
              ===================================== */}

          <button
            onClick={() => {
              setCategory(null);
              setSelectedPlant(null);
              setGroupMenu(false);
              setTestMenu(false);
              setMode(null);
              setSelectedTest(null);
              setTestLimit("");
              setAllPlants(false);
            }}
          >
            ⬅ Späť
          </button>

        </div>
      </div>
    );
  }

  // =========================================
  // HLAVNÁ STRÁNKA
  // =========================================

  return (
    <div className="app">
      <h1>🌿 Sadovníctvo</h1>

      <p>
        Precvičovanie a testovanie rastlín
      </p>

      <h2>Vyber kategóriu</h2>

      <div className="categories">
        {categories.map((item) => (
          <button
            key={item.value}
            onClick={() => {
              setCategory(item.value);
            }}
          >
            {item.icon} {item.name}

            <br />

            <small>
              (
              {
                plants.filter(
                  (plant) =>
                    plant.category ===
                    item.value
                ).length
              }{" "}
              rastlín)
            </small>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
