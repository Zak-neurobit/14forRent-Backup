
import React from "react";

const HotDealsGradientText = () => {
  return (
    <span className="hot-deals-gradient-text">
      HOT DEALS
      <style>{`
        .hot-deals-gradient-text {
          background: linear-gradient(
            90deg,
            #A80000 0%,
            #DA2916 16%,
            #F36A04 33%,
            #FF6500 50%,
            #FFC41F 66%,
            #FFF370 83%
          );
          background-size: 300% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          animation: hotdealsgradient 3s linear infinite;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        
        @keyframes hotdealsgradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </span>
  );
};

export default HotDealsGradientText;
