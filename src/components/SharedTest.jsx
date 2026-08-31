import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import plants from "../data/plants";
import GroupOrganizer from "./GroupOrganizer";

function SharedTest({ category, goBack }) {

  const [mode, setMode] = useState(null);

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================
  // TEST 1 – STAV HRÁČA
  // =========================================

  const [options, setOptions] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [answerResult, setAnswerResult] = useState(null);
  const [testStartTime, setTestStartTime] = useState(null);
  const [testTime, setTestTime] = useState(0);

  // =========================================
  // KATEGÓRIE
  // =========================================

  const categories = {
    vzdyzelene_kry: {
      name: "Vždyzelené listnaté kry",
      icon: "🌿"
    },

    popinave: {
      name: "Popínavé rastliny",
      icon: "🌱"
    },

    ihlicnany: {
      name: "Ihličnany",
      icon: "🌲"
    },

    opadave_stromy: {
      name: "Opadavé listnaté stromy",
      icon: "🌳"
    }
  };

  // =========================================
  // AKTUÁLNA RASTLINA
  // =========================================

  function getCurrentPlant() {

    if (!room?.question_data) {
      return null;
    }

    const currentQuestion =
      Number(room.current_question || 0);

    if (currentQuestion < 1) {
      return null;
    }

    const questions =
      Array.isArray(room.question_data)
        ? room.question_data
        : [];

    const question =
      questions[currentQuestion - 1];

    if (!question?.plantId) {
      return null;
    }

    return (
      plants.find(
        (plant) =>
          String(plant.id) ===
          String(question.plantId)
      ) || null
    );
  }

  // =========================================
  // VYTVORENIE 4 MOŽNOSTÍ
  // =========================================

  function createOptions(correctPlant) {

    if (!correctPlant) {
      setOptions([]);
      return;
    }

    const categoryPlants =
      plants.filter(
        (plant) =>
          plant.category === room?.category
      );

    const wrongPlants =
      categoryPlants
        .filter(
          (plant) =>
            String(plant.id) !==
            String(correctPlant.id)
        )
        .sort(
          () => Math.random() - 0.5
        )
        .slice(0, 3);

    const result = [
      correctPlant,
      ...wrongPlants
    ].sort(
      () => Math.random() - 0.5
    );

    setOptions(result);
  }

  // =========================================
  // PRIPOJENIE HRÁČA
  // =========================================

  async function joinRoom() {

    if (!name.trim()) {
      setMessage("Zadaj svoje meno.");
      return;
    }

    if (!roomCode.trim()) {
      setMessage("Zadaj kód miestnosti.");
      return;
    }

    setMessage("");
    setLoading(true);

    try {

      const {
        data: roomData,
        error: roomError
      } = await supabase
        .from("shared_test_rooms")
        .select("*")
        .eq(
          "room_code",
          roomCode.trim().toUpperCase()
        )
        .maybeSingle();

      if (roomError) {
        throw roomError;
      }

      if (!roomData) {
        setMessage(
          "Miestnosť s týmto kódom neexistuje."
        );

        return;
      }

      if (roomData.status === "finished") {
        setMessage(
          "Tento test už bol ukončený."
        );

        return;
      }

      // Spoločný test zatiaľ robíme iba podľa Quiz.jsx,
      // teda Test 1.
      if (Number(roomData.test_type) !== 1) {

        setMessage(
          "Spoločný Test 2, 3 a 4 zatiaľ nie sú upravené."
        );

        return;
      }

      const {
        data: playerData,
        error: playerError
      } = await supabase
        .from("shared_test_players")
        .insert([
          {
            room_id: roomData.id,
            name: name.trim(),
            score: 0,
            current_answer: null,
            answered: false,
            finished: false
          }
        ])
        .select()
        .single();

      if (playerError) {
        throw playerError;
      }

      setRoom(roomData);
      setPlayer(playerData);
      setAnswerResult(null);
      setOptions([]);
      setPhotoIndex(0);
      setMode("player");

    } catch (err) {

      console.error(
        "Chyba pri pripájaní hráča:",
        err
      );

      setMessage(
        "Nepodarilo sa pripojiť k testu. " +
        (err?.message || "")
      );

    } finally {

      setLoading(false);

    }
  }

  // =========================================
  // REALTIME + KONTROLA MIESTNOSTI
  // =========================================

  useEffect(() => {

    if (!room?.id) {
      return;
    }

    const roomId = room.id;

    const checkRoom = async () => {

      const {
        data,
        error
      } = await supabase
        .from("shared_test_rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (error) {

        console.error(
          "PLAYER ROOM CHECK CHYBA:",
          error
        );

        return;
      }

      if (data) {
        setRoom(data);
      }
    };

    checkRoom();

    const interval =
      setInterval(
        checkRoom,
        1000
      );

    const channel =
      supabase
        .channel(
          `shared-test-player-room-${roomId}`
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "shared_test_rooms",
            filter:
              `id=eq.${roomId}`
          },
          (payload) => {

            console.log(
              "PLAYER REALTIME:",
              payload.new
            );

            setRoom(payload.new);

          }
        )
        .subscribe((status) => {

          console.log(
            "PLAYER REALTIME STATUS:",
            status
          );

        });

    return () => {

      clearInterval(interval);

      supabase.removeChannel(
        channel
      );

    };

  }, [room?.id]);

  // =========================================
  // REALTIME – HRÁČ
  // =========================================

  useEffect(() => {

    if (!player?.id) {
      return;
    }

    const channel =
      supabase
        .channel(
          `shared-test-player-${player.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "shared_test_players",
            filter:
              `id=eq.${player.id}`
          },
          (payload) => {

            console.log(
              "PLAYER DATA REALTIME:",
              payload.new
            );

            setPlayer(payload.new);

          }
        )
        .subscribe((status) => {

          console.log(
            "PLAYER REALTIME STATUS:",
            status
          );

        });

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, [player?.id]);

  // =========================================
  // PRÍPRAVA OTÁZKY
  // =========================================

  useEffect(() => {

    if (
      !room ||
      room.status !== "running" ||
      Number(room.test_type) !== 1
    ) {
      return;
    }

    const currentPlant =
      getCurrentPlant();

    if (!currentPlant) {
      return;
    }

    setAnswerResult(null);
    setPhotoIndex(0);
    createOptions(currentPlant);

    // Čas sa spustí pri prvej otázke
    if (
      Number(room.current_question) === 1 &&
      !testStartTime
    ) {

      setTestStartTime(
        Date.now()
      );

    }

  }, [
    room?.current_question,
    room?.status
  ]);

  // =========================================
  // AUTOMATICKÉ MENENIE FOTOGRAFIÍ
  // KAŽDÉ 2 SEKUNDY
  // =========================================

  useEffect(() => {

    if (
      !room ||
      room.status !== "running" ||
      Number(room.test_type) !== 1 ||
      options.length === 0 ||
      answerResult
    ) {
      return;
    }

    const interval =
      setInterval(() => {

        setPhotoIndex(
          (prev) => prev + 1
        );

      }, 2000);

    return () =>
      clearInterval(interval);

  }, [
    room?.status,
    room?.current_question,
    options,
    answerResult
  ]);

  // =========================================
  // ODPOVEĎ
  // =========================================

  async function checkAnswer(selectedPlant) {

    if (
      answerResult ||
      !player ||
      !room ||
      room.status !== "running"
    ) {
      return;
    }

    const correctPlant =
      getCurrentPlant();

    if (!correctPlant) {
      return;
    }

    const correct =
      String(selectedPlant.id) ===
      String(correctPlant.id);

    setAnswerResult({
      correct,
      selected: selectedPlant,
      correctPlant
    });

    try {

      const {
        data,
        error
      } = await supabase
        .from("shared_test_players")
        .update({
          current_answer:
            selectedPlant.id,
          answered: true
        })
        .eq("id", player.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPlayer(data);

    } catch (err) {

      console.error(
        "Chyba pri ukladaní odpovede:",
        err
      );

    }
  }

  // =========================================
  // ODCHOD
  // =========================================

  async function leaveRoom() {

    if (player?.id) {

      await supabase
        .from("shared_test_players")
        .delete()
        .eq(
          "id",
          player.id
        );

    }

    setRoom(null);
    setPlayer(null);
    setMode(null);
    setMessage("");
    setOptions([]);
    setAnswerResult(null);
    setPhotoIndex(0);
    setTestStartTime(null);
    setTestTime(0);

  }

  // =========================================
  // ÚVOD
  // =========================================

  if (!mode) {

    return (
      <div className="app">

        <h1>
          👥 Spoločný test
        </h1>

        <p>
          Vyber, či vytváraš test alebo
          sa pripájaš k existujúcemu testu.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "15px",
            marginTop: "30px"
          }}
        >

          <button
            onClick={() =>
              setMode("organizer")
            }
            style={{
              width: "300px",
              fontSize: "18px",
              padding: "15px"
            }}
          >
            👑 Organizátor
          </button>

          <button
            onClick={() =>
              setMode("playerForm")
            }
            style={{
              width: "300px",
              fontSize: "18px",
              padding: "15px"
            }}
          >
            👤 Pripojiť sa k testu
          </button>

        </div>

        <br />

        {goBack && (
          <button onClick={goBack}>
            ⬅ Späť
          </button>
        )}

      </div>
    );
  }

  // =========================================
  // ORGANIZÁTOR
  // =========================================

  if (mode === "organizer") {

    return (
      <GroupOrganizer
        category={category}
        goBack={() =>
          setMode(null)
        }
      />
    );

  }

  // =========================================
  // HRÁČ – FORMULÁR
  // =========================================

  if (mode === "playerForm") {

    return (
      <div className="app">

        <h1>
          👤 Pripojiť sa k testu
        </h1>

        <p>
          Tvoje meno
        </p>

        <input
          type="text"
          placeholder="Zadaj meno"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          style={{
            fontSize: "18px",
            padding: "10px",
            width: "280px",
            maxWidth: "90%"
          }}
        />

        <p>
          Kód testu
        </p>

        <input
          type="text"
          placeholder="Napr. A7K4"
          value={roomCode}
          onChange={(e) =>
            setRoomCode(
              e.target.value.toUpperCase()
            )
          }
          style={{
            fontSize: "18px",
            padding: "10px",
            width: "280px",
            maxWidth: "90%",
            textAlign: "center"
          }}
        />

        <div
          style={{
            marginTop: "20px"
          }}
        >

          <button
            onClick={joinRoom}
            disabled={loading}
          >
            {loading
              ? "⏳ Pripájam..."
              : "Pripojiť sa"}
          </button>

        </div>

        {message && (
          <p
            style={{
              color: "red",
              fontWeight: "bold"
            }}
          >
            {message}
          </p>
        )}

        <br />

        <button
          onClick={() =>
            setMode(null)
          }
        >
          ⬅ Späť
        </button>

      </div>
    );
  }

  // =========================================
  // HRÁČ
  // =========================================

  if (mode === "player") {

    const selectedCategory =
      categories[room?.category];

    const currentQuestion =
      Number(
        room?.current_question || 0
      );

    const totalQuestions =
      Number(
        room?.total_questions || 0
      );

    const testRunning =
      room?.status === "running";

    const testFinished =
      room?.status === "finished";

    const currentPlant =
      getCurrentPlant();

    // =======================================
    // ČAKÁREŇ
    // =======================================

    if (
      !testRunning &&
      !testFinished
    ) {

      return (
        <div className="app">

          <h1>
            👤 Hráč
          </h1>

          <h2>
            {selectedCategory?.icon}{" "}
            {selectedCategory?.name}
          </h2>

          <p>
            Meno:{" "}
            <strong>
              {player?.name}
            </strong>
          </p>

          <p>
            Kód testu:{" "}
            <strong>
              {room?.room_code}
            </strong>
          </p>

          <hr />

          <h2>
            ⏳ Čakáme na organizátora...
          </h2>

          <p>
            Organizátor zatiaľ test nespustil.
          </p>

          <button
            onClick={leaveRoom}
          >
            ⬅ Opustiť test
          </button>

        </div>
      );
    }

    // =======================================
    // TEST 1 – AKTÍVNA OTÁZKA
    // =======================================

    if (
      testRunning &&
      Number(room?.test_type) === 1
    ) {

      if (!currentPlant) {

        return (
          <div className="app">
            <h2>
              ⏳ Načítavam otázku...
            </h2>
          </div>
        );

      }

      return (
        <div className="app">

          <button
            className="back-button"
            onClick={leaveRoom}
          >
            ⬅ Opustiť test
          </button>

          <h1>
            🌿 Poznaj rastlinu
          </h1>

          <div className="progress">

            <p>

              Otázka{" "}
              {currentQuestion} /{" "}
              {totalQuestions}

              &nbsp;&nbsp;&nbsp;

              ✅ Správne:{" "}
              {player?.score ?? 0}

            </p>

          </div>

          <h2>

            Ktorá rastlina je{" "}

            <i>
              {currentPlant.latin}
            </i>?

          </h2>

          <p>
            Vyber správny obrázok.
          </p>

          {/* =================================
              FOTOGRAFIE
              ================================= */}

          <div className="images">

            {options.map(
              (option) => {

                const photos =
                  option.images || [];

                if (
                  photos.length === 0
                ) {
                  return null;
                }

                const currentPhoto =
                  photos[
                    photoIndex %
                    photos.length
                  ];

                const isSelected =
                  answerResult &&
                  String(
                    answerResult.selected.id
                  ) ===
                  String(option.id);

                const isCorrectPlant =
                  String(option.id) ===
                  String(currentPlant.id);

                return (

                  <div
                    className="quiz-image-wrapper"
                    key={option.id}
                  >

                    <img
                      src={`/plants/${currentPhoto}`}
                      alt={option.name}

                      className={
                        answerResult
                          ? isSelected
                            ? answerResult.correct
                              ? "correct-image"
                              : "wrong-image"
                            : isCorrectPlant
                              ? "correct-image"
                              : "disabled-image"
                          : ""
                      }

                      onClick={() =>
                        !answerResult &&
                        checkAnswer(option)
                      }

                    />

                  </div>

                );

              }
            )}

            {/* =================================
                VÝSLEDOK ODPOVEDE
                ================================= */}

            {answerResult && (

              <div
                className={`answer-overlay ${
                  answerResult.correct
                    ? "correct"
                    : "incorrect"
                }`}
              >

                <div className="answer-title">

                  {answerResult.correct
                    ? "SPRÁVNE!"
                    : "NESPRÁVNE!"}

                </div>

                <div className="answer-info">

                  <div>
                    Klikol si na:
                  </div>

                  <div className="answer-latin">

                    <i>
                      {
                        answerResult
                          .selected
                          .latin
                      }
                    </i>

                  </div>

                  {!answerResult.correct && (
                    <div
                      style={{
                        marginTop:
                          "10px"
                      }}
                    >

                      Správne je:

                      <div
                        className="answer-latin"
                      >
                        <i>
                          {
                            answerResult
                              .correctPlant
                              .latin
                          }
                        </i>
                      </div>

                    </div>
                  )}

                </div>

                <div
                  style={{
                    marginTop: "15px"
                  }}
                >
                  ⏳ Čakaj na organizátora...
                </div>

              </div>

            )}

          </div>

          <p
            style={{
              marginTop: "20px"
            }}
          >
            {answerResult
              ? "Odpoveď bola odoslaná."
              : "Vyber jeden zo štyroch obrázkov."}
          </p>

        </div>
      );
    }

    // =======================================
    // TEST UKONČENÝ
    // =======================================

    if (testFinished) {

      const percentage =
        totalQuestions > 0
          ? Math.round(
              ((player?.score ?? 0) /
                totalQuestions) *
              100
            )
          : 0;

      let resultGif;

      if (percentage === 100) {

        resultGif =
          "/gifs/test100.gif";

      } else if (percentage >= 61) {

        resultGif =
          "/gifs/testdo99.gif";

      } else if (percentage >= 26) {

        resultGif =
          "/gifs/testdo60.gif";

      } else {

        resultGif =
          "/gifs/testdo25.gif";

      }

      const minutes =
        Math.floor(testTime / 60);

      const seconds =
        testTime % 60;

      const formattedTime =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      return (
        <div className="app">

          <h1>
            🏆 Vyhodnotenie
          </h1>

          <img
            src={resultGif}
            alt="Výsledok testu"
            style={{
              maxWidth: "270px",
              width: "90%",
              margin: "20px auto",
              display: "block"
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              maxWidth: "500px",
              width: "90%",
              margin: "20px auto",
              border: "1px solid #ccc",
              borderRadius: "10px",
              overflow: "hidden",
              background: "white"
            }}
          >

            <div
              style={{
                padding: "10px 5px",
                textAlign: "center",
                borderRight:
                  "1px solid #ccc"
              }}
            >

              <div>
                Otázky
              </div>

              <strong>
                {player?.score ?? 0}
                {" / "}
                {totalQuestions}
              </strong>

            </div>

            <div
              style={{
                padding: "10px 5px",
                textAlign: "center",
                borderRight:
                  "1px solid #ccc"
              }}
            >

              <div>
                Úspešnosť
              </div>

              <strong>
                {percentage} %
              </strong>

            </div>

            <div
              style={{
                padding: "10px 5px",
                textAlign: "center"
              }}
            >

              <div>
                Čas
              </div>

              <strong>
                {formattedTime}
              </strong>

            </div>

          </div>

          <button
            onClick={leaveRoom}
          >
            ⬅ Späť
          </button>

        </div>
      );
    }
  }

  return null;
}

export default SharedTest;