import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ColorVisionTest.css';

const ColorVisionTest = ({ applicationNumber, digiLockerId, onTestComplete, onCancel }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [testQuestions, setTestQuestions] = useState([]);

  // All available images with their correct answers
  const availableImages = [
    { image: '0.jpg', correctAnswer: '0' },
    { image: '1.jpg', correctAnswer: '1' },
    { image: '2.jpg', correctAnswer: '2' },
    { image: '3.jpg', correctAnswer: '3' },
    { image: '4.jpg', correctAnswer: '4' },
    { image: '5.png', correctAnswer: '5' },
    { image: '6.jpg', correctAnswer: '6' },
    { image: '8.jpg', correctAnswer: '8' },
    { image: '12.jpg', correctAnswer: '12' },
    { image: '16.jpg', correctAnswer: '16' },
    { image: '26.jpg', correctAnswer: '26' },
    { image: '29.jpg', correctAnswer: '29' },
    { image: '35.jpg', correctAnswer: '35' },
    { image: '42.jpg', correctAnswer: '42' },
    { image: '74.png', correctAnswer: '74' },
    { image: '96.jpg', correctAnswer: '96' }
  ];

  // Generate wrong answers that are different from correct answer
  const generateWrongAnswers = (correctAnswer, allAnswers) => {
    const wrongAnswers = [];
    const usedAnswers = new Set([correctAnswer]);
    
    while (wrongAnswers.length < 3) {
      const randomAnswer = allAnswers[Math.floor(Math.random() * allAnswers.length)];
      if (!usedAnswers.has(randomAnswer)) {
        wrongAnswers.push(randomAnswer);
        usedAnswers.add(randomAnswer);
      }
    }
    
    return wrongAnswers;
  };

  // Initialize test with random 10 questions
  useEffect(() => {
    // Shuffle and pick 10 random images
    const shuffledImages = [...availableImages].sort(() => Math.random() - 0.5).slice(0, 10);
    
    // Get all possible answers for generating wrong options
    const allPossibleAnswers = availableImages.map(img => img.correctAnswer);
    
    // Create questions with 1 correct + 3 wrong answers
    const questions = shuffledImages.map(img => {
      const wrongAnswers = generateWrongAnswers(img.correctAnswer, allPossibleAnswers);
      const allOptions = [img.correctAnswer, ...wrongAnswers];
      
      // Shuffle options
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
      const correctIndex = shuffledOptions.indexOf(img.correctAnswer);
      
      return {
        question: "What number do you see in the image?",
        image: img.image,
        options: shuffledOptions,
        correct: correctIndex
      };
    });
    
    setTestQuestions(questions);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswer(optionIndex);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      setAnswers([...answers, selectedAnswer]);
      setSelectedAnswer(null);
      
      if (currentQuestion < testQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    const finalAnswers = [...answers];
    if (selectedAnswer !== null) {
      finalAnswers.push(selectedAnswer);
    }

    // Calculate score
    let correctCount = 0;
    testQuestions.forEach((q, index) => {
      if (finalAnswers[index] === q.correct) {
        correctCount++;
      }
    });

    const score = (correctCount / testQuestions.length) * 100;
    const passed = score >= 70; // Pass threshold: 70%

    try {
      const response = await axios.post('http://localhost:5001/api/applications/complete-color-test', {
        applicationNumber,
        digiLockerId,
        score,
        passed
      });

      onTestComplete({
        success: response.data.success,
        passed,
        score,
        message: response.data.message
      });
    } catch (error) {
      onTestComplete({
        success: false,
        passed: false,
        score,
        message: error.response?.data?.message || 'Test submission failed'
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (testQuestions.length === 0) {
    return <div className="loading">Loading test...</div>;
  }

  const question = testQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / testQuestions.length) * 100;

  return (
    <div className="color-test-container">
      <div className="test-header">
        <h2>Color Vision Test</h2>
        <div className="test-info">
          <span className="question-counter">
            Question {currentQuestion + 1} of {testQuestions.length}
          </span>
          <span className={`timer ${timeLeft < 60 ? 'warning' : ''}`}>
            ⏱️ {formatTime(timeLeft)}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="test-content">
        <div className="question-card">
          <div className="ishihara-plate">
            <div className="plate-image">
              <img 
                src={`/Images/${question.image}`} 
                alt="Ishihara color test plate" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <p className="plate-instruction">Look carefully at the colored pattern above</p>
          </div>

          <h3 className="question-text">{question.question}</h3>

          <div className="options-grid">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${selectedAnswer === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="option-label">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="test-footer">
        <button className="btn-cancel" onClick={onCancel}>
          Cancel Test
        </button>
        <button
          className="btn-next"
          onClick={handleNext}
          disabled={selectedAnswer === null}
        >
          {currentQuestion === testQuestions.length - 1 ? 'Submit Test' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default ColorVisionTest;
