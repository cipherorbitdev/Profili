"use client";

import { motion } from "framer-motion";

export function ConversationBubble({
  who,
  children,
}: {
  who: "visitor" | "ai";
  children: string;
}) {
  const visitor = who === "visitor";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass max-w-[36rem] rounded-2xl px-5 py-4 ${visitor ? "" : "ml-auto"}`}
    >
      <p className="label">{visitor ? "Visitor" : "AI"}</p>
      <p className="mt-2 text-[18px] leading-[1.5] tracking-tight">{children}</p>
    </motion.div>
  );
}
