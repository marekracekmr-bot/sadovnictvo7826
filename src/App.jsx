import { useState } from "react";
import Quiz from "./components/Quiz";
import Study from "./components/Study";
import plants from "./data/plants";

function App() {
  const [category, setCategory] = useState(null);
  const [mode, setMode] = useState(null);

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

  if (category && mode === "study") {
  return (
    <Study
      category={category}
      goBack={() => {
        setMode(null);
        setCategory(null);
      }}
    />
  );
}

if (category && mode === "quiz") {
  return (
    <Quiz
      category={category}
      goBack={() => {
        setMode(null);
        setCategory(null);
      }}
    />
  );
}

if (category && !mode) {
  const selectedCategory = categories.find(
    (item) => item.value === category
  );

  return (
    <div className="app">

      <h1>{selectedCategory.icon} {selectedCategory.name}</h1>

      <button onClick={() => setMode("study")}>
        📖 Výuka
      </button>

      <br />

      <button onClick={() => setMode("quiz")}>
        📝 Test
      </button>

      <br /><br />

      <button onClick={() => setCategory(null)}>
        ⬅ Späť
      </button>

    </div>
  );
}

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