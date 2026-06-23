import API_URL from '../config.js';
import { useState, useEffect, useRef } from 'react';

export default function useBlindTest(user) {
    const [gameState, setGameState] = useState('LOBBY'); // LOBBY | LOADING | PLAYING | RESULTS
    const [artist, setArtist] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [locked, setLocked] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [answersHistory, setAnswersHistory] = useState([]);
    const [error, setError] = useState(null);

    const audioRef = useRef(null);
    const timerRef = useRef(null);

    // Initial check for user and cleanup
    useEffect(() => {
        if (user && !user.favArtistId) {
            setError("Veuillez d'abord choisir un artiste favori dans votre profil pour jouer !");
        }
        return () => {
            stopAudioAndTimer();
        };
    }, [user]);

    const stopAudioAndTimer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const fetchAndStartGame = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/game/blindtest`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de la récupération des morceaux.");
            if (!data.questions || data.questions.length === 0) throw new Error("Aucun extrait audio disponible pour cet artiste.");
            
            setArtist(data.artist);
            setQuestions(data.questions);
            setGameState('PLAYING');
            startQuestion(data.questions, 0);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setGameState('LOBBY');
        }
    };

    const startQuestion = (questionsList, idx) => {
        setSelectedOption(null);
        setLocked(false);
        setTimeLeft(15);

        const currentQ = questionsList[idx];

        // Launch audio
        if (audioRef.current) {
            audioRef.current.src = currentQ.previewUrl;
            audioRef.current.volume = 0.5;
            audioRef.current.play().catch(e => console.error("Impossible de lire l'audio :", e));
        }

        // Launch timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeOut(questionsList[idx]);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSelectOption = (option) => {
        if (locked) return;
        setLocked(true);
        setSelectedOption(option);
        
        // Stop audio & timer
        if (audioRef.current) {
            audioRef.current.pause();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        const currentQ = questions[currentQuestionIdx];
        const isCorrect = option === currentQ.correctAnswer;

        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        setAnswersHistory(prev => [
            ...prev,
            {
                trackName: currentQ.correctAnswer,
                albumCover: currentQ.albumCover,
                correct: isCorrect,
                userChoice: option || "Temps écoulé"
            }
        ]);
    };

    const handleTimeOut = (question) => {
        setLocked(true);
        setSelectedOption(null);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setAnswersHistory(prev => [
            ...prev,
            {
                trackName: question.correctAnswer,
                albumCover: question.albumCover,
                correct: false,
                userChoice: "Temps écoulé"
            }
        ]);
    };

    const nextQuestion = () => {
        const nextIdx = currentQuestionIdx + 1;
        if (nextIdx < questions.length) {
            setCurrentQuestionIdx(nextIdx);
            startQuestion(questions, nextIdx);
        } else {
            setGameState('RESULTS');
            stopAudioAndTimer();
        }
    };

    return {
        gameState, setGameState,
        artist, setArtist,
        questions, setQuestions,
        currentQuestionIdx, setCurrentQuestionIdx,
        selectedOption, setSelectedOption,
        locked, setLocked,
        score, setScore,
        timeLeft, setTimeLeft,
        answersHistory, setAnswersHistory,
        error, setError,
        audioRef,
        stopAudioAndTimer,
        fetchAndStartGame,
        startQuestion,
        handleSelectOption,
        nextQuestion
    };
}
