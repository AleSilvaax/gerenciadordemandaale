
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface MotionContainerProps {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
}

export const MotionContainer: React.FC<MotionContainerProps> = ({
  children,
  stagger = 0.10,
  delay = 0,
  className = ""
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          }
        }
      }}
    >
      {React.Children.map(children, child =>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 40 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 18 } }
          }}
        >
          {child}
        </motion.div>
      )}
    </motion.div>
  );
};
