import { motion } from "framer-motion";
import heart_sprite from "../assets/heart_sprite.png";
const HeartLoader = () => {
  // We define the number of columns and rows in your sprite sheet
  const columns = 5;
  const rows = 4;
  const totalFrames = 20;

  // We create an array of indexes [0, 1, 2...19] to map through the frames
  const frameVariants = {
    animate: {
      // This calculates the background position for each frame
      backgroundPositionX: Array.from({ length: totalFrames }).map(
        (_, i) => `${(i % columns) * 25}%` 
      ),
      backgroundPositionY: Array.from({ length: totalFrames }).map(
        (_, i) => `${Math.floor(i / columns) * 33.3}%`
      ),
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <motion.div
        variants={frameVariants}
        animate="animate"
        transition={{
          duration: 1.5, // Speed of the spin
          repeat: Infinity,
          ease: "steps(1)", // This ensures it "jumps" between frames instead of sliding
        }}
        style={{
          width: "200px",           // Adjust size as needed
          height: "250px",          // Adjust size as needed
          backgroundImage: `url(${heart_sprite})`,
          backgroundSize: "500% 400%", // 5 columns = 500%, 4 rows = 400%
          backgroundRepeat: "no-repeat",
        }}
      />
      
      <p className="mt-4 text-pink-300 font-serif italic tracking-widest animate-pulse">
        unfolding...
      </p>
    </div>
  );
};

export default HeartLoader;