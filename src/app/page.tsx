"use client";

import { useEffect, useState } from "react";
import { Button } from "../../components/UI/Button";
import styles from "./page.module.css";
import Strahd from "../../public/strahd.png";
import Hole from "../../public/hole.svg";
import Image from "next/image";
import {
  addDoc,
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const Home = () => {
  const counter = 10;
  const [play, setPlay] = useState(false);
  const [strahd, setStrahd] = useState(Array(9).fill(false));
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(counter);
  const [leaderboard, setLeaderboard] = useState<DocumentData[]>([]);
  const [playerName, setPlayerName] = useState("");

  let timeouts: NodeJS.Timeout[] = []; // Store timeouts to clear later

  const handlePlay = () => {
    setPlay((prevPlay) => !prevPlay);
    setScore(0);
    setStrahd(Array(9).fill(false));
  };

  useEffect(() => {
    if (!play) return;

    const intervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * strahd.length);
      setStrahd((currentStrahds) => {
        const newStrahds = [...currentStrahds];
        newStrahds[randomIndex] = true;

        const timeoutId = setTimeout(() => hideStrahd(randomIndex), 500);
        timeouts.push(timeoutId);

        return newStrahds;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
      timeouts.forEach(clearTimeout);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timeouts = [];
    };
  }, [play]);

  useEffect(() => {
    if (!play && score > 0 && playerName.trim()) {
      const saveScore = async () => {
        try {
          await addDoc(collection(db, "leaderboard"), {
            name: playerName,
            score: score,
          });
        } catch (error) {
          console.error("Error saving score:", error);
        }
      };

      saveScore();
    }
  }, [play, playerName, score]);

  useEffect(() => {
    if (!play) return;

    setCountdown(counter);

    const interval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          setPlay(false);
          clearInterval(interval);
          setCountdown(counter);
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [play]);

  const whackHandler = (i: number) => {
    if (!strahd[i]) return;
    setScore((prevScore) => prevScore + 1);
    hideStrahd(i);
  };

  const hideStrahd = (i: number) => {
    setStrahd((currentStrahds) => {
      const newStrahds = [...currentStrahds];
      newStrahds[i] = false;
      return newStrahds;
    });
  };

  useEffect(() => {
    if (!play) return;

    const timer = setTimeout(() => setPlay(false), counter * 1000);
    return () => clearTimeout(timer);
  }, [play]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const leaderboardQuery = query(
          collection(db, "leaderboard"),
          orderBy("score", "desc"),
          limit(5),
        );
        const querySnapshot = await getDocs(leaderboardQuery);
        const scores = querySnapshot.docs.map((doc) => doc.data());

        setLeaderboard(scores);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.sky}>
        <h1 className={styles.title}>Whack a Strahd!</h1>
        <Button onClick={handlePlay}>{play ? "Stop" : "Start"} Game</Button>
        <p className={styles.score}>
          Score: <span className={styles.scoreValue}>{score}</span>
        </p>
        <p className={styles.countdown}>Countdown: {countdown}</p>
        <div className={styles.inputContainer}>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className={styles.nameInput}
          />
        </div>
        <div className={styles.leaderboard}>
          <h2>Leaderboard</h2>
          <ul>
            {leaderboard.map((entry, index) => (
              <li key={index}>
                {index + 1}. {entry.name}: {entry.score} points
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={styles.gameGrid}>
        {strahd.map((isStrahd, i) => (
          <div
            className={styles.element}
            key={i}
            onClick={() => whackHandler(i)}
          >
            <Image
              src={isStrahd ? Strahd : Hole}
              alt={isStrahd ? "Strahd" : "Hole"}
              width={100}
              height={100}
            />
          </div>
        ))}
      </div>
      <div className={styles.grass}></div>
    </div>
  );
};

export default Home;
