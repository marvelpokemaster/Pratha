import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
  subtext?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ 
  message = "Entering Sacred Space...", 
  subtext = "Connecting with Pratha Sanctuaries",
  fullScreen = true 
}: LoadingScreenProps) {
  return (
    <div className={`loading-container ${fullScreen ? 'loading-fullscreen' : 'loading-inline'}`}>
      <div className="loading-content">
        <div className="loading-sacred-symbol">
          <div className="pulsing-aura"></div>
          <div className="inner-mandala">
            <span className="sacred-om">ॐ</span>
          </div>
        </div>
        <h3 className="loading-title">{message}</h3>
        {subtext && <p className="loading-subtext">{subtext}</p>}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-skeleton glass-surface">
          <div className="skeleton-image shimmer"></div>
          <div className="skeleton-content">
            <div className="skeleton-line shimmer title-line"></div>
            <div className="skeleton-line shimmer subtitle-line"></div>
            <div className="skeleton-line shimmer meta-line"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
