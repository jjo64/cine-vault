import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, X, Minus } from "lucide-react";
import {
  fetchOnboardingMovie,
  sendOnboardingInteraction,
  type OnboardingMovie,
} from "../../services/socialServices";
import "./OnboardingModal.css";

const STEPS_TOTAL = 10;

const BUTTONS = [
  {
    id: "hate",
    label: "LO ODIO",
    icon: <X size={14} />,
    color: "#FF4141",
    weight: -2,
  },
  {
    id: "dislike",
    label: "NO ME GUSTA",
    icon: <Minus size={14} />,
    color: "#FFA07A",
    weight: -1,
  },
  {
    id: "neutral",
    label: "NI FÚ NI FÁ",
    icon: <Minus size={14} />,
    color: "#AAAAAA",
    weight: 0,
  },
  {
    id: "like",
    label: "ME GUSTA",
    icon: <Heart size={14} />,
    color: "#D4AF7A",
    weight: 1,
  },
  {
    id: "love",
    label: "ME ENCANTA",
    icon: <Star size={14} />,
    color: "#FFD700",
    weight: 2,
  },
];

const mapOnboardingType = (type: string) => {
  if (type === "love" || type === "like") return "like_onboarding";
  return "skip_onboarding";
};

export default function OnboardingModal({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [movie, setMovie] = useState<OnboardingMovie["movie"] | null>(null);
  const [lastSeedId, setLastSeedId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadNextMovie(0);
  }, []);

  const loadNextMovie = async (currentStep: number, seedId?: number) => {
    setLoading(true);
    try {
      const data = await fetchOnboardingMovie(currentStep, seedId);
      setMovie(data.movie);
      setProgress((currentStep / STEPS_TOTAL) * 100);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishEarly = () => {
    setIsFinishing(true);
    setTimeout(() => {
      onComplete();
    }, 3500); // Duration of the special animation
  };

  const handleInteraction = async (type: string) => {
    if (!movie) return;

    // Optimistic step increase or background send
    const nextStep = step + 1;

    try {
      const interactionType = mapOnboardingType(type);
      await sendOnboardingInteraction(movie.id, interactionType, { step });

      let newSeed = lastSeedId;
      if (["like", "love"].includes(type)) {
        newSeed = movie.id;
        setLastSeedId(newSeed);
      }

      if (nextStep >= STEPS_TOTAL) {
        setIsFinishing(true);
        setTimeout(() => {
          onComplete();
        }, 3500); // Duration of the special animation
      } else {
        setStep(nextStep);
        loadNextMovie(nextStep, newSeed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isFinishing) {
    return (
      <div className="onboarding-overlay">
        <motion.div
          className="onboarding-finishing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="engine-core"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="core-inner" />
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Sincronizando gustos...
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
          >
            El motor de CineVault está calculando tu bóveda personalizada.
          </motion.p>

          <div className="scan-line" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="onboarding-overlay">
      <motion.div
        className="onboarding-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="onboarding-header">
          <div className="brand">
            CINEVAULT <span className="engine-tag">ENGINE</span>
          </div>
          <div className="step-counter">
            PASO {step + 1} DE {STEPS_TOTAL}
          </div>
        </div>

        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="onboarding-content">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="movie-placeholder"
              >
                <div className="spinner" />
              </motion.div>
            ) : movie ? (
              <motion.div
                key={movie.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="movie-display"
              >
                <div className="movie-poster">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                  />
                  <div className="poster-gradient" />
                </div>

                <div className="movie-info">
                  <h3>{movie.title}</h3>
                  <div className="movie-year">{movie.year}</div>
                  <p>{movie.overview}</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="onboarding-footer">
          <div className="action-buttons">
            {BUTTONS.map((btn) => (
              <button
                key={btn.id}
                className={`onboarding-btn btn-${btn.id}`}
                onClick={() => handleInteraction(btn.id)}
                disabled={loading}
              >
                <span className="btn-icon">{btn.icon}</span>
                <span className="btn-label">{btn.label}</span>
              </button>
            ))}
          </div>

          {step >= 3 && (
            <div className="onboarding-completion-tip">
              <p className="recommendation-notice">
                ✨ <strong>¡Ya podés empezar!</strong> Tenés el mínimo de 3 películas, pero te recomendamos llegar a 10 para mayor precisión.
              </p>
              <button
                className="finish-early-btn"
                onClick={handleFinishEarly}
                disabled={loading}
              >
                Comenzar ya
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grain-overlay" />
    </div>
  );
}
