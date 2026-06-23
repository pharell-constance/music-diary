import API_URL from '../config.js';
import { useState, useEffect, useRef } from 'react';

export default function useGuessTheCover(user) {
    const [gameState, setGameState] = useState('LOBBY'); // LOBBY | LOADING | PLAYING | RESULTS
    const [artist, setArtist] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [locked, setLocked] = useState(false);
    const [score, setScore] = useState(0); // Score global en points
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0); // Nombre de bonnes réponses
    const [timeLeft, setTimeLeft] = useState(15);
    const [answersHistory, setAnswersHistory] = useState([]);
    const [error, setError] = useState(null);
    const [imageReady, setImageReady] = useState(false);

    const timerRef = useRef(null);

    // Initial check for favorite artist presence
    useEffect(() => {
        if (user && !user.favArtistId) {
            setError("Veuillez d'abord choisir un artiste favori dans votre profil pour jouer !");
        }
        
        return () => {
            stopGameTimer();
        };
    }, [user]);

    const stopGameTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const fetchQuestionsAndStart = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/game/guessthecover`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Impossible de charger le jeu.");
            if (!data.questions || data.questions.length === 0) throw new Error("Aucun album disponible pour cet artiste.");
            
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
        setImageReady(false);

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
        stopGameTimer();

        const currentQ = questions[currentQuestionIdx];
        const isCorrect = option === currentQ.correctAnswer;

        let pointsGained = 0;
        if (isCorrect) {
            pointsGained = Math.max(10, Math.round((timeLeft / 15) * 100));
            setScore(prev => prev + pointsGained);
            setCorrectAnswersCount(prev => prev + 1);
        }

        setAnswersHistory(prev => [
            ...prev,
            {
                albumCover: currentQ.albumCover,
                correctAnswer: currentQ.correctAnswer,
                correct: isCorrect,
                userChoice: option,
                pointsGained,
                timeLeft
            }
        ]);
    };

    const handleTimeOut = (question) => {
        setLocked(true);
        setSelectedOption(null);
        setAnswersHistory(prev => [
            ...prev,
            {
                albumCover: question.albumCover,
                correctAnswer: question.correctAnswer,
                correct: false,
                userChoice: "Temps écoulé",
                pointsGained: 0,
                timeLeft: 0
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
            stopGameTimer();
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
        correctAnswersCount, setCorrectAnswersCount,
        timeLeft, setTimeLeft,
        answersHistory, setAnswersHistory,
        error, setError,
        imageReady, setImageReady,
        stopGameTimer,
        fetchQuestionsAndStart,
        startQuestion,
        handleSelectOption,
        nextQuestion
    };
}
