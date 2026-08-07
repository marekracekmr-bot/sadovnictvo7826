import { useState } from "react";
import plants from "../data/plants";

function Study({ category, goBack }) {
  
  const [limit, setLimit] = useState("");
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const categoryPlants = plants.filter(
    (plant) => plant.category === category
  );

  const studyPlants = categoryPlants.slice(
    0,
    limit ? Number(limit) : categoryPlants.length
  );
  if (!started) {
  return (
    <div className="app">

      <h1>📖 Výuka rastlín</h1>

      <p>Koľko rastlín chceš precvičiť?</p>

      <input
        type="number"
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
      />

      <br /><br />

      <button onClick={() => setStarted(true)}>
        ▶️ Začať výuku
      </button>

      <br />

      <button
        onClick={() => {
          setLimit(categoryPlants.length);
          setStarted(true);
        }}
      >
        🌿 Všetky rastliny
      </button>

      <br /><br />

      <button onClick={goBack}>
        ⬅ Späť
      </button>

    </div>
  );
}
  const plant = studyPlants[currentIndex];

  function nextPlant() {
  if (currentIndex < studyPlants.length - 1) {
    setCurrentIndex(currentIndex + 1);
    setShowInfo(false);
    setShowDetail(false);
  }
}

  function previousPlant() {
  if (currentIndex > 0) {
    setCurrentIndex(currentIndex - 1);
    setShowInfo(false);
    setShowDetail(false);
  }
}

  return (
    <div className="app">

      <button
        className="back-button"
        onClick={goBack}
      >
        ⬅ Späť
      </button>

      <h1>📖 Výuka rastlín</h1>

      <p>
        {currentIndex + 1} / {studyPlants.length}
      </p>

      <img
  src={`/plants/${
    showDetail && plant.detailImage
      ? plant.detailImage
      : plant.image
  }`}
  alt={plant.name}
  style={{
    width: "650px",
    maxWidth: "90%",
    borderRadius: "15px"
  }}
/>

{plant.detailImage && (
  <div style={{ marginTop: "15px" }}>
    <button onClick={() => setShowDetail(!showDetail)}>
      {showDetail
        ? "🌿 Zobraziť hlavnú fotku"
        : "🔍 Zobraziť detail"}
    </button>
  </div>
)}


      {!showInfo ? (
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => setShowInfo(true)}>
            👁️ Zobraziť názov
          </button>
        </div>
      ) : (
        <div className="result">

          <h2><i>{plant.latin}</i></h2>

          <p>{plant.name}</p>

          <p>
            Čeľaď: {plant.family}
          </p>
            
            
          <button onClick={() => setShowInfo(false)}>
            🙈 Skryť názov
          </button>

        </div>
      )}

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "15px"
        }}
      >

        <button
          onClick={previousPlant}
          disabled={currentIndex === 0}
        >
          ⬅ Predchádzajúca
        </button>

        <button
          onClick={nextPlant}
          disabled={currentIndex === studyPlants.length - 1}
        >
          Ďalšia ➡
        </button>

      </div>

    </div>
  );
}

export default Study;