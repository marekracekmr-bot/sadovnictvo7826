import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import plants from "../data/plants";

function GroupOrganizer({ category, goBack }) {

  const [testType, setTestType] = useState("");
  const [testLimit, setTestLimit] = useState("");
  const [allPlants, setAllPlants] = useState(false);

  // =========================================
  // HESLO ORGANIZÁTORA
  // =========================================

  const [organizerPassword, setOrganizerPassword] =
    useState("");

  const [roomCode, setRoomCode] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [room, setRoom] = useState(null);

  const [players, setPlayers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [changingQuestion, setChangingQuestion] =
    useState(false);
  const [finishing, setFinishing] = useState(false);

  const [error, setError] = useState("");

  // Počet nesprávnych odpovedí z predošlých uzavretých kôl
  const [wrongAnswers, setWrongAnswers] =
    useState({});

  // Zabráni dvojitému zápisu tej istej otázky do DB pri prechode na ďalšiu otázku
  const processedAnswersRef =
    useRef(new Set());

  // =========================================
  // RASTLINY KATEGÓRIE
  // =========================================

  const categoryPlants = plants.filter(
    (plant) =>
      plant.category === category
  );

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
    },

    buriny: {
      name: "Buriny",
      icon: "🌵"
    },

    crep_kvet_okrasne_listom: {
      name: "Črepníkové kvety okrasné listom",
      icon: "🪴"
    }
  };

  const selectedCategory =
    categories[category];

  // =========================================
  // NÁHODNÝ KÓD MIESTNOSTI
  // =========================================

  function generateRoomCode() {

    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 4; i++) {

      code += characters.charAt(
        Math.floor(
          Math.random() *
          characters.length
        )
      );

    }

    return code;
  }

  // =========================================
  // VYTVORENIE OTÁZOK
  // =========================================

  function createQuestionData(
    numberOfQuestions
  ) {

    const shuffled =
      [...categoryPlants]
        .sort(
          () => Math.random() - 0.5
        );

    const selectedPlants =
      shuffled.slice(
        0,
        numberOfQuestions
      );

    return selectedPlants.map(
      (plant, index) => ({
        question: index + 1,
        plantId: plant.id
      })
    );
  }

  // =========================================
  // SPRÁVNA RASTLINA AKTUÁLNEJ OTÁZKY
  // =========================================

  function getCurrentQuestionPlant() {

    if (!room?.question_data) {
      return null;
    }

    const questionNumber =
      Number(
        room.current_question || 0
      );

    if (questionNumber < 1) {
      return null;
    }

    const questions =
      Array.isArray(room.question_data)
        ? room.question_data
        : [];

    const question =
      questions[
        questionNumber - 1
      ];

    if (!question) {
      return null;
    }

    const plantId =
      question.plantId;

    if (!plantId) {
      return null;
    }

    return (
      plants.find(
        (plant) =>
          String(plant.id) ===
          String(plantId)
      ) || null
    );
  }

  // =========================================
  // NAČÍTANIE MIESTNOSTI
  // =========================================

  async function loadRoom(id) {

    if (!id) {
      return;
    }

    const {
      data,
      error: roomError
    } = await supabase
      .from("shared_test_rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (roomError) {

      console.error(
        "Chyba pri načítaní miestnosti:",
        roomError
      );

      return;
    }

    setRoom(data);
  }

  // =========================================
  // NAČÍTANIE HRÁČOV
  // =========================================

  async function loadPlayers(id) {

    if (!id) {
      return;
    }

    const {
      data,
      error: playersError
    } = await supabase
      .from("shared_test_players")
      .select("*")
      .eq("room_id", id)
      .order("joined_at", {
        ascending: true
      });

    if (playersError) {

      console.error(
        "Chyba pri načítaní hráčov:",
        playersError
      );

      return;
    }

    setPlayers(data || []);
  }

  // =========================================
  // REALTIME + ZÁLOŽNÝ POLLING – HRÁČI A MIESTNOSŤ
  // =========================================

  useEffect(() => {

    if (!roomId) {
      return;
    }

    loadRoom(roomId);
    loadPlayers(roomId);

    // Okamžitá aktualizácia pri zmene v tabuľke hráčov (napr. kliknutie na odpoveď)
    const playersChannel =
      supabase
        .channel(
          `shared-test-players-${roomId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "shared_test_players",
            filter:
              `room_id=eq.${roomId}`
          },
          (payload) => {

            if (payload.eventType === "UPDATE" && payload.new) {
              setPlayers((prev) =>
                prev.map((p) =>
                  p.id === payload.new.id ? payload.new : p
                )
              );
            } else {
              loadPlayers(roomId);
            }

          }
        )
        .subscribe();

    const roomChannel =
      supabase
        .channel(
          `shared-test-room-${roomId}`
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

            setRoom(payload.new);

          }
        )
        .subscribe();

    // Záložná kontrola každú 1 sekundu pre prípad slabého signálu v triede
    const fallbackInterval = setInterval(() => {
      loadPlayers(roomId);
    }, 1000);

    return () => {

      clearInterval(fallbackInterval);

      supabase.removeChannel(
        playersChannel
      );

      supabase.removeChannel(
        roomChannel
      );

    };

  }, [roomId]);

  // =========================================
  // VYTVORENIE MIESTNOSTI
  // =========================================

  async function createRoom() {

    setError("");

    if (!organizerPassword.trim()) {

      setError(
        "Zadaj heslo organizátora."
      );

      return;
    }

    setLoading(true);

    try {

      const {
        data: passwordCorrect,
        error: passwordError
      } = await supabase.rpc(
        "check_organizer_password",
        {
          input_password:
            organizerPassword.trim()
        }
      );

      if (passwordError) {
        throw passwordError;
      }

      if (passwordCorrect !== true) {

        setError(
          "Nesprávne heslo organizátora."
        );

        return;
      }

      if (!testType) {

        setError(
          "Vyber typ testu."
        );

        return;
      }

      if (
        !allPlants &&
        !testLimit
      ) {

        setError(
          "Vyber počet rastlín."
        );

        return;
      }

      const numberOfQuestions =
        allPlants
          ? categoryPlants.length
          : Number(testLimit);

      if (
        numberOfQuestions < 1 ||
        numberOfQuestions >
          categoryPlants.length
      ) {

        setError(
          `Počet musí byť od 1 do ${categoryPlants.length}.`
        );

        return;
      }

      let code =
        generateRoomCode();

      let codeExists = true;

      while (codeExists) {

        const {
          data,
          error: checkError
        } = await supabase
          .from("shared_test_rooms")
          .select("id")
          .eq(
            "room_code",
            code
          )
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (!data) {

          codeExists = false;

        } else {

          code =
            generateRoomCode();

        }

      }

      const questionData =
        createQuestionData(
          numberOfQuestions
        );

      const {
        data,
        error: insertError
      } = await supabase
        .from("shared_test_rooms")
        .insert([
          {
            room_code:
              code,

            category:
              category,

            test_type:
              Number(testType),

            total_questions:
              numberOfQuestions,

            current_question:
              0,

            status:
              "waiting",

            question_data:
              questionData
          }
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setWrongAnswers({});

      processedAnswersRef.current =
        new Set();

      setRoomCode(
        data.room_code
      );

      setRoomId(
        data.id
      );

      setRoom(data);

      setPlayers([]);

    } catch (err) {

      console.error(
        "Chyba pri vytváraní miestnosti:",
        err
      );

      setError(
        "Miestnosť sa nepodarilo vytvoriť. " +
        (err?.message || "")
      );

    } finally {

      setLoading(false);

    }

  }

  // =========================================
  // SPUSTENIE TESTU
  // =========================================

  async function startTest() {

    if (!roomId) {
      return;
    }

    if (players.length === 0) {

      setError(
        "Najprv sa musí pripojiť aspoň jeden hráč."
      );

      return;
    }

    setError("");
    setStarting(true);

    try {

      const {
        data,
        error: updateError
      } = await supabase
        .from("shared_test_rooms")
        .update({

          status:
            "running",

          current_question:
            1,

          started_at:
            new Date().toISOString()

        })
        .eq("id", roomId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setWrongAnswers({});

      processedAnswersRef.current =
        new Set();

      setRoom(data);

    } catch (err) {

      console.error(
        "Chyba pri spúšťaní testu:",
        err
      );

      setError(
        "Test sa nepodarilo spustiť. " +
        (err?.message || "")
      );

    } finally {

      setStarting(false);

    }

  }

  // =========================================
  // VYHODNOTENIE AKTUÁLNEJ OTÁZKY DO DATABÁZY
  // =========================================

  async function evaluateCurrentQuestion() {

    const currentQuestion =
      Number(
        room?.current_question || 0
      );

    const questions =
      Array.isArray(
        room?.question_data
      )
        ? room.question_data
        : [];

    const currentQuestionData =
      questions[
        currentQuestion - 1
      ];

    const correctPlantId =
      currentQuestionData?.plantId;

    if (
      currentQuestion < 1 ||
      !correctPlantId
    ) {
      return;
    }

    for (const player of players) {

      const answerKey =
        `${player.id}-${currentQuestion}`;

      if (
        processedAnswersRef.current.has(
          answerKey
        )
      ) {
        continue;
      }

      processedAnswersRef.current.add(
        answerKey
      );

      if (!player.answered) {

        setWrongAnswers(
          (previous) => ({
            ...previous,
            [player.id]:
              (previous[player.id] || 0) + 1
          })
        );

        continue;
      }

      const isCorrect =
        String(
          player.current_answer
        ) ===
        String(
          correctPlantId
        );

      if (isCorrect) {

        const newScore =
          Number(
            player.score || 0
          ) + 1;

        const {
          data,
          error
        } = await supabase
          .from("shared_test_players")
          .update({
            score:
              newScore
          })
          .eq(
            "id",
            player.id
          )
          .select()
          .single();

        if (error) {

          console.error(
            "Chyba pri zvýšení skóre:",
            error
          );

          continue;
        }

        setPlayers(
          (previous) =>
            previous.map(
              (p) =>
                p.id === data.id
                  ? data
                  : p
            )
        );

      } else {

        setWrongAnswers(
          (previous) => ({
            ...previous,
            [player.id]:
              (previous[player.id] || 0) + 1
          })
        );

      }

    }

  }

  // =========================================
  // ĎALŠIA OTÁZKA
  // =========================================

  async function nextQuestion() {

    if (!roomId || !room) {
      return;
    }

    const currentQuestion =
      Number(
        room.current_question || 0
      );

    const totalQuestions =
      Number(
        room.total_questions || 0
      );

    if (
      currentQuestion < 1 ||
      currentQuestion > totalQuestions
    ) {
      return;
    }

    setError("");
    setChangingQuestion(true);

    try {

      await evaluateCurrentQuestion();

      if (
        currentQuestion >=
        totalQuestions
      ) {
        return;
      }

      const {
        error: resetError
      } = await supabase
        .from(
          "shared_test_players"
        )
        .update({

          current_answer:
            null,

          answered:
            false,

          finished:
            false

        })
        .eq(
          "room_id",
          roomId
        );

      if (resetError) {
        throw resetError;
      }

      const nextQuestionNumber =
        currentQuestion + 1;

      const {
        data,
        error: updateError
      } = await supabase
        .from(
          "shared_test_rooms"
        )
        .update({

          current_question:
            nextQuestionNumber

        })
        .eq(
          "id",
          roomId
        )
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setRoom(data);

    } catch (err) {

      console.error(
        "Chyba pri prechode na ďalšiu otázku:",
        err
      );

      setError(
        "Nepodarilo sa prejsť na ďalšiu otázku. " +
        (err?.message || "")
      );

    } finally {

      setChangingQuestion(false);

    }

  }

  // =========================================
  // UKONČENIE TESTU
  // =========================================

  async function finishTest() {

    if (!roomId || !room) {
      return;
    }

    setError("");
    setFinishing(true);

    try {

      const currentQuestion =
        Number(
          room.current_question || 0
        );

      const totalQuestions =
        Number(
          room.total_questions || 0
        );

      if (
        room.status === "running" &&
        currentQuestion === totalQuestions
      ) {

        await evaluateCurrentQuestion();

      }

      const {
        data,
        error: updateError
      } = await supabase
        .from(
          "shared_test_rooms"
        )
        .update({

          status:
            "finished",

          finished_at:
            new Date().toISOString()

        })
        .eq(
          "id",
          roomId
        )
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setRoom(data);

    } catch (err) {

      console.error(
        "Chyba pri ukončení testu:",
        err
      );

      setError(
        "Test sa nepodarilo ukončiť. " +
        (err?.message || "")
      );

    } finally {

      setFinishing(false);

    }

  }

  // =========================================
  // STAV TESTU
  // =========================================

  const currentQuestion =
    Number(
      room?.current_question || 0
    );

  const totalQuestions =
    Number(
      room?.total_questions || 0
    );

  const currentQuestionPlant =
    getCurrentQuestionPlant();

  const answeredPlayers =
    players.filter(
      (player) =>
        player.answered
    ).length;

  const testRunning =
    room?.status === "running";

  const testFinished =
    room?.status === "finished";

  // =========================================
  // OKAMŽITÝ PREPOČET SKÓRE, PERCENTA A MENA
  // =========================================

  function getPlayerScoreText(
    player
  ) {

    let correct =
      Number(
        player.score || 0
      );

    let wrong =
      Number(
        wrongAnswers[player.id] || 0
      );

    // Ak test beží, aktuálna otázka ešte nebola uložená do DB a hráč už klikol na odpoveď,
    // okamžite ju započítame do zobrazeného skóre a percenta
    const answerKey =
      `${player.id}-${currentQuestion}`;

    if (
      testRunning &&
      player.answered &&
      !processedAnswersRef.current.has(answerKey) &&
      currentQuestionPlant
    ) {
      const isCurrentCorrect =
        String(player.current_answer) ===
        String(currentQuestionPlant.id);

      if (isCurrentCorrect) {
        correct += 1;
      } else {
        wrong += 1;
      }
    }

    const total =
      totalQuestions;

    const evaluatedCount = correct + wrong;

    const percentage =
      evaluatedCount > 0
        ? Math.round((correct / evaluatedCount) * 100)
        : 0;

    return {
      correct,
      wrong,
      total,
      percentage
    };

  }

  function formatPlayerName(name) {
    return String(name || "").trim().slice(0, 8);
  }

  // Zoraď hráčov okamžite podľa aktuálne prepočítaného počtu správnych odpovedí
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = getPlayerScoreText(a);
    const scoreB = getPlayerScoreText(b);
    if (scoreB.correct !== scoreA.correct) {
      return scoreB.correct - scoreA.correct;
    }
    return scoreB.percentage - scoreA.percentage;
  });

  // =========================================
  // ORGANIZÁTOR – ČAKÁREŇ / TEST
  // =========================================

  if (roomCode) {

    return (
      <div className="app">

        <h1>
          👑 Organizátor testu
        </h1>

        <h2>
          {selectedCategory?.icon}{" "}
          {selectedCategory?.name}
        </h2>

        <div
          style={{
            margin: "15px auto",
            padding: "16px",
            maxWidth: "520px",
            border: "2px solid #ccc",
            borderRadius: "12px",
            background: "#fff"
          }}
        >

          <p style={{ margin: "4px 0" }}>
            Kód spoločného testu:
          </p>

          <div
            style={{
              fontSize: "40px",
              fontWeight: "bold",
              letterSpacing: "8px",
              margin: "8px 0"
            }}
          >
            {roomCode}
          </div>

          <hr />

          <p style={{ margin: "4px 0" }}>
            <strong>Test:</strong> Test {testType} &nbsp;|&nbsp;
            <strong>Otázky:</strong>{" "}
            {room?.total_questions ||
              (allPlants ? categoryPlants.length : testLimit)}
          </p>

          {/* =================================
              AKTUÁLNA OTÁZKA
              ================================= */}

          {testRunning && (
            <>

              <hr />

              <h2 style={{ margin: "8px 0" }}>
                📝 Otázka{" "}
                {currentQuestion} /{" "}
                {totalQuestions}
              </h2>

              {currentQuestionPlant && (
                <div
                  key={`org-question-${currentQuestion}`}
                  style={{
                    margin: "10px 0",
                    padding: "10px",
                    border:
                      "2px solid #2196f3",
                    borderRadius:
                      "10px",
                    background:
                      "#e3f2fd"
                  }}
                >

                  <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                    Ktorá rastlina je:
                  </p>

                  <div
                    style={{
                      fontSize: "22px"
                    }}
                  >
                    <i translate="no">
                      {currentQuestionPlant.latin}
                    </i>
                  </div>

                </div>
              )}

              <div
                style={{
                  margin: "10px 0",
                  padding: "8px 12px",
                  border:
                    "2px solid #4caf50",
                  borderRadius:
                    "10px",
                  fontSize: "15px"
                }}
              >
                Odpovedalo:{" "}
                <strong>
                  {answeredPlayers}
                </strong>{" "}
                z{" "}
                <strong>
                  {players.length}
                </strong>
              </div>

              <button
                onClick={
                  nextQuestion
                }
                disabled={
                  changingQuestion
                }
                style={{
                  fontSize:
                    "16px",
                  padding:
                    "10px 20px"
                }}
              >

                {changingQuestion
                  ? "⏳ Vyhodnocujem..."
                  : currentQuestion >=
                    totalQuestions
                  ? "✅ Vyhodnotiť poslednú otázku"
                  : "➡ Ďalšia otázka"}

              </button>

              {currentQuestion >=
                totalQuestions && (
                <>
                  <br />
                  <button
                    onClick={
                      finishTest
                    }
                    disabled={
                      finishing
                    }
                    style={{
                      fontSize:
                        "16px",
                      padding:
                        "10px 20px",
                      marginTop: "6px"
                    }}
                  >

                    {finishing
                      ? "⏳ Ukončujem..."
                      : "🏁 Ukončiť test"}

                  </button>
                </>
              )}

            </>
          )}

          {/* =================================
              TEST UKONČENÝ
              ================================= */}

          {testFinished && (
            <>

              <hr />

              <h2>
                🏁 Test je ukončený
              </h2>

              <h3>
                👥 Výsledky hráčov
              </h3>

              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}
              >

                {sortedPlayers.map(
                  (
                    player,
                    index
                  ) => {

                    const score =
                      getPlayerScoreText(
                        player
                      );

                    return (
                      <div
                        key={
                          player.id
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          background: "#f5f5f5",
                          fontSize: "15px"
                        }}
                      >

                        <strong>
                          {index + 1}.{" "}
                          {formatPlayerName(player.name)}
                        </strong>

                        <span>
                          <span
                            style={{
                              color: "green",
                              fontWeight: "bold"
                            }}
                          >
                            {score.correct}
                          </span>
                          {" / "}
                          <span
                            style={{
                              color: "red",
                              fontWeight: "bold"
                            }}
                          >
                            {score.wrong}
                          </span>
                          {" / "}
                          <strong>
                            {score.total}
                          </strong>
                          {" "}
                          <span style={{ color: "#333", fontWeight: "bold" }}>
                            ({score.percentage} %)
                          </span>
                        </span>

                      </div>
                    );

                  }
                )}

              </div>

            </>
          )}

          {/* =================================
              ČAKÁREŇ
              ================================= */}

          {!testRunning &&
            !testFinished && (
              <>

                <hr />

                <h3 style={{ margin: "8px 0" }}>
                  👥 Pripojení hráči:{" "}
                  {players.length}
                </h3>

                {players.length === 0 ? (

                  <div>
                    <p>
                      ⏳ Zatiaľ sa nepripojil žiadny hráč.
                    </p>
                  </div>

                ) : (

                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px"
                    }}
                  >

                    {sortedPlayers.map(
                      (
                        player,
                        index
                      ) => {

                        const score =
                          getPlayerScoreText(
                            player
                          );

                        return (
                          <div
                            key={
                              player.id
                            }
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 10px",
                              border: "1px solid #ccc",
                              borderRadius: "6px",
                              background: "#f5f5f5",
                              fontSize: "15px"
                            }}
                          >

                            <strong>
                              {index + 1}.{" "}
                              {formatPlayerName(player.name)}
                            </strong>

                            <span>
                              <span
                                style={{
                                  color: "green",
                                  fontWeight: "bold"
                                }}
                              >
                                {score.correct}
                              </span>
                              {" / "}
                              <span
                                style={{
                                  color: "red",
                                  fontWeight: "bold"
                                }}
                              >
                                {score.wrong}
                              </span>
                              {" / "}
                              <strong>
                                {score.total}
                              </strong>
                              {" "}
                              <span style={{ color: "#333", fontWeight: "bold" }}>
                                ({score.percentage} %)
                              </span>
                            </span>

                          </div>
                        );

                      }
                    )}

                  </div>

                )}

                {error && (
                  <p
                    style={{
                      color:
                        "red",
                      fontWeight:
                        "bold"
                    }}
                  >
                    {error}
                  </p>
                )}

                <br />

                <button
                  onClick={
                    startTest
                  }
                  disabled={
                    starting ||
                    players.length ===
                      0
                  }
                  style={{
                    fontSize:
                      "18px",
                    padding:
                      "12px 24px"
                  }}
                >

                  {starting
                    ? "⏳ Spúšťam test..."
                    : "🚀 Spustiť test"}

                </button>

              </>
            )}

          {/* =================================
              HRÁČI POČAS TESTU (HUSTÝ ZOZNAM)
              ================================= */}

          {testRunning && (
            <div
              style={{
                marginTop: "14px",
                textAlign: "left"
              }}
            >

              <hr />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}
              >

                {sortedPlayers.map(
                  (
                    player,
                    index
                  ) => {

                    const score =
                      getPlayerScoreText(
                        player
                      );

                    return (
                      <div
                        key={
                          player.id
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "5px 10px",
                          border: player.answered
                            ? "1px solid #66bb6a"
                            : "1px solid #ef5350",
                          borderRadius: "6px",
                          background: player.answered
                            ? "#c8e6c9"
                            : "#ffcdd2",
                          fontSize: "15px",
                          lineHeight: "1.2"
                        }}
                      >

                        <strong>
                          {index + 1}.{" "}
                          {formatPlayerName(player.name)}
                        </strong>

                        <span>
                          <span
                            style={{
                              color: "#1b5e20",
                              fontWeight: "bold"
                            }}
                          >
                            {score.correct}
                          </span>
                          {" / "}
                          <span
                            style={{
                              color: "#b71c1c",
                              fontWeight: "bold"
                            }}
                          >
                            {score.wrong}
                          </span>
                          {" / "}
                          <strong>
                            {score.total}
                          </strong>
                          {" "}
                          <span style={{ color: "#222", fontWeight: "bold" }}>
                            ({score.percentage} %)
                          </span>
                        </span>

                      </div>
                    );

                  }
                )}

              </div>

            </div>
          )}

          {error &&
            (
              testRunning ||
              testFinished
            ) && (
              <p
                style={{
                  color:
                    "red",
                  fontWeight:
                    "bold"
                }}
              >
                {error}
              </p>
            )}

        </div>

        <button
          onClick={
            goBack
          }
        >
          ⬅ Späť
        </button>

      </div>
    );

  }

  // =========================================
  // VYTVORENIE TESTU
  // =========================================

  return (

    <div className="app">

      <h1>
        👑 Organizátor testu
      </h1>

      <h2>
        {selectedCategory?.icon}{" "}
        {selectedCategory?.name}
      </h2>

      <p>
        Nastav spoločný test:
      </p>

      {/* ===================================
          HESLO ORGANIZÁTORA
          =================================== */}

      <p>
        <strong>
          Heslo organizátora:
        </strong>
      </p>

      <input
        type="password"
        value={
          organizerPassword
        }
        onChange={(e) =>
          setOrganizerPassword(
            e.target.value
          )
        }
        placeholder="Zadaj heslo"
        autoComplete="off"
        style={{
          fontSize: "18px",
          padding: "10px",
          width: "280px",
          maxWidth: "90%"
        }}
      />

      <p
        style={{
          fontSize: "14px",
          color: "#666"
        }}
      >
        Heslo sa overí cez Supabase.
      </p>

      <p>
        Koľko rastlín bude v teste?
      </p>

      <input
        type="number"
        min="1"
        max={
          categoryPlants.length
        }
        value={
          testLimit
        }
        disabled={
          allPlants
        }
        onChange={(e) => {

          setTestLimit(
            e.target.value
          );

          setAllPlants(
            false
          );

        }}
      />

      <div
        style={{
          margin:
            "15px 0"
        }}
      >

        <label>

          <input
            type="checkbox"
            checked={
              allPlants
            }
            onChange={(e) => {

              const checked =
                e.target.checked;

              setAllPlants(
                checked
              );

              if (checked) {

                setTestLimit(
                  categoryPlants.length
                );

              } else {

                setTestLimit(
                  ""
                );

              }

            }}
          />

          {" "}
          Všetky rastliny

        </label>

      </div>

      <h3>
        Vyber test:
      </h3>

      <div className="test-list">

        <button
          onClick={() =>
            setTestType("1")
          }
        >
          🌿 Test 1
        </button>

        <button
          onClick={() =>
            setTestType("2")
          }
        >
          🌱 Test 2
        </button>

        <button
          onClick={() =>
            setTestType("3")
          }
        >
          🌳 Test 3
        </button>

        <button
          onClick={() =>
            setTestType("4")
          }
        >
          🪴 Test 4
        </button>

      </div>

      {testType && (
        <p>
          Vybraný test:{" "}
          <strong>
            Test {testType}
          </strong>
        </p>
      )}

      {error && (
        <p
          style={{
            color:
              "red",
            fontWeight:
              "bold"
          }}
        >
          {error}
        </p>
      )}

      <br />

      <button
        onClick={
          createRoom
        }
        disabled={
          loading
        }
      >
        {loading
          ? "⏳ Vytváram test..."
          : "🚀 Vytvoriť spoločný test"}
      </button>

      <br />
      <br />

      <button
        onClick={
          goBack
        }
      >
        ⬅ Späť
      </button>

    </div>

  );

}

export default GroupOrganizer;