
import React from "react";

export default function FireGradientText() {
  return (
    <div className="fire-gradient-text">
      <div className="gradient-overlay" />
      <span className="text-content">HOT DEALS</span>
      <style>{`
        .fire-gradient-text {
          position: relative;
          margin: 0 auto;
          display: flex;
          width: 100%;
          max-width: fit-content;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          border-radius: 1.25rem;
          font-weight: 700;
          font-size: 1.875rem;
          letter-spacing: 0.06em;
          overflow: hidden;
          cursor: pointer;
          padding: 0.5em 1.5em;
          box-shadow: 
            0 6px 32px 0 rgba(255,50,0,0.12),
            0 0 20px rgba(255, 100, 0, 0.8),
            0 0 40px rgba(255, 150, 0, 0.6),
            0 0 60px rgba(255, 200, 0, 0.4);
          animation: neonGlow 1.5s ease-in-out infinite alternate;
        }
        
        @keyframes neonGlow {
          from {
            box-shadow: 
              0 6px 32px 0 rgba(255,50,0,0.12),
              0 0 20px rgba(255, 100, 0, 0.8),
              0 0 40px rgba(255, 150, 0, 0.6),
              0 0 60px rgba(255, 200, 0, 0.4);
          }
          to {
            box-shadow: 
              0 6px 32px 0 rgba(255,50,0,0.25),
              0 0 30px rgba(255, 100, 0, 1),
              0 0 60px rgba(255, 150, 0, 0.8),
              0 0 90px rgba(255, 200, 0, 0.6);
          }
        }
        
        .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
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
          animation: firegradient 2s linear infinite;
          border-radius: inherit;
          z-index: 0;
          pointer-events: none;
        }
        .gradient-overlay::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          border-radius: inherit;
          width: calc(100% - 2px);
          height: calc(100% - 2px);
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background-color: #060010;
          z-index: -1;
        }
        @keyframes firegradient {
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
        
        @media (max-width: 767px) {
          .fire-gradient-text {
            width: 100%;
            max-width: 100%;
            padding: 0.3em 1em;
            font-size: 1.5rem;
            border-radius: 0;
          }
        }
        
        @media (min-width: 768px) {
          .fire-gradient-text {
            font-size: 2.5rem;
          }
        }
        
        .text-content {
          display: inline-block;
          position: relative;
          z-index: 2;
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
          animation: firegradient 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
