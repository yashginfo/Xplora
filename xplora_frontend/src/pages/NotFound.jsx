import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-4"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80')" }}>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Glass Card */}
      <div className="relative z-10 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-10 py-12 max-w-md w-full text-center shadow-2xl">

        {/* 404 Number */}
        <h1 className="text-8xl font-bold text-amber-400 mb-2 drop-shadow-lg">
          404
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-3">
          Lost in Transit
        </h2>

        {/* Message */}
        <p className="text-white/70 text-sm mb-8 leading-relaxed">
          Looks like this destination doesn't exist on our map.
          The page you're looking for has either moved or never existed.
        </p>

        {/* Divider */}
        <div className="w-16 h-px bg-amber-400/50 mx-auto mb-8" />

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-lg transition-all duration-200 text-sm"
          >
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-all duration-200 text-sm"
          >
            Go Back
          </button>
        </div>

        {/* Tagline */}
        <p className="mt-8 text-white/40 text-xs italic">
          Travel more, worry less.
        </p>
      </div>
    </div>
  );
};

export default NotFound;