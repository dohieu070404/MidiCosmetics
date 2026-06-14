import { motion } from "framer-motion";

import { fadeInUp } from "@/lib/motion/animations";
import { cn } from "@/lib/utils";

export function PageShell({ className, children }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn("py-16 sm:py-20 lg:py-24", className)}
    >
      {children}
    </motion.div>
  );
}
