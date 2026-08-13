import { useState } from "react";
import Quiz from "./components/Quiz";
import Study from "./components/Study";
import plants from "./data/plants";

function App() {
  const [category, setCategory] = useState(null);
  const [mode, setMode] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);

  const [testMenu, setTestMenu] = useState(false);
  const [testLimit, setTestLimit] = useState("");
  const [allPlants, setAllPlants] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

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
    }
  ];

  /* VÝUKA */

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

  /* TEST */

  if (category && mode === "quiz") {
    return (
      <Quiz
  category={category}
  testType={selectedTest}
  testLimit={allPlants ? plants.filter(
    (plant) => plant.category === category
  ).length : Number(testLimit)}
  goBack={() => {
    setMode(null);
    setSelectedPlant(null);
  }}
/>
    );
  }

  /* MENU TESTOV */

  if (category && testMenu) {
    const selectedCategory = categories.find(
      (item) => item.value === category
    );

    const categoryPlants = plants.filter(
      (plant) => plant.category === category
    );

    return (
      <div className="app">

        <h1>
          {selectedCategory.icon} {selectedCategory.name}
        </h1>

        <h2>📝 Testy</h2>

        <p>Koľko rastlín chceš v teste?</p>

        <input
          type="number"
          min="1"
          max={categoryPlants.length}
          value={testLimit}
          onChange={(e) => {
            setTestLimit(e.target.value);
            setAllPlants(false);
          }}
        />

        <div style={{ margin: "15px 0" }}>

          <label>
            <input
              type="checkbox"
              checked={allPlants}
              onChange={(e) => {
                setAllPlants(e.target.checked);

                if (e.target.checked) {
                  setTestLimit(categoryPlants.length);
                } else {
                  setTestLimit("");
                }
              }}
            />

            {" "}Všetky rastliny
          </label>

        </div>

        <h3>Vyber test:</h3>

        <div className="test-list">

          <button
            onClick={() => {
              if (!allPlants && !testLimit) {
                alert("Vyber počet rastlín.");
                return;
              }

              setSelectedTest(1);
              setMode("quiz");
              setTestMenu(false);
            }}
          >
            🌿 Test 1
          </button>

          <button
            onClick={() => {
              if (!allPlants && !testLimit) {
                alert("Vyber počet rastlín.");
                return;
              }

              setSelectedTest(2);
              setMode("quiz");
              setTestMenu(false);
            }}
          >
            🌱 Test 2
          </button>

          <button
  onClick={() => {
    if (!allPlants && !testLimit) {
      alert("Vyber počet rastlín.");
      return;
    }

    setSelectedTest(3);
    setMode("quiz");
    setTestMenu(false);
  }}
>
  🌳 Test 3
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

  /* VÝBER KATEGÓRIE */

  if (category && !mode) {
    const selectedCategory = categories.find(
      (item) => item.value === category
    );

    const categoryPlants = plants
      .filter((plant) => plant.category === category)
      .sort((a, b) => a.latin.localeCompare(b.latin));

    return (
      <div className="app">

        <h1>
          {selectedCategory.icon} {selectedCategory.name}
        </h1>

        <div className="category-buttons">

          <button onClick={() => setMode("study")}>
            📖 Výuka
          </button>

          <button onClick={() => setTestMenu(true)}>
            📝 Testy
          </button>

          <button
            onClick={() => {
              setCategory(null);
              setSelectedPlant(null);
            }}
          >
            ⬅ Späť
          </button>

        </div>

        <h2>🌿 Zoznam rastlín</h2>

        <div className="plant-list">

          {categoryPlants.map((plant) => (
            <button
              key={plant.id}
              onClick={() => {
                setSelectedPlant(plant.id);
                setMode("study");
              }}
            >
              <i>{plant.latin}</i> – {plant.name}
            </button>
          ))}

        </div>

      </div>
    );
  }

  /* HLAVNÁ STRÁNKA */

  return (
    <div className="app">

      <h1>🌿 Sadovníctvo</h1>

      <p>Precvičovanie a testovanie rastlín</p>

      <h2>Vyber kategóriu</h2>

      <div className="categories">

        {categories.map((item) => (

          <button
            key={item.value}
            onClick={() => setCategory(item.value)}
          >
            {item.icon} {item.name}

            <br />

            <small>
              (
              {
                plants.filter(
                  (plant) => plant.category === item.value
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