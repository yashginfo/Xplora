// src/components/TripForm/TripForm.jsx
import { useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import TripResult from "../TripResult";
import LoadingSpinner from "../LoadingSpinner";
import client from "../../api/client";
import useTranslate from "../../hooks/useTranslate";

const INITIAL_FORM = {
  from: "", destination: "", startDate: "", endDate: "",
  people: 1, budgetType: "total", budget: "", currency: "INR",
  travelStyle: "", interests: [],
};

const TripForm = () => {
  const [step, setStep]                   = useState(1);
  const [formData, setFormData]           = useState(INITIAL_FORM);
  const [loading, setLoading]             = useState(false);
  const [tripPlan, setTripPlan]           = useState(null);
  const [savedFormData, setSavedFormData] = useState(null);
  const [error, setError]                 = useState("");
  const [regenerateCount, setRegenerateCount] = useState(0);

  const [planNewTrip, errorText] = useTranslate([
    "Plan a new trip",
    "Something went wrong. Please try again.",
  ]);

  const updateForm = (fields) => setFormData((prev) => ({ ...prev, ...fields }));
  const nextStep   = () => setStep((s) => s + 1);
  const prevStep   = () => setStep((s) => s - 1);

  const generateTrip = async (data = formData) => {
    setLoading(true);
    setError("");
    try {
      const res = await client.post("/trips/generate", {
        from_location: data.from,
        destination:   data.destination,
        startDate:     data.startDate,
        endDate:       data.endDate,
        people:        parseInt(data.people),
        budgetType:    data.budgetType,
        budget:        parseFloat(data.budget),
        currency:      data.currency,
        travelStyle:   data.travelStyle,
        interests:     data.interests,
      });
      setTripPlan(res.data);
      setSavedFormData(data);
    } catch (err) {
      setError(err.response?.data?.detail || errorText);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => generateTrip();

  const handleRegenerate = () => {
    if (regenerateCount >= 2) return;
    setRegenerateCount((c) => c + 1);
    setTripPlan(null);
    generateTrip(savedFormData || formData);
  };

  const handlePlanNewTrip = () => {
    setTripPlan(null);
    setSavedFormData(null);
    setStep(1);
    setFormData(INITIAL_FORM);
    setRegenerateCount(0);
    setError("");
  };

  if (loading) return <LoadingSpinner />;

  if (tripPlan) {
    const activeForm = savedFormData || formData;
    return (
      <div className="w-full max-w-2xl px-4 md:px-0">
        {/* Plan new trip — TOP */}
        <button
          onClick={handlePlanNewTrip}
          className="mb-5 flex items-center gap-2 text-xs font-semibold text-white/40 hover:text-amber-400 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {planNewTrip}
        </button>

        <TripResult
          plan={tripPlan}
          weatherData={tripPlan.weatherData}
          fromLocation={activeForm.from}
          onRegenerate={handleRegenerate}
          onPlanNewTrip={handlePlanNewTrip}
          regenerateCount={regenerateCount}
          hotelsData={tripPlan.hotelsData || []}
          flightsData={tripPlan.flightsData || []}
          trainsData={tripPlan.trainsData || []}
          photosData={tripPlan.photosData || []}
          hotelPhotosData={tripPlan.hotelPhotosData || []}
        />
      </div>
    );
  }

  const STEP_LABELS = ["Location", "Budget", "Style"];

  return (
    /* Full width on mobile, max-w-xl on larger screens */
    <div className="w-full max-w-xl px-4 md:px-0">

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${step === s
                    ? "bg-amber-400 text-stone-900 ring-4 ring-amber-400/20"
                    : step > s
                    ? "bg-amber-400/20 text-amber-400 border border-amber-400/40"
                    : "bg-white/5 text-white/25 border border-white/10"
                  }`}
              >
                {step > s ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${step >= s ? "text-white/50" : "text-white/20"}`}>
                {STEP_LABELS[s - 1]}
              </span>
            </div>
            {s < 3 && (
              <div className={`flex-1 h-px mx-2 mb-5 transition-colors duration-300 ${step > s ? "bg-amber-400/40" : "bg-white/8"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Form card — tighter padding on mobile */}
      <div className="backdrop-blur-md bg-black/50 rounded-2xl border border-white/10 p-5 md:p-8 shadow-2xl shadow-black/40">
        {step === 1 && <Step1 formData={formData} updateForm={updateForm} onNext={nextStep} />}
        {step === 2 && <Step2 formData={formData} updateForm={updateForm} onNext={nextStep} onBack={prevStep} />}
        {step === 3 && <Step3 formData={formData} updateForm={updateForm} onSubmit={handleSubmit} onBack={prevStep} />}
      </div>
    </div>
  );
};

export default TripForm;